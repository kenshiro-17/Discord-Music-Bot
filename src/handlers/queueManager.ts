import { Collection, TextChannel, VoiceChannel } from 'discord.js';
import { ServerQueue, Song, LoopMode } from '../types';
import { config } from '../config/config';
import { logger } from '../utils/logger';

/**
 * Global queue storage
 */
const queues = new Collection<string, ServerQueue>();

/**
 * Creates a new queue for a guild
 */
export function createQueue(
  textChannel: TextChannel,
  voiceChannel: VoiceChannel
): ServerQueue {
  const queue: ServerQueue = {
    textChannel,
    voiceChannel,
    connection: null,
    songs: [],
    volume: config.defaultVolume,
    playing: false,
    loop: 'off',
    audioPlayer: null,
    currentIndex: 0,
  };

  queues.set(voiceChannel.guild.id, queue);
  logger.info('Queue created', { guildId: voiceChannel.guild.id });

  return queue;
}

/**
 * Gets queue for a guild
 */
export function getQueue(guildId: string): ServerQueue | undefined {
  return queues.get(guildId);
}

/**
 * Deletes queue for a guild
 */
export function deleteQueue(guildId: string): boolean {
  const deleted = queues.delete(guildId);
  if (deleted) {
    logger.info('Queue deleted', { guildId });
  }
  return deleted;
}

/**
 * Adds a song to the queue
 */
export function addSong(guildId: string, song: Song): { success: boolean; position?: number; error?: string } {
  const queue = getQueue(guildId);

  if (!queue) {
    return { success: false, error: 'No active queue found' };
  }

  if (queue.songs.length >= config.maxQueueSize) {
    return {
      success: false,
      error: `Queue is full (maximum ${config.maxQueueSize} songs)`,
    };
  }

  queue.songs.push(song);
  const position = queue.songs.length;

  logger.info('Song added to queue', {
    guildId,
    song: song.title,
    position,
  });

  return { success: true, position };
}

/**
 * Adds multiple songs to the queue
 */
export function addSongs(
  guildId: string,
  songs: Song[]
): { success: boolean; count?: number; error?: string } {
  const queue = getQueue(guildId);

  if (!queue) {
    return { success: false, error: 'No active queue found' };
  }

  const availableSpace = config.maxQueueSize - queue.songs.length;
  if (availableSpace <= 0) {
    return {
      success: false,
      error: `Queue is full (maximum ${config.maxQueueSize} songs)`,
    };
  }

  const songsToAdd = songs.slice(0, availableSpace);
  queue.songs.push(...songsToAdd);

  logger.info('Multiple songs added to queue', {
    guildId,
    count: songsToAdd.length,
    total: queue.songs.length,
  });

  return { success: true, count: songsToAdd.length };
}

/**
 * Removes a song from the queue by index
 */
export function removeSong(guildId: string, index: number): { success: boolean; error?: string } {
  const queue = getQueue(guildId);

  if (!queue) {
    return { success: false, error: 'No active queue found' };
  }

  if (index < 0 || index >= queue.songs.length) {
    return { success: false, error: 'Invalid song index' };
  }

  if (index === queue.currentIndex) {
    return {
      success: false,
      error: 'Cannot remove currently playing song. Use skip instead.',
    };
  }

  const removedSong = queue.songs.splice(index, 1)[0];

  // Adjust current index if needed
  if (index < queue.currentIndex) {
    queue.currentIndex--;
  }

  logger.info('Song removed from queue', {
    guildId,
    song: removedSong.title,
    index,
  });

  return { success: true };
}

/**
 * Clears the queue
 */
export function clearQueue(guildId: string): { success: boolean; error?: string } {
  const queue = getQueue(guildId);

  if (!queue) {
    return { success: false, error: 'No active queue found' };
  }

  const currentSong = queue.songs[queue.currentIndex];
  queue.songs = [currentSong];
  queue.currentIndex = 0;

  logger.info('Queue cleared', { guildId });

  return { success: true };
}

/**
 * Shuffles the queue (preserving current song)
 */
export function shuffleQueue(guildId: string): { success: boolean; error?: string } {
  const queue = getQueue(guildId);

  if (!queue) {
    return { success: false, error: 'No active queue found' };
  }

  if (queue.songs.length <= 1) {
    return { success: false, error: 'Not enough songs to shuffle' };
  }

  // Remove current song temporarily
  const currentSong = queue.songs[queue.currentIndex];
  const otherSongs = queue.songs.filter((_, i) => i !== queue.currentIndex);

  // Fisher-Yates shuffle
  for (let i = otherSongs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [otherSongs[i], otherSongs[j]] = [otherSongs[j], otherSongs[i]];
  }

  // Reconstruct queue with current song at index 0
  queue.songs = [currentSong, ...otherSongs];
  queue.currentIndex = 0;

  logger.info('Queue shuffled', { guildId });

  return { success: true };
}

/**
 * Jumps to a specific song in the queue
 */
export function jumpToSong(guildId: string, index: number): { success: boolean; error?: string; song?: Song } {
  const queue = getQueue(guildId);

  if (!queue) {
    return { success: false, error: 'No active queue found' };
  }

  if (index < 0 || index >= queue.songs.length) {
    return { success: false, error: 'Invalid song index' };
  }

  queue.currentIndex = index;

  logger.info('Jumped to song', {
    guildId,
    index,
    song: queue.songs[index].title,
  });

  return { success: true, song: queue.songs[index] };
}

/**
 * Skips to the next song
 */
export function skip(guildId: string): { success: boolean; error?: string; nextSong?: Song; shouldStop?: boolean } {
  const queue = getQueue(guildId);

  if (!queue) {
    return { success: false, error: 'No active queue found' };
  }

  // Handle loop modes
  if (queue.loop === 'song') {
    // Stay on current song
    return { success: true, nextSong: queue.songs[queue.currentIndex] };
  } else if (queue.loop === 'queue') {
    // Move to next song, wrap around if at end
    queue.currentIndex = (queue.currentIndex + 1) % queue.songs.length;
    return { success: true, nextSong: queue.songs[queue.currentIndex] };
  } else {
    // Normal mode: move to next song
    queue.currentIndex++;

    if (queue.currentIndex >= queue.songs.length) {
      // No more songs
      return { success: true, shouldStop: true };
    }

    return { success: true, nextSong: queue.songs[queue.currentIndex] };
  }
}

/**
 * Sets loop mode
 */
export function setLoop(guildId: string, mode: LoopMode): { success: boolean; error?: string } {
  const queue = getQueue(guildId);

  if (!queue) {
    return { success: false, error: 'No active queue found' };
  }

  queue.loop = mode;

  logger.info('Loop mode changed', { guildId, mode });

  return { success: true };
}

/**
 * Sets volume
 */
export function setVolume(guildId: string, volume: number): { success: boolean; error?: string } {
  const queue = getQueue(guildId);

  if (!queue) {
    return { success: false, error: 'No active queue found' };
  }

  if (volume < 0 || volume > 200) {
    return { success: false, error: 'Volume must be between 0 and 200' };
  }

  queue.volume = volume;

  logger.info('Volume changed', { guildId, volume });

  return { success: true };
}

/**
 * Pauses playback
 */
export function pause(guildId: string): { success: boolean; error?: string } {
  const queue = getQueue(guildId);

  if (!queue || !queue.audioPlayer) {
    return { success: false, error: 'Nothing is playing' };
  }

  if (!queue.playing) {
    return { success: false, error: 'Playback is already paused' };
  }

  queue.audioPlayer.pause();
  queue.playing = false;

  logger.info('Playback paused', { guildId });

  return { success: true };
}

/**
 * Resumes playback
 */
export function resume(guildId: string): { success: boolean; error?: string } {
  const queue = getQueue(guildId);

  if (!queue || !queue.audioPlayer) {
    return { success: false, error: 'Nothing is playing' };
  }

  if (queue.playing) {
    return { success: false, error: 'Playback is already active' };
  }

  queue.audioPlayer.unpause();
  queue.playing = true;

  logger.info('Playback resumed', { guildId });

  return { success: true };
}

/**
 * Stops playback and clears queue
 */
export function stop(guildId: string): { success: boolean; error?: string } {
  const queue = getQueue(guildId);

  if (!queue) {
    return { success: false, error: 'Nothing is playing' };
  }

  if (queue.audioPlayer) {
    queue.audioPlayer.stop();
  }

  logger.info('Playback stopped', { guildId });

  return { success: true };
}

/**
 * Gets current song
 */
export function getCurrentSong(guildId: string): Song | undefined {
  const queue = getQueue(guildId);
  if (!queue || queue.songs.length === 0) return undefined;
  return queue.songs[queue.currentIndex];
}

/**
 * Gets all queues (for metrics)
 */
export function getAllQueues(): Collection<string, ServerQueue> {
  return queues;
}
