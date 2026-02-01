import { Player } from 'discord-player';
import { Client } from 'discord.js';
import { logger, logError } from '../utils/logger';
import { YoutubeiExtractor } from 'discord-player-youtubei';

// Singleton instance
let player: Player | null = null;

/**
 * Initialize discord-player with YoutubeiExtractor using PoToken (no OAuth required)
 */
export async function initializePlayer(client: Client): Promise<Player> {
    if (player) return player;

    player = new Player(client);

    try {
        logger.info('Initializing YouTube extractor with PoToken...');

        // Build extractor options - PoToken only, no OAuth
        const extractorOptions: any = {
            // Enable PoToken generation (bypasses bot detection without needing Google account)
            generateWithPoToken: true,

            // Use WEB client - required for PoToken and less restricted
            streamOptions: {
                useClient: 'WEB',
                highWaterMark: 1 << 25 // 32MB buffer for smooth playback
            },

            // Don't fail on sign-in errors since we're not using OAuth
            ignoreSignInErrors: true
        };

        // Add cookies if available (optional, can help with some restrictions)
        if (process.env.YOUTUBE_COOKIES) {
            extractorOptions.cookie = process.env.YOUTUBE_COOKIES;
            logger.info('YouTube cookies configured');
        }

        // Add proxy if configured (for bypassing IP blocks)
        if (process.env.YOUTUBE_PROXY) {
            try {
                const { ProxyAgent } = await import('undici');
                extractorOptions.proxy = new ProxyAgent(process.env.YOUTUBE_PROXY);
                logger.info('Proxy configured for YouTube requests');
            } catch (e) {
                logger.warn('Failed to configure proxy - undici may not be installed');
            }
        }

        // Register YoutubeiExtractor
        await player.extractors.register(YoutubeiExtractor, extractorOptions);
        logger.info('Registered: YoutubeiExtractor (PoToken + WEB client)');

        // Log configuration summary
        logger.info('YouTube Extractor Configuration:', {
            poToken: true,
            cookies: !!process.env.YOUTUBE_COOKIES,
            proxy: !!process.env.YOUTUBE_PROXY,
            client: 'WEB',
            oauth: false
        });

    } catch (error) {
        logger.error('Failed to register YoutubeiExtractor', { error: (error as Error).message });
        logger.error('YouTube playback may not work without a valid extractor');
    }

    // Event handling
    player.events.on('playerStart', (queue: any, track: any) => {
        logger.info('Player started', { guild: queue.guild.id, track: track.title });
    });

    player.events.on('error', (queue: any, error: Error) => {
        logError(error, { context: 'Player Error', guild: queue.guild.id });
    });

    player.events.on('playerError', (queue: any, error: Error, track: any) => {
        logError(error, {
            context: 'Player Playback Error',
            guild: queue.guild.id,
            track: track?.title || 'Unknown'
        });
    });

    // Debug events
    player.events.on('debug', (_queue: any, message: string) => {
        logger.debug('Player Debug', { message });
    });

    // Track extraction errors
    player.events.on('playerSkip', (queue: any, track: any, reason: string) => {
        logger.warn('Track skipped', {
            guild: queue.guild.id,
            track: track?.title || 'Unknown',
            reason
        });
    });

    return player;
}

/**
 * Get player instance
 */
export function getPlayer(): Player | null {
    return player;
}
