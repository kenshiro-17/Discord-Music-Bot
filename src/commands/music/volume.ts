import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getQueue } from '../../handlers/queueManager';
import { updateVolume } from '../../handlers/audioHandler';
import { validateMusicCommand } from '../../utils/validators';
import { createSuccessEmbed } from '../../utils/embedBuilder';
import { ValidationError } from '../../utils/errorHandler';

export default {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the playback volume')
    .addIntegerOption((option) =>
      option
        .setName('level')
        .setDescription('Volume level (0-200)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(200)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = getQueue(interaction.guildId!);
    const validation = validateMusicCommand(interaction, queue, true);

    if (!validation.valid) {
      throw new ValidationError(validation.error!);
    }

    const volume = interaction.options.getInteger('level', true);
    updateVolume(interaction.guildId!, volume);

    const embed = createSuccessEmbed(
      `Volume set to ${volume}%\n\nNote: Volume changes will apply fully to the next song.`
    );
    await interaction.reply({ embeds: [embed] });
  },
};
