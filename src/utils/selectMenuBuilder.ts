import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { YouTubeSearchResult } from '../types';
import { truncate, formatDuration } from './embedBuilder';

/**
 * Creates a select menu for YouTube search results
 */
export function createSearchResultSelectMenu(
  results: YouTubeSearchResult[],
  customId: string = 'music_search_select'
): ActionRowBuilder<StringSelectMenuBuilder> {
  const options = results.map((result, index) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(truncate(result.title, 100))
      .setDescription(`${result.channel} • ${formatDuration(result.duration)}`)
      .setValue(`search_${index}`)
  );

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder('Select a song to play')
    .addOptions(options);

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
}
