import { Player } from 'discord-player';
import { Client } from 'discord.js';
import { logger, logError } from '../utils/logger';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import { DefaultExtractors } from '@discord-player/extractor';

// Singleton instance
let player: Player | null = null;

/**
 * Initialize discord-player
 */
export async function initializePlayer(client: Client): Promise<Player> {
  if (player) return player;

  player = new Player(client);

  try {
    // Register defaults first (Spotify, SoundCloud, etc.)
    // Explicitly loading DefaultExtractors
    await player.extractors.loadMulti(DefaultExtractors);
    
    // Register YouTubei extractor which is more reliable for YouTube
    // We register it manually to ensure it takes precedence or is available
    await player.extractors.register(YoutubeiExtractor, {
      authentication: process.env.YOUTUBE_COOKIES || '' // Optional: pass cookies string if available
    });

    logger.info('Discord Player extractors loaded');
    logger.debug('Registered extractors', { list: player.extractors.store.keys() });
  } catch (error) {
    logger.error('Failed to load extractors', { error: (error as Error).message });
  }

  // Event handling
  player.events.on('playerStart', (queue: any, track: any) => {
    logger.info('Player started', { guild: queue.guild.id, track: track.title });
  });

  player.events.on('error', (queue: any, error: Error) => {
    logError(error, { context: 'Player Error', guild: queue.guild.id });
  });

  player.events.on('playerError', (queue: any, error: Error) => {
    logError(error, { context: 'Player Connection Error', guild: queue.guild.id });
  });

  return player;
}

/**
 * Get player instance
 */
export function getPlayer(): Player | null {
  return player;
}
