const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Check for token
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('Error: DISCORD_TOKEN is not defined in .env file.');
  process.exit(1);
}

// Path to icon
const iconPath = path.resolve(__dirname, '../../public/assets/img/bot_icon.png');

if (!fs.existsSync(iconPath)) {
  console.error(`Error: Icon file not found at ${iconPath}`);
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log('Attempting to update avatar...');

  try {
    await client.user.setAvatar(iconPath);
    console.log('✅ Successfully updated bot avatar!');
  } catch (error) {
    console.error('❌ Failed to update avatar:', error);
    if (error.code === 50035) {
      console.error('Note: You might be changing the avatar too frequently. Discord has a rate limit on profile updates.');
    }
  }

  console.log('Logging out...');
  client.destroy();
  process.exit(0);
});

client.login(token);
