# 🎵 How to Use Your Discord Music Bot

## ⚠️ IMPORTANT: Use Slash Commands!

### ✅ CORRECT Way (Use This):
```
/play never gonna give you up
/play https://www.youtube.com/watch?v=dQw4w9WgXcQ
/pause
/resume
/skip
/queue
```

### ❌ WRONG Way (Don't Use):
```
!play song name              ❌ Wrong
play song name               ❌ Wrong
https://youtube.com/...      ❌ Wrong (message commands disabled)
```

---

## Why Slash Commands Only?

Your bot uses TWO libraries:
1. **ytdl-core** - For playback (has cookies ✅ works!)
2. **play-dl** - For searching (cookies cause errors ❌)

Slash commands (`/play`) use ytdl-core directly = **works perfectly**!

Message commands try to use play-dl = fails with cookie errors.

---

## 🔧 Fix Your Local Bot (Currently Broken)

You have an old bot process running on port 8081. Kill it manually:

### Windows:
1. Press `Ctrl+C` in the terminal where bot is running
2. Or Task Manager → Find "node.exe" → End Task
3. Then run: `npm start`

### Check Bot is Running:
```bash
curl http://localhost:8081/health
```

Should show:
```json
{
  "status": "healthy",
  "uptime": 123,
  "memory": { "percentage": 60 }
}
```

---

## 🎮 Test Your Bot

1. **Open Discord**
2. **Join a voice channel**
3. **Type slash command:**
   ```
   /play never gonna give you up
   ```
4. **Bot should:**
   - ✅ Join your voice channel
   - ✅ Start playing music
   - ✅ No errors!

---

## 🚂 Deploy to Railway (CORRECT Way)

### ⛔ DO NOT:
- ❌ Commit cookies to Git
- ❌ Put cookies in any code file
- ❌ Push .env to GitHub

### ✅ DO THIS:

1. **Go to Railway:**
   https://railway.app/new

2. **Connect GitHub:**
   - Click "Deploy from GitHub repo"
   - Select: `kenshiro-17/Discord-Music-Bot`

3. **Add Environment Variables:**
   Click "Variables" tab in Railway, add:

   ```
   DISCORD_TOKEN=your_token_here
   DISCORD_CLIENT_ID=your_client_id_here
   YOUTUBE_COOKIES=your_cookies_here
   NODE_ENV=production
   LOG_LEVEL=info
   ```

4. **Deploy:**
   Railway will automatically build and deploy!

---

## 🍪 About YouTube Cookies

### Where Cookies Go:

**Local Development:**
- ✅ In `.env` file (local only, not in Git)
- `.gitignore` prevents accidental commits

**Railway Production:**
- ✅ In Railway environment variables (encrypted)
- Set in Railway dashboard, never in code

**Git/GitHub:**
- ❌ NEVER commit cookies
- ❌ NEVER push .env file
- ✅ Only .env.example (empty template)

### Security:
Cookies are like **passwords for your YouTube account!**
- Don't share them
- Don't commit them to Git
- Don't post them publicly
- Railway encrypts them automatically

---

## 🔄 When Cookies Expire

Cookies last weeks/months. When they expire:

**Symptoms:**
- 403 errors return
- Songs fail to play
- "Could not parse decipher function" errors

**Fix:**
1. Re-export cookies from YouTube (see `YOUTUBE_COOKIES_SETUP.md`)
2. **For Local:** Update `.env` file
3. **For Railway:** Update environment variable in Railway dashboard
4. Restart bot (Railway auto-restarts)

---

## 📝 Quick Reference

### Start Bot Locally:
```bash
npm start
```

### Stop Bot:
```
Ctrl+C
```

### Check Health:
```bash
curl http://localhost:8081/health
```

### View Logs:
```bash
tail -f logs/combined.log
tail -f logs/error.log
```

### Deploy to Railway:
1. Push code to GitHub: `git push`
2. Railway auto-deploys
3. Check Railway logs for status

---

## ✅ Commands Available

### Playback:
- `/play <song>` - Play or add to queue
- `/pause` - Pause playback
- `/resume` - Resume
- `/skip` - Next song
- `/stop` - Stop and clear queue

### Queue:
- `/queue` - Show queue
- `/clear` - Clear all
- `/remove <position>` - Remove song
- `/shuffle` - Shuffle
- `/loop` - Loop mode
- `/jump <position>` - Jump to song

### Info:
- `/nowplaying` - Current song
- `/volume <1-100>` - Adjust volume

---

## 🐛 Troubleshooting

### Bot not responding to /play:
1. Check bot is online in Discord
2. Verify slash commands deployed: `npm run deploy:commands`
3. Check bot permissions in Discord server

### "Failed to play track":
1. Are you using `/play` (slash command)? ✅
2. Or typing in chat? ❌ (this won't work)
3. Check bot logs for specific error

### Port already in use:
1. Kill old node process
2. Or change `HEALTH_CHECK_PORT` in `.env` to 8082
3. Restart bot

### 403 errors on YouTube:
1. Cookies expired - re-export fresh ones
2. Update `.env` (local) or Railway env vars (production)
3. Restart bot

---

## 📊 What's Working Now

✅ YouTube 403 fix with cookies (for ytdl-core)
✅ Slash commands work perfectly
✅ Voice connection works
✅ Queue management works
✅ All 14 commands available
✅ Railway deployment ready
✅ Health monitoring
✅ Logging

---

## 🎯 Next Steps

1. **Kill old bot process** (port 8081 conflict)
2. **Restart bot:** `npm start`
3. **Test with slash commands:** `/play never gonna give you up`
4. **Deploy to Railway** when ready (5 minutes)
5. **Enjoy your music bot!** 🎉

---

**Remember: Always use `/play` (slash command), never message commands!**
