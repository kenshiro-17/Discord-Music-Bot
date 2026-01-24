import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getQueue, removeSong } from '../../handlers/queueManager';
import { validateMusicCommand, validateSongPosition } from '../../utils/validators';
import { createSuccessEmbed } from '../../utils/embedBuilder';
import { ValidationError } from '../../utils/errorHandler';

export default {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a song from the queue')
    .addIntegerOption((option) =>
      option
        .setName('position')
        .setDescription('Position of the song in the queue')
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

    const index = position - 1;
    const songTitle = queue!.songs[index].title;

    const result = removeSong(interaction.guildId!, index);

    if (!result.success) {
      throw new ValidationError(result.error!);
    }

    const embed = createSuccessEmbed(`Removed **${songTitle}** from the queue`);
    await interaction.reply({ embeds: [embed] });
  },
};
