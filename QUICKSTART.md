# Quick Start Guide

Get your TC Discord Music Bot up and running in 5 minutes!

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- A Discord account
- 5-10 minutes of your time

## Step 1: Create Discord Bot (2 minutes)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** and name it "TC"
3. Go to **"Bot"** section → Click **"Add Bot"**
4. Under the bot's username, click **"Reset Token"** and copy it (you'll need this!)
5. Go to **"OAuth2"** → **"General"**
   - Copy the **Application ID** (you'll need this too!)
6. Go to **"OAuth2"** → **"URL Generator"**
   - Select scopes: `bot` and `applications.commands`
   - Select permissions: `Connect`, `Speak`, `Send Messages`, `Embed Links`, `Attach Files`
7. Copy the generated URL and open it in your browser
8. Select your server and authorize the bot

## Step 2: Setup Project (1 minute)

```bash
# Navigate to project directory
cd "Discord Music Bot"

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

## Step 3: Configure Bot (1 minute)

Edit `.env` file and add your credentials:

```env
DISCORD_TOKEN=paste_your_bot_token_here
DISCORD_CLIENT_ID=paste_your_application_id_here
```

Save the file.

## Step 4: Deploy Commands (30 seconds)

```bash
npm run deploy:commands
```

You should see: "Deployed commands globally" (this may take up to an hour to propagate globally, but usually takes a few minutes)

**For faster testing**, deploy to your specific server:

```bash
npx ts-node src/scripts/deployCommands.ts YOUR_SERVER_ID
```

To get your server ID:
1. Enable Developer Mode in Discord (Settings → Advanced → Developer Mode)
2. Right-click your server → Copy ID

## Step 5: Start the Bot (30 seconds)

```bash
npm run dev
```

You should see:

```
[INFO] Starting TC Discord Music Bot
[INFO] Bot logged in as YourBot#1234
[INFO] Serving 1 guild(s)
[INFO] Bot is ready!
```

## Step 6: Test It! (1 minute)

In your Discord server:

1. Join a voice channel
2. Type `/play never gonna give you up`
3. Select a song from the search results
4. Enjoy the music! 🎵

## Common Commands

```
/play <song name>        - Search and play a song
/play <youtube url>      - Play from YouTube
/pause                   - Pause playback
/resume                  - Resume playback
/skip                    - Skip current song
/queue                   - View song queue
/stop                    - Stop and disconnect
/volume <0-200>          - Set volume
/loop <off|song|queue>   - Set loop mode
```

## Troubleshooting

### Bot doesn't show up in Discord

- Make sure you invited it using the OAuth2 URL
- Check if the bot token is correct in `.env`
- Restart Discord

### Commands don't appear

- Wait a few minutes (commands can take time to register)
- Try deploying to your specific server (faster)
- Make sure you ran `npm run deploy:commands`

### Bot doesn't join voice channel

- Check if you're in a voice channel
- Verify bot has "Connect" and "Speak" permissions
- Check console for error messages

### "Module not found" error

- Run `npm install` again
- Delete `node_modules` folder and run `npm install`

### Music doesn't play

- Check your internet connection
- Try a different song/URL
- Check console logs for errors
- Make sure FFmpeg is available (it's included via ffmpeg-static)

## Optional: Spotify Support

To enable Spotify integration:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy Client ID and Client Secret
4. Add to `.env`:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```
5. Restart the bot

Now you can use Spotify URLs!

```
/play https://open.spotify.com/track/...
/play https://open.spotify.com/playlist/...
```

## Next Steps

- Read [README.md](./README.md) for full feature list
- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Read [TESTING.md](./TESTING.md) for testing guide
- Customize the bot to your liking!

## Production Deployment

For 24/7 uptime, see [DEPLOYMENT.md](./DEPLOYMENT.md) for:

- Docker deployment
- VPS hosting with PM2
- Monitoring and health checks
- Error tracking with Sentry

## Need Help?

- Check the logs in `logs/` directory
- Read the full [README.md](./README.md)
- Open an issue on GitHub

## Support the Project

If you find this bot useful, please:

- ⭐ Star the repository
- 🐛 Report bugs
- 💡 Suggest features
- 🤝 Contribute code

---

**That's it!** You now have a fully functional Discord music bot. Enjoy! 🎉
