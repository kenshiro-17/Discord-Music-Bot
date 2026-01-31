import { Client } from 'discord.js';
import { Shoukaku, Connectors, Player, Track, LoadType } from 'shoukaku';
import { logger } from '../utils/logger';

// Lavalink node configuration
const LavalinkNodes = [
  {
    name: 'main',
    url: process.env.LAVALINK_HOST || 'localhost:2333',
    auth: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
  },
];

// Shoukaku instance
let shoukaku: Shoukaku | null = null;

/**
 * Initialize Shoukaku/Lavalink connection
 */
export function initializeLavalink(client: Client): Shoukaku {
  if (shoukaku) return shoukaku;

  shoukaku = new Shoukaku(new Connectors.DiscordJS(client), LavalinkNodes, {
    moveOnDisconnect: false,
    resume: false,
    resumeTimeout: 30,
    reconnectTries: 3,
    reconnectInterval: 5,
  });

  // Event handlers
  shoukaku.on('ready', (name) => {
    logger.info('Lavalink node connected', { node: name });
  });

  shoukaku.on('error', (name, error) => {
    logger.error('Lavalink node error', { node: name, error: error.message });
  });

  shoukaku.on('close', (name, code, reason) => {
    logger.warn('Lavalink node disconnected', { node: name, code, reason });
  });

  shoukaku.on('disconnect', (name, count) => {
    logger.warn('Lavalink node disconnected', { node: name, playerCount: count });
  });

  shoukaku.on('debug', (name, info) => {
    logger.debug('Lavalink debug', { node: name, info });
  });

  return shoukaku;
}

/**
 * Get Shoukaku instance
 */
export function getShoukaku(): Shoukaku | null {
  return shoukaku;
}

/**
 * Get or create a player for a guild
 */
export async function getPlayer(guildId: string, channelId: string): Promise<Player | null> {
  if (!shoukaku) {
    logger.error('Shoukaku not initialized');
    return null;
  }

  // Check if player already exists
  let player = shoukaku.players.get(guildId);
  
  if (!player) {
    // Get an available node
    const node = shoukaku.options.nodeResolver?.(shoukaku.nodes) || shoukaku.nodes.values().next().value;
    
    if (!node) {
      logger.error('No Lavalink nodes available');
      return null;
    }

    // Create new player
    player = await shoukaku.joinVoiceChannel({
      guildId,
      channelId,
      shardId: 0,
      deaf: true,
    });

    logger.info('Created Lavalink player', { guildId, channelId });
  }

  return player;
}

/**
 * Destroy a player for a guild
 */
export async function destroyPlayer(guildId: string): Promise<void> {
  if (!shoukaku) return;

  const player = shoukaku.players.get(guildId);
  if (player) {
    await shoukaku.leaveVoiceChannel(guildId);
    logger.info('Destroyed Lavalink player', { guildId });
  }
}

/**
 * Search for tracks
 */
export async function searchTracks(query: string): Promise<Track[]> {
  if (!shoukaku) {
    logger.error('Shoukaku not initialized');
    return [];
  }

  const node = shoukaku.options.nodeResolver?.(shoukaku.nodes) || shoukaku.nodes.values().next().value;
  
  if (!node) {
    logger.error('No Lavalink nodes available');
    return [];
  }

  try {
    // Determine search prefix
    let searchQuery = query;
    
    // If it's a URL, use it directly
    if (query.startsWith('http://') || query.startsWith('https://')) {
      searchQuery = query;
    }
    // If it's a YouTube URL, use it directly
    else if (query.includes('youtube.com') || query.includes('youtu.be')) {
      searchQuery = query;
    }
    // Otherwise, use YouTube search
    else {
      searchQuery = `ytsearch:${query}`;
    }

    const result = await node.rest.resolve(searchQuery);

    if (!result) {
      logger.warn('No results found', { query });
      return [];
    }

    switch (result.loadType) {
      case LoadType.TRACK:
        return [result.data];
      
      case LoadType.PLAYLIST:
        logger.info('Loaded playlist', { name: result.data.info.name, trackCount: result.data.tracks.length });
        return result.data.tracks;
      
      case LoadType.SEARCH:
        return result.data;
      
      case LoadType.EMPTY:
        logger.warn('No results found', { query });
        return [];
      
      case LoadType.ERROR:
        logger.error('Error loading track', { query, error: result.data });
        return [];
      
      default:
        return [];
    }
  } catch (error) {
    logger.error('Failed to search tracks', { query, error: (error as Error).message });
    return [];
  }
}

/**
 * Convert Lavalink track to our Song format
 */
export function trackToSong(track: Track): {
  title: string;
  url: string;
  duration: number;
  thumbnail: string;
  source: 'youtube' | 'soundcloud' | 'spotify' | 'file';
  requestedBy?: string;
  encodedTrack: string;
} {
  const info = track.info;
  
  // Determine source
  let source: 'youtube' | 'soundcloud' | 'spotify' | 'file' = 'youtube';
  if (info.sourceName === 'soundcloud') source = 'soundcloud';
  else if (info.sourceName === 'spotify') source = 'spotify';

  // Get thumbnail
  let thumbnail = '';
  if (info.sourceName === 'youtube' && info.identifier) {
    thumbnail = `https://img.youtube.com/vi/${info.identifier}/hqdefault.jpg`;
  } else if (info.artworkUrl) {
    thumbnail = info.artworkUrl;
  }

  return {
    title: info.title || 'Unknown Title',
    url: info.uri || '',
    duration: Math.floor((info.length || 0) / 1000), // Convert ms to seconds
    thumbnail,
    source,
    encodedTrack: track.encoded,
  };
}

/**
 * Check if Lavalink is connected
 */
export function isLavalinkReady(): boolean {
  if (!shoukaku) return false;
  return shoukaku.nodes.size > 0;
}
