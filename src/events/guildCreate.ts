import { Events, Guild, ChannelType, PermissionFlagsBits } from 'discord.js';
import { logger, logError } from '../utils/logger';

export const MUSIC_CHANNEL_NAME = 'music-requests';

export default {
    name: Events.GuildCreate,
    async execute(guild: Guild) {
        logger.info(`Joined guild: ${guild.name} (${guild.id})`);

        try {
            // Check if channel already exists
            const existingChannel = guild.channels.cache.find(
                (channel) => channel.name === MUSIC_CHANNEL_NAME && channel.type === ChannelType.GuildText
            );

            if (existingChannel) {
                logger.info(`Music channel already exists in ${guild.name}`);
                return;
            }

            // Create the channel
            const channel = await guild.channels.create({
                name: MUSIC_CHANNEL_NAME,
                type: ChannelType.GuildText,
                topic: '🎵 Music requests channel. Type a song name or paste a link to play!',
                permissionOverwrites: [
                    {
                        id: guild.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                    },
                    {
                        id: guild.client.user!.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
                    },
                ],
            });

            if (channel) {
                await channel.send({
                    embeds: [
                        {
                            title: '🎵 Music Channel Setup',
                            description: `This channel has been set up for music requests!\n\n**How to use:**\n• Simply type a song name or paste a YouTube link here to play.\n• Use slash commands like \`/skip\`, \`/stop\`, \`/queue\` for control.\n\nEnjoy the tunes! 🎧`,
                            color: 0x00ff00,
                        },
                    ],
                });
                logger.info(`Created music channel in ${guild.name}`);
            }
        } catch (error) {
            logError(error as Error, { context: 'Failed to create music channel', guildId: guild.id });
        }
    },
};
