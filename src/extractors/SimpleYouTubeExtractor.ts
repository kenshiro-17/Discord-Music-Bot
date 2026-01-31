import { BaseExtractor, Track } from 'discord-player';
import ytdl from '@distube/ytdl-core';
import { logger } from '../utils/logger';
import { getPoToken } from '../services/potoken';

// Cookie parser helper
function parseCookies(cookieString: string): any[] {
    if (!cookieString) return [];
    return cookieString.split('\n')
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
            const parts = line.split('\t');
            if (parts.length < 7) return null;
            return {
                domain: parts[0],
                path: parts[2],
                secure: parts[3] === 'TRUE',
                expiration: parseFloat(parts[4]),
                name: parts[5],
                value: parts[6]
            };
        })
        .filter(c => c !== null);
}

// Create agent globally if possible
let ytdlAgent: any = null;
try {
    if (process.env.YOUTUBE_COOKIES) {
        const cookies = parseCookies(process.env.YOUTUBE_COOKIES);
        if (cookies.length > 0) {
            ytdlAgent = ytdl.createAgent(cookies);
            logger.info(`Created YTDL Agent with ${cookies.length} cookies`);
        }
    }
} catch (e) {
    logger.error('Failed to create YTDL Agent', { error: (e as Error).message });
}

export default class SimpleYouTubeExtractor extends BaseExtractor {
    static identifier = 'com.discord-player.simpleyoutubeextractor';

    async validate(query: string) {
        if (typeof query !== 'string') return false;
        const isValid = ytdl.validateURL(query);
        logger.debug(`SimpleYouTubeExtractor validate: ${isValid} for ${query}`);
        return isValid;
    }

    async handle(query: string, _context: any) {
        try {
            logger.debug(`SimpleYouTubeExtractor handling: ${query}`);
            
            const options: any = {
                // Use mobile clients which are less restricted
                playerClients: ['ANDROID', 'IOS', 'WEB']
            };
            if (ytdlAgent) options.agent = ytdlAgent;

            // Add PoToken
            const { poToken, visitorData } = getPoToken();
            if (poToken) {
                options.poToken = poToken;
                options.visitorData = visitorData;
                logger.debug('Using PoToken for info fetch');
            }

            const info = await ytdl.getInfo(query, options);
            
            const track = new Track(this.context.player, {
                title: info.videoDetails.title,
                url: info.videoDetails.video_url,
                duration: info.videoDetails.lengthSeconds,
                thumbnail: info.videoDetails.thumbnails[0]?.url,
                author: info.videoDetails.author.name,
                views: parseInt(info.videoDetails.viewCount),
                source: 'youtube',
                raw: info,
                queryType: 'youtubeVideo'
            });

            logger.info(`SimpleYouTubeExtractor found track: ${track.title}`);

            return {
                playlist: null,
                tracks: [track]
            };
        } catch (e) {
            logger.error('SimpleYouTubeExtractor handle error', { error: (e as Error).message });
            return { playlist: null, tracks: [] };
        }
    }

    async stream(info: Track) {
        logger.debug(`SimpleYouTubeExtractor streaming: ${info.title}`);
        
        const options: any = {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
            dlChunkSize: 0,
        };
        
        if (ytdlAgent) options.agent = ytdlAgent;

        // Add PoToken
        const { poToken, visitorData } = getPoToken();
        if (poToken) {
            options.poToken = poToken;
            options.visitorData = visitorData;
        }

        return ytdl(info.url, options);
    }
}
