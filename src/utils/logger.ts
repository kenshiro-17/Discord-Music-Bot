import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config, isProduction } from '../config/config';
import path from 'path';
import fs from 'fs';

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  isProduction()
    ? winston.format.json()
    : winston.format.printf(({ timestamp, level, message, metadata }) => {
      const metaStr = Object.keys(metadata as any).length ? JSON.stringify(metadata) : '';
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
    })
);

/**
 * Create transports array
 */
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

// Add file transports if not in test environment
if (process.env.NODE_ENV !== 'test') {
  // Daily rotate file for all logs
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: config.logLevel,
    })
  );

  // Daily rotate file for errors only
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
    })
  );
}

/**
 * Winston logger instance
 */
export const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  transports,
  exitOnError: false,
});

/**
 * Log with additional context
 */
export function logWithContext(
  level: 'error' | 'warn' | 'info' | 'debug',
  message: string,
  context?: Record<string, unknown>
): void {
  logger.log(level, message, context);
}

/**
 * Log command execution
 */
export function logCommand(
  commandName: string,
  userId: string,
  guildId: string,
  success: boolean
): void {
  logger.info('Command executed', {
    command: commandName,
    userId,
    guildId,
    success,
  });
}

/**
 * Log error with context
 */
export function logError(
  error: Error,
  context?: Record<string, unknown>
): void {
  logger.error(error.message, {
    error: error.stack,
    ...context,
  });
}

/**
 * Create logs directory if it doesn't exist
 */
export function ensureLogsDirectory(): void {
  const logsDir = path.join(process.cwd(), 'logs');

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    logger.info('Created logs directory');
  }
}
