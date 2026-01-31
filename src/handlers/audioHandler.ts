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
import { Innertube, ClientType } from 'youtubei.js';

// YouTube.js client instance - lazy loaded
let innertube: Innertube | null = null;
let innertubeInitializing = false;

/**
 * Get or initialize the YouTube.js client
 */
async function getInnertube(): Promise<Innertube> {
  if (innertube) return innertube;
  
  if (innertubeInitializing) {
    // Wait for initialization to complete
    while (innertubeInitializing && !innertube) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (innertube) return innertube;
  }
  
  innertubeInitializing = true;
  try {
    logger.info('Initializing YouTube.js client...');
    innertube = await Innertube.create({
      // Use iOS client which has fewer restrictions
      client_type: ClientType.IOS,
      generate_session_locally: true,
    });
    logger.info('YouTube.js client initialized successfully');
    return innertube;
  } catch (error) {
    innertubeInitializing = false;
    logger.error('Failed to initialize YouTube.js client', { error: (error as Error).message });
    throw error;
  }
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
 * Creates audio resource from song using YouTube.js built-in download
 */
async function createAudioResourceFromSong(song: Song, volume: number, seekTime: number = 0): Promise<AudioResource> {
  try {
    if (!song.url) throw new Error('No URL provided for song');

    const videoId = extractVideoId(song.url);
    if (!videoId) {
      throw new Error('Could not extract video ID from URL');
    }

    logger.debug('Creating stream with YouTube.js', { videoId, seekTime });

    // Get YouTube.js client
    const yt = await getInnertube();
    
    // Get video info using getInfo for full streaming support
    const info = await yt.getInfo(videoId);
    
    logger.debug('Got video info', { 
      videoId, 
      title: info.basic_info.title,
      duration: info.basic_info.duration,
    });

    // Use YouTube.js built-in download which handles all the complexity
    // This uses the proper client headers and session
    const stream = await yt.download(videoId, {
      type: 'audio',
      quality: 'best',
      // Use iOS client which has fewer restrictions
      client: 'IOS',
    });

    logger.debug('Got download stream', { videoId });

    // Convert web ReadableStream to Node.js Readable
    const { Readable } = await import('stream');
    const nodeStream = Readable.fromWeb(stream as import('stream/web').ReadableStream);

    const resource = createAudioResource(nodeStream, {
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
