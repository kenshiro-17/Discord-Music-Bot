import { deployCommands } from '../handlers/commandHandler';
import { logger, ensureLogsDirectory } from '../utils/logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Deploy commands script
 */
async function main() {
  ensureLogsDirectory();

  logger.info('Starting command deployment...');

  // Get guild ID from command line args (optional)
  const guildId = process.argv[2];

  if (guildId) {
    logger.info(`Deploying to guild: ${guildId}`);
  } else {
    logger.info('Deploying globally (this may take up to an hour to propagate)');
  }

  try {
    await deployCommands(guildId);
    logger.info('Command deployment successful!');
    process.exit(0);
  } catch (error) {
    logger.error('Command deployment failed', error);
    process.exit(1);
  }
}

main();
