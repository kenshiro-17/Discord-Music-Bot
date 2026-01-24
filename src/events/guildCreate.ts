import { Events, Guild, ChannelType, PermissionFlagsBits, TextChannel } from 'discord.js';
import { logger, logError } from '../utils/logger';
import { createSuccessEmbed } from '../utils/embedBuilder';
import { styleResponse } from '../utils/persona';

export const BOT_CHANNEL_NAMES = ['music-requests', 'music', 'songs', 'bot-commands', 'bots', 'commands'];
export const DEFAULT_MUSIC_CHANNEL = 'music-requests';

export default {
    name: Events.GuildCreate,
    async execute(guild: Guild) {
        logger.info(`Joined guild: ${guild.name} (${guild.id})`);

        try {
            // Check if any suitable bot channel already exists
            const existingChannel = guild.channels.cache.find(
                (channel) => 
                    channel.type === ChannelType.GuildText && 
                    BOT_CHANNEL_NAMES.includes(channel.name.toLowerCase())
            );

            if (existingChannel && existingChannel.isTextBased()) {
                logger.info(`Found existing bot channel ${existingChannel.name} in ${guild.name}`);
                
                // Send welcome message to existing channel
                const welcomeEmbed = createSuccessEmbed(
                    styleResponse(
                        `**Thankan Chettan Vannu!**\n\nI noticed you have a **#${existingChannel.name}** channel.\nI'll use this for music requests!\n\nJust type a song name or paste a link here.`,
                        'success'
                    )
                ).setTitle('🎵 Ready to Play');

                await (existingChannel as TextChannel).send({ embeds: [welcomeEmbed] });
                return;
            }

            // Create the channel if none exists
            const channel = await guild.channels.create({
                name: DEFAULT_MUSIC_CHANNEL,
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
                const welcomeEmbed = createSuccessEmbed(
                    styleResponse(
                        `**Thankan Chettan Vannu!**\n\nI created this channel for music.\nType a song name or link to start.`,
                        'success'
                    )
                ).setTitle('🎵 Music Channel Setup');

                await channel.send({ embeds: [welcomeEmbed] });
                logger.info(`Created music channel in ${guild.name}`);
            }
        } catch (error) {
            logError(error as Error, { context: 'Failed to setup music channel', guildId: guild.id });
        }
    },
};

