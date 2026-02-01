/**
 * Test script to verify YouTube extraction works
 * Run with: npx ts-node src/scripts/testYoutube.ts
 */

import { Innertube } from 'youtubei.js';

const TEST_VIDEO_ID = 'dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up

async function testYouTube() {
    console.log('='.repeat(60));
    console.log('YouTube Extraction Test');
    console.log('='.repeat(60));
    console.log('');

    try {
        console.log('1. Creating Innertube client...');
        const innertube = await Innertube.create({
            po_token: undefined,
            player_id: '0004de42'
        });
        console.log('   ✅ Innertube client created\n');

        // Test different clients
        const clients = ['WEB', 'TV', 'IOS', 'ANDROID'] as const;

        for (const client of clients) {
            console.log(`2. Testing ${client} client...`);
            try {
                const info = await innertube.getBasicInfo(TEST_VIDEO_ID, { client });

                const formats = info.streaming_data?.formats || [];
                const adaptiveFormats = info.streaming_data?.adaptive_formats || [];
                const audioFormats = adaptiveFormats.filter((f: any) =>
                    f.mime_type?.includes('audio')
                );

                console.log(`   Title: ${info.basic_info.title}`);
                console.log(`   Formats: ${formats.length} regular, ${adaptiveFormats.length} adaptive, ${audioFormats.length} audio`);

                if (audioFormats.length > 0) {
                    // Try to get a URL
                    const audioFormat = audioFormats[0] as any;
                    const hasUrl = !!(audioFormat.url || audioFormat.decipher);

                    if (hasUrl) {
                        console.log(`   ✅ ${client} client works with audio streams!\n`);
                        console.log('='.repeat(60));
                        console.log(`SUCCESS! Use client: ${client}`);
                        console.log('='.repeat(60));
                        process.exit(0);
                    } else {
                        console.log(`   ⚠️  Audio formats found but no URLs\n`);
                    }
                } else {
                    console.log(`   ❌ No audio formats\n`);
                }
            } catch (e) {
                console.log(`   ❌ Error: ${(e as Error).message}\n`);
            }
        }

        // If we get here, no client worked
        console.log('='.repeat(60));
        console.log('All clients failed to get audio streams');
        console.log('='.repeat(60));
        process.exit(1);

    } catch (error) {
        console.log('\n   ❌ Error:', (error as Error).message);
        process.exit(1);
    }
}

testYouTube();
