import { getPlayer } from '../services/player';
import { logger, logError } from '../utils/logger';

/**
 * Plays a song (or adds to queue) using discord-player
 */
export async function playSong(guildId: string, query: string, channel: any): Promise<void> {
  const player = getPlayer();
  if (!player) throw new Error('Player not initialized');

  try {
    const { track } = await player.play(channel, query, {
      nodeOptions: {
        metadata: { channel: channel }
      }
    });

    logger.info('Played/Added song', { guildId, track: track.title });
  } catch (error) {
    logError(error as Error, { context: 'Play Error', guildId });
    throw error;
  }
}

/**
 * Pause playback
 */
export async function pausePlayback(guildId: string): Promise<void> {
  const player = getPlayer();
  const queue = player?.nodes.get(guildId);
  if (queue) {
    queue.node.pause();
    logger.info('Playback paused', { guildId });
  }
}

/**
 * Resume playback
 */
export async function resumePlayback(guildId: string): Promise<void> {
  const player = getPlayer();
  const queue = player?.nodes.get(guildId);
  if (queue) {
    queue.node.resume();
    logger.info('Playback resumed', { guildId });
  }
}

/**
 * Stop playback and clean up
 */
export async function stopPlayback(guildId: string): Promise<void> {
  const player = getPlayer();
  const queue = player?.nodes.get(guildId);
  if (queue) {
    queue.delete();
    logger.info('Playback stopped', { guildId });
  }
}

/**
 * Updates volume
 */
export function updateVolume(guildId: string, volume: number): void {
  const player = getPlayer();
  const queue = player?.nodes.get(guildId);
  if (queue) {
    queue.node.setVolume(volume);
    logger.info('Volume updated', { guildId, volume });
  }
}

/**
 * Seeks to a specific time in the song
 */
export async function seekTo(guildId: string, timestamp: number): Promise<void> {
  const player = getPlayer();
  const queue = player?.nodes.get(guildId);
  if (queue) {
    await queue.node.seek(timestamp * 1000);
    logger.info('Seeked', { guildId, timestamp });
  }
}

/**
 * Skips the current song
 */
export function skip(guildId: string): void {
  const player = getPlayer();
  const queue = player?.nodes.get(guildId);
  if (queue) {
    queue.node.skip();
    logger.info('Skipped song', { guildId });
  }
}
