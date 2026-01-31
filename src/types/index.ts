import {
  User,
  TextChannel,
  VoiceChannel,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  Collection,
  ButtonInteraction,
  StringSelectMenuInteraction,
  Message,
} from 'discord.js';
import { AudioPlayer } from '@discordjs/voice';

/**
 * Represents a song in the queue
 */
export interface Song {
  /** Song title */
  title: string;
  /** Playable URL */
  url: string;
  /** Duration in seconds */
  duration: number;
  /** Thumbnail image URL */
  thumbnail: string;
  /** User who requested the song */
  requestedBy: User;
  /** Music source type */
  source: 'youtube' | 'soundcloud' | 'spotify' | 'file';
  /** Lavalink encoded track */
  encodedTrack?: string;
}

/**
 * Loop mode options
 */
export type LoopMode = 'off' | 'song' | 'queue';

/**
 * Server-specific music queue
 */
export interface ServerQueue {
  /** Text channel where bot was summoned */
  textChannel: TextChannel;
  /** Voice channel bot is connected to */
  voiceChannel: VoiceChannel;
  /** Active voice connection (Lavalink Player) */
  connection: any;
  /** Queue of songs */
  songs: Song[];
  /** Current volume (0-200) */
  volume: number;
  /** Whether currently playing */
  playing: boolean;
  /** Loop mode */
  loop: LoopMode;
  /** Audio player instance */
  audioPlayer: AudioPlayer | null;
  /** Index of currently playing song */
  currentIndex: number;
  /** Message showing now playing status */
  nowPlayingMessage?: Message;
  /** Interval for updating progress bar */
  progressInterval?: NodeJS.Timeout;
  /** Timestamp when current song started */
  startTime?: number;
  /** Total time spent paused in ms */
  pausedTime?: number;
  /** Timestamp when last pause started */
  lastPauseTime?: number;
}

/**
 * Music command interface
 */
export interface MusicCommand {
  /** Slash command data */
  data: SlashCommandBuilder;
  /** Command execution function */
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

/**
 * Button handler interface
 */
export interface ButtonHandler {
  /** Button custom ID pattern */
  customId: string | RegExp;
  /** Button execution function */
  execute: (interaction: ButtonInteraction) => Promise<void>;
}

/**
 * Select menu handler interface
 */
export interface SelectMenuHandler {
  /** Select menu custom ID pattern */
  customId: string | RegExp;
  /** Select menu execution function */
  execute: (interaction: StringSelectMenuInteraction) => Promise<void>;
}

/**
 * Bot configuration
 */
export interface BotConfig {
  /** Discord bot token */
  token: string;
  /** Discord client ID */
  clientId: string;

  /** Sentry DSN */
  sentryDsn?: string;
  /** Environment */
  nodeEnv: 'development' | 'production';
  /** Log level */
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  /** Default volume */
  defaultVolume: number;
  /** Maximum queue size */
  maxQueueSize: number;
  /** Inactivity timeout in seconds */
  inactivityTimeout: number;
  /** Maximum file size in MB */
  maxFileSize: number;
  /** YouTube Cookies for Auth */
  youtubeCookies: string;
}

/**
 * YouTube search result
 */
export interface YouTubeSearchResult {
  /** Video title */
  title: string;
  /** Video URL */
  url: string;
  /** Duration in seconds */
  duration: number;
  /** Thumbnail URL */
  thumbnail: string;
  /** Channel name */
  channel: string;
}



/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Server queue if valid */
  queue?: ServerQueue;
}

/**
 * Search result storage (temporary)
 */
export interface SearchResultCache {
  /** Search results */
  results: YouTubeSearchResult[];
  /** User who initiated search */
  userId: string;
  /** Expiry timestamp */
  expiresAt: number;
}

/**
 * Extended Discord client with custom properties
 */
export interface ExtendedClient {
  /** Command collection */
  commands: Collection<string, MusicCommand>;
  /** Server queues */
  queues: Collection<string, ServerQueue>;
  /** Search result cache */
  searchCache: Collection<string, SearchResultCache>;
}

/**
 * Metrics data
 */
export interface Metrics {
  /** Commands executed per type */
  commandsExecuted: Map<string, number>;
  /** Errors per command */
  errors: Map<string, number>;
  /** Total songs played */
  songsPlayed: number;
  /** Total playback time in seconds */
  totalPlaybackTime: number;
  /** Active queues count */
  activeQueues: number;
  /** Bot start time */
  startTime: number;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  /** Service status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Uptime in seconds */
  uptime: number;
  /** Memory usage */
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  /** Active queues */
  activeQueues: number;
  /** Timestamp */
  timestamp: number;
}
