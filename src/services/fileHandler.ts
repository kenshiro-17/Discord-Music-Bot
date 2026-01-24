import { Attachment, User } from 'discord.js';
import { Song } from '../types';
import { logger, logError } from '../utils/logger';
import { validateAudioFile } from '../utils/validators';
import { PlaybackError } from '../utils/errorHandler';
import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import http from 'http';

/**
 * Processes audio file attachment
 */
export async function processAudioFile(attachment: Attachment, user: User): Promise<Song> {
  // Validate file
  const validation = validateAudioFile(attachment);

  if (!validation.valid) {
    throw new PlaybackError(validation.error || 'Invalid audio file');
  }

  try {
    // Download file
    const filePath = await downloadFile(attachment);

    // Extract metadata (duration)
    const metadata = await extractMetadata(filePath);

    const song: Song = {
      title: metadata.title || attachment.name,
      url: attachment.url,
      duration: metadata.duration,
      thumbnail: '', // No thumbnail for files
      requestedBy: user,
      source: 'file',
      filename: attachment.name,
      filePath,
    };

    logger.info('Audio file processed', {
      filename: attachment.name,
      size: attachment.size,
      duration: metadata.duration,
    });

    return song;
  } catch (error) {
    logError(error as Error, { context: 'Failed to process audio file' });
    throw new PlaybackError('Failed to process audio file');
  }
}

/**
 * Downloads file to temp directory
 */
async function downloadFile(attachment: Attachment): Promise<string> {
  return new Promise((resolve, reject) => {
    const tempDir = os.tmpdir();
    const fileName = `tc-upload-${Date.now()}-${attachment.name}`;
    const filePath = path.join(tempDir, fileName);

    const file = fs.createWriteStream(filePath);
    const protocol = attachment.url.startsWith('https') ? https : http;

    protocol
      .get(attachment.url, (response) => {
        response.pipe(file);

        file.on('finish', () => {
          file.close();
          logger.debug('File downloaded', { filePath });
          resolve(filePath);
        });
      })
      .on('error', (error) => {
        fs.unlink(filePath, () => { }); // Clean up on error
        reject(error);
      });

    file.on('error', (error) => {
      fs.unlink(filePath, () => { });
      reject(error);
    });
  });
}

/**
 * Extracts metadata from audio file
 */
async function extractMetadata(filePath: string): Promise<{ title?: string; duration: number }> {
  try {
    // Use play-dl's ffmpeg to extract metadata
    const { exec } = require('child_process');
    const ffmpegPath = require('ffmpeg-static');

    return new Promise<{ title?: string; duration: number }>((resolve) => {
      // Use ffprobe to get duration
      const command = `"${ffmpegPath}" -i "${filePath}" -f null - 2>&1`;

      exec(command, (_error: Error | null, stdout: string, stderr: string) => {
        // ffmpeg outputs to stderr even on success
        const output = stderr || stdout;

        // Extract duration using regex
        const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);

        if (durationMatch) {
          const hours = parseInt(durationMatch[1], 10);
          const minutes = parseInt(durationMatch[2], 10);
          const seconds = parseFloat(durationMatch[3]);
          const totalSeconds = hours * 3600 + minutes * 60 + seconds;

          resolve({
            duration: Math.floor(totalSeconds),
          });
        } else {
          // Fallback to default duration if extraction fails
          logger.warn('Could not extract duration from file', { filePath });
          resolve({
            duration: 0,
          });
        }
      });
    });
  } catch (error) {
    logError(error as Error, { context: 'Failed to extract metadata', filePath });
    return { duration: 0 };
  }
}

/**
 * Cleans up temporary file
 */
export function cleanupTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.debug('Temp file cleaned up', { filePath });
    }
  } catch (error) {
    logError(error as Error, { context: 'Failed to cleanup temp file', filePath });
  }
}
