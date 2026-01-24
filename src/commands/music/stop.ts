import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getQueue, stop } from '../../handlers/queueManager';
import { leaveVoiceChannel } from '../../handlers/voiceManager';
import { validateMusicCommand } from '../../utils/validators';
import { createSuccessEmbed } from '../../utils/embedBuilder';
import { ValidationError } from '../../utils/errorHandler';

export default {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playback and clear the queue'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = getQueue(interaction.guildId!);
    const validation = validateMusicCommand(interaction, queue, true);

    if (!validation.valid) {
      throw new ValidationError(validation.error!);
    }

    stop(interaction.guildId!);
    leaveVoiceChannel(interaction.guildId!);

    const embed = createSuccessEmbed('Stopped playback and left the voice channel');
    await interaction.reply({ embeds: [embed] });
  },
};
