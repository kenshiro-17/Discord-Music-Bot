import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getQueue } from '../../handlers/queueManager';
import { validateMusicCommand } from '../../utils/validators';
import { createQueueEmbed } from '../../utils/embedBuilder';
import { createPaginationButtons, createNowPlayingButtons } from '../../utils/buttonBuilder';
import { ValidationError } from '../../utils/errorHandler';

export default {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Display the current queue')
    .addIntegerOption((option) =>
      option
        .setName('page')
        .setDescription('Page number')
        .setRequired(false)
        .setMinValue(1)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = getQueue(interaction.guildId!);
    const validation = validateMusicCommand(interaction, queue, true);

    if (!validation.valid) {
      throw new ValidationError(validation.error!);
    }

    const page = interaction.options.getInteger('page') || 1;
    const songsPerPage = 10;
    const totalPages = Math.ceil(queue!.songs.length / songsPerPage);

    if (page > totalPages) {
      throw new ValidationError(`Invalid page number. Maximum is ${totalPages}`);
    }

    const embed = createQueueEmbed(queue!, page);
    
    const components: any[] = [];
    
    if (totalPages > 1) {
        components.push(createPaginationButtons(page, totalPages));
    }
    
    // Add playback controls
    components.push(...createNowPlayingButtons(!queue!.playing, queue!.loop));

    await interaction.reply({
      embeds: [embed],
      components: components,
    });
  },
};
