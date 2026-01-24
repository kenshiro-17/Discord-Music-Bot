import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { ExtendedClient, SearchResultCache } from './types';
import { config, getConfigSummary } from './config/config';
import { logger, ensureLogsDirectory, logError } from './utils/logger';
import { loadCommands, deployCommands } from './handlers/commandHandler';
import { createHealthCheckServer, setStartTime } from './utils/healthCheck';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

// Force IPv4 for DNS resolution to avoid issues with Discord Voice on dual-stack networks
try {
  dns.setDefaultResultOrder('ipv4first');
  logger.info('DNS resolution set to prefer IPv4');
} catch (error) {
  logger.warn('Failed to set DNS result order', { error: (error as Error).message });
}

/**
 * Creates and configures the Discord client
 */
function createClient(): Client & ExtendedClient {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  }) as Client & ExtendedClient;

  // Initialize collections
  client.commands = new Collection();
  client.queues = new Collection();
  client.searchCache = new Collection<string, SearchResultCache>();

  return client;
}

/**
 * Loads all event handlers
 */
async function loadEvents(client: Client): Promise<void> {
  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);

    try {
      const module = await import(filePath);
      const event = module.default;

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }

      logger.debug('Loaded event', { name: event.name });
    } catch (error) {
      logError(error as Error, { context: 'Failed to load event', file: filePath });
    }
  }

  logger.info('Loaded event handlers');
}

/**
 * Handles graceful shutdown
 */
function setupGracefulShutdown(client: Client): void {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);

    try {
      // Destroy all voice connections
      const { getAllQueues } = await import('./handlers/queueManager');
      const queues = getAllQueues() as Collection<string, any>;

      for (const [_, queue] of queues) {
        if (queue.connection) {
          queue.connection.destroy();
        }
      }

      // Destroy Discord client
      client.destroy();

      logger.info('Shutdown complete');
      process.exit(0);
    } catch (error) {
      logError(error as Error, { context: 'Error during shutdown' });
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * Handles unhandled errors
 */
function setupErrorHandlers(): void {
  process.on('unhandledRejection', (error: Error) => {
    logError(error, { context: 'Unhandled Promise Rejection' });
  });

  process.on('uncaughtException', (error: Error) => {
    logError(error, { context: 'Uncaught Exception' });
    process.exit(1);
  });
}

/**
 * Starts the bot
 */
async function start(): Promise<void> {
  try {
    // Ensure logs directory exists
    ensureLogsDirectory();

    // Set start time for uptime tracking
    setStartTime(Date.now());

    // Log startup
    logger.info('Starting TC Discord Music Bot');
    logger.info('Configuration', getConfigSummary());

    // Initialize play-dl with cookies if provided
    // NOTE: play-dl uses cookies differently than ytdl-core
    // For now, skip play-dl cookies to avoid "Invalid character in header" errors
    // ytdl-core (used for actual playback) has cookies loaded separately
    if (config.youtubeCookies && false) { // Disabled for now - cookies work in ytdl-core
      try {
        const play = (await import('play-dl')).default || (await import('play-dl'));
        await play.setToken({ youtube: { cookie: config.youtubeCookies } });
        logger.info('YouTube cookies loaded successfully');
      } catch (error) {
        logger.warn('Failed to load YouTube cookies', { error: (error as Error).message });
      }
    }

    // Create health check server
    createHealthCheckServer();

    // Create client
    const client = createClient();

    // Client error logging
    client.on('error', (error) => logError(error, { context: 'Discord Client Error' }));
    client.on('warn', (message) => logger.warn('Discord Client Warning', { message }));

    // Setup error handlers
    setupErrorHandlers();

    // Setup graceful shutdown
    setupGracefulShutdown(client);

    // Load commands and events
    await loadCommands(client);
    await loadEvents(client);

    // Deploy commands automatically on startup
    try {
      await deployCommands();
    } catch (error) {
      logger.error('Failed to auto-deploy commands', { error: (error as Error).message });
    }

    // Log voice dependency report for debugging
    const { generateDependencyReport, version } = await import('@discordjs/voice');
    logger.info(`Voice Lib Version: ${version}`);
    logger.info('Voice Dependency Report:\n' + generateDependencyReport());

    // Login to Discord
    await client.login(config.token);
  } catch (error) {
    logError(error as Error, { context: 'Failed to start bot' });
    process.exit(1);
  }
}

// Start the bot
start();
