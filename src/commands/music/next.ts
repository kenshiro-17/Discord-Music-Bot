import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { skip } from '../../handlers/audioHandler';
import { validateMusicCommand } from '../../utils/validators';
import { createSuccessEmbed } from '../../utils/embedBuilder';
import { ValidationError } from '../../utils/errorHandler';
import { styleResponse } from '../../utils/persona';
import { getPlayer } from '../../services/player';

export default {
  data: new SlashCommandBuilder()
    .setName('next')
    .setDescription('Play the next song'),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = getPlayer();
    const queue = player?.nodes.get(interaction.guildId!);
    // Simple validation
    if (!queue || !queue.isPlaying()) {
       throw new ValidationError('Nothing is playing');
    }

    skip(interaction.guildId!);

    const embed = createSuccessEmbed(styleResponse('Skipped to the next song.'));
    await interaction.reply({ embeds: [embed] });
  },
};
