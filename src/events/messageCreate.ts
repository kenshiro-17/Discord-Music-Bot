import { Events, Message, Client } from 'discord.js';
import { ExtendedClient } from '../types';
import { logger, logError } from '../utils/logger';
import { MUSIC_CHANNEL_NAME } from './guildCreate';

// We need to import the play command logic. 
// Since command logic is encapsulated in the command file, usually we'd import the execute function.
// However, the execute function expects an Interaction, not a Message.
// We'll need to adapt the play logic or import the relevant service.
// For simplicity and cleaner architecture, let's assume we can trigger the play logic via a helper or service.
// Checking implementation_plan, we see we have youtube services.

import { play } from '../commands/music/play'; // We might need to refactor play.ts to separate logic from interaction.

// Ideally, we should refactor play.ts to export a `handlePlayRequest(query, guild, member, textChannel)` function.
// For now, let's create a shim/adapter.

export default {
    name: Events.MessageCreate,
    async execute(message: Message) {
        if (message.author.bot || !message.guild) return;

        // Check if it's the music channel
        const channel = message.channel;
        if (!('name' in channel) || channel.name !== MUSIC_CHANNEL_NAME) return;

        const query = message.content.trim();
        if (!query) return;

        const client = message.client as Client & ExtendedClient;

        // We need to construct a fake interaction or call core logic directly.
        // Calling core logic is better.
        // Let's modify this after we verify how play.ts is structured. 
        // Usually extracting shared logic to a controller is best.

        // TEMPORARY: Just logging intent. To fully implement, we need to Refactor play.ts.
        // I will write this file as a placeholder and then initiate a Refactor task.

        // Actually, looking at the user request, they want to "freely chat". 
        // Simply piping everything to play might be annoying if they want to chat ABOUT music.
        // But "join my vc or give it links" implies commands.

        // Let's implement simple text command parsing for this channel.

        // Since we can't easily fake an interaction for the existing /play command without significant refactoring,
        // I will add a TODO to refactor play.ts first.

        // Wait, I can try to execute the command if I allow a cleaner way. 
        // Let's just respond for now telling them to use /play, OR better, 
        // actually implement the playing.

        try {
            // Validation: User must be in VC
            const member = message.member;
            if (!member?.voice.channel) {
                await message.reply("You need to be in a Voice Channel to play music!");
                return;
            }

            // We will call a unified play handler. 
            // I will create `src/handlers/messageCommandHandler.ts` to handle this logic cleanly.
            const { handleMessagePlay } = require('../handlers/messageCommandHandler');
            await handleMessagePlay(message, query);

        } catch (error) {
            logError(error as Error, { context: 'Message play handler' });
            await message.reply('An error occurred while processing your request.');
        }
    },
};
