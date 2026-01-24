import SpotifyWebApi from 'spotify-web-api-node';
import { Song } from '../types';
import { User } from 'discord.js';
import { config, isSpotifyEnabled } from '../config/config';
import { logger, logError } from '../utils/logger';
import { PlaybackError } from '../utils/errorHandler';
import { searchYouTube } from './youtube';
import { parseSpotifyUrl } from '../utils/validators';

/**
 * Spotify API client
 */
let spotifyApi: SpotifyWebApi | null = null;

/**
 * Spotify to YouTube mapping cache
 */
const spotifyYouTubeCache = new Map<string, string>();

/**
 * Initializes Spotify API client
 */
export async function initializeSpotify(): Promise<void> {
  if (!isSpotifyEnabled()) {
    logger.warn('Spotify credentials not configured, Spotify support disabled');
    return;
  }

  try {
    spotifyApi = new SpotifyWebApi({
      clientId: config.spotifyClientId,
      clientSecret: config.spotifyClientSecret,
    });

    // Get access token
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body.access_token);

    // Set up token refresh
    const expiresIn = data.body.expires_in;
    setTimeout(refreshSpotifyToken, (expiresIn - 60) * 1000); // Refresh 1 min before expiry

    logger.info('Spotify API initialized');
  } catch (error) {
    logError(error as Error, { context: 'Failed to initialize Spotify' });
    spotifyApi = null;
  }
}

/**
 * Refreshes Spotify access token
 */
async function refreshSpotifyToken(): Promise<void> {
  if (!spotifyApi) return;

  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body.access_token);

    const expiresIn = data.body.expires_in;
    setTimeout(refreshSpotifyToken, (expiresIn - 60) * 1000);

    logger.info('Spotify token refreshed');
  } catch (error) {
    logError(error as Error, { context: 'Failed to refresh Spotify token' });
  }
}

/**
 * Checks if Spotify is available
 */
export function isSpotifyAvailable(): boolean {
  return spotifyApi !== null;
}

/**
 * Gets Spotify track and finds YouTube match
 */
export async function getSpotifyTrack(id: string, user: User): Promise<Song | null> {
  if (!spotifyApi) {
    throw new PlaybackError('Spotify is not configured');
  }

  try {
    // Check cache first
    const cachedUrl = spotifyYouTubeCache.get(id);
    if (cachedUrl) {
      logger.debug('Using cached Spotify->YouTube mapping', { id });
      const play = require('play-dl');
      const info = await play.video_info(cachedUrl);
      if (info) {
        return {
          title: info.video_details.title,
          url: cachedUrl,
          duration: info.video_details.durationInSec,
          thumbnail: info.video_details.thumbnails[0]?.url || '',
          requestedBy: user,
          source: 'spotify',
        };
      }
    }

    // Fetch from Spotify
    const track = await spotifyApi.getTrack(id);
    const trackData = track.body;

    const artists = trackData.artists.map((artist: any) => artist.name).join(', ');
    const trackName = trackData.name;

    // Search YouTube
    const youtubeUrl = await findYouTubeMatch(trackName, artists);

    if (!youtubeUrl) {
      throw new PlaybackError('Could not find YouTube match for Spotify track');
    }

    // Cache the mapping
    spotifyYouTubeCache.set(id, youtubeUrl);

    // Get YouTube info
    const play = require('play-dl');
    const info = await play.video_info(youtubeUrl);

    logger.info('Spotify track converted to YouTube', {
      spotifyTrack: `${artists} - ${trackName}`,
      youtubeUrl,
    });

    return {
      title: `${artists} - ${trackName}`,
      url: youtubeUrl,
      duration: info.video_details.durationInSec,
      thumbnail: trackData.album.images[0]?.url || '',
      requestedBy: user,
      source: 'spotify',
    };
  } catch (error) {
    logError(error as Error, { context: 'Failed to get Spotify track', id });
    return null;
  }
}

/**
 * Gets Spotify playlist
 */
export async function getSpotifyPlaylist(id: string, user: User): Promise<Song[]> {
  if (!spotifyApi) {
    throw new PlaybackError('Spotify is not configured');
  }

  try {
    const songs: Song[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const playlist = await spotifyApi.getPlaylistTracks(id, {
        offset,
        limit,
      });

      const tracks = playlist.body.items;

      for (const item of tracks) {
        if (!item.track || item.track.type !== 'track') continue;

        const track = item.track;
        const artists = track.artists.map((artist: any) => artist.name).join(', ');
        const trackName = track.name;

        try {
          // Try to find YouTube match
          const youtubeUrl = await findYouTubeMatch(trackName, artists);

          if (youtubeUrl) {
            const play = require('play-dl');
            const info = await play.video_info(youtubeUrl);

            songs.push({
              title: `${artists} - ${trackName}`,
              url: youtubeUrl,
              duration: info.video_details.durationInSec,
              thumbnail: track.album.images[0]?.url || '',
              requestedBy: user,
              source: 'spotify',
            });
          }
        } catch (error) {
          // Skip tracks that fail
          logger.debug('Failed to convert Spotify track', { track: trackName });
        }

        // Limit to 50 songs
        if (songs.length >= 50) break;
      }

      if (songs.length >= 50 || tracks.length < limit) break;
      offset += limit;
    }

    logger.info('Spotify playlist fetched', { id, songs: songs.length });

    return songs;
  } catch (error) {
    logError(error as Error, { context: 'Failed to get Spotify playlist', id });
    throw new PlaybackError('Failed to fetch Spotify playlist');
  }
}

/**
 * Gets Spotify album
 */
export async function getSpotifyAlbum(id: string, user: User): Promise<Song[]> {
  if (!spotifyApi) {
    throw new PlaybackError('Spotify is not configured');
  }

  try {
    const album = await spotifyApi.getAlbum(id);
    const tracks = album.body.tracks.items;
    const songs: Song[] = [];

    for (const track of tracks) {
      const artists = track.artists.map((artist: any) => artist.name).join(', ');
      const trackName = track.name;

      try {
        const youtubeUrl = await findYouTubeMatch(trackName, artists);

        if (youtubeUrl) {
          const play = require('play-dl');
          const info = await play.video_info(youtubeUrl);

          songs.push({
            title: `${artists} - ${trackName}`,
            url: youtubeUrl,
            duration: info.video_details.durationInSec,
            thumbnail: album.body.images[0]?.url || '',
            requestedBy: user,
            source: 'spotify',
          });
        }
      } catch (error) {
        logger.debug('Failed to convert Spotify track', { track: trackName });
      }

      // Limit to 50 songs
      if (songs.length >= 50) break;
    }

    logger.info('Spotify album fetched', { id, songs: songs.length });

    return songs;
  } catch (error) {
    logError(error as Error, { context: 'Failed to get Spotify album', id });
    throw new PlaybackError('Failed to fetch Spotify album');
  }
}

/**
 * Finds YouTube match for a Spotify track
 */
export async function findYouTubeMatch(trackName: string, artists: string): Promise<string | null> {
  try {
    const query = `${artists} - ${trackName} official audio`;
    const results = await searchYouTube(query, 1);

    if (results.length > 0) {
      return results[0].url;
    }

    return null;
  } catch (error) {
    logError(error as Error, {
      context: 'Failed to find YouTube match',
      track: trackName,
      artists,
    });
    return null;
  }
}

/**
 * Processes Spotify URL
 */
export async function processSpotifyUrl(url: string, user: User): Promise<Song[] | null> {
  const parsed = parseSpotifyUrl(url);

  if (!parsed) {
    return null;
  }

  try {
    if (parsed.type === 'track') {
      const song = await getSpotifyTrack(parsed.id, user);
      return song ? [song] : null;
    } else if (parsed.type === 'playlist') {
      return await getSpotifyPlaylist(parsed.id, user);
    } else if (parsed.type === 'album') {
      return await getSpotifyAlbum(parsed.id, user);
    }

    return null;
  } catch (error) {
    logError(error as Error, { context: 'Failed to process Spotify URL', url });
    return null;
  }
}
