import { Client, Collection, REST, Routes } from 'discord.js';
import { MusicCommand, ExtendedClient } from '../types';
import { config } from '../config/config';
import { logger, logError } from '../utils/logger';
import fs from 'fs';
import path from 'path';

/**
 * Loads all commands from the commands directory
 */
export async function loadCommands(client: Client & ExtendedClient): Promise<void> {
  client.commands = new Collection<string, MusicCommand>();

  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);

    if (!fs.statSync(folderPath).isDirectory()) continue;

    const commandFiles = fs
      .readdirSync(folderPath)
      .filter((file) => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts'));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);

      try {
        const command = (await import(filePath)).default;

        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
          logger.debug('Loaded command', { name: command.data.name });
        } else {
          logger.warn('Invalid command file', { file: filePath });
        }
      } catch (error) {
        logError(error as Error, { context: 'Failed to load command', file: filePath });
      }
    }
  }

  logger.info(`Loaded ${client.commands.size} command(s)`);
}

/**
 * Deploys slash commands to Discord
 */
export async function deployCommands(guildId?: string): Promise<void> {
  const commands: any[] = [];
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFolders = fs.readdirSync(commandsPath);

  // Load all command data
  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);

    if (!fs.statSync(folderPath).isDirectory()) continue;

    const commandFiles = fs
      .readdirSync(folderPath)
      .filter((file) => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts'));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);

      try {
        const command = (await import(filePath)).default;

        if ('data' in command) {
          commands.push(command.data.toJSON());
        }
      } catch (error) {
        logError(error as Error, { context: 'Failed to load command for deployment', file: filePath });
      }
    }
  }

  // Deploy commands
  const rest = new REST({ version: '10' }).setToken(config.token);
  const targetGuildId = guildId || process.env.GUILD_ID;

  try {
    logger.info(`Started deploying ${commands.length} slash command(s)`);
    commands.forEach(cmd => logger.debug(`Deploying command: ${cmd.name}`));

    if (targetGuildId) {
      // Deploy to specific guild (faster for testing)
      await rest.put(Routes.applicationGuildCommands(config.clientId, targetGuildId), {
        body: commands,
      });
      logger.info(`Deployed commands to guild ${targetGuildId}`);
    } else {
      // Deploy globally
      await rest.put(Routes.applicationCommands(config.clientId), {
        body: commands,
      });
      logger.info('Deployed commands globally');
    }
  } catch (error) {
    logError(error as Error, { context: 'Failed to deploy commands' });
    throw error;
  }
}
