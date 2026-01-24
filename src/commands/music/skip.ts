import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getQueue, skip as skipSong, stop as stopQueue } from '../../handlers/queueManager';
import { playSong } from '../../handlers/audioHandler';
import { leaveVoiceChannel } from '../../handlers/voiceManager';
import { validateMusicCommand } from '../../utils/validators';
import { createNowPlayingEmbed, createSuccessEmbed } from '../../utils/embedBuilder';
import { createNowPlayingButtons } from '../../utils/buttonBuilder';
import { ValidationError } from '../../utils/errorHandler';
import { styleResponse } from '../../utils/persona';

export default {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = getQueue(interaction.guildId!);
    const validation = validateMusicCommand(interaction, queue, true);

    if (!validation.valid) {
      throw new ValidationError(validation.error!);
    }

    await interaction.deferReply();

    const skipResult = skipSong(interaction.guildId!);

    if (skipResult.shouldStop) {
      stopQueue(interaction.guildId!);
      leaveVoiceChannel(interaction.guildId!);

      const embed = createSuccessEmbed(styleResponse('Queue finished! No more songs to play.'));
      await interaction.editReply({ embeds: [embed] });
    } else if (skipResult.nextSong) {
      await playSong(interaction.guildId!);

      const embed = createNowPlayingEmbed(skipResult.nextSong, queue!);
      const buttons = createNowPlayingButtons(!queue!.playing, queue!.loop);

      await interaction.editReply({
        content: styleResponse('Skipped to the next song.'),
        embeds: [embed],
        components: buttons,
      });
    }
  },
};
