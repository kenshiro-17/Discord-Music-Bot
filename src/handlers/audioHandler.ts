import {
  AudioPlayer,
  AudioPlayerStatus,
} from '@discordjs/voice';
import { Song } from '../types';
import { logger, logError } from '../utils/logger';
import { getQueue, skip, stop as stopQueue } from './queueManager';
import { startInactivityTimer } from './voiceManager';
import { createNowPlayingEmbed } from '../utils/embedBuilder';
import { createNowPlayingButtons } from '../utils/buttonBuilder';
import { getPlayer, searchTracks } from '../services/lavalink';
import { Player } from 'shoukaku';

// Map to store guild players
const guildPlayers: Map<string, Player> = new Map();

/**
 * Creates and configures an audio player (legacy - kept for compatibility)
 */
export function createAudioPlayerHandler(): AudioPlayer {
  // This is now a stub - Lavalink handles audio playing
  const { createAudioPlayer } = require('@discordjs/voice');
  return createAudioPlayer();
}

/**
 * Sets up audio player event handlers for Lavalink player
 */
export function setupLavalinkPlayerHandlers(player: Player, guildId: string): void {
  player.on('start', () => {
    const queue = getQueue(guildId);
    if (queue) {
      queue.playing = true;
      logger.info('Started playing song', {
        guildId,
        song: queue.songs[queue.currentIndex]?.title,
      });
    }
  });

  player.on('end', () => {
    handleSongEnd(guildId);
  });

  player.on('closed', () => {
    logger.info('Lavalink player closed', { guildId });
  });

  player.on('exception', (error) => {
    logError(new Error(String(error.exception?.message || 'Unknown error')), {
      context: 'Lavalink player exception',
      guildId,
    });
    handleSongEnd(guildId);
  });

  player.on('stuck', () => {
    logger.warn('Track got stuck', { guildId });
    handleSongEnd(guildId);
  });

  player.on('update', (data) => {
    const queue = getQueue(guildId);
    if (queue && data.state.position) {
      // Update position tracking
      queue.startTime = Date.now() - data.state.position;
    }
  });
}

/**
 * Sets up audio player event handlers (legacy - kept for compatibility)
 */
export function setupAudioPlayerHandlers(audioPlayer: AudioPlayer, guildId: string): void {
  audioPlayer.on(AudioPlayerStatus.Idle, () => {
    handleSongEnd(guildId);
  });

  audioPlayer.on(AudioPlayerStatus.Playing, () => {
    const queue = getQueue(guildId);
    if (queue) {
      queue.playing = true;
      logger.info('Started playing song', {
        guildId,
        song: queue.songs[queue.currentIndex]?.title,
      });
    }
  });

  audioPlayer.on(AudioPlayerStatus.Paused, () => {
    logger.info('Playback paused', { guildId });
  });

  audioPlayer.on('error', (error) => {
    logError(error, {
      context: 'Audio player error',
      guildId,
    });
    handleSongEnd(guildId);
  });
}

/**
 * Handles when a song ends
 */
async function handleSongEnd(guildId: string): Promise<void> {
  const queue = getQueue(guildId);
  if (!queue) return;

  // Clear progress interval
  if (queue.progressInterval) {
    clearInterval(queue.progressInterval);
    queue.progressInterval = undefined;
  }

  const skipResult = skip(guildId);

  if (skipResult.shouldStop) {
    logger.info('Queue finished', { guildId });

    if (queue && queue.textChannel) {
      queue.textChannel
        .send('Queue finished! Add more songs or I\'ll leave after 5 minutes of inactivity.')
        .catch((error: Error) => logError(error, { context: 'Failed to send queue finished message' }));
    }

    stopQueue(guildId);
    startInactivityTimer(guildId, 300);
  } else if (skipResult.nextSong) {
    await playSong(guildId);
  }
}

/**
 * Plays a song from the queue using Lavalink
 */
export async function playSong(guildId: string): Promise<void> {
  const queue = getQueue(guildId);

  if (!queue || queue.songs.length === 0) {
    logger.warn('Attempted to play song but queue is empty', { guildId });
    return;
  }

  const song = queue.songs[queue.currentIndex];

  try {
    // Get or create Lavalink player
    let player = guildPlayers.get(guildId);
    
    if (!player && queue.voiceChannel?.id) {
      const newPlayer = await getPlayer(guildId, queue.voiceChannel.id);
      if (newPlayer) {
        player = newPlayer;
        guildPlayers.set(guildId, player);
        setupLavalinkPlayerHandlers(player, guildId);
      }
    }

    if (!player) {
      throw new Error('Failed to get Lavalink player');
    }

    if (queue.progressInterval) {
      clearInterval(queue.progressInterval);
      queue.progressInterval = undefined;
    }

    // Get encoded track from song or search for it
    let encodedTrack = (song as Song & { encodedTrack?: string }).encodedTrack;
    
    if (!encodedTrack) {
      // Need to search for the track
      const tracks = await searchTracks(song.url || song.title);
      if (tracks.length === 0) {
        throw new Error('Could not find track');
      }
      encodedTrack = tracks[0].encoded;
    }

    // Play the track
    await player.playTrack({ track: { encoded: encodedTrack } });
    
    queue.startTime = Date.now();
    queue.pausedTime = 0;
    queue.playing = true;

    logger.info('Playing song via Lavalink', {
      guildId,
      song: song.title,
      source: song.source,
    });

    // Send Now Playing Message
    if (queue.textChannel) {
      try {
        const embed = createNowPlayingEmbed(song, queue, 0);
        const buttons = createNowPlayingButtons(false, queue.loop);
        
        const message = await queue.textChannel.send({ embeds: [embed], components: buttons });
        queue.nowPlayingMessage = message;

        const interval = setInterval(async () => {
          const currentQueue = getQueue(guildId);
          
          if (!currentQueue || !currentQueue.playing) {
            clearInterval(interval);
            return;
          }
          
          let currentTime = 0;
          if (currentQueue.startTime) {
            const now = Date.now();
            const currentPaused = !currentQueue.playing && currentQueue.lastPauseTime ? (now - currentQueue.lastPauseTime) : 0;
            currentTime = Math.floor((now - currentQueue.startTime - (currentQueue.pausedTime || 0) - currentPaused) / 1000);
          }
          
          if (currentTime < 0) currentTime = 0;
          if (currentTime > song.duration) currentTime = song.duration;

          try {
            const newEmbed = createNowPlayingEmbed(song, currentQueue, currentTime);
            const newButtons = createNowPlayingButtons(!currentQueue.playing, currentQueue.loop);
            await message.edit({ embeds: [newEmbed], components: newButtons });
          } catch {
            clearInterval(interval);
          }
        }, 5000);
        
        queue.progressInterval = interval;
      } catch (msgError) {
        logError(msgError as Error, { context: 'Failed to send now playing message' });
      }
    }

  } catch (error) {
    logError(error as Error, {
      context: 'Failed to play song',
      guildId,
      song: song.title,
    });

    if (queue && queue.textChannel) {
      queue.textChannel
        .send(`Failed to play **${song.title}**. Skipping to next song...`)
        .catch((e) => logError(e as Error, { context: 'Failed to send error message' }));
    }

    handleSongEnd(guildId);
  }
}

/**
 * Seeks to a specific time in the song
 */
export async function seekTo(guildId: string, timestamp: number): Promise<void> {
  const queue = getQueue(guildId);
  if (!queue || !queue.playing) return;

  const player = guildPlayers.get(guildId);
  if (!player) return;

  try {
    await player.seekTo(timestamp * 1000); // Convert to ms
    queue.startTime = Date.now() - (timestamp * 1000);
    queue.pausedTime = 0;
    logger.info('Seeked to position', { guildId, timestamp });
  } catch (error) {
    logError(error as Error, { context: 'Failed to seek' });
    throw error;
  }
}

/**
 * Pause playback
 */
export async function pausePlayback(guildId: string): Promise<void> {
  const player = guildPlayers.get(guildId);
  if (!player) return;

  await player.setPaused(true);
  
  const queue = getQueue(guildId);
  if (queue) {
    queue.playing = false;
    queue.lastPauseTime = Date.now();
  }
  
  logger.info('Playback paused', { guildId });
}

/**
 * Resume playback
 */
export async function resumePlayback(guildId: string): Promise<void> {
  const player = guildPlayers.get(guildId);
  if (!player) return;

  await player.setPaused(false);
  
  const queue = getQueue(guildId);
  if (queue) {
    queue.playing = true;
    if (queue.lastPauseTime) {
      queue.pausedTime = (queue.pausedTime || 0) + (Date.now() - queue.lastPauseTime);
      queue.lastPauseTime = undefined;
    }
  }
  
  logger.info('Playback resumed', { guildId });
}

/**
 * Stop playback and clean up
 */
export async function stopPlayback(guildId: string): Promise<void> {
  const player = guildPlayers.get(guildId);
  if (player) {
    await player.stopTrack();
    guildPlayers.delete(guildId);
  }
  
  logger.info('Playback stopped', { guildId });
}

/**
 * Updates volume for currently playing song
 */
export function updateVolume(guildId: string, volume: number): void {
  const queue = getQueue(guildId);
  const player = guildPlayers.get(guildId);

  if (!queue) return;

  queue.volume = volume;
  
  if (player) {
    // Lavalink volume is 0-1000 (1000 = 100%)
    player.setGlobalVolume(volume * 10);
  }
  
  logger.info('Volume updated', { guildId, volume });
}

/**
 * Get player for a guild
 */
export function getGuildPlayer(guildId: string): Player | undefined {
  return guildPlayers.get(guildId);
}

/**
 * Clean up player for a guild
 */
export function cleanupPlayer(guildId: string): void {
  guildPlayers.delete(guildId);
}
