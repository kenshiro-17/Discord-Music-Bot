import { EmbedBuilder } from 'discord.js';
import { Song, ServerQueue, YouTubeSearchResult } from '../types';
import { getThankanQuote } from './persona';

/**
 * Color constants for embeds
 */
export const Colors = {
  PRIMARY: 0x5865f2,
  SUCCESS: 0x57f287,
  ERROR: 0xed4245,
  WARNING: 0xfee75c,
} as const;

/**
 * Formats duration from seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Creates a progress bar
 */
export function createProgressBar(current: number, total: number, length: number = 20): string {
  const progress = Math.min(current / total, 1);
  const filledLength = Math.floor(progress * length);
  const emptyLength = length - filledLength;

  const filled = '▬'.repeat(Math.max(0, filledLength - 1));
  const pointer = '🔘';
  const empty = '─'.repeat(Math.max(0, emptyLength));

  return `${filled}${pointer}${empty}`;
}

/**
 * Truncates text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Creates embed for song added to queue
 */
export function createSongAddedEmbed(song: Song, position: number): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(Colors.SUCCESS)
    .setTitle('✅ Queue ilittu')
    .setDescription(`**[${truncate(song.title, 80)}](${song.url})**`)
    .setThumbnail(song.thumbnail)
    .addFields(
      { name: 'Duration', value: formatDuration(song.duration), inline: true },
      { name: 'Position', value: `#${position}`, inline: true },
      { name: 'Source', value: song.source.toUpperCase(), inline: true }
    )
    .setFooter({ text: `Requested by ${song.requestedBy.username} | ${getThankanQuote()}` })
    .setTimestamp();

  return embed;
}

/**
 * Creates embed for now playing
 */
export function createNowPlayingEmbed(song: Song, queue: ServerQueue, currentTime: number = 0): EmbedBuilder {
  const progressBar = createProgressBar(currentTime, song.duration);
  const timeDisplay = `${formatDuration(currentTime)} / ${formatDuration(song.duration)}`;

  const embed = new EmbedBuilder()
    .setColor(Colors.PRIMARY)
    .setTitle('🎵 Thankan Chettan Vibe')
    .setDescription(`**[${truncate(song.title, 80)}](${song.url})**`)
    .setThumbnail(song.thumbnail)
    .addFields(
      { name: 'Duration', value: formatDuration(song.duration), inline: true },
      { name: 'Volume', value: `${queue.volume}%`, inline: true },
      { name: 'Loop', value: queue.loop === 'off' ? 'Off' : queue.loop === 'song' ? 'Song' : 'Queue', inline: true },
      { name: 'Progress', value: `${progressBar}\n${timeDisplay}`, inline: false }
    )
    .setFooter({ text: `Requested by ${song.requestedBy.username} | ${getThankanQuote()}` })
    .setTimestamp();

  return embed;
}

/**
 * Creates embed for queue display
 */
export function createQueueEmbed(queue: ServerQueue, page: number = 1): EmbedBuilder {
  const songsPerPage = 10;
  const start = (page - 1) * songsPerPage;
  const end = start + songsPerPage;
  const totalPages = Math.ceil(queue.songs.length / songsPerPage);

  const currentSong = queue.songs[queue.currentIndex];
  const upcomingSongs = queue.songs.slice(start + 1, end + 1);

  let description = `**Ippo Kalikkunnu:**\n`;
  description += `🎵 [${truncate(currentSong.title, 60)}](${currentSong.url}) - \`${formatDuration(currentSong.duration)}\`\n\n`;

  if (upcomingSongs.length > 0) {
    description += `**Aduthu Varunnu:**\n`;
    upcomingSongs.forEach((song, index) => {
      const position = start + index + 2;
      description += `\`${position}.\` [${truncate(song.title, 50)}](${song.url}) - \`${formatDuration(song.duration)}\`\n`;
    });
  } else if (queue.songs.length === 1) {
    description += `*Ini onnumilla... Veettil po.*`;
  }

  const embed = new EmbedBuilder()
    .setColor(Colors.PRIMARY)
    .setTitle(`📜 Thankan Chettan's Queue: ${queue.voiceChannel.guild.name}`)
    .setDescription(description)
    .setFooter({ text: `Page ${page}/${totalPages} | ${queue.songs.length} total song(s) | ${getThankanQuote()}` })
    .setTimestamp();

  return embed;
}

/**
 * Creates embed for search results
 */
export function createSearchResultsEmbed(results: YouTubeSearchResult[], query: string): EmbedBuilder {
  let description = `Search results for: **${truncate(query, 100)}**\n\n`;

  results.forEach((result, index) => {
    description += `**${index + 1}.** [${truncate(result.title, 60)}](${result.url})\n`;
    description += `${result.channel} • ${formatDuration(result.duration)}\n\n`;
  });

  const embed = new EmbedBuilder()
    .setColor(Colors.PRIMARY)
    .setTitle('🔎 Kandu pidichu...')
    .setDescription(description)
    .setFooter({ text: 'Onnu vegam para... Thankan chettanu thirakkund.' })
    .setTimestamp();

  return embed;
}

/**
 * Creates success embed
 */
export function createSuccessEmbed(message: string, title: string = 'Success'): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.SUCCESS)
    .setTitle(title === 'Success' ? '✅ Sheri...' : title)
    .setDescription(message)
    .setTimestamp();
}

/**
 * Creates error embed
 */
export function createErrorEmbed(message: string, title: string = 'Error'): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.ERROR)
    .setTitle(title === 'Error' ? '⚠️ Ayye...' : title)
    .setDescription(message)
    .setTimestamp();
}

/**
 * Creates warning embed
 */
export function createWarningEmbed(message: string, title: string = 'Warning'): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.WARNING)
    .setTitle(title === 'Warning' ? '⚠️ Oru karyam...' : title)
    .setDescription(message)
    .setTimestamp();
}

/**
 * Creates playlist added embed
 */
export function createPlaylistAddedEmbed(playlistName: string, songCount: number, source: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.SUCCESS)
    .setTitle('✅ Playlist Queue ilittu')
    .setDescription(`**${truncate(playlistName, 100)}**`)
    .addFields(
      { name: 'Songs Added', value: `${songCount}`, inline: true },
      { name: 'Source', value: source.toUpperCase(), inline: true }
    )
    .setFooter({ text: getThankanQuote() })
    .setTimestamp();
}
