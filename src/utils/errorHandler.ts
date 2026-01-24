import { InteractionResponse, Message } from 'discord.js';
import { logError } from './logger';
import { createErrorEmbed } from './embedBuilder';

/**
 * Base error class for music bot
 */
export class MusicBotError extends Error {
  constructor(
    message: string,
    public userMessage: string = message,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MusicBotError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Voice connection error
 */
export class VoiceConnectionError extends MusicBotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, message, context);
    this.name = 'VoiceConnectionError';
  }
}

/**
 * Playback error
 */
export class PlaybackError extends MusicBotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'Failed to play the song. Please try again.', context);
    this.name = 'PlaybackError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends MusicBotError {
  constructor(message: string) {
    super(message, message);
    this.name = 'ValidationError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends MusicBotError {
  constructor(
    message: string = 'Rate limit exceeded. Please try again later.',
    public retryAfter?: number
  ) {
    super(message, message);
    this.name = 'RateLimitError';
  }
}

/**
 * Handles errors in command interactions
 */
export async function handleCommandError(
  interaction: any,
  error: Error
): Promise<void> {
  // Log error with context
  logError(error, {
    command: 'customId' in interaction ? interaction.customId : interaction.commandName,
    userId: interaction.user.id,
    guildId: interaction.guildId,
  });

  // Determine user-friendly error message
  let errorMessage = 'An unexpected error occurred. Please try again.';

  if (error instanceof MusicBotError) {
    errorMessage = error.userMessage;
  } else if (error.message.includes('VOICE_')) {
    errorMessage = 'Voice connection error. Please try rejoining the voice channel.';
  } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
    errorMessage = 'Network error. Please check your connection and try again.';
  }

  // Create error embed
  const embed = createErrorEmbed(errorMessage);

  try {
    // Send error message to user
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }
  } catch (replyError) {
    // If we can't reply, log it
    logError(replyError as Error, {
      context: 'Failed to send error message to user',
    });
  }

  // Report to Sentry in production
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    // Sentry integration would go here
    // This will be implemented in the Sentry config
  }
}

/**
 * Wraps async function with error handling
 */
export function withErrorHandling<T extends any[]>(
  fn: (...args: T) => Promise<void>
): (...args: T) => Promise<void> {
  return async (...args: T) => {
    try {
      await fn(...args);
    } catch (error) {
      logError(error as Error, {
        function: fn.name,
      });
    }
  };
}

/**
 * Safely edits or sends a message
 */
export async function safeReply(
  interaction: any,
  content: Parameters<typeof interaction.reply>[0]
): Promise<InteractionResponse | Message | void> {
  try {
    if (interaction.replied || interaction.deferred) {
      return await interaction.followUp(content);
    } else {
      return await interaction.reply(content);
    }
  } catch (error) {
    logError(error as Error, {
      context: 'Failed to send reply',
      userId: interaction.user.id,
    });
  }
}
