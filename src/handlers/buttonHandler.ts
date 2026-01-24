import { ButtonInteraction } from 'discord.js';
import { getQueue, pause, resume, setLoop, setVolume } from './queueManager';
import { skip as skipSong, stop as stopPlayback } from './queueManager';
import { shuffleQueue } from './queueManager';
import { playSong } from './audioHandler';
import { leaveVoiceChannel } from './voiceManager';
import { validateMusicCommand } from '../utils/validators';
import { createNowPlayingEmbed } from '../utils/embedBuilder';
import { createNowPlayingButtons } from '../utils/buttonBuilder';
// import { safeReply } from '../utils/errorHandler';
import { ValidationError } from '../utils/errorHandler';

/**
 * Handles button interactions
 */
export async function handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
  const customId = interaction.customId;

  // Defer update for immediate feedback
  await interaction.deferUpdate();

  const queue = getQueue(interaction.guildId!);
  const validation = validateMusicCommand(interaction, queue, true);

  if (!validation.valid) {
    throw new ValidationError(validation.error!);
  }

  // Handle different button types
  if (customId === 'music_playpause') {
    await handlePlayPause(interaction, queue!);
  } else if (customId === 'music_skip') {
    await handleSkip(interaction, queue!);
  } else if (customId === 'music_stop') {
    await handleStop(interaction, queue!);
  } else if (customId === 'music_loop') {
    await handleLoop(interaction, queue!);
  } else if (customId === 'music_shuffle') {
    await handleShuffle(interaction, queue!);
  } else if (customId === 'music_volume_up') {
    await handleVolumeUp(interaction, queue!);
  } else if (customId === 'music_volume_down') {
    await handleVolumeDown(interaction, queue!);
  } else if (customId.startsWith('queue_page_')) {
    // Queue pagination handled separately
    // const page = parseInt(customId.split('_')[2], 10);
    // This would be handled by the queue command
  }
}

/**
 * Handles play/pause button
 */
async function handlePlayPause(interaction: ButtonInteraction, queue: any): Promise<void> {
  if (queue.playing) {
    pause(interaction.guildId!);
  } else {
    resume(interaction.guildId!);
  }

  // Update embed
  const currentSong = queue.songs[queue.currentIndex];
  const embed = createNowPlayingEmbed(currentSong, queue);
  const buttons = createNowPlayingButtons(!queue.playing, queue.loop);

  await interaction.editReply({
    embeds: [embed],
    components: buttons,
  });
}

/**
 * Handles skip button
 */
async function handleSkip(interaction: ButtonInteraction, queue: any): Promise<void> {
  const skipResult = skipSong(interaction.guildId!);

  if (skipResult.shouldStop) {
    stopPlayback(interaction.guildId!);
    leaveVoiceChannel(interaction.guildId!);

    await interaction.followUp({
      content: 'Queue finished!',
      ephemeral: true,
    });
  } else if (skipResult.nextSong) {
    await playSong(interaction.guildId!);

    const embed = createNowPlayingEmbed(skipResult.nextSong, queue);
    const buttons = createNowPlayingButtons(!queue.playing, queue.loop);

    await interaction.editReply({
      embeds: [embed],
      components: buttons,
    });
  }
}

/**
 * Handles stop button
 */
async function handleStop(interaction: ButtonInteraction, _queue: any): Promise<void> {
  stopPlayback(interaction.guildId!);
  leaveVoiceChannel(interaction.guildId!);

  await interaction.followUp({
    content: 'Stopped playback and left the voice channel.',
    ephemeral: true,
  });
}

/**
 * Handles loop button
 */
async function handleLoop(interaction: ButtonInteraction, queue: any): Promise<void> {
  // Cycle through loop modes
  let newMode: 'off' | 'song' | 'queue';

  if (queue.loop === 'off') {
    newMode = 'song';
  } else if (queue.loop === 'song') {
    newMode = 'queue';
  } else {
    newMode = 'off';
  }

  setLoop(interaction.guildId!, newMode);

  // Update embed
  const currentSong = queue.songs[queue.currentIndex];
  const embed = createNowPlayingEmbed(currentSong, queue);
  const buttons = createNowPlayingButtons(!queue.playing, newMode);

  await interaction.editReply({
    embeds: [embed],
    components: buttons,
  });
}

/**
 * Handles shuffle button
 */
async function handleShuffle(interaction: ButtonInteraction, _queue: any): Promise<void> {
  shuffleQueue(interaction.guildId!);

  await interaction.followUp({
    content: 'Queue shuffled!',
    ephemeral: true,
  });
}

/**
 * Handles volume up button
 */
async function handleVolumeUp(interaction: ButtonInteraction, queue: any): Promise<void> {
  const newVolume = Math.min(queue.volume + 10, 200);
  setVolume(interaction.guildId!, newVolume);

  await interaction.followUp({
    content: `Volume set to ${newVolume}%`,
    ephemeral: true,
  });
}

/**
 * Handles volume down button
 */
async function handleVolumeDown(interaction: ButtonInteraction, queue: any): Promise<void> {
  const newVolume = Math.max(queue.volume - 10, 0);
  setVolume(interaction.guildId!, newVolume);

  await interaction.followUp({
    content: `Volume set to ${newVolume}%`,
    ephemeral: true,
  });
}
