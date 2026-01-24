import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getQueue, pause } from '../../handlers/queueManager';
import { validateMusicCommand } from '../../utils/validators';
import { createSuccessEmbed } from '../../utils/embedBuilder';
import { ValidationError } from '../../utils/errorHandler';
import { styleResponse } from '../../utils/persona';

export default {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current song'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = getQueue(interaction.guildId!);
    const validation = validateMusicCommand(interaction, queue, true);

    if (!validation.valid) {
      throw new ValidationError(validation.error!);
    }

    const result = pause(interaction.guildId!);

    if (!result.success) {
      throw new ValidationError(result.error!);
    }

    const embed = createSuccessEmbed(styleResponse('Playback paused.'));
    await interaction.reply({ embeds: [embed] });
  },
};
