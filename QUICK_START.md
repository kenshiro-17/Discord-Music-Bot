# 🚀 Quick Start Guide

## Your Bot is READY! ✅

**Status:** Running and operational
**Uptime:** Active since startup
**YouTube 403 Errors:** FIXED

---

## 1. Test Your Bot Now

Open Discord and join a voice channel, then try:

```
/play never gonna give you up
```

Or with a direct URL:
```
/play https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

### All Available Commands:

**Playback:**
- `/play <song name or URL>` - Play a song or add to queue
- `/pause` - Pause the current song
- `/resume` - Resume playback
- `/skip` - Skip to the next song
- `/stop` - Stop playback and clear queue
- `/jump <position>` - Jump to a specific song in queue

**Queue Management:**
- `/queue` - Show the current queue
- `/clear` - Clear the entire queue
- `/remove <position>` - Remove a song from queue
- `/shuffle` - Shuffle the queue
- `/loop` - Toggle loop mode (off/song/queue)

**Information:**
- `/nowplaying` - Show currently playing song
- `/volume <1-100>` - Adjust volume

---

## 2. Managing Your Bot

### Start the Bot
```bash
npm start
```

### Stop the Bot
Press `Ctrl+C` in the terminal

### Restart the Bot
```bash
# Stop with Ctrl+C, then:
npm start
```

### Check Bot Status
```bash
curl http://localhost:8081/health
```

---

## 3. Running in Background (Production)

### Option A: PM2 (Recommended)
```bash
# Start with PM2
npm run pm2:start

# View logs
pm2 logs tc-discord-bot

# Stop
pm2 stop tc-discord-bot

# Restart
pm2 restart tc-discord-bot
```

### Option B: Docker
```bash
# Build and run
npm run docker:build
npm run docker:run

# View logs
docker logs -f lyra-bot

# Stop
docker-compose down
```

---

## 4. Monitoring

### View Logs
```bash
# Real-time logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log

# Last 100 lines
tail -100 logs/combined.log
```

### Health Check Endpoint
```bash
# Check bot health
curl http://localhost:8081/health

# Response:
{
  "status": "healthy",
  "uptime": 221,
  "memory": { "percentage": 92.3 },
  "activeQueues": 0
}
```

---

## 5. Common Operations

### Update Dependencies
```bash
npm update
npm run build
npm start
```

### Refresh YouTube Cookies (When 403 errors return)
1. Export fresh cookies using browser extension
2. Update `.env` file (line 24)
3. Restart bot

### Change Configuration
Edit `.env` file:
```bash
DEFAULT_VOLUME=50          # Change default volume
MAX_QUEUE_SIZE=100         # Max songs in queue
INACTIVITY_TIMEOUT=300     # Seconds before auto-disconnect
HEALTH_CHECK_PORT=8081     # Health check port
```

Then restart the bot.

---

## 6. Troubleshooting

### Bot Not Responding to Commands?
1. Check bot is online in Discord
2. Verify commands are deployed: `npm run deploy:commands`
3. Check bot has proper permissions in Discord server

### Music Won't Play?
1. Check FFmpeg is installed: `ffmpeg -version`
2. Verify you're in a voice channel
3. Check bot has permission to join voice channels
4. Look for errors in logs: `tail -f logs/error.log`

### 403 Errors Returned?
Cookies expired! Follow `YOUTUBE_COOKIES_SETUP.md` to re-export fresh cookies.

### Port 8081 Already in Use?
Change `HEALTH_CHECK_PORT` in `.env` to another port (e.g., 8082)

---

## 7. Project Structure

```
Discord Music Bot/
├── src/                      # TypeScript source code
│   ├── commands/music/       # Music commands
│   ├── handlers/             # Audio, queue, voice handlers
│   ├── services/             # YouTube service
│   └── utils/                # Helpers, logger, etc.
├── dist/                     # Compiled JavaScript
├── logs/                     # Bot logs
├── .env                      # YOUR CONFIGURATION (keep private!)
├── package.json              # Dependencies
└── SETUP_COMPLETE.md         # Full documentation
```

---

## 8. Useful Commands

### Development
```bash
npm run dev              # Run with hot reload
npm run build            # Compile TypeScript
npm test                 # Run tests
npm run lint             # Check code style
```

### Production
```bash
npm start                # Start bot
npm run pm2:start        # Start with PM2
npm run docker:run       # Start with Docker
```

### Git
```bash
git status               # Check changes
git pull                 # Update from GitHub
git log --oneline -5     # View recent commits
```

---

## 9. Performance Tips

1. **Use PM2 or Docker** for production (auto-restart on crashes)
2. **Monitor memory usage** via health endpoint
3. **Rotate logs** to prevent disk space issues
4. **Update dependencies** monthly for security patches
5. **Refresh cookies** when 403 errors appear

---

## 10. Next Steps

### Immediate:
- ✅ Test `/play` command in Discord
- ✅ Try different music commands
- ✅ Monitor logs for any issues

### Soon:
- Set up PM2 for background running
- Configure Sentry for error tracking (optional)
- Consider dedicated YouTube account for bot

### Future:
- Deploy to cloud (AWS, DigitalOcean, etc.)
- Set up automatic cookie refresh
- Add custom features/commands

---

## Support & Documentation

- **Quick Reference:** `get-cookies-instructions.txt`
- **Cookie Setup:** `YOUTUBE_COOKIES_SETUP.md`
- **Full Setup:** `SETUP_COMPLETE.md`
- **GitHub:** https://github.com/kenshiro-17/Discord-Music-Bot

---

## Key Files to Remember

- **`.env`** - Your configuration (NEVER commit to Git!)
- **`logs/`** - Check here for errors
- **`YOUTUBE_COOKIES_SETUP.md`** - When cookies expire

---

**Your bot is ready to rock! 🎵**

Test it now with `/play` in Discord!
