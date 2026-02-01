import { getPlayer } from '../services/player';
import { logger, logError } from '../utils/logger';
import { SearchQueryType } from 'discord-player';

/**
 * Plays a song (or adds to queue) using discord-player
 */
export async function playSong(guildId: string, query: string, channel: any): Promise<void> {
  const player = getPlayer();
  if (!player) throw new Error('Player not initialized');

  // Debug: Log available extractors
  const extractors = Array.from(player.extractors.store.keys());
  logger.info('Available extractors for play', { extractors, query });

  // Clean YouTube URL - remove playlist parameters that might confuse extractors
  let cleanQuery = query;
  if (query.includes('youtube.com/watch') || query.includes('youtu.be')) {
    try {
      const url = new URL(query);
      const videoId = url.searchParams.get('v') || url.pathname.slice(1);
      if (videoId) {
        // Use clean URL without playlist params
        cleanQuery = `https://www.youtube.com/watch?v=${videoId}`;
        if (cleanQuery !== query) {
          logger.info('Cleaned YouTube URL', { original: query, clean: cleanQuery });
        }
      }
    } catch (e) {
      // Not a valid URL, use as-is
    }
  }

  try {
    // Check if it's a YouTube URL
    const isYouTubeUrl = cleanQuery.includes('youtube.com') || cleanQuery.includes('youtu.be');

    if (isYouTubeUrl) {
      // Force use of youtubei extractor for YouTube URLs
      logger.info('Using explicit YouTube extractor', { query: cleanQuery });

      // First search with explicit extractor
      const searchResult = await player.search(cleanQuery, {
        requestedBy: undefined,
        searchEngine: 'ext:com.retrouser955.discord-player.discord-player-youtubei' as SearchQueryType
      });

      logger.info('Search result', {
        found: searchResult.tracks.length > 0,
        tracks: searchResult.tracks.length
      });

      if (searchResult && searchResult.tracks.length > 0) {
        const { track } = await player.play(channel, searchResult.tracks[0], {
          nodeOptions: { metadata: { channel: channel } }
        });
        logger.info('Played/Added song', { guildId, track: track.title });
        return;
      } else {
        throw new Error('No tracks found from YouTube extractor');
      }
    }

    // Non-YouTube: Try standard play
    logger.info('Attempting standard play', { query: cleanQuery });

    const result = await player.play(channel, cleanQuery, {
      nodeOptions: {
        metadata: { channel: channel }
      }
    });

    if (!result || !result.track) {
        throw new Error('No track found');
    }

    logger.info('Played/Added song', { guildId, track: result.track.title });
  } catch (error) {
    // Fallback: Try search by title
    logger.warn('Direct play failed, trying title search...', { error: (error as Error).message });

    try {
        // Extract video ID and search by it
        let searchTerm = cleanQuery;
        if (cleanQuery.includes('youtube.com') || cleanQuery.includes('youtu.be')) {
          try {
            const url = new URL(cleanQuery);
            searchTerm = url.searchParams.get('v') || url.pathname.slice(1);
          } catch (e) {
            // Use as-is
          }
        }

        const searchResult = await player.search(searchTerm, {
            requestedBy: undefined,
            searchEngine: 'ext:com.retrouser955.discord-player.discord-player-youtubei' as SearchQueryType
        });

        if (searchResult && searchResult.tracks.length > 0) {
            const { track } = await player.play(channel, searchResult.tracks[0], {
                nodeOptions: { metadata: { channel: channel } }
            });
            logger.info('Fallback play success', { track: track.title });
            return;
        }
    } catch (fallbackError) {
        logger.error('Fallback failed', { error: (fallbackError as Error).message });
    }

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

/**
 * Jumps to a specific track in the queue
 */
export function jumpTo(guildId: string, index: number): void {
  const player = getPlayer();
  const queue = player?.nodes.get(guildId);
  if (queue) {
    queue.node.jump(index);
    logger.info('Jumped to song', { guildId, index });
  }
}

/**
 * Plays previous song
 */
export async function previous(guildId: string): Promise<void> {
  const player = getPlayer();
  const queue = player?.nodes.get(guildId);
  if (queue && queue.history.previousTrack) {
    await queue.history.back();
    logger.info('Playing previous song', { guildId });
  } else {
    throw new Error('No previous song available');
  }
}
