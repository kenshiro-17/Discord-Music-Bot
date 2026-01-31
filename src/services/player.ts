import { Player, BaseExtractor, Track } from 'discord-player';
import { Client } from 'discord.js';
import { logger, logError } from '../utils/logger';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import { DefaultExtractors } from '@discord-player/extractor';
import play from 'play-dl';
import SimpleYouTubeExtractor from '../extractors/SimpleYouTubeExtractor';

// Singleton instance
let player: Player | null = null;

// Custom play-dl extractor
class PlayDLExtractor extends BaseExtractor {
    static identifier = 'com.discord-player.playdlextractor';

    async validate(query: string) {
        if (typeof query !== 'string') return false;
        // Check if youtube
        return query.includes('youtube.com') || query.includes('youtu.be');
    }

    async handle(query: string, _context: any) {
        try {
            if (play.yt_validate(query) === 'video') {
                const info = await play.video_info(query);
                
                const track = new Track(this.context.player, {
                    title: info.video_details.title || 'Unknown',
                    url: info.video_details.url,
                    duration: info.video_details.durationInSec.toString(),
                    thumbnail: info.video_details.thumbnails[0]?.url,
                    author: info.video_details.channel?.name || 'Unknown',
                    views: info.video_details.views,
                    source: 'youtube',
                    raw: info,
                    queryType: 'youtubeVideo'
                });

                return {
                    playlist: null,
                    tracks: [track]
                };
            }
            // Add playlist support if needed
        } catch (e) {
            return { playlist: null, tracks: [] };
        }
        return { playlist: null, tracks: [] };
    }

    async stream(info: Track) {
        const stream = await play.stream(info.url);
        return stream.stream;
    }
}

/**
 * Initialize discord-player
 */
export async function initializePlayer(client: Client): Promise<Player> {
  if (player) return player;

  player = new Player(client);

  try {
    logger.info('Registering extractors...');

    // 1. Load Default Extractors first (Standard priority)
    await player.extractors.loadMulti(DefaultExtractors);
    logger.info('Registered: DefaultExtractors');

    // 2. Register SimpleYouTubeExtractor (ytdl-core) - Very reliable fallback
    try {
        await player.extractors.register(SimpleYouTubeExtractor, {});
        logger.info('Registered: SimpleYouTubeExtractor');
    } catch (e) {
        logger.error('Failed to register SimpleYouTubeExtractor', { error: (e as Error).message });
    }

    // 3. Register Custom PlayDL Extractor (Robust fallback)
    try {
        await player.extractors.register(PlayDLExtractor, {});
        logger.info('Registered: PlayDLExtractor');
    } catch (e) {
        logger.error('Failed to register PlayDLExtractor', { error: (e as Error).message });
    }

    // 4. Try to register YoutubeiExtractor (Highest Priority if it works)
    try {
        await player.extractors.register(YoutubeiExtractor, {
            authentication: process.env.YOUTUBE_COOKIES || '',
            streamOptions: {
                useClient: 'ANDROID'
            }
        });
        logger.info('Registered: YoutubeiExtractor');
    } catch (e) {
        logger.error('Failed to register YoutubeiExtractor', { error: (e as Error).message });
    }
    
    // Debug: List all registered extractors
    const registered = player.extractors.store.keys();
    logger.info(`Total Registered Extractors: ${Array.from(registered).join(', ')}`);

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

  // Debug events
  player.events.on('debug', (_queue: any, message: string) => {
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
