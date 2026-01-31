import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { jumpTo } from '../../handlers/audioHandler';
import { createSuccessEmbed } from '../../utils/embedBuilder';
import { ValidationError } from '../../utils/errorHandler';
import { styleResponse } from '../../utils/persona';

export default {
  data: new SlashCommandBuilder()
    .setName('jump')
    .setDescription('Jump to a specific song in the queue')
    .addIntegerOption((option) =>
      option
        .setName('position')
        .setDescription('Position of the song to jump to')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const position = interaction.options.getInteger('position', true);
    await interaction.deferReply();

    try {
      // discord-player uses 0-based index
      jumpTo(interaction.guildId!, position - 1);
      
      const embed = createSuccessEmbed(styleResponse(`Jumped to song at position ${position}.`));
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      throw new ValidationError((error as Error).message);
    }
  },
};
