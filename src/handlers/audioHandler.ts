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
 * Fetches stream URL from cobalt.tools API
 */
async function getCobaltStreamUrl(videoId: string): Promise<string | null> {
  const cobaltInstances = [
    'https://api.cobalt.tools',
    'https://cobalt-api.kwiatekmiki.com', 
    'https://cobalt.api.timelessnesses.me',
    'https://co.wuk.sh',
  ];

  for (const apiUrl of cobaltInstances) {
    try {
      logger.debug('Trying Cobalt instance', { apiUrl, videoId });
      
      const response = await fetch(`${apiUrl}/api/json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          isAudioOnly: true,
          aFormat: 'opus',
          filenamePattern: 'basic',
        }),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
      
      if (!response.ok) {
        logger.debug('Cobalt response not ok', { apiUrl, status: response.status });
        continue;
      }
      
      const data = await response.json() as any;
      
      if (data.status === 'stream' && data.url) {
        logger.info('Got stream URL from Cobalt', { apiUrl, videoId });
        return data.url;
      } else if (data.status === 'redirect' && data.url) {
        logger.info('Got redirect URL from Cobalt', { apiUrl, videoId });
        return data.url;
      } else if (data.url) {
        // Some instances just return the URL directly
        logger.info('Got URL from Cobalt', { apiUrl, videoId });
        return data.url;
      } else {
        logger.debug('Cobalt returned unexpected response', { apiUrl, status: data.status });
      }
    } catch (error) {
      logger.debug('Cobalt instance failed', { apiUrl, error: (error as Error).message });
      continue;
    }
  }
  
  return null;
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
 * Creates audio resource from song using Cobalt API only
 */
async function createAudioResourceFromSong(song: Song, volume: number, seekTime: number = 0): Promise<AudioResource> {
  try {
    // Verify URL validity first
    if (!song.url) throw new Error('No URL provided for song');

    // Extract video ID
    const videoId = extractVideoId(song.url);
    if (!videoId) {
      throw new Error('Could not extract video ID from URL');
    }

    logger.debug('Getting stream URL from Cobalt', { videoId });
    const streamUrl = await getCobaltStreamUrl(videoId);
    
    if (!streamUrl) {
      throw new Error('Failed to get stream URL from Cobalt');
    }

    logger.debug('Streaming with ffmpeg', { videoId, seekTime });

    // Use ffmpeg to stream from the URL
    const ffmpeg = spawn('ffmpeg', [
      '-reconnect', '1',
      '-reconnect_streamed', '1',
      '-reconnect_delay_max', '5',
      '-i', streamUrl,
      '-ss', seekTime.toString(),
      '-vn',
      '-acodec', 'libopus',
      '-f', 'opus',
      '-ar', '48000',
      '-ac', '2',
      'pipe:1',
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    ffmpeg.on('error', (error) => {
      logger.error('ffmpeg process error', { error: error.message });
    });

    ffmpeg.stderr.on('data', (data) => {
      // FFmpeg outputs info to stderr, only log actual errors
      const msg = data.toString();
      if (msg.includes('Error') || msg.includes('error')) {
        logger.warn(`ffmpeg stderr: ${msg}`);
      }
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0 && code !== null) {
        logger.debug('ffmpeg process closed', { code });
      }
    });

    const resource = createAudioResource(ffmpeg.stdout, {
      inputType: StreamType.OggOpus,
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
