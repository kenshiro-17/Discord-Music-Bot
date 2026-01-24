# TC - Discord Music Bot

A production-ready Discord music bot built with TypeScript, supporting YouTube, Spotify, and file uploads with an interactive UI.

## Features

- **Multiple Music Sources**
  - YouTube videos and playlists
  - Spotify tracks, playlists, and albums
  - Direct audio file uploads (mp3, wav, flac, ogg, m4a)

- **Advanced Playback Controls**
  - Queue management (add, remove, skip, jump, shuffle, clear)
  - Loop modes (off, song, queue)
  - Volume control (0-200%)
  - Pause/Resume functionality

- **Interactive UI**
  - Rich embeds with song information
  - Interactive buttons for playback control
  - Search result selection menus
  - Paginated queue display

- **Production Ready**
  - Comprehensive error handling
  - Structured logging with Winston
  - Error tracking with Sentry
  - Docker support
  - PM2 process management
  - Health check endpoint
  - Auto-reconnection on voice disconnects

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- FFmpeg (included via ffmpeg-static)
- Discord Bot Token
- (Optional) Spotify API Credentials
- (Optional) Sentry DSN for error tracking

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Discord\ Music\ Bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your credentials:
   - `DISCORD_TOKEN` - Your Discord bot token
   - `DISCORD_CLIENT_ID` - Your Discord application client ID
   - (Optional) Spotify and Sentry credentials

4. **Deploy slash commands**
   ```bash
   npm run deploy:commands
   ```

5. **Start the bot**

   Development mode:
   ```bash
   npm run dev
   ```

   Production mode:
   ```bash
   npm run build
   npm start
   ```

## Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a New Application
3. Go to the "Bot" section and click "Add Bot"
4. Copy the token and add it to `.env` as `DISCORD_TOKEN`
5. Copy the Application ID and add it to `.env` as `DISCORD_CLIENT_ID`
6. Enable the following Privileged Gateway Intents:
   - Server Members Intent (optional)
   - Message Content Intent (optional)
7. Go to OAuth2 → URL Generator
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions:
     - Connect
     - Speak
     - Send Messages
     - Embed Links
     - Attach Files
     - Use Slash Commands
8. Use the generated URL to invite the bot to your server

## Commands

### Music Playback
- `/play <query|url>` - Play a song from YouTube/Spotify or search
- `/play file:<attachment>` - Play an uploaded audio file
- `/pause` - Pause the current song
- `/resume` - Resume playback
- `/stop` - Stop playback and clear the queue
- `/skip` - Skip to the next song

### Queue Management
- `/queue` - Display the current queue
- `/nowplaying` - Show currently playing song with controls
- `/remove <position>` - Remove a song from the queue
- `/jump <position>` - Jump to a specific song in the queue
- `/clear` - Clear the entire queue
- `/shuffle` - Shuffle the queue

### Playback Settings
- `/volume <0-200>` - Set the volume
- `/loop <off|song|queue>` - Set loop mode

## Docker Deployment

1. **Build the Docker image**
   ```bash
   npm run docker:build
   ```

2. **Run with Docker Compose**
   ```bash
   npm run docker:run
   ```

3. **Check logs**
   ```bash
   docker-compose logs -f
   ```

4. **Stop the bot**
   ```bash
   docker-compose down
   ```

## PM2 Deployment

1. **Start with PM2**
   ```bash
   npm run pm2:start
   ```

2. **Monitor**
   ```bash
   pm2 monit
   ```

3. **View logs**
   ```bash
   pm2 logs lyra-bot
   ```

4. **Restart**
   ```bash
   pm2 restart lyra-bot
   ```

## Project Structure

```
src/
├── commands/        # Slash command implementations
│   └── music/      # Music-related commands
├── config/         # Configuration files
├── events/         # Discord event handlers
├── handlers/       # Core handlers (queue, audio, voice, etc.)
├── services/       # External service integrations (YouTube, Spotify)
├── types/          # TypeScript type definitions
├── utils/          # Utility functions (logger, validators, etc.)
└── index.ts        # Application entry point
```

## Configuration

All configuration is done through environment variables in the `.env` file:

- `DISCORD_TOKEN` - Discord bot token (required)
- `DISCORD_CLIENT_ID` - Discord application ID (required)
- `SPOTIFY_CLIENT_ID` - Spotify API client ID (optional)
- `SPOTIFY_CLIENT_SECRET` - Spotify API secret (optional)
- `SENTRY_DSN` - Sentry error tracking DSN (optional)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (error/warn/info/debug)
- `DEFAULT_VOLUME` - Default volume percentage (0-200)
- `MAX_QUEUE_SIZE` - Maximum songs in queue
- `INACTIVITY_TIMEOUT` - Seconds before auto-disconnect
- `MAX_FILE_SIZE` - Max file upload size in MB

## Testing

Run unit tests:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

Run integration tests:
```bash
npm run test:integration
```

Watch mode:
```bash
npm run test:watch
```

## Troubleshooting

### Bot doesn't respond to commands
- Ensure slash commands are deployed: `npm run deploy:commands`
- Check bot has proper permissions in the server
- Verify bot token is correct in `.env`

### Voice connection issues
- Ensure bot has "Connect" and "Speak" permissions
- Check voice channel isn't full
- Verify FFmpeg is installed or ffmpeg-static is in dependencies

### YouTube playback fails
- May be rate limited - wait a few minutes
- Check if video is age-restricted or region-locked
- Verify internet connection

### Spotify integration not working
- Verify Spotify credentials in `.env`
- Check Spotify app is active in developer dashboard
- Ensure credentials have proper scopes

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
