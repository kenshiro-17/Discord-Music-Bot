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
import play from 'play-dl';

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
 * Fetches stream URL from Invidious API (fallback method)
 */
async function getInvidiousStreamUrl(videoId: string): Promise<string | null> {
  // List of public Invidious instances
  const instances = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://invidious.jing.rocks',
    'https://yt.artemislena.eu',
    'https://invidious.privacyredirect.com',
  ];

  for (const instance of instances) {
    try {
      const response = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (!response.ok) continue;
      
      const data = await response.json() as any;
      
      // Find best audio format
      const audioFormats = data.adaptiveFormats?.filter((f: any) => 
        f.type?.startsWith('audio/') && f.url
      ) || [];
      
      if (audioFormats.length > 0) {
        // Sort by bitrate and get best
        audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
        logger.debug('Got stream URL from Invidious', { instance, videoId });
        return audioFormats[0].url;
      }
    } catch (error) {
      logger.debug('Invidious instance failed', { instance, error: (error as Error).message });
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
 * Creates audio resource from song using play-dl (primary) with Invidious fallback
 */
async function createAudioResourceFromSong(song: Song, volume: number, seekTime: number = 0): Promise<AudioResource> {
  try {
    // Verify URL validity first
    if (!song.url) throw new Error('No URL provided for song');

    // Extract video ID for consistent URL format
    const videoId = extractVideoId(song.url);
    const cleanUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : song.url;

    // Try play-dl first (most reliable)
    try {
      logger.debug('Trying play-dl for streaming', { url: cleanUrl, seekTime });
      
      // Validate the URL first
      const validated = play.yt_validate(cleanUrl);
      if (validated !== 'video') {
        throw new Error(`Invalid video URL: ${validated}`);
      }

      const stream = await play.stream(cleanUrl, {
        seek: seekTime,
      });

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true,
        metadata: {
          title: song.title,
        },
      });

      if (resource.volume) {
        resource.volume.setVolume(volume / 100);
      }

      logger.debug('play-dl stream created successfully');
      return resource;
    } catch (playDlError) {
      logger.warn('play-dl failed, trying Invidious fallback', { 
        error: (playDlError as Error).message,
        url: cleanUrl 
      });
    }

    // Fallback to Invidious API
    if (!videoId) {
      throw new Error('Could not extract video ID from URL');
    }

    logger.debug('Trying Invidious fallback', { videoId });
    const streamUrl = await getInvidiousStreamUrl(videoId);
    
    if (!streamUrl) {
      throw new Error('All streaming methods failed');
    }

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
      // FFmpeg outputs info to stderr, only log errors
      const msg = data.toString();
      if (msg.includes('Error') || msg.includes('error')) {
        logger.warn(`ffmpeg stderr: ${msg}`);
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

    logger.debug('Invidious stream created successfully');
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
