import { StringSelectMenuInteraction } from 'discord.js';
import { ExtendedClient, Song } from '../types';
import { getQueue, createQueue, addSong } from './queueManager';
import { joinVoiceChannelHandler } from './voiceManager';
import { playSong } from './audioHandler';
import { createSongAddedEmbed, createNowPlayingEmbed } from '../utils/embedBuilder';
import { createNowPlayingButtons } from '../utils/buttonBuilder';
import { getUserVoiceChannel } from '../utils/validators';
import { ValidationError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

/**
 * Handles select menu interactions
 */
export async function handleSelectMenuInteraction(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  if (!interaction.customId.startsWith('music_search_')) return;

  await interaction.deferReply();

  const client = interaction.client as unknown as ExtendedClient;
  const searchId = interaction.customId;

  // Get cached search results
  const cached = client.searchCache?.get(searchId);

  if (!cached) {
    throw new ValidationError('Search results expired. Please search again.');
  }

  if (cached.userId !== interaction.user.id) {
    throw new ValidationError('You cannot select from someone else\'s search results.');
  }

  // Get selected index
  const selectedValue = interaction.values[0];
  const index = parseInt(selectedValue.split('_')[1], 10);

  const result = cached.results[index];

  if (!result) {
    throw new ValidationError('Invalid selection.');
  }

  // Get user's voice channel
  const voiceChannel = getUserVoiceChannel(interaction);

  if (!voiceChannel) {
    throw new ValidationError('You need to be in a voice channel.');
  }

  // Create song object
  const song: Song = {
    title: result.title,
    url: result.url,
    duration: result.duration,
    thumbnail: result.thumbnail,
    requestedBy: interaction.user,
    source: 'youtube',
  };

  // Get or create queue
  let queue = getQueue(interaction.guildId!);
  let isFirstSong = false;

  if (!queue) {
    queue = createQueue(interaction.channel as any, voiceChannel as any);
    isFirstSong = true;

    // Join voice channel
    const connection = await joinVoiceChannelHandler(voiceChannel as any);
    queue.connection = connection;
  }

  // Add song to queue
  const addResult = addSong(interaction.guildId!, song);

  if (!addResult.success) {
    throw new ValidationError(addResult.error!);
  }

  // Start playback if first song
  if (isFirstSong) {
    await playSong(interaction.guildId!);

    const embed = createNowPlayingEmbed(song, queue);
    const buttons = createNowPlayingButtons(false, queue.loop);

    await interaction.editReply({
      embeds: [embed],
      components: buttons,
    });
  } else {
    const embed = createSongAddedEmbed(song, addResult.position!);

    await interaction.editReply({
      embeds: [embed],
    });
  }

  // Clean up cache
  client.searchCache?.delete(searchId);

  logger.info('Search result selected', {
    guildId: interaction.guildId,
    song: song.title,
    userId: interaction.user.id,
  });
}
