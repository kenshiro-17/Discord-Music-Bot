import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { previous } from '../../handlers/audioHandler';
import { createSuccessEmbed } from '../../utils/embedBuilder';
import { ValidationError } from '../../utils/errorHandler';
import { styleResponse } from '../../utils/persona';

export default {
  data: new SlashCommandBuilder()
    .setName('previous')
    .setDescription('Play the previous song'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      await previous(interaction.guildId!);
      
      const embed = createSuccessEmbed(styleResponse('Playing previous song.'));
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      throw new ValidationError((error as Error).message);
    }
  },
};
