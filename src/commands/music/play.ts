import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Song, ExtendedClient } from '../../types';
import { getQueue, createQueue, addSong, addSongs } from '../../handlers/queueManager';
import { joinVoiceChannelHandler } from '../../handlers/voiceManager';
import { playSong } from '../../handlers/audioHandler';
import {
  getUserVoiceChannel,
  validateVoicePermissions,
} from '../../utils/validators';
import { searchTracks, trackToSong } from '../../services/lavalink';
import {
  createSongAddedEmbed,
  createNowPlayingEmbed,
  createSearchResultsEmbed,
  createPlaylistAddedEmbed,
} from '../../utils/embedBuilder';
import { createNowPlayingButtons } from '../../utils/buttonBuilder';
import { createSearchResultSelectMenu } from '../../utils/selectMenuBuilder';
import { ValidationError, PlaybackError } from '../../utils/errorHandler';
import { logger, logError } from '../../utils/logger';
import { styleResponse } from '../../utils/persona';
import { YouTubeSearchResult } from '../../types';

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

    // Get or create queue
    let queue = getQueue(interaction.guildId!);
    let isFirstSong = false;

    if (!queue) {
      queue = createQueue(interaction.channel as any, voiceChannel as any);
      isFirstSong = true;

      // Join voice channel
      logger.info('Connecting to voice channel...', { guildId: voiceChannel.guild.id });
      try {
        const player = await joinVoiceChannelHandler(voiceChannel as any);
        queue.connection = player;
        logger.info('Connected to voice channel', { guildId: voiceChannel.guild.id });
      } catch (error) {
        logger.error('Failed to connect to voice channel', { error: (error as Error).message });
        throw error;
      }
    }

    // Process input using Lavalink
    let songs: Song[] = [];
    logger.info('Processing query with Lavalink', { query });

    try {
      const tracks = await searchTracks(query);

      if (tracks.length === 0) {
        throw new PlaybackError('No results found');
      }

      // Convert tracks to Songs
      songs = tracks.map(track => {
        const songData = trackToSong(track);
        return {
          ...songData,
          requestedBy: interaction.user
        } as Song;
      });

      // If it's a playlist (more than 1 song) or direct URL, add them
      // If it's a search result (and we have results), we might want to show selection menu
      // But Lavalink's searchTracks implementation already handles "ytsearch:" vs direct URL
      // If it returns multiple tracks for a non-playlist search, it usually returns the top result or list?
      // Our searchTracks implementation returns [result.data] for TRACK load type, and tracks array for PLAYLIST.
      // For SEARCH load type, it returns result.data (array).
      
      // If query was a direct URL (http/https), we take the result directly.
      // If it was a search, we might have got multiple results.
      
      const isUrl = query.startsWith('http');
      
      if (!isUrl && songs.length > 1) {
        // It was a search, show selection menu
        // Need to convert songs back to YouTubeSearchResult format for the helper
        // or just pick the first one?
        // Let's stick to showing selection menu for searches
        
        const results: YouTubeSearchResult[] = songs.slice(0, 5).map(s => ({
            title: s.title,
            url: s.url,
            duration: s.duration,
            thumbnail: s.thumbnail,
            channel: 'Unknown' // Lavalink doesn't give channel name easily in basic info
        }));

        const client = interaction.client as unknown as ExtendedClient;
        const searchId = `music_search_${interaction.id}`;

        client.searchCache.set(searchId, {
          results,
          userId: interaction.user.id,
          expiresAt: Date.now() + 60000, // 1 minute
        });

        const embed = createSearchResultsEmbed(results, query);
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

      // If we are here, we are adding songs to queue (either direct URL, playlist, or single search result)
      if (songs.length > 1) {
        // Playlist
        const addResult = addSongs(voiceChannel.guild.id, songs);

        if (!addResult.success) {
          throw new ValidationError(addResult.error!);
        }

        // Start playback if first song
        if (isFirstSong) {
          await playSong(voiceChannel.guild.id);
        }

        const embed = createPlaylistAddedEmbed(
          'Playlist',
          addResult.count!,
          'Lavalink'
        );

        await interaction.editReply({ embeds: [embed] });
      } else {
        // Single song
        const song = songs[0];
        const addResult = addSong(voiceChannel.guild.id, song);

        if (!addResult.success) {
          throw new ValidationError(addResult.error!);
        }

        // Start playback if first song
        if (isFirstSong) {
          await playSong(voiceChannel.guild.id);

          const embed = createNowPlayingEmbed(song, queue);
          const buttons = createNowPlayingButtons(false, queue.loop);

          await interaction.editReply({
            embeds: [embed],
            components: buttons,
          });

          const addedEmbed = createSongAddedEmbed(song, addResult.position!);

          await interaction.editReply({
            content: styleResponse(`Added to queue: ${song.title}`),
            embeds: [addedEmbed],
          });
        } else {
            // Just added to queue
            const addedEmbed = createSongAddedEmbed(song, addResult.position!);
            await interaction.editReply({
                content: styleResponse(`Added to queue: ${song.title}`),
                embeds: [addedEmbed],
            });
        }

        logger.info('Song added via play command', {
          guildId: interaction.guildId,
          song: song.title,
          source: song.source,
        });
      }

    } catch (error) {
        logError(error as Error, { context: 'Lavalink search failed', query });
        throw new PlaybackError(`Failed to load track: ${(error as Error).message}`);
    }
  },
};
