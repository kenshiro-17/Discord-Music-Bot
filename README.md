# Discord Music Bot

A production-ready Discord music bot built with TypeScript, focusing on high-quality YouTube playback.

## Features

- **YouTube Playback**: Play individual videos or playlists (up to 100 songs).
- **Search**: Search YouTube directly from Discord with interactive results.
- **Playback Controls**: Play, Pause, Resume, Stop, Skip, Jump, Remove.
- **Queue Management**: Shuffle, Clear, Loop (Song/Queue), Volume Control.
- **Interactive UI**: Rich embeds and buttons for easy control.
- **Robust**: Auto-reconnection, error handling, and containerized deployment.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- FFmpeg (included via `ffmpeg-static`)
- Discord Bot Token

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
   Edit `.env` and set:
   - `DISCORD_TOKEN`: Your bot token
   - `DISCORD_CLIENT_ID`: Your application ID

4. **Deploy Commands** (Required once)
   ```bash
   npm run deploy:commands
   ```

5. **Start the bot**
   ```bash
   npm run build
   npm start
   ```

## Development

- **Run in dev mode**: `npm run dev`
- **Lint**: `npm run lint` (if configured)
- **Test**: `npm test`

## Deployment

### Railway
This bot is optimized for Railway deployment.
1. Connect your GitHub repository to Railway.
2. Set `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` in Railway Variables.
3. During the first deploy, change the Start Command to `npm run deploy:commands && npm start` to register slash commands.
4. Thereafter, revert to `npm start`.

See `RAILWAY_DEPLOYMENT.md` for a detailed guide.

### Docker
```bash
docker build -t music-bot .
docker run -d --env-file .env music-bot
```

## Commands

- `/play <query|url>`: Play a song or search YouTube.
- `/pause`: Pause playback.
- `/resume`: Resume playback.
- `/stop`: Stop and clear queue.
- `/skip`: Skip current song.
- `/queue`: View current queue.
- `/nowplaying`: View current song details.
- `/loop <off|song|queue>`: Change loop mode.
- `/volume <0-200>`: Adjust volume.
- `/shuffle`: Shuffle the queue.
- `/clear`: Clear the queue.
