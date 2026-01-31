import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getQueue } from '../../handlers/queueManager';
import { pausePlayback } from '../../handlers/audioHandler';
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

    await pausePlayback(interaction.guildId!);

    const embed = createSuccessEmbed(styleResponse('Playback paused.'));
    await interaction.reply({ embeds: [embed] });
  },
};
