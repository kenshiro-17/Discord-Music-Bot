import dotenv from 'dotenv';
import { BotConfig } from '../types';

// Load environment variables
dotenv.config();

/**
 * Validates required environment variables
 */
function validateConfig(): void {
  const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please copy .env.example to .env and fill in the required values.'
    );
  }
}

// Validate on import
validateConfig();

/**
 * Centralized bot configuration
 */
export const config: BotConfig = {
  // Discord configuration (required)
  token: process.env.DISCORD_TOKEN!,
  clientId: process.env.DISCORD_CLIENT_ID!,



  // Sentry configuration (optional)
  sentryDsn: process.env.SENTRY_DSN,

  // Application configuration
  nodeEnv: (process.env.NODE_ENV as 'development' | 'production') || 'development',
  logLevel: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',
  defaultVolume: parseInt(process.env.DEFAULT_VOLUME || '50', 10),
  maxQueueSize: parseInt(process.env.MAX_QUEUE_SIZE || '100', 10),
  inactivityTimeout: parseInt(process.env.INACTIVITY_TIMEOUT || '300', 10),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '25', 10),
};



/**
 * Check if Sentry is configured
 */
export function isSentryEnabled(): boolean {
  return !!config.sentryDsn && config.nodeEnv === 'production';
}

/**
 * Check if in production mode
 */
export function isProduction(): boolean {
  return config.nodeEnv === 'production';
}

/**
 * Get configuration summary (safe for logging)
 */
export function getConfigSummary(): Record<string, unknown> {
  return {
    nodeEnv: config.nodeEnv,
    logLevel: config.logLevel,
    sentryEnabled: isSentryEnabled(),
    defaultVolume: config.defaultVolume,
    maxQueueSize: config.maxQueueSize,
    inactivityTimeout: config.inactivityTimeout,
    maxFileSize: config.maxFileSize,
  };
}
