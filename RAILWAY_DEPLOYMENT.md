# 🚂 Railway Deployment Guide

## Quick Deploy to Railway

Your Discord music bot is fully configured for Railway deployment!

---

## Prerequisites

1. **Railway Account:** Sign up at https://railway.app
2. **GitHub Repository:** Your code is already on GitHub
3. **Discord Bot Token:** From Discord Developer Portal
4. **YouTube Cookies:** Exported from your browser

---

## Deployment Steps

### 1. Create New Project on Railway

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your repository: `kenshiro-17/Discord-Music-Bot`
4. Railway will automatically detect it's a Node.js project

### 2. Configure Environment Variables

In Railway project settings, add these environment variables:

#### Required Variables:
```bash
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
```

#### YouTube Cookies (Critical for 403 fix):
```bash
YOUTUBE_COOKIES="# Netscape HTTP Cookie File
.youtube.com	TRUE	/	TRUE	1800685732	__Secure-1PSIDTS	sidts-...
[paste your full cookies here]"
```

#### Optional Configuration:
```bash
NODE_ENV=production
LOG_LEVEL=info
DEFAULT_VOLUME=50
MAX_QUEUE_SIZE=100
INACTIVITY_TIMEOUT=300
MAX_FILE_SIZE=25
```

### 3. Deploy

Railway will automatically:
- ✅ Install Node.js 20
- ✅ Install FFmpeg
- ✅ Run `npm ci`
- ✅ Build TypeScript (`npm run build`)
- ✅ Start bot (`node dist/index.js`)

**Deployment takes 2-3 minutes.**

### 4. Verify Deployment

Check the Railway logs for:
```
✅ Starting TC Discord Music Bot
✅ YouTube cookies loaded successfully
✅ YTDL agent initialized successfully with cookies
✅ Bot logged in as TC#2447
✅ Bot is ready!
```

### 5. Test Your Bot

In Discord:
```
/play never gonna give you up
```

**If it plays - you're live! 🎉**

---

## Railway Configuration Files

Your project includes these Railway-specific files:

### `nixpacks.toml`
Tells Railway to install Node.js 20 and FFmpeg:
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "ffmpeg"]
```

### `railway.json`
Configures build and deployment:
```json
{
  "build": {
    "buildCommand": "npm ci && npm run build"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "healthcheckPath": "/health"
  }
}
```

### `.railwayignore`
Excludes unnecessary files from deployment (speeds up builds)

---

## Health Check

Railway will monitor your bot via the health check endpoint.

**Endpoint:** `http://your-app.railway.app/health`

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "memory": {
    "percentage": 85.2
  },
  "activeQueues": 2
}
```

---

## Environment Variable Details

### Critical Variables

#### DISCORD_TOKEN
Your bot's authentication token.
- Get from: https://discord.com/developers/applications
- Format: `MTQ2NDQ5MTg3NTkxNzYyNzYwNg.GIWy-t...`

#### DISCORD_CLIENT_ID
Your bot's client ID.
- Get from: Same Discord Developer Portal
- Format: `1464491875917627606`

#### YOUTUBE_COOKIES
**MOST IMPORTANT for 403 fix!**
- Export using "Get cookies.txt LOCALLY" browser extension
- Must include ALL cookies from youtube.com
- Format: Netscape cookie format (tab-separated)

**Example:**
```bash
YOUTUBE_COOKIES="# Netscape HTTP Cookie File
# https://curl.haxx.se/rfc/cookie_spec.html
# This is a generated file! Do not edit.

.youtube.com	TRUE	/	TRUE	1800685732	__Secure-1PSIDTS	sidts-CjUB7I...
.youtube.com	TRUE	/	FALSE	1803723522	HSID	A4pyA25DVlH1bOmmW
.youtube.com	TRUE	/	TRUE	1803723522	SSID	AcLWhHUaJEYMlrHH_
... [all your cookies]"
```

### Optional Variables

These have defaults but can be customized:

```bash
NODE_ENV=production              # Environment (production recommended)
LOG_LEVEL=info                   # Logging level (error/warn/info/debug)
DEFAULT_VOLUME=50                # Default playback volume (1-100)
MAX_QUEUE_SIZE=100              # Maximum songs in queue
INACTIVITY_TIMEOUT=300          # Seconds before auto-disconnect
MAX_FILE_SIZE=25                # Max file upload size (MB)
SENTRY_DSN=                     # Error tracking (optional)
```

---

## Railway-Specific Features

### Automatic Restarts
Railway automatically restarts your bot if it crashes:
- Max retries: 10
- Restart policy: ON_FAILURE

### Automatic Builds
Every push to GitHub triggers a new deployment:
1. You push code to GitHub
2. Railway detects the change
3. Automatic build starts
4. Bot redeploys with new code

### Logs
View real-time logs in Railway dashboard:
- Click your project
- Go to "Deployments" tab
- Click "View Logs"

### Metrics
Monitor your bot:
- CPU usage
- Memory usage
- Network traffic
- Uptime

---

## Troubleshooting

### Deployment Fails

**Check build logs for errors:**

#### "Module not found"
- Ensure `npm ci` ran successfully
- Check `package.json` dependencies

#### "Cannot find module 'dist/index.js'"
- Build step might have failed
- Check TypeScript compilation: `npm run build`

#### "EADDRINUSE: address already in use"
- Should not happen on Railway (they assign dynamic ports)
- If it does, Railway handles PORT env variable automatically

### Bot Deploys But Doesn't Work

#### "Invalid token" error
- Check `DISCORD_TOKEN` is correct in Railway environment variables
- Token should start with `MTQ...` or similar

#### 403 Errors on YouTube
- `YOUTUBE_COOKIES` not set or invalid
- Re-export cookies and update Railway env variable
- Make sure cookies are wrapped in quotes

#### Bot offline in Discord
- Check Railway logs for crash errors
- Verify Discord token is valid
- Check bot has proper intents enabled

### Commands Not Working

#### "Unknown interaction" error
Deploy slash commands:
1. Add temporary environment variable: `DEPLOY_COMMANDS=true`
2. Run deploy script locally: `npm run deploy:commands`
3. Or create a one-off Railway job to deploy commands

#### Bot doesn't respond
- Check bot has necessary Discord permissions
- Verify bot is in your Discord server
- Check Railway logs for errors

---

## Cost & Resources

### Railway Free Tier
- $5 free credits per month
- Should be enough for small-medium bots
- Automatically sleeps when inactive (NOT good for Discord bots)

### Hobby Plan (Recommended)
- $5/month for always-on services
- No sleep mode
- Better for Discord bots

### Resource Usage
Your bot typically uses:
- **Memory:** ~100-200 MB
- **CPU:** Very low (spikes during playback)
- **Network:** Moderate (depends on usage)

---

## Updates & Maintenance

### Update Bot Code
1. Make changes locally
2. Commit to GitHub: `git push`
3. Railway auto-deploys new version

### Update Dependencies
1. Run locally: `npm update`
2. Commit `package-lock.json`
3. Push to GitHub
4. Railway rebuilds with new dependencies

### Refresh YouTube Cookies
1. Export fresh cookies from browser
2. Update `YOUTUBE_COOKIES` in Railway dashboard
3. Restart deployment (Railway will auto-restart)

### View Logs
Railway dashboard → Your project → Deployments → View Logs

---

## Security Best Practices

### Never Commit Secrets
✅ DO:
- Use Railway environment variables
- Keep `.env` in `.gitignore`
- Use `.env.example` for templates

❌ DON'T:
- Commit `.env` to GitHub
- Share Discord token publicly
- Share YouTube cookies publicly

### Rotate Secrets Regularly
- Regenerate Discord token periodically
- Refresh YouTube cookies monthly
- Monitor for unauthorized access

---

## Advanced Configuration

### Custom Domains
1. Railway Settings → Networking
2. Add custom domain
3. Update DNS records
4. Access bot health check at `https://yourdomain.com/health`

### Database (Optional)
Add PostgreSQL or MongoDB:
1. Railway dashboard → "New" → Database
2. Railway auto-sets DATABASE_URL
3. Update bot code to use database

### Monitoring (Sentry)
1. Sign up at https://sentry.io
2. Get DSN
3. Set `SENTRY_DSN` in Railway env variables
4. Bot automatically reports errors

---

## Deployment Checklist

Before deploying, verify:

- [ ] Code pushed to GitHub
- [ ] `DISCORD_TOKEN` ready
- [ ] `DISCORD_CLIENT_ID` ready
- [ ] YouTube cookies exported
- [ ] Railway account created
- [ ] Project connected to GitHub
- [ ] Environment variables configured
- [ ] Slash commands deployed
- [ ] Bot invited to Discord server

After deployment:

- [ ] Check Railway logs for success
- [ ] Verify bot is online in Discord
- [ ] Test `/play` command
- [ ] Monitor health check endpoint
- [ ] Check for 403 errors in logs

---

## Quick Deploy Command Summary

```bash
# 1. Ensure code is up to date
git add .
git commit -m "Prepare for Railway deployment"
git push origin master

# 2. Deploy slash commands (do this once)
npm run deploy:commands

# 3. Railway handles the rest!
# Just configure environment variables in Railway dashboard
```

---

## Support & Resources

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Bot Setup Guide:** `SETUP_COMPLETE.md`
- **Cookie Setup:** `YOUTUBE_COOKIES_SETUP.md`
- **GitHub Repo:** https://github.com/kenshiro-17/Discord-Music-Bot

---

## What Railway Does Automatically

✅ Install Node.js 20
✅ Install FFmpeg (via nixpacks.toml)
✅ Install dependencies (`npm ci`)
✅ Build TypeScript (`npm run build`)
✅ Start bot (`node dist/index.js`)
✅ Handle PORT environment variable
✅ Restart on crashes
✅ Redeploy on GitHub pushes
✅ Health check monitoring
✅ HTTPS endpoint
✅ Logging

---

**Your bot is 100% ready for Railway! 🚂**

Just set the environment variables and click deploy!
