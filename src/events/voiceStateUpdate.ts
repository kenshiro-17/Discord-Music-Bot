import { VoiceState } from 'discord.js';
import { getQueue } from '../handlers/queueManager';
import { leaveVoiceChannel, isBotAloneInChannel } from '../handlers/voiceManager';
import { logger } from '../utils/logger';

export default {
  name: 'voiceStateUpdate',
  async execute(oldState: VoiceState, newState: VoiceState) {
    const guild = oldState.guild;

    // Check if someone left a voice channel
    if (oldState.channel && !newState.channel) {
      const queue = getQueue(guild.id);

      // Check if bot is in a voice channel
      if (queue && queue.voiceChannel) {
        // Check if bot is now alone
        if (isBotAloneInChannel(queue.voiceChannel)) {
          logger.info('Bot is alone in voice channel, starting disconnect timer', {
            guildId: guild.id,
          });

          // Wait 5 minutes, then disconnect if still alone
          setTimeout(() => {
            const currentQueue = getQueue(guild.id);
            if (currentQueue && currentQueue.voiceChannel && isBotAloneInChannel(currentQueue.voiceChannel)) {
              logger.info('Auto-disconnecting after being alone for 5 minutes', {
                guildId: guild.id,
              });

              leaveVoiceChannel(guild.id);

              currentQueue.textChannel
                .send('Left the voice channel - everyone left!')
                .catch(() => {});
            }
          }, 5 * 60 * 1000); // 5 minutes
        }
      }
    }
  },
};
