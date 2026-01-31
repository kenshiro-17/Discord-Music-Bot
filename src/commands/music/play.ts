import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { playSong } from '../../handlers/audioHandler';
import {
  getUserVoiceChannel,
  validateVoicePermissions,
} from '../../utils/validators';
import { createSuccessEmbed } from '../../utils/embedBuilder';
import { ValidationError, PlaybackError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { styleResponse } from '../../utils/persona';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Song name or YouTube URL')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const query = interaction.options.getString('query', true);

    // Get user's voice channel
    const cachedChannel = getUserVoiceChannel(interaction);

    if (!cachedChannel) {
      throw new ValidationError('You need to be in a voice channel to play music');
    }

    // Fetch fresh channel to ensure we have latest guild/adapter info
    const voiceChannel = await interaction.client.channels.fetch(cachedChannel.id) as any;

    if (!voiceChannel) {
       throw new ValidationError('Could not fetch your voice channel');
    }

    // Validate permissions
    const permissionCheck = validateVoicePermissions(voiceChannel);
    if (!permissionCheck.valid) {
      throw new ValidationError(permissionCheck.error!);
    }

    try {
      await playSong(interaction.guildId!, query, voiceChannel);
      
      // Note: playSong now handles queueing via discord-player.
      // We rely on player events to show "Now Playing" messages, 
      // but we should send a confirmation here.
      
      const embed = createSuccessEmbed(styleResponse(`Processing request: ${query}`));
      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      logger.error('Play command failed', { error: (error as Error).message });
      throw new PlaybackError(`Failed to play song: ${(error as Error).message}`);
    }
  },
};
