import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getQueue, setLoop } from '../../handlers/queueManager';
import { LoopMode } from '../../types';
import { validateMusicCommand } from '../../utils/validators';
import { createSuccessEmbed } from '../../utils/embedBuilder';
import { ValidationError } from '../../utils/errorHandler';
import { styleResponse } from '../../utils/persona';

export default {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Set loop mode')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('Loop mode')
        .setRequired(true)
        .addChoices(
          { name: 'Off', value: 'off' },
          { name: 'Song', value: 'song' },
          { name: 'Queue', value: 'queue' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = getQueue(interaction.guildId!);
    const validation = validateMusicCommand(interaction, queue, true);

    if (!validation.valid) {
      throw new ValidationError(validation.error!);
    }

    const mode = interaction.options.getString('mode', true) as LoopMode;
    const result = setLoop(interaction.guildId!, mode);

    if (!result.success) {
      throw new ValidationError(result.error!);
    }

    const modeText = mode === 'off' ? 'disabled' : mode === 'song' ? 'current song' : 'entire queue';
    const embed = createSuccessEmbed(styleResponse(`Loop mode set to: ${modeText}`));

    await interaction.reply({ embeds: [embed] });
  },
};
