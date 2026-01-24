import { Events, Message } from 'discord.js';
import { logError } from '../utils/logger';
import { MUSIC_CHANNEL_NAME } from './guildCreate';

const cooldowns = new Map<string, number>();
const COOLDOWN_DURATION = 3000; // 3 seconds

export default {
    name: Events.MessageCreate,
    async execute(message: Message) {
        if (message.author.bot || !message.guild) return;

        // Check if it's the music channel
        const channel = message.channel;
        if (!('name' in channel) || channel.name !== MUSIC_CHANNEL_NAME) return;

        const query = message.content.trim();
        if (!query) return;

        // Rate limiting
        const now = Date.now();
        const lastMessage = cooldowns.get(message.author.id);
        if (lastMessage && now - lastMessage < COOLDOWN_DURATION) {
            await message.react('⏳'); // Indicate cooldown
            return;
        }
        cooldowns.set(message.author.id, now);

        try {
            // Validation: User must be in VC
            const member = message.member;
            if (!member?.voice.channel) {
                await message.reply("You need to be in a Voice Channel to play music!");
                return;
            }

            // We will call a unified play handler. 
            // I will create `src/handlers/messageCommandHandler.ts` to handle this logic cleanly.
            const { handleMessagePlay } = await import('../handlers/messageCommandHandler');
            await handleMessagePlay(message, query);

        } catch (error) {
            logError(error as Error, { context: 'Message play handler' });
            await message.reply('An error occurred while processing your request.');
        }
    },
};
