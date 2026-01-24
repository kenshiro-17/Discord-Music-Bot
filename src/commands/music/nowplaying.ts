import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getQueue, getCurrentSong } from '../../handlers/queueManager';
import { validateMusicCommand } from '../../utils/validators';
import { createNowPlayingEmbed } from '../../utils/embedBuilder';
import { createNowPlayingButtons } from '../../utils/buttonBuilder';
import { ValidationError } from '../../utils/errorHandler';

export default {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Display the currently playing song'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = getQueue(interaction.guildId!);
    const validation = validateMusicCommand(interaction, queue, true);

    if (!validation.valid) {
      throw new ValidationError(validation.error!);
    }

    const currentSong = getCurrentSong(interaction.guildId!);

    if (!currentSong) {
      throw new ValidationError('Nothing is currently playing');
    }

    const embed = createNowPlayingEmbed(currentSong, queue!);
    const buttons = createNowPlayingButtons(!queue!.playing, queue!.loop);

    await interaction.reply({
      embeds: [embed],
      components: buttons,
    });
  },
};
