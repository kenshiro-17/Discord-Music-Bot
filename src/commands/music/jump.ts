import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getQueue, jumpToSong } from '../../handlers/queueManager';
import { playSong } from '../../handlers/audioHandler';
import { validateMusicCommand, validateSongPosition } from '../../utils/validators';
import { createNowPlayingEmbed } from '../../utils/embedBuilder';
import { createNowPlayingButtons } from '../../utils/buttonBuilder';
import { ValidationError } from '../../utils/errorHandler';

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
    const queue = getQueue(interaction.guildId!);
    const validation = validateMusicCommand(interaction, queue, true);

    if (!validation.valid) {
      throw new ValidationError(validation.error!);
    }

    const position = interaction.options.getInteger('position', true);

    // Validate position
    const positionCheck = validateSongPosition(position, queue!.songs.length);
    if (!positionCheck.valid) {
      throw new ValidationError(positionCheck.error!);
    }

    await interaction.deferReply();

    const index = position - 1;
    const result = jumpToSong(interaction.guildId!, index);

    if (!result.success) {
      throw new ValidationError(result.error!);
    }

    await playSong(interaction.guildId!);

    const embed = createNowPlayingEmbed(result.song!, queue!);
    const buttons = createNowPlayingButtons(!queue!.playing, queue!.loop);

    await interaction.editReply({
      embeds: [embed],
      components: buttons,
    });
  },
};
