import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getQueue, clearQueue } from '../../handlers/queueManager';
import { validateMusicCommand } from '../../utils/validators';
import { createSuccessEmbed } from '../../utils/embedBuilder';
import { ValidationError } from '../../utils/errorHandler';
import { styleResponse } from '../../utils/persona';

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear all songs from the queue (keeps current song)'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = getQueue(interaction.guildId!);
    const validation = validateMusicCommand(interaction, queue, true);

    if (!validation.valid) {
      throw new ValidationError(validation.error!);
    }

    const result = clearQueue(interaction.guildId!);

    if (!result.success) {
      throw new ValidationError(result.error!);
    }

    const embed = createSuccessEmbed(styleResponse('Queue cleared! Only the current song remains.'));
    await interaction.reply({ embeds: [embed] });
  },
};
