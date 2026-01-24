import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getQueue, shuffleQueue } from '../../handlers/queueManager';
import { validateMusicCommand } from '../../utils/validators';
import { createSuccessEmbed } from '../../utils/embedBuilder';
import { ValidationError } from '../../utils/errorHandler';
import { styleResponse } from '../../utils/persona';

export default {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffle the queue'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = getQueue(interaction.guildId!);
    const validation = validateMusicCommand(interaction, queue, true);

    if (!validation.valid) {
      throw new ValidationError(validation.error!);
    }

    const result = shuffleQueue(interaction.guildId!);

    if (!result.success) {
      throw new ValidationError(result.error!);
    }

    const embed = createSuccessEmbed(styleResponse('Queue shuffled!'));
    await interaction.reply({ embeds: [embed] });
  },
};
