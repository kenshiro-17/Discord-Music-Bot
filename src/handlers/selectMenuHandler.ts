import { StringSelectMenuInteraction } from 'discord.js';
import { ExtendedClient } from '../types';
import { playSong } from './audioHandler';
import { createSuccessEmbed } from '../utils/embedBuilder';
import { getUserVoiceChannel } from '../utils/validators';
import { ValidationError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { styleResponse } from '../utils/persona';

/**
 * Handles select menu interactions
 */
export async function handleSelectMenuInteraction(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  if (!interaction.customId.startsWith('music_search_')) return;

  await interaction.deferReply();

  const client = interaction.client as unknown as ExtendedClient;
  const searchId = interaction.customId;

  // Get cached search results
  const cached = client.searchCache?.get(searchId);

  if (!cached) {
    throw new ValidationError('Search results expired. Please search again.');
  }

  if (cached.userId !== interaction.user.id) {
    throw new ValidationError('You cannot select from someone else\'s search results.');
  }

  // Get selected index
  const selectedValue = interaction.values[0];
  const index = parseInt(selectedValue.split('_')[1], 10);

  const result = cached.results[index];

  if (!result) {
    throw new ValidationError('Invalid selection.');
  }

  // Get user's voice channel
  const cachedChannel = getUserVoiceChannel(interaction);

  if (!cachedChannel) {
    throw new ValidationError('You need to be in a voice channel.');
  }

  // Fetch fresh channel
  const voiceChannel = await interaction.client.channels.fetch(cachedChannel.id) as any;

  if (!voiceChannel) {
     throw new ValidationError('Could not fetch your voice channel');
  }

  try {
    await playSong(interaction.guildId!, result.url, voiceChannel);

    const embed = createSuccessEmbed(styleResponse(`Selected: ${result.title}`));
    await interaction.editReply({ embeds: [embed] });

    // Clean up cache
    client.searchCache?.delete(searchId);

    logger.info('Search result selected', {
      guildId: interaction.guildId,
      song: result.title,
      userId: interaction.user.id,
    });
  } catch (error) {
    logger.error('Failed to play selected track', { error: (error as Error).message });
    throw new ValidationError(`Failed to play track: ${(error as Error).message}`);
  }
}
