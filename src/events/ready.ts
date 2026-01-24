import { Client, ActivityType } from 'discord.js';
import { logger } from '../utils/logger';
import { initializePlayDl } from '../services/youtube';
import { initializeSpotify } from '../services/spotify';
import { cleanupOldTempFiles } from '../handlers/audioHandler';

export default {
  name: 'ready',
  once: true,
  async execute(client: Client) {
    logger.info(`Bot logged in as ${client.user?.tag}`);
    logger.info(`Serving ${client.guilds.cache.size} guild(s)`);

    // Set bot presence
    client.user?.setPresence({
      activities: [
        {
          name: '🎵 /play to start',
          type: ActivityType.Listening,
        },
      ],
      status: 'online',
    });

    // Initialize services
    await initializePlayDl();
    await initializeSpotify();

    // Cleanup old temp files
    cleanupOldTempFiles();

    logger.info('Bot is ready!');
  },
};
