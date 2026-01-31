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

  // Initialize without invalid options
  player = new Player(client);

  try {
    logger.info('Registering extractors...');

    // 1. Register YouTubei Extractor (Priority)
    await player.extractors.register(YoutubeiExtractor, {
      authentication: process.env.YOUTUBE_COOKIES || '' 
    });
    logger.info('Registered: YoutubeiExtractor');

    // 2. Load Default Extractors (Spotify, SoundCloud, etc.)
    await player.extractors.loadMulti(DefaultExtractors);
    logger.info('Registered: DefaultExtractors');

    // Debug: List all registered extractors
    const registered = player.extractors.store.keys();
    logger.info(`Total Extractors: ${Array.from(registered).join(', ')}`);

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

  return player;
}

/**
 * Get player instance
 */
export function getPlayer(): Player | null {
  return player;
}
