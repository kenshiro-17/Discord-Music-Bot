import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getQueue, stop } from '../../handlers/queueManager';
import { leaveVoiceChannel } from '../../handlers/voiceManager';
import { validateMusicCommand } from '../../utils/validators';
import { createSuccessEmbed } from '../../utils/embedBuilder';
import { ValidationError } from '../../utils/errorHandler';
import { styleResponse } from '../../utils/persona';

export default {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave the voice channel'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = getQueue(interaction.guildId!);
    // requireQueue = false because we want to leave even if nothing is playing
    const validation = validateMusicCommand(interaction, queue, false);

    if (!validation.valid) {
      throw new ValidationError(validation.error!);
    }

    // If there's a queue, stop it properly
    if (queue) {
        stop(interaction.guildId!);
    }
    
    // Force leave
    leaveVoiceChannel(interaction.guildId!);

    const embed = createSuccessEmbed(styleResponse('Left the voice channel.'));
    await interaction.reply({ embeds: [embed] });
  },
};
