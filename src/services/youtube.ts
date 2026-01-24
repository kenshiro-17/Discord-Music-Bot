import play from 'play-dl';
import { Song, YouTubeSearchResult } from '../types';
import { User } from 'discord.js';
import { logger, logError } from '../utils/logger';
import { PlaybackError } from '../utils/errorHandler';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config/config';

const execFileAsync = promisify(execFile);

// Cookie handling
const COOKIES_PATH = path.join(process.cwd(), 'cookies.txt');

// Determine yt-dlp path based on platform
const isWindows = process.platform === 'win32';
const YT_DLP_PATH = isWindows 
  ? path.join(process.cwd(), 'bin', 'yt-dlp.exe') 
  : 'yt-dlp'; // On Linux (Railway), assume it's in PATH via nixpacks

// Ensure cookies file exists if env var is provided
if (config.youtubeCookies && !fs.existsSync(COOKIES_PATH)) {
  try {
    fs.writeFileSync(COOKIES_PATH, config.youtubeCookies);
    logger.info('Created cookies.txt from environment variable');
  } catch (error) {
    logger.error('Failed to create cookies.txt', { error });
  }
}

/**
 * Helper to get default yt-dlp arguments
 */
function getYtDlpArgs(): string[] {
  const args = [
    '--no-warnings',
    '--no-check-certificate',
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    '--referer', 'https://www.youtube.com/',
    // Use Android client to bypass some bot checks
    '--extractor-args', 'youtube:player_client=android',
  ];

  if (fs.existsSync(COOKIES_PATH)) {
    args.push('--cookies', COOKIES_PATH);
  }

  return args;
}

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
    if (fs.existsSync(COOKIES_PATH)) {
        // play-dl currently doesn't support reading cookies.txt file directly via a simple API in all versions, 
        // but let's try to set it if we can parse it, or rely on yt-dlp for playback which we are doing.
        // For search, play-dl might still block.
        // We can't easily parse cookies.txt into the format play-dl wants without a parser.
        // But since we use yt-dlp for the critical playback part (getYouTubeInfo), we are mostly covered.
        // Search usually works better than playback regarding bot checks.
    }
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
    logger.debug('Fetching video info with yt-dlp', { url });

    const args = [
      ...getYtDlpArgs(),
      '--dump-json',
      '--socket-timeout', '10',
      '--',
      url
    ];

    const { stdout } = await execFileAsync(YT_DLP_PATH, args, { timeout: 30000 }); // 30s timeout

    const video = JSON.parse(stdout);

    // Check if it's a live stream (optional, yt-dlp handles lives, but we might want to skip)
    if (video.is_live) {
      throw new PlaybackError('Live streams are not supported');
    }

    return {
      title: video.title || 'Unknown Title',
      url: video.webpage_url || video.url || url,
      duration: video.duration || 0,
      thumbnail: video.thumbnail || '',
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
    logger.debug('Fetching playlist with yt-dlp', { url });

    const args = [
      ...getYtDlpArgs(),
      '--dump-single-json',
      '--flat-playlist',
      '--playlist-end', '100',
      '--socket-timeout', '10',
      '--',
      url
    ];

    const { stdout } = await execFileAsync(YT_DLP_PATH, args, { maxBuffer: 10 * 1024 * 1024, timeout: 30000 }); // 10MB buffer, 30s timeout

    const playlistData = JSON.parse(stdout);

    if (!playlistData || !playlistData.entries || playlistData.entries.length === 0) {
      throw new Error('Playlist is empty or unavailable');
    }

    const songs: Song[] = playlistData.entries
      .map((entry: any) => ({
        title: entry.title || 'Unknown Title',
        url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
        duration: entry.duration || 0,
        thumbnail: entry.thumbnail || `https://img.youtube.com/vi/${entry.id}/hqdefault.jpg`,
        requestedBy: user,
        source: 'youtube' as const,
      }));

    logger.info('YouTube playlist fetched', {
      url,
      title: playlistData.title,
      songs: songs.length,
    });

    return songs;
  } catch (error) {
    logger.warn('Failed to fetch playlist with yt-dlp, attempting fallback to single video', { url, error: (error as Error).message });

    // Fallback: If playlist fails but has a video ID, return that single video
    if (url.includes('v=')) {
      try {
        // Strip playlist parameters to ensure it's treated as a single video
        const videoUrl = url.split('&')[0];
        logger.info('Attempting fallback with cleaned URL', { videoUrl });

        const video = await getYouTubeInfo(videoUrl);
        if (video) {
          video.requestedBy = user; // Ensure user is set
          return [video];
        }
      } catch (innerError) {
        logger.error('Fallback video fetch failed', { error: (innerError as Error).message });
      }
    }

    logError(error as Error, { context: 'Failed to get YouTube playlist', url });
    throw new PlaybackError('Failed to fetch playlist');
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
