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
    logger.info('Registering extractors...');

    // 1. Load Default Extractors
    logger.info(`Loading defaults: ${DefaultExtractors.length} extractors`);
    await player.extractors.loadMulti(DefaultExtractors);
    
    // 2. Register YouTubei Extractor
    logger.info('Registering YoutubeiExtractor...');
    await player.extractors.register(YoutubeiExtractor, {
      authentication: process.env.YOUTUBE_COOKIES || '' 
    });

    // Debug: List all registered extractors
    // Using internal store access if public API doesn't show it
    const registered = player.extractors.store.keys();
    logger.info(`Total Registered Extractors: ${Array.from(registered).join(', ')}`);

  } catch (error) {
    logger.error('Failed to load extractors', { error: (error as Error).message });
  }

  // Event handling
  player.events.on('playerStart', (queue: any, track: any) => {
    logger.info('Player started', { guild: queue.guild.id, track: track.title, url: track.url });
  });

  player.events.on('error', (queue: any, error: Error) => {
    logError(error, { context: 'Player Error', guild: queue.guild.id });
  });

  player.events.on('playerError', (queue: any, error: Error) => {
    logError(error, { context: 'Player Connection Error', guild: queue.guild.id });
  });

  // Debug events
  player.events.on('debug', (queue: any, message: string) => {
    logger.debug('Player Debug', { message });
  });

  return player;
}

/**
 * Get player instance
 */
export function getPlayer(): Player | null {
  return player;
}
