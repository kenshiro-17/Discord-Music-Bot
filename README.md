# Thankan Chettan Music Bot 🐘

A production-grade, personality-filled Discord music bot built with TypeScript. Features high-quality audio playback, interactive controls, and a unique "Thankan Chettan" persona (inspired by the movie *Churuli*).

![Status](https://img.shields.io/badge/Status-Online-success) ![Version](https://img.shields.io/badge/Version-1.0.0-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- **🎵 Robust Playback**: Powered by `yt-dlp` for reliable streaming from YouTube (Videos, Playlists, Mixes).
- **🗣️ Unique Persona**: Responds in "Manglish" with the rough, authoritative tone of Thankan Chettan.
- **⏯️ Interactive Controls**:
  - **Buttons**: Play/Pause, Next, Previous, Stop, and Show Queue directly on the player.
  - **Advanced Controls**: Seek Backward (⏪ 10s), Seek Forward (⏩ 10s), Loop, and Shuffle via the secondary button row.
  - **Animated Progress**: The "Now Playing" message updates in real-time (every 5s) to show playback progress.
- **📋 Queue Management**:
  - Pagination support for long queues.
  - Shuffle, Loop (Song/Queue), Move, Remove, and Jump functionality.
- **🛡️ Enterprise Grade Security**:
  - Rate limiting (DoS protection).
  - Input sanitization (Command injection protection).
  - Secure Headers & Sentry Integration.
- **🌐 Status Dashboard**: Built-in web dashboard showing uptime and active sessions.

## 🚀 Commands

### Music Control
- `/play <query|url>`: Play a song or playlist from YouTube.
- `/pause`: Pause the current song.
- `/resume`: Resume playback.
- `/stop`: Stop playback and clear the queue.
- `/leave`: Disconnect the bot from the voice channel.
- `/next` (or `/skip`): Play the next song.
- `/previous`: Play the previous song in history.

### Queue Management
- `/queue` (or `/playlist`): Display the current song queue with pagination.
- `/nowplaying`: Show details of the currently playing song.
- `/loop <off|song|queue>`: Set the loop mode.
- `/shuffle`: Shuffle the current queue.
- `/clear`: Clear all songs from the queue.
- `/remove <position>`: Remove a specific song.
- `/jump <position>`: Jump to a specific song in the queue.
- `/volume <0-200>`: Adjust the playback volume.

### Utility
- `/setup`: Create a dedicated `#music-requests` channel (Admin only).

## 🛠️ Tech Stack

- **Language**: TypeScript (Node.js 20)
- **Framework**: `discord.js` v14
- **Audio Engine**: `@discordjs/voice` + `libsodium-wrappers`
- **Streaming**: `yt-dlp` (subprocess spawning)
- **Metadata**: `yt-dlp` (JSON dump)
- **Deployment**: Optimized for Railway (Docker/Nixpacks)

## 📦 Installation & Deployment

### Prerequisites
- Node.js >= 20.0.0
- FFmpeg & Python 3 (Required for yt-dlp)

### Railway Deployment (Recommended)
1. Fork this repository.
2. Create a new project on [Railway](https://railway.app).
3. Connect your GitHub repo.
4. Set the following Environment Variables:
   - `DISCORD_TOKEN`: Your Bot Token.
   - `DISCORD_CLIENT_ID`: Your Bot Application ID.
   - `YOUTUBE_COOKIES`: (Optional) For age-restricted content.
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
1. Clone the repo:
   ```bash
   git clone https://github.com/yourusername/thankan-chettan-bot.git
   cd thankan-chettan-bot
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup `.env`:
   ```bash
   cp .env.example .env
   # Edit .env with your tokens
   ```
4. Start dev server:
   ```bash
   npm run dev
   ```

## 🔒 Security

This bot implements several security measures:
- **Input Sanitization**: Prevents flag injection in `yt-dlp`.
- **Rate Limiting**: Throttles text commands to prevent spam.
- **Mention Protection**: Prevents mass pings (`@everyone`) in bot responses.
- **Non-Root User**: Runs as `tc` user in Docker.

## 📄 License

MIT
