import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getQueue, previous as previousSong } from '../../handlers/queueManager';
import { playSong } from '../../handlers/audioHandler';
import { validateMusicCommand } from '../../utils/validators';
import { createNowPlayingEmbed, createErrorEmbed } from '../../utils/embedBuilder';
import { createNowPlayingButtons } from '../../utils/buttonBuilder';
import { ValidationError } from '../../utils/errorHandler';
import { styleResponse } from '../../utils/persona';

export default {
  data: new SlashCommandBuilder()
    .setName('previous')
    .setDescription('Play the previous song'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = getQueue(interaction.guildId!);
    const validation = validateMusicCommand(interaction, queue, true);

    if (!validation.valid) {
      throw new ValidationError(validation.error!);
    }

    await interaction.deferReply();

    const previousResult = previousSong(interaction.guildId!);

    if (!previousResult.success) {
      const embed = createErrorEmbed(styleResponse(previousResult.error || 'Cannot go back further', 'error'));
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Play the previous song
    await playSong(interaction.guildId!);

    const embed = createNowPlayingEmbed(previousResult.previousSong!, queue!);
    const buttons = createNowPlayingButtons(!queue!.playing, queue!.loop);

    await interaction.editReply({
      content: styleResponse('Going back to the previous song.'),
      embeds: [embed],
      components: buttons,
    });
  },
};
