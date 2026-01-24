# Thankan Chettan Music Bot

<p align="center">
  <img src="public/assets/img/bot_icon.svg" alt="Thankan Chettan Bot" width="200"/>
</p>

<p align="center">
  <strong>Ividuthe Niyamam Thankan Chettan Aanu</strong><br/>
  A production-grade, personality-filled Discord music bot built with TypeScript.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Online-success" alt="Status"/>
  <img src="https://img.shields.io/badge/Version-1.0.0-blue" alt="Version"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License"/>
</p>

---

## Features

- **Robust Playback**: Powered by `yt-dlp` for reliable streaming from YouTube (Videos, Playlists, Mixes).
- **Unique Persona**: Responds in "Manglish" with the rough, authoritative tone of Thankan Chettan (inspired by the movie *Churuli*).
- **Interactive Controls**:
  - **Buttons**: Play/Pause, Next, Previous, Stop, and Show Queue directly on the player.
  - **Advanced Controls**: Seek Backward (10s), Seek Forward (10s), Loop, and Shuffle via the secondary button row.
  - **Animated Progress**: The "Now Playing" message updates in real-time (every 5s) to show playback progress.
- **Queue Management**:
  - Pagination support for long queues.
  - Shuffle, Loop (Song/Queue), Move, Remove, and Jump functionality.
- **Enterprise Grade Security**:
  - Rate limiting (DoS protection).
  - Input sanitization (Command injection protection).
  - Secure Headers & Sentry Integration.
- **Status Dashboard**: Built-in web dashboard showing uptime and active sessions.

---

## Commands

### Music Control
| Command | Description |
|---------|-------------|
| `/play <query\|url>` | Play a song or playlist from YouTube |
| `/pause` | Pause the current song |
| `/resume` | Resume playback |
| `/stop` | Stop playback and clear the queue |
| `/leave` | Disconnect the bot from the voice channel |
| `/next` | Play the next song |
| `/previous` | Play the previous song in history |

### Queue Management
| Command | Description |
|---------|-------------|
| `/queue` | Display the current song queue with pagination |
| `/nowplaying` | Show details of the currently playing song |
| `/loop <off\|song\|queue>` | Set the loop mode |
| `/shuffle` | Shuffle the current queue |
| `/clear` | Clear all songs from the queue |
| `/remove <position>` | Remove a specific song |
| `/jump <position>` | Jump to a specific song in the queue |
| `/volume <0-200>` | Adjust the playback volume |

### Utility
| Command | Description |
|---------|-------------|
| `/setup` | Create a dedicated `#music-requests` channel (Admin only) |

### Message Commands
You can also control the bot by typing directly in the music channel:
- Paste a **YouTube URL** or **playlist link** to start playing
- Type a **song name** to search and play

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Language | TypeScript (Node.js 20) |
| Framework | discord.js v14 |
| Audio Engine | @discordjs/voice + libsodium-wrappers |
| Streaming | yt-dlp (subprocess spawning) |
| Metadata | yt-dlp (JSON dump) |
| Deployment | Railway / Docker / Nixpacks |

---

## Installation & Deployment

### Prerequisites
- Node.js >= 20.0.0
- FFmpeg & Python 3 (Required for yt-dlp)

### Railway Deployment (Recommended)

1. Fork this repository
2. Create a new project on [Railway](https://railway.app)
3. Connect your GitHub repo
4. Set the following Environment Variables:
   | Variable | Description | Required |
   |----------|-------------|----------|
   | `DISCORD_TOKEN` | Your Bot Token | Yes |
   | `DISCORD_CLIENT_ID` | Your Bot Application ID | Yes |
   | `YOUTUBE_COOKIES` | Netscape format cookies for age-restricted content | Optional |
5. Deploy! The bot will auto-register slash commands on startup.

### Docker

```bash
# Build the image
docker build -t thankan-chettan .

# Run the container
docker run -d \
  -e DISCORD_TOKEN=your_token \
  -e DISCORD_CLIENT_ID=your_id \
  thankan-chettan
```

### Local Development

```bash
# Clone the repo
git clone https://github.com/kenshiro-17/Discord-Music-Bot.git
cd Discord-Music-Bot

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your tokens

# Start dev server
npm run dev
```

---

## Security

This bot implements several security measures:

| Feature | Description |
|---------|-------------|
| Input Sanitization | Prevents flag injection in yt-dlp |
| Rate Limiting | Throttles text commands to prevent spam |
| Mention Protection | Prevents mass pings (@everyone) in bot responses |
| Non-Root User | Runs as `tc` user in Docker |

---

## Project Structure

```
├── src/
│   ├── commands/       # Slash commands
│   ├── events/         # Discord event handlers
│   ├── handlers/       # Audio, queue, voice managers
│   ├── services/       # YouTube service
│   ├── utils/          # Helpers, embeds, buttons
│   └── index.ts        # Entry point
├── public/             # Static website assets
│   └── assets/img/     # Bot icon
├── Dockerfile          # Production Docker image
└── railway.json        # Railway deployment config
```

---

## License

MIT

---

<p align="center">
  <i>"Nee aara? Joy-o?"</i>
</p>
