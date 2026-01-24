import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  GuildMember,
  VoiceBasedChannel,
  Attachment,
} from 'discord.js';
import { ServerQueue, ValidationResult } from '../types';
import { config } from '../config/config';

/**
 * Validates if a string is a valid YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
}

/**
 * Validates if a string is a valid YouTube playlist URL
 */
export function isYouTubePlaylistUrl(url: string): boolean {
  return url.includes('youtube.com') && (url.includes('list=') || url.includes('&list='));
}



/**
 * Validates if a URL is safe to use
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowedProtocols = ['http:', 'https:'];
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validates audio file attachment
 */
export function validateAudioFile(attachment: Attachment): { valid: boolean; error?: string } {
  const allowedExtensions = ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.webm'];
  const allowedMimeTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/flac',
    'audio/ogg',
    'audio/x-m4a',
    'audio/webm',
  ];

  // Check file extension
  const hasValidExtension = allowedExtensions.some((ext) =>
    attachment.name.toLowerCase().endsWith(ext)
  );

  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedExtensions.join(', ')}`,
    };
  }

  // Check MIME type if available
  if (attachment.contentType && !allowedMimeTypes.includes(attachment.contentType)) {
    return {
      valid: false,
      error: 'Invalid file MIME type',
    };
  }

  // Check file size (convert to MB)
  const fileSizeMB = attachment.size / (1024 * 1024);
  if (fileSizeMB > config.maxFileSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${config.maxFileSize}MB`,
    };
  }

  return { valid: true };
}

/**
 * Sanitizes search query
 */
export function sanitizeSearchQuery(query: string): string {
  // Remove potentially harmful characters
  return query
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 200); // Limit length
}

/**
 * Validates user is in a voice channel
 */
export function getUserVoiceChannel(interaction: any): VoiceBasedChannel | null {
  const member = interaction.member as GuildMember;
  return member?.voice?.channel || null;
}

/**
 * Validates bot has required voice permissions
 */
export function validateVoicePermissions(channel: VoiceBasedChannel): { valid: boolean; error?: string } {
  const permissions = channel.permissionsFor(channel.guild.members.me!);

  if (!permissions) {
    return {
      valid: false,
      error: 'Unable to check permissions',
    };
  }

  if (!permissions.has(PermissionFlagsBits.Connect)) {
    return {
      valid: false,
      error: 'I need permission to connect to the voice channel',
    };
  }

  if (!permissions.has(PermissionFlagsBits.Speak)) {
    return {
      valid: false,
      error: 'I need permission to speak in the voice channel',
    };
  }

  // Check if channel is full
  if (channel.full) {
    return {
      valid: false,
      error: 'Voice channel is full',
    };
  }

  return { valid: true };
}

/**
 * Validates user is in the same voice channel as the bot
 */
export function validateSameVoiceChannel(
  interaction: ChatInputCommandInteraction,
  queue: ServerQueue
): { valid: boolean; error?: string } {
  const member = interaction.member as GuildMember;
  const userChannel = member?.voice?.channel;

  if (!userChannel) {
    return {
      valid: false,
      error: 'You need to be in a voice channel',
    };
  }

  if (userChannel.id !== queue.voiceChannel.id) {
    return {
      valid: false,
      error: 'You need to be in the same voice channel as the bot',
    };
  }

  return { valid: true };
}

/**
 * Validates music command preconditions
 */
export function validateMusicCommand(
  interaction: any,
  queue: ServerQueue | undefined,
  requireQueue: boolean = true
): ValidationResult {
  // Check if user is in a voice channel
  const userChannel = getUserVoiceChannel(interaction);
  if (!userChannel) {
    return {
      valid: false,
      error: 'You need to be in a voice channel to use this command',
    };
  }

  // If queue is required, validate it exists
  if (requireQueue && !queue) {
    return {
      valid: false,
      error: 'Nothing is currently playing',
    };
  }

  // If queue exists, validate user is in same channel
  if (queue) {
    const sameChannel = validateSameVoiceChannel(interaction, queue);
    if (!sameChannel.valid) {
      return sameChannel;
    }
  }

  // Validate bot permissions in user's channel
  const permissions = validateVoicePermissions(userChannel);
  if (!permissions.valid) {
    return permissions;
  }

  return {
    valid: true,
    queue,
  };
}

/**
 * Validates queue size limit
 */
export function validateQueueSize(currentSize: number): { valid: boolean; error?: string } {
  if (currentSize >= config.maxQueueSize) {
    return {
      valid: false,
      error: `Queue is full (maximum ${config.maxQueueSize} songs)`,
    };
  }

  return { valid: true };
}

/**
 * Validates song position in queue
 */
export function validateSongPosition(position: number, queueLength: number): { valid: boolean; error?: string } {
  if (position < 1 || position > queueLength) {
    return {
      valid: false,
      error: `Invalid position. Must be between 1 and ${queueLength}`,
    };
  }

  return { valid: true };
}
