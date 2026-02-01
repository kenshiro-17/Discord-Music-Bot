/**
 * Test script to verify YouTube extraction works
 * Run with: npx ts-node src/scripts/testYoutube.ts
 */

import { Innertube } from 'youtubei.js';

// Test the EXACT URL that's failing on Railway
const FAILING_URL = 'https://www.youtube.com/watch?v=LZY0-ccz2-w&list=RDLZY0-ccz2-w&start_radio=1';

async function testYouTube() {
    console.log('='.repeat(60));
    console.log('YouTube Extraction Test - Railway Failing URL');
    console.log('='.repeat(60));
    console.log('');

    try {
        console.log('1. Creating Innertube client...');
        const innertube = await Innertube.create({
            po_token: undefined,
            player_id: '0004de42'
        });
        console.log('   ✅ Innertube client created\n');

        // Test the failing URL
        console.log('2. Testing FAILING URL from Railway...');
        console.log(`   URL: ${FAILING_URL}`);

        // Extract video ID
        const urlObj = new URL(FAILING_URL);
        const videoId = urlObj.searchParams.get('v') || '';
        console.log(`   Extracted video ID: ${videoId}`);

        try {
            const info = await innertube.getBasicInfo(videoId, { client: 'IOS' });
            const audioFormats = (info.streaming_data?.adaptive_formats || []).filter((f: any) =>
                f.mime_type?.includes('audio')
            );

            console.log(`   Title: ${info.basic_info.title}`);
            console.log(`   Author: ${info.basic_info.author}`);
            console.log(`   Duration: ${info.basic_info.duration} seconds`);
            console.log(`   Audio formats: ${audioFormats.length}`);

            if (audioFormats.length > 0) {
                console.log(`   ✅ Video extraction works!\n`);
            } else {
                console.log(`   ❌ No audio formats found\n`);
            }
        } catch (e) {
            console.log(`   ❌ Error: ${(e as Error).message}\n`);
        }

        // Now test with discord-player-youtubei's validation
        console.log('3. Testing YoutubeiExtractor URL validation...');
        const { YoutubeiExtractor } = await import('discord-player-youtubei');

        const isValidUrl = YoutubeiExtractor.validateURL(FAILING_URL);
        const isValidId = YoutubeiExtractor.validateId(videoId);

        console.log(`   validateURL result: ${isValidUrl}`);
        console.log(`   validateId result: ${isValidId}`);

        if (isValidUrl) {
            const parsedId = YoutubeiExtractor.parseURL(FAILING_URL);
            console.log(`   parseURL result: ${parsedId}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('TEST COMPLETED');
        console.log('='.repeat(60));

    } catch (error) {
        console.log('\n   ❌ Error:', (error as Error).message);
        process.exit(1);
    }
}

testYouTube();
