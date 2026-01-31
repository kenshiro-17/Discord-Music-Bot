import { generate } from 'youtube-po-token-generator';
import { logger } from '../utils/logger';
import play from 'play-dl';

let poToken: string | null = null;
let visitorData: string | null = null;

/**
 * Generates and sets PoToken for YouTube clients
 */
export async function refreshPoToken(): Promise<void> {
    try {
        logger.info('Generating YouTube PoToken...');
        
        const result = await generate();
        
        if (result && result.poToken) {
            poToken = result.poToken;
            visitorData = result.visitorData;
            
            logger.info('PoToken generated successfully', { 
                token: poToken.substring(0, 10) + '...',
                visitorData: visitorData 
            });

            // Update play-dl
            // play-dl currently doesn't export a simple 'setPoToken' but we can try setToken
            try {
                // Not all play-dl versions support 'pot' key yet, but worth a shot if updated
                // Or we rely on ytdl-core which we configured explicitly
            } catch (e) {
                // ignore
            }
        } else {
            logger.warn('PoToken generation returned empty result');
        }
    } catch (error) {
        logger.error('Failed to generate PoToken', { error: (error as Error).message });
    }
}

/**
 * Get current PoToken
 */
export function getPoToken() {
    return { poToken, visitorData };
}

/**
 * Start PoToken refresh loop
 */
export function startPoTokenService() {
    refreshPoToken();
    // Refresh every 12 hours
    setInterval(refreshPoToken, 12 * 60 * 60 * 1000);
}
