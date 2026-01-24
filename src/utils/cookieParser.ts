import { logger } from './logger';

export interface YtdlCookie {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    expirationDate?: number;
}

/**
 * Parses cookies from various formats into YTDL-compatible array
 */
export function parseCookies(cookieInput: string): YtdlCookie[] | null {
    if (!cookieInput) return null;

    // 1. Try JSON
    try {
        const jsonParsed = JSON.parse(cookieInput);
        if (Array.isArray(jsonParsed)) {
            return jsonParsed as YtdlCookie[];
        }
    } catch (e) {
        // Not JSON, continue
    }

    // 2. Try Netscape format (TAB separated)
    if (cookieInput.includes('\t') || cookieInput.includes('# Netscape HTTP Cookie File')) {
        logger.debug('Detected Netscape cookie format');
        const cookies: YtdlCookie[] = [];
        const lines = cookieInput.split('\n');

        for (const line of lines) {
            if (line.startsWith('#') || !line.trim()) continue;

            const parts = line.split('\t');
            if (parts.length >= 7) {
                cookies.push({
                    domain: parts[0],
                    // parts[1] is includeSubdomains
                    path: parts[2],
                    secure: parts[3] === 'TRUE',
                    expirationDate: parseInt(parts[4]) || undefined,
                    name: parts[5],
                    value: parts[6].trim(),
                });
            }
        }

        if (cookies.length > 0) return cookies;
    }

    // 3. Try Header format (key=value; key=value)
    if (cookieInput.includes('=')) {
        logger.debug('Detected Cookie Header format');
        const cookies: YtdlCookie[] = [];
        const pairs = cookieInput.split(';');

        for (const pair of pairs) {
            const splitAt = pair.indexOf('=');
            if (splitAt === -1) continue;

            const name = pair.substring(0, splitAt).trim();
            const value = pair.substring(splitAt + 1).trim();

            if (name && value) {
                cookies.push({
                    name,
                    value,
                    domain: '.youtube.com',
                    path: '/',
                    secure: true,
                });
            }
        }

        if (cookies.length > 0) return cookies;
    }

    logger.warn('Failed to parse cookies: unknown format');
    return null;
}
