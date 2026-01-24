import {
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
} from '@discordjs/voice';
import { VoiceChannel } from 'discord.js';
import { logger, logError } from '../utils/logger';
import { getQueue, deleteQueue } from './queueManager';

/**
 * Inactivity timeout trackers
 */
const inactivityTimers = new Map<string, NodeJS.Timeout>();

/**
 * Joins a voice channel
 */
export async function joinVoiceChannelHandler(
  channel: VoiceChannel
): Promise<VoiceConnection> {
  try {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator as any,
      selfDeaf: false,
      selfMute: false,
      group: `vc_${channel.guild.id}_${Date.now()}`,
    });

    // Setup connection handlers
    setupConnectionHandlers(connection, channel.guild.id);

    // Debug state changes
    connection.on('stateChange', (oldState, newState) => {
      logger.debug(`Voice Connection State: ${oldState.status} -> ${newState.status}`, { 
        guildId: channel.guild.id,
        reason: (newState as any).reason || 'unknown'
      });
    });

    // Verify connection in background
    entersState(connection, VoiceConnectionStatus.Ready, 20_000)
      .then(() => logger.info('Voice connection successfully established (Ready)', { guildId: channel.guild.id }))
      .catch((error) => {
        logger.warn('Voice connection failed to reach Ready state in background', { 
          guildId: channel.guild.id, 
          error: error.message 
        });
        // We don't destroy here immediately to see if it recovers or if it's just a state tracking bug
      });

    logger.info('Joined voice channel', {
      guildId: channel.guild.id,
      channelId: channel.id,
    });

    // Clear any existing inactivity timer
    clearInactivityTimer(channel.guild.id);

    return connection;
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
export function leaveVoiceChannel(guildId: string): void {
  const connection = getVoiceConnection(guildId);

  if (connection) {
    connection.destroy();
    logger.info('Left voice channel', { guildId });
  }

  // Clean up queue
  deleteQueue(guildId);

  // Clear inactivity timer
  clearInactivityTimer(guildId);
}

/**
 * Setup connection event handlers
 */
function setupConnectionHandlers(connection: VoiceConnection, guildId: string): void {
  connection.on('stateChange', (oldState, newState) => {
    logger.debug(`Connection transitioned from ${oldState.status} to ${newState.status}`, { guildId });
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      // Try to reconnect
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
      // Reconnection successful
      logger.info('Voice connection reconnected', { guildId });
    } catch (error) {
      // Reconnection failed
      logger.warn('Voice connection failed to reconnect', { guildId });
      connection.destroy();
      deleteQueue(guildId);
    }
  });

  connection.on(VoiceConnectionStatus.Destroyed, () => {
    logger.info('Voice connection destroyed', { guildId });
    deleteQueue(guildId);
    clearInactivityTimer(guildId);
  });

  connection.on('error', (error) => {
    logError(error, {
      context: 'Voice connection error',
      guildId,
    });
  });
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

/**
 * Gets voice connection for a guild
 */
export function getVoiceConnectionForGuild(guildId: string): VoiceConnection | undefined {
  return getVoiceConnection(guildId);
}
