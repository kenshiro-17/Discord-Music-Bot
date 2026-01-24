import play from 'play-dl';
import { Song, YouTubeSearchResult } from '../types';
import { User } from 'discord.js';
import { logger, logError } from '../utils/logger';
import { PlaybackError } from '../utils/errorHandler';

/**
 * Search cache to avoid repeated searches
 */
interface SearchCacheEntry {
  results: YouTubeSearchResult[];
  timestamp: number;
}

const searchCache = new Map<string, SearchCacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Initializes play-dl
 */
export async function initializePlayDl(): Promise<void> {
  try {
    // play-dl will auto-initialize, but we can set user agent if needed
    logger.info('play-dl initialized');
  } catch (error) {
    logError(error as Error, { context: 'Failed to initialize play-dl' });
  }
}

/**
 * Checks if URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  return play.yt_validate(url) === 'video' || play.yt_validate(url) === 'playlist';
}

/**
 * Checks if URL is a YouTube playlist
 */
export function isYouTubePlaylist(url: string): boolean {
  return play.yt_validate(url) === 'playlist';
}

/**
 * Searches YouTube for videos
 */
export async function searchYouTube(query: string, limit: number = 5): Promise<YouTubeSearchResult[]> {
  try {
    // Check cache first
    const cached = searchCache.get(query);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.debug('Returning cached search results', { query });
      return cached.results;
    }

    const searchResults = await play.search(query, {
      limit,
      source: { youtube: 'video' },
    });

    const results: YouTubeSearchResult[] = searchResults.map((video) => ({
      title: video.title || 'Unknown Title',
      url: video.url,
      duration: video.durationInSec || 0,
      thumbnail: video.thumbnails[0]?.url || '',
      channel: video.channel?.name || 'Unknown Channel',
    }));

    // Cache results
    searchCache.set(query, {
      results,
      timestamp: Date.now(),
    });

    logger.info('YouTube search completed', { query, results: results.length });

    return results;
  } catch (error) {
    logError(error as Error, { context: 'YouTube search failed', query, limit });
    throw new PlaybackError(`Failed to search YouTube: ${(error as Error).message}`);
  }
}

/**
 * Gets YouTube video information
 */
export async function getYouTubeInfo(url: string): Promise<Song | null> {
  try {
    const info = await play.video_info(url);

    if (!info || !info.video_details) {
      return null;
    }

    const video = info.video_details;

    // Check if it's a live stream
    if (video.live) {
      throw new PlaybackError('Live streams are not supported');
    }

    return {
      title: video.title || 'Unknown Title',
      url: video.url,
      duration: video.durationInSec || 0,
      thumbnail: video.thumbnails[0]?.url || '',
      requestedBy: {} as User, // Will be set by caller
      source: 'youtube',
    };
  } catch (error) {
    logError(error as Error, { context: 'Failed to get YouTube video info', url });
    return null;
  }
}

/**
 * Gets all videos from a YouTube playlist
 */
export async function getYouTubePlaylist(url: string, user: User): Promise<Song[]> {
  try {
    const playlist = await play.playlist_info(url, { incomplete: true });

    if (!playlist) {
      throw new PlaybackError('Failed to fetch playlist information');
    }

    await playlist.fetch();
    const videos = (playlist as any).videos;

    if (!videos || videos.length === 0) {
      throw new PlaybackError('Playlist is empty or unavailable');
    }

    // Limit to 100 songs to avoid abuse
    const limitedVideos = videos.slice(0, 100);

    const songs: Song[] = limitedVideos
      .filter((video: any) => !video.live) // Filter out live streams
      .map((video: any) => ({
        title: video.title || 'Unknown Title',
        url: video.url,
        duration: video.durationInSec || 0,
        thumbnail: video.thumbnails[0]?.url || '',
        requestedBy: user,
        source: 'youtube' as const,
      }));

    logger.info('YouTube playlist fetched', {
      url,
      title: playlist.title,
      songs: songs.length,
    });

    return songs;
  } catch (error) {
    logger.warn('Failed to fetch playlist, attempting fallback to single video', { url, error: (error as Error).message });

    // Fallback: If playlist fails but has a video ID, return that single video
    if (url.includes('v=')) {
      try {
        const video = await getYouTubeInfo(url);
        if (video) {
          return [video];
        }
      } catch (innerError) {
        logger.error('Fallback video fetch failed', { error: (innerError as Error).message });
      }
    }

    logError(error as Error, { context: 'Failed to get YouTube playlist', url });
    throw new PlaybackError('Failed to fetch playlist (and fallback failed)');
  }
}

/**
 * Clears search cache (for cleanup)
 */
export function clearSearchCache(): void {
  searchCache.clear();
  logger.debug('Search cache cleared');
}

/**
 * Cleans up old cache entries
 */
export function cleanupSearchCache(): void {
  const now = Date.now();
  let removed = 0;

  for (const [key, entry] of searchCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      searchCache.delete(key);
      removed++;
    }
  }

  if (removed > 0) {
    logger.debug('Cleaned up search cache', { removed });
  }
}

// Set up periodic cache cleanup
setInterval(cleanupSearchCache, 10 * 60 * 1000); // Every 10 minutes
