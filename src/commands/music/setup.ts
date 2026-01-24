import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ChannelType } from 'discord.js';
import { MUSIC_CHANNEL_NAME } from '../../events/guildCreate';
import { logger } from '../../utils/logger';

export default {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Creates the dedicated music request channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        await interaction.deferReply({ ephemeral: true });

        try {
            // Check if channel already exists
            const existingChannel = interaction.guild.channels.cache.find(
                (channel) => channel.name === MUSIC_CHANNEL_NAME && channel.type === ChannelType.GuildText
            );

            if (existingChannel) {
                await interaction.editReply(`Music channel already exists: ${existingChannel.toString()}`);
                return;
            }

            // Create the channel
            const channel = await interaction.guild.channels.create({
                name: MUSIC_CHANNEL_NAME,
                type: ChannelType.GuildText,
                topic: '🎵 Music requests channel. Type a song name or paste a link to play!',
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                    },
                    {
                        id: interaction.client.user.id,
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

                await interaction.editReply(`Successfully created dedicated music channel: ${channel.toString()}`);
                logger.info(`Manually created music channel in ${interaction.guild.name}`);
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply('Failed to create music channel. Please check my permissions.');
        }
    },
};
