import { BaseExtractor, Track } from 'discord-player';
import ytdl from '@distube/ytdl-core';

export default class SimpleYouTubeExtractor extends BaseExtractor {
    static identifier = 'com.discord-player.simpleyoutubeextractor';

    async validate(query: string) {
        if (typeof query !== 'string') return false;
        return ytdl.validateURL(query);
    }

    async handle(query: string, _context: any) {
        try {
            const info = await ytdl.getInfo(query);
            
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

            return {
                playlist: null,
                tracks: [track]
            };
        } catch (e) {
            return { playlist: null, tracks: [] };
        }
    }

    async stream(info: Track) {
        // Use highWaterMark to prevent stuttering
        return ytdl(info.url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
            dlChunkSize: 0,
        });
    }
}
