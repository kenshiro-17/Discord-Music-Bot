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
import play from 'play-dl';
import fs from 'fs';

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

  // Clean up file if it was an uploaded file
  const currentSong = queue.songs[queue.currentIndex];
  if (currentSong?.source === 'file' && currentSong.filePath) {
    cleanupTempFile(currentSong.filePath);
  }

  // Skip to next song
  const skipResult = skip(guildId);

  if (skipResult.shouldStop) {
    // No more songs, stop playback
    logger.info('Queue finished', { guildId });

    queue.textChannel
      .send('Queue finished! Add more songs or I\'ll leave after 5 minutes of inactivity.')
      .catch((error) => logError(error, { context: 'Failed to send queue finished message' }));

    stopQueue(guildId);
    startInactivityTimer(guildId, 300);
  } else if (skipResult.nextSong) {
    // Play next song
    await playSong(guildId);
  }
}

/**
 * Creates audio resource from song
 */
async function createAudioResourceFromSong(song: Song, volume: number): Promise<AudioResource> {
  try {
    let resource: AudioResource;

    if (song.source === 'file' && song.filePath) {
      // Create resource from file
      const stream = fs.createReadStream(song.filePath);
      resource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true,
      });
    } else {
      // Create resource from YouTube URL
      const stream = await play.stream(song.url);
      resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true,
      });
    }

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

    // Create audio resource
    const resource = await createAudioResourceFromSong(song, queue.volume);

    // Subscribe connection to player
    if (queue.connection) {
      queue.connection.subscribe(queue.audioPlayer);
    }

    // Play the resource
    queue.audioPlayer.play(resource);

    logger.info('Playing song', {
      guildId,
      song: song.title,
      source: song.source,
    });
  } catch (error) {
    logError(error as Error, {
      context: 'Failed to play song',
      guildId,
      song: song.title,
    });

    queue.textChannel
      .send(`Failed to play **${song.title}**. Skipping to next song...`)
      .catch((e) => logError(e as Error, { context: 'Failed to send error message' }));

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

/**
 * Cleans up temporary audio file
 */
function cleanupTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.debug('Cleaned up temp file', { filePath });
    }
  } catch (error) {
    logError(error as Error, {
      context: 'Failed to cleanup temp file',
      filePath,
    });
  }
}

/**
 * Cleans up old temporary files on startup
 */
export function cleanupOldTempFiles(): void {
  const os = require('os');
  const path = require('path');
  const tempDir = os.tmpdir();
  const botTempPattern = /^tc-upload-/;

  try {
    const files = fs.readdirSync(tempDir);

    files.forEach((file) => {
      if (botTempPattern.test(file)) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);

        // Delete files older than 1 hour
        if (ageHours > 1) {
          fs.unlinkSync(filePath);
          logger.debug('Cleaned up old temp file', { file });
        }
      }
    });

    logger.info('Temp file cleanup completed');
  } catch (error) {
    logError(error as Error, { context: 'Failed to cleanup old temp files' });
  }
}
