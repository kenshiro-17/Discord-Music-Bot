import { Collection, TextChannel, VoiceChannel } from 'discord.js';
import { ServerQueue, Song, LoopMode } from '../types';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { getPlayer } from '../services/player';
import { GuildQueue, Track, QueueRepeatMode } from 'discord-player';

// Helper to convert Track to Song
function trackToSong(track: Track): Song {
  return {
    title: track.title,
    url: track.url,
    duration: track.durationMS / 1000,
    thumbnail: track.thumbnail,
    source: track.source as any,
    requestedBy: track.requestedBy as any
  };
}

/**
 * Gets queue for a guild (mapped from discord-player)
 */
export function getQueue(guildId: string): ServerQueue | undefined {
  const player = getPlayer();
  if (!player) return undefined;

  const dpQueue = player.nodes.get(guildId) as GuildQueue<any>;
  if (!dpQueue) return undefined;

  // Map discord-player queue to ServerQueue interface
  return {
    textChannel: dpQueue.metadata?.channel as TextChannel,
    voiceChannel: dpQueue.channel as VoiceChannel,
    connection: dpQueue.connection,
    songs: dpQueue.tracks.toArray().map(trackToSong),
    volume: dpQueue.node.volume,
    playing: dpQueue.node.isPlaying(),
    loop: dpQueue.repeatMode === 0 ? 'off' : (dpQueue.repeatMode === 1 ? 'song' : 'queue'),
    audioPlayer: null, // Legacy
    currentIndex: 0, // discord-player handles index internally, songs array is usually remaining songs
    startTime: 0, // Not easily exposed
    pausedTime: 0,
    // Add current song to the beginning of the list for compatibility
    // discord-player keeps current track separate from queue
  } as unknown as ServerQueue;
}

// ... legacy exports stubbed or redirected ...

/**
 * Deletes queue for a guild
 */
export function deleteQueue(guildId: string): boolean {
  const player = getPlayer();
  const queue = player?.nodes.get(guildId);
  if (queue) {
    queue.delete();
    return true;
  }
  return false;
}

// We implement basic operations that commands expect, delegating to discord-player

export function pause(guildId: string) {
    const player = getPlayer();
    const queue = player?.nodes.get(guildId);
    if (queue) {
        queue.node.pause();
        return { success: true };
    }
    return { success: false, error: 'No queue' };
}

export function resume(guildId: string) {
    const player = getPlayer();
    const queue = player?.nodes.get(guildId);
    if (queue) {
        queue.node.resume();
        return { success: true };
    }
    return { success: false, error: 'No queue' };
}

export function stop(guildId: string) {
    const player = getPlayer();
    const queue = player?.nodes.get(guildId);
    if (queue) {
        queue.delete();
        return { success: true };
    }
    return { success: false, error: 'No queue' };
}

export function setVolume(guildId: string, volume: number) {
    const player = getPlayer();
    const queue = player?.nodes.get(guildId);
    if (queue) {
        queue.node.setVolume(volume);
        return { success: true };
    }
    return { success: false, error: 'No queue' };
}

export function previous(guildId: string) {
    const player = getPlayer();
    const queue = player?.nodes.get(guildId);
    if (queue && queue.history.previousTrack) {
        queue.history.back();
        return { success: true, previousSong: trackToSong(queue.history.previousTrack) };
    }
    return { success: false, error: 'No previous track' };
}

export function skip(guildId: string) {
    const player = getPlayer();
    const queue = player?.nodes.get(guildId);
    if (queue) {
        queue.node.skip();
        // Return dummy next song, accurate next song hard to predict without event
        return { success: true, nextSong: {} as Song }; 
    }
    return { success: false, error: 'No queue' };
}

export function setLoop(guildId: string, mode: LoopMode) {
    const player = getPlayer();
    const queue = player?.nodes.get(guildId);
    if (queue) {
        // Map mode to discord-player RepeatMode (0: OFF, 1: TRACK, 2: QUEUE, 3: AUTOPLAY)
        let dpMode = QueueRepeatMode.OFF;
        if (mode === 'song') dpMode = QueueRepeatMode.TRACK;
        if (mode === 'queue') dpMode = QueueRepeatMode.QUEUE;
        queue.setRepeatMode(dpMode);
        return { success: true };
    }
    return { success: false, error: 'No queue' };
}

export function shuffleQueue(guildId: string) {
    const player = getPlayer();
    const queue = player?.nodes.get(guildId);
    if (queue) {
        queue.tracks.shuffle();
        return { success: true };
    }
    return { success: false, error: 'No queue' };
}

export function jumpToSong(guildId: string, index: number) {
    const player = getPlayer();
    const queue = player?.nodes.get(guildId);
    if (queue) {
        queue.node.jump(index);
        return { success: true, song: {} as Song };
    }
    return { success: false, error: 'No queue' };
}

// Stub other functions if needed
export function createQueue() { return {}; }
export function addSong() { return { success: true }; }
export function addSongs() { return { success: true }; }
export function removeSong() { return { success: true }; }
export function clearQueue(guildId: string) {
    const player = getPlayer();
    const queue = player?.nodes.get(guildId);
    if (queue) {
        queue.tracks.clear();
        return { success: true };
    }
    return { success: false, error: 'No queue' };
}

