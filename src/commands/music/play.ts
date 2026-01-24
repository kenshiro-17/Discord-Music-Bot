import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Song, ExtendedClient } from '../../types';
import { getQueue, createQueue, addSong, addSongs } from '../../handlers/queueManager';
import { joinVoiceChannelHandler } from '../../handlers/voiceManager';
import { playSong } from '../../handlers/audioHandler';
import {
  isYouTubeUrl,
  isYouTubePlaylistUrl,
  getUserVoiceChannel,
  validateVoicePermissions,
  sanitizeSearchQuery,
} from '../../utils/validators';
import { getYouTubeInfo, getYouTubePlaylist, searchYouTube } from '../../services/youtube';
import {
  createSongAddedEmbed,
  createNowPlayingEmbed,
  createSearchResultsEmbed,
  createPlaylistAddedEmbed,
} from '../../utils/embedBuilder';
import { createNowPlayingButtons } from '../../utils/buttonBuilder';
import { createSearchResultSelectMenu } from '../../utils/selectMenuBuilder';
import { ValidationError, PlaybackError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { styleResponse } from '../../utils/persona';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube or upload a file')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Song name or YouTube URL')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const query = interaction.options.getString('query');

    // Validate input
    if (!query) {
      throw new ValidationError(styleResponse('Please provide a song name or YouTube URL', 'error'));
    }

    // Get user's voice channel
    const voiceChannel = getUserVoiceChannel(interaction);

    if (!voiceChannel) {
      throw new ValidationError('You need to be in a voice channel to play music');
    }

    // Validate permissions
    const permissionCheck = validateVoicePermissions(voiceChannel);
    if (!permissionCheck.valid) {
      throw new ValidationError(permissionCheck.error!);
    }

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

    // Process input
    let songs: Song[] = [];

    if (query) {
      // Handle URL or search query
      if (isYouTubeUrl(query)) {
        if (isYouTubePlaylistUrl(query)) {
          // YouTube playlist
          songs = await getYouTubePlaylist(query, interaction.user);

          if (songs.length === 0) {
            throw new PlaybackError('Failed to load playlist or playlist is empty');
          }

          // Add all songs
          const addResult = addSongs(interaction.guildId!, songs);

          if (!addResult.success) {
            throw new ValidationError(addResult.error!);
          }

          // Start playback if first song
          if (isFirstSong) {
            await playSong(interaction.guildId!);
          }

          const embed = createPlaylistAddedEmbed(
            'YouTube Playlist',
            addResult.count!,
            'YouTube'
          );

          await interaction.editReply({ embeds: [embed] });
          return;
        } else {
          // Single YouTube video
          const song = await getYouTubeInfo(query);

          if (!song) {
            throw new PlaybackError('Failed to load video information');
          }

          song.requestedBy = interaction.user;
          songs = [song];
        }
      } else {
        // Search query
        const sanitized = sanitizeSearchQuery(query);
        const results = await searchYouTube(sanitized, 5);

        if (results.length === 0) {
          throw new PlaybackError('No results found for your search');
        }

        // Create select menu
        const client = interaction.client as unknown as ExtendedClient;
        const searchId = `music_search_${interaction.id}`;

        client.searchCache.set(searchId, {
          results,
          userId: interaction.user.id,
          expiresAt: Date.now() + 60000, // 1 minute
        });

        const embed = createSearchResultsEmbed(results, sanitized);
        const selectMenu = createSearchResultSelectMenu(results, searchId);

        await interaction.editReply({
          embeds: [embed],
          components: [selectMenu],
        });

        // Clean up cache after 1 minute
        setTimeout(() => {
          client.searchCache.delete(searchId);
        }, 60000);

        return;
      }
    }

    // Add song to queue
    if (songs.length === 0) {
      throw new PlaybackError('Failed to process your request');
    }

    const song = songs[0];
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

    } else {
      const embed = createSongAddedEmbed(song, addResult.position!);

      await interaction.editReply({
        content: styleResponse(`Added to queue: ${song.title}`),
        embeds: [embed],
      });
    }

    logger.info('Song added via play command', {
      guildId: interaction.guildId,
      song: song.title,
      source: song.source,
    });
},
};
