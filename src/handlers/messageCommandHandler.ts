import { Message } from 'discord.js';
import { execute as playExecute } from '../commands/music/play';
import { logger, logError } from '../utils/logger';

// This is a bit of a hack to reuse the slash command logic.
// We mock the interaction object to pass to the play command.
// A better long-term solution is to extract the core logic of play.ts into a service.

export async function handleMessagePlay(message: Message, query: string): Promise<void> {
    if (!message.member?.voice.channel) {
        await message.reply('You need to be in a voice channel to play music!');
        return;
    }

    // Mock interaction object
    // We only implement what the play command uses
    const mockInteraction: any = {
        isChatInputCommand: () => true,
        deferred: false,
        replied: false,
        guild: message.guild,
        member: message.member,
        user: message.author,
        client: message.client,
        options: {
            getString: (name: string) => (name === 'query' ? query : null),
            getAttachment: () => null,
        },
        deferReply: async () => {
            // Message commands don't need deferral in the same way, but we can simulate "thinking"
            // by reacting or typing? For now, we'll just ignore or send a "Searching..." message if needed.
            // Actually, play command sends "Searching...", so we should probably implement this
            // but simple reply is easier.
            mockInteraction.deferred = true;
            return { interaction: mockInteraction };
        },
        editReply: async (content: any) => {
            // If content is an embed, we send it.
            // If it's a string, we send it.
            await message.channel.send(content);
            return { id: message.id }; // Return fake message
        },
        followUp: async (content: any) => {
            await message.channel.send(content);
            return { id: message.id };
        }
    };

    try {
        logger.info(`Processing message play request: ${query} from ${message.author.tag}`);
        await playExecute(mockInteraction);
        // Cleanup the original command message to keep chat clean? 
        // Maybe later.
    } catch (error) {
        logError(error as Error, { context: 'Handle Message Play' });
        await message.reply('Failed to play track. Please try again.');
    }
}
