import { VoiceChannel } from 'discord.js';
import { logger, logError } from '../utils/logger';
import { getQueue, deleteQueue } from './queueManager';
import { getPlayer, destroyPlayer } from '../services/lavalink';
import { Player } from 'shoukaku';

/**
 * Inactivity timeout trackers
 */
const inactivityTimers = new Map<string, NodeJS.Timeout>();

/**
 * Joins a voice channel using Lavalink
 */
export async function joinVoiceChannelHandler(
  channel: VoiceChannel
): Promise<Player> {
  try {
    const player = await getPlayer(channel.guild.id, channel.id);

    if (!player) {
      throw new Error('Failed to create Lavalink player');
    }

    logger.info('Joined voice channel', {
      guildId: channel.guild.id,
      channelId: channel.id,
    });

    // Clear any existing inactivity timer
    clearInactivityTimer(channel.guild.id);

    return player;
  } catch (error) {
    logError(error as Error, {
      context: 'Failed to join voice channel',
      guildId: channel.guild.id,
    });
    throw error;
  }
}

/**
 * Leaves a voice channel
 */
export async function leaveVoiceChannel(guildId: string): Promise<void> {
  await destroyPlayer(guildId);
  logger.info('Left voice channel', { guildId });

  // Clean up queue
  deleteQueue(guildId);

  // Clear inactivity timer
  clearInactivityTimer(guildId);
}

/**
 * Starts inactivity timer for auto-disconnect
 */
export function startInactivityTimer(guildId: string, timeoutSeconds: number = 300): void {
  // Clear existing timer
  clearInactivityTimer(guildId);

  const timer = setTimeout(() => {
    const queue = getQueue(guildId);
    if (queue && !queue.playing) {
      logger.info('Auto-disconnecting due to inactivity', { guildId });
      leaveVoiceChannel(guildId);

      // Send message to text channel
      queue.textChannel
        .send('Left the voice channel due to inactivity.')
        .catch((error) => logError(error, { context: 'Failed to send inactivity message' }));
    }
  }, timeoutSeconds * 1000);

  inactivityTimers.set(guildId, timer);
}

/**
 * Clears inactivity timer
 */
export function clearInactivityTimer(guildId: string): void {
  const timer = inactivityTimers.get(guildId);
  if (timer) {
    clearTimeout(timer);
    inactivityTimers.delete(guildId);
  }
}

/**
 * Checks if bot is alone in voice channel
 */
export function isBotAloneInChannel(channel: VoiceChannel): boolean {
  // Filter out bots
  const humanMembers = channel.members.filter((member) => !member.user.bot);
  return humanMembers.size === 0;
}

