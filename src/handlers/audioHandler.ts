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
import { createNowPlayingEmbed } from '../utils/embedBuilder';
import { createNowPlayingButtons } from '../utils/buttonBuilder';
import ytdl from '@distube/ytdl-core';
import * as fs from 'fs';
import * as path from 'path';

// Cookie path
const COOKIES_PATH = path.join(process.cwd(), 'cookies.txt');

/**
 * Parse Netscape cookie file to ytdl-core cookie format
 */
function parseCookiesFile(): ytdl.Cookie[] | undefined {
  try {
    if (!fs.existsSync(COOKIES_PATH)) {
      logger.warn('No cookies.txt file found');
      return undefined;
    }

    const content = fs.readFileSync(COOKIES_PATH, 'utf-8');
    const cookies: ytdl.Cookie[] = [];

    const lines = content.split('\n');
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith('#') || line.trim() === '') continue;

      const parts = line.split('\t');
      if (parts.length >= 7) {
        cookies.push({
          domain: parts[0],
          hostOnly: parts[1] !== 'TRUE',
          path: parts[2],
          secure: parts[3] === 'TRUE',
          expirationDate: parseInt(parts[4]) || undefined,
          name: parts[5],
          value: parts[6],
        });
      }
    }

    if (cookies.length > 0) {
      logger.info('Loaded YouTube cookies', { count: cookies.length });
      return cookies;
    }
  } catch (error) {
    logger.error('Failed to parse cookies file', { error: (error as Error).message });
  }
  return undefined;
}

// Load cookies once at startup
const ytdlCookies = parseCookiesFile();

// Create ytdl agent with cookies
const ytdlAgent = ytdlCookies ? ytdl.createAgent(ytdlCookies) : undefined;

if (ytdlAgent) {
  logger.info('YTDL agent created with cookies');
} else {
  logger.warn('YTDL agent created without cookies - may get 403 errors');
}

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
 * Extracts video ID from YouTube URL
 */
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Creates audio resource from song using @distube/ytdl-core
 */
async function createAudioResourceFromSong(song: Song, volume: number, seekTime: number = 0): Promise<AudioResource> {
  try {
    if (!song.url) throw new Error('No URL provided for song');

    const videoId = extractVideoId(song.url);
    if (!videoId) {
      throw new Error('Could not extract video ID from URL');
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    logger.debug('Creating stream with ytdl-core', { videoId, seekTime });

    // ytdl options
    const ytdlOptions: ytdl.downloadOptions = {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25, // 32MB buffer
      dlChunkSize: 0, // Disable chunking for better streaming
    };

    // Add agent with cookies if available
    if (ytdlAgent) {
      ytdlOptions.agent = ytdlAgent;
    }

    // Create the stream
    const stream = ytdl(videoUrl, ytdlOptions);

    // Handle stream errors
    stream.on('error', (error) => {
      logger.error('ytdl stream error', { error: error.message, videoId });
    });

    const resource = createAudioResource(stream, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true,
      metadata: {
        title: song.title,
      },
    });

    if (resource.volume) {
      resource.volume.setVolume(volume / 100);
    }

    logger.debug('Audio resource created successfully', { videoId });
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
    const resource = await createAudioResourceFromSong(song, queue.volume, timestamp);
    queue.audioPlayer.play(resource);
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
    if (!queue.audioPlayer) {
      queue.audioPlayer = createAudioPlayerHandler();
      setupAudioPlayerHandlers(queue.audioPlayer, guildId);
    }

    if (queue.progressInterval) {
      clearInterval(queue.progressInterval);
      queue.progressInterval = undefined;
    }

    const resource = await createAudioResourceFromSong(song, queue.volume);

    if (queue.connection) {
      queue.connection.subscribe(queue.audioPlayer);
    }

    queue.audioPlayer.play(resource);
    queue.startTime = Date.now();
    queue.pausedTime = 0;

    logger.info('Playing song', {
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
          
          if (!currentQueue || !currentQueue.playing || !currentQueue.audioPlayer) {
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
 * Updates volume for currently playing song
 */
export function updateVolume(guildId: string, volume: number): void {
  const queue = getQueue(guildId);

  if (!queue || !queue.audioPlayer) {
    return;
  }

  queue.volume = volume;
  logger.info('Volume updated', { guildId, volume });
}
