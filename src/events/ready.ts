import { Client, ActivityType, Events } from 'discord.js';
import { logger } from '../utils/logger';



export default {
  name: Events.ClientReady,
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

    // Update bot name if needed
    if (client.user && client.user.username !== 'Thankan Chettan') {
      try {
        await client.user.setUsername('Thankan Chettan');
        logger.info('Updated bot username to: Thankan Chettan');
      } catch (error) {
        logger.warn('Failed to update bot username (rate limit or restriction)', { error: (error as Error).message });
      }
    }

    // Initialize services
    // Lavalink is initialized in index.ts now




    logger.info('Bot is ready!');
  },
};
