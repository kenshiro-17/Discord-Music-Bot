import {
  createAudioPlayer,
  createAudioResource,
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  StreamType,
} from '@discordjs/voice';
import { Song } from '../types';
import { logger, logError } from '../utils/logger';
import { PlaybackError } from '../utils/errorHandler';
import { getQueue, skip, stop as stopQueue } from './queueManager';
import { startInactivityTimer } from './voiceManager';
import { spawn } from 'child_process';
import { createNowPlayingEmbed } from '../utils/embedBuilder';
import { createNowPlayingButtons } from '../utils/buttonBuilder';

/**
 * Creates and configures an audio player
 */
export function createAudioPlayerHandler(): AudioPlayer {
  const audioPlayer = createAudioPlayer();

  return audioPlayer;
}

/**
 * Sets up audio player event handlers
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
    // No more songs, stop playback
    logger.info('Queue finished', { guildId });

    if (queue && queue.textChannel) {
      queue.textChannel
        .send('Queue finished! Add more songs or I\'ll leave after 5 minutes of inactivity.')
        .catch((error: Error) => logError(error, { context: 'Failed to send queue finished message' }));
    }

    stopQueue(guildId);
    startInactivityTimer(guildId, 300);
  } else if (skipResult.nextSong) {
    // Play next song
    await playSong(guildId);
  }
}

/**
 * Creates audio resource from song using yt-dlp
 */
async function createAudioResourceFromSong(song: Song, volume: number, seekTime: number = 0): Promise<AudioResource> {
  try {
    // Verify URL validity first
    if (!song.url) throw new Error('No URL provided for song');

    logger.debug('Spawning yt-dlp process', { url: song.url, seekTime });

    const args = [
      '-o', '-',
      '-q',
      '-f', 'bestaudio',
      '--no-playlist',
      '--no-warnings',
      '--buffer-size', '16K',
      '--socket-timeout', '10'
    ];

    if (seekTime > 0) {
        args.push('--download-sections', `*${seekTime}-inf`);
    }

    args.push('--', song.url);

    const ytDlp = spawn('yt-dlp', args, { stdio: ['ignore', 'pipe', 'pipe'] }); // Capture stderr

    ytDlp.on('error', (error) => {
        logger.error('yt-dlp process error', { error: error.message });
    });

    ytDlp.stderr.on('data', (data) => {
        logger.warn(`yt-dlp stderr: ${data.toString()}`);
    });

    ytDlp.on('close', (code) => {
        if (code !== 0) {
            logger.error(`yt-dlp process exited with code ${code}`);
        } else {
            logger.debug('yt-dlp process finished successfully');
        }
    });

    // Handle stream errors
    ytDlp.stdout.on('error', (error) => {
        logger.error('yt-dlp stream error', { error: error.message });
    });

    const resource = createAudioResource(ytDlp.stdout, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true,
      metadata: {
        title: song.title,
      },
    });

    // Set volume
    if (resource.volume) {
      resource.volume.setVolume(volume / 100);
    }

    return resource;
  } catch (error) {
    logError(error as Error, {
      context: 'Failed to create audio resource',
      song: song.title,
    });
    throw new PlaybackError('Failed to create audio stream for playback');
  }
}

/**
 * Seeks to a specific time in the song
 */
export async function seekTo(guildId: string, timestamp: number): Promise<void> {
  const queue = getQueue(guildId);
  if (!queue || !queue.playing || !queue.audioPlayer) return;

  const song = queue.songs[queue.currentIndex];
  if (!song) return;

  try {
    // Create new resource starting at timestamp
    const resource = await createAudioResourceFromSong(song, queue.volume, timestamp);
    
    // Play new resource
    queue.audioPlayer.play(resource);
    
    // Update manual timer
    queue.startTime = Date.now() - (timestamp * 1000);
    queue.pausedTime = 0;
    
    logger.info('Seeked to position', { guildId, timestamp });
  } catch (error) {
    logError(error as Error, { context: 'Failed to seek' });
    throw error;
  }
}

/**
 * Plays a song from the queue
 */
export async function playSong(guildId: string): Promise<void> {
  const queue = getQueue(guildId);

  if (!queue || queue.songs.length === 0) {
    logger.warn('Attempted to play song but queue is empty', { guildId });
    return;
  }

  const song = queue.songs[queue.currentIndex];

  try {
    // Create audio player if needed
    if (!queue.audioPlayer) {
      queue.audioPlayer = createAudioPlayerHandler();
      setupAudioPlayerHandlers(queue.audioPlayer, guildId);
    }

    // Clear existing progress interval
    if (queue.progressInterval) {
      clearInterval(queue.progressInterval);
      queue.progressInterval = undefined;
    }

    // Create audio resource
    const resource = await createAudioResourceFromSong(song, queue.volume);

    // Subscribe connection to player
    if (queue.connection) {
      queue.connection.subscribe(queue.audioPlayer);
    }

    // Play the resource
    queue.audioPlayer.play(resource);
    
    // Set start time for manual tracking
    queue.startTime = Date.now();
    queue.pausedTime = 0;

    logger.info('Playing song', {
      guildId,
      song: song.title,
      source: song.source,
    });

    // Send Now Playing Message with updates
    if (queue.textChannel) {
        try {
            const embed = createNowPlayingEmbed(song, queue, 0);
            const buttons = createNowPlayingButtons(false, queue.loop);
            
            const message = await queue.textChannel.send({ embeds: [embed], components: buttons });
            queue.nowPlayingMessage = message;

            // Start animation interval (5s)
            const interval = setInterval(async () => {
                // Re-fetch queue to ensure it still exists and is playing
                const currentQueue = getQueue(guildId);
                
                if (!currentQueue || !currentQueue.playing || !currentQueue.audioPlayer) {
                    clearInterval(interval);
                    return;
                }
                
                // Calculate current time manually
                let currentTime = 0;
                if (currentQueue.startTime) {
                    const now = Date.now();
                    const currentPaused = !currentQueue.playing && currentQueue.lastPauseTime ? (now - currentQueue.lastPauseTime) : 0;
                    currentTime = Math.floor((now - currentQueue.startTime - (currentQueue.pausedTime || 0) - currentPaused) / 1000);
                }
                
                // Clamp time
                if (currentTime < 0) currentTime = 0;
                if (currentTime > song.duration) currentTime = song.duration;

                try {
                    const newEmbed = createNowPlayingEmbed(song, currentQueue, currentTime);
                    const newButtons = createNowPlayingButtons(!currentQueue.playing, currentQueue.loop);
                    await message.edit({ embeds: [newEmbed], components: newButtons });
                } catch (error) {
                    // Stop updating if message deleted or rate limited
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

    // Try to play next song
    handleSongEnd(guildId);
  }
}

/**
 * Updates volume for currently playing song
 */
export function updateVolume(guildId: string, volume: number): void {
  const queue = getQueue(guildId);

  if (!queue || !queue.audioPlayer) {
    return;
  }

  // Note: Volume changes will apply to next song
  // To change current song volume, we'd need to recreate the resource
  queue.volume = volume;

  logger.info('Volume updated', { guildId, volume });
}
