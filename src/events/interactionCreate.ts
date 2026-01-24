import { Interaction, Client } from 'discord.js';
import { ExtendedClient } from '../types';
import { handleCommandError } from '../utils/errorHandler';
import { logCommand, logError } from '../utils/logger';
import { handleButtonInteraction } from '../handlers/buttonHandler';
import { handleSelectMenuInteraction } from '../handlers/selectMenuHandler';

export default {
  name: 'interactionCreate',
  async execute(interaction: Interaction) {
    const client = interaction.client as Client & ExtendedClient;

    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands?.get(interaction.commandName);

      if (!command) {
        logError(new Error(`Command not found: ${interaction.commandName}`));
        return;
      }

      try {
        await command.execute(interaction);

        logCommand(interaction.commandName, interaction.user.id, interaction.guildId || 'DM', true);
      } catch (error) {
        logCommand(
          interaction.commandName,
          interaction.user.id,
          interaction.guildId || 'DM',
          false
        );
        await handleCommandError(interaction, error as Error);
      }
    }
    // Handle button interactions
    else if (interaction.isButton()) {
      try {
        await handleButtonInteraction(interaction);
      } catch (error) {
        await handleCommandError(interaction, error as Error);
      }
    }
    // Handle select menu interactions
    else if (interaction.isStringSelectMenu()) {
      try {
        await handleSelectMenuInteraction(interaction);
      } catch (error) {
        await handleCommandError(interaction, error as Error);
      }
    }
  },
};
