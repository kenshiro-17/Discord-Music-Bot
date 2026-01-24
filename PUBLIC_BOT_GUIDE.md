# Public Bot Setup Guide

This guide will help you make TC available as a public bot that anyone can add to their Discord server.

## Table of Contents

1. [Make Bot Public in Discord](#make-bot-public-in-discord)
2. [Host the Bot](#host-the-bot)
3. [Create Public Invite Link](#create-public-invite-link)
4. [Create Landing Page](#create-landing-page)
5. [Submit to Bot Lists](#submit-to-bot-lists)
6. [Scaling Considerations](#scaling-considerations)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Make Bot Public in Discord

### 1. Update Bot Settings

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to **Bot** section
4. **Uncheck** "Requires OAuth2 Code Grant" (if checked)
5. Under **Privileged Gateway Intents**:
   - Server Members Intent: OFF (not needed)
   - Presence Intent: OFF (not needed)
   - Message Content Intent: OFF (not needed)
6. **Save Changes**

### 2. Make Application Public

1. Go to **General Information**
2. Scroll to **Public Bot**
3. **Check** "Public Bot"
4. **Uncheck** "Require Code Grant"
5. Add **Description**:
   ```
   TC is a feature-rich music bot supporting YouTube, Spotify, and file uploads.
   High-quality audio, interactive controls, and 24/7 uptime!
   ```
6. Add **Tags**: `music`, `audio`, `youtube`, `spotify`
7. Upload an **icon** (512x512 recommended)
8. Upload a **banner** (optional, 960x540)
9. Add **Terms of Service URL** (we'll create this)
10. Add **Privacy Policy URL** (we'll create this)
11. **Save Changes**

### 3. Generate Public Invite Link

1. Go to **OAuth2** → **URL Generator**
2. Select **Scopes**:
   - `bot`
   - `applications.commands`
3. Select **Bot Permissions**:
   - Connect
   - Speak
   - Send Messages
   - Embed Links
   - Attach Files
   - Read Message History
   - Use Voice Activity
4. Copy the **Generated URL**

Example URL:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=36700160&scope=bot%20applications.commands
```

---

## Host the Bot

### Option 1: Free Hosting (Railway)

Railway offers free tier for small bots:

1. **Sign up**: [railway.app](https://railway.app)
2. **Create New Project** → **Deploy from GitHub**
3. **Connect Repository**: Link your GitHub repo
4. **Add Environment Variables**:
   - `DISCORD_TOKEN`
   - `DISCORD_CLIENT_ID`
   - `SPOTIFY_CLIENT_ID` (optional)
   - `SPOTIFY_CLIENT_SECRET` (optional)
   - `NODE_ENV=production`
5. **Deploy**: Railway auto-deploys from GitHub
6. **Add Build Command**: `npm run build`
7. **Add Start Command**: `node dist/index.js`

**Free Tier Limits**:
- $5 credit/month
- 500 hours execution
- 512MB RAM

### Option 2: Free Hosting (Render)

Render offers free tier:

1. **Sign up**: [render.com](https://render.com)
2. **Create Web Service** → **Connect GitHub**
3. **Configure**:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/index.js`
4. **Add Environment Variables** (same as above)
5. **Deploy**

**Free Tier Limits**:
- Spins down after inactivity
- 750 hours/month
- 512MB RAM

### Option 3: VPS Hosting (Recommended for 24/7)

Best for serious public bots:

**Providers**:
- [DigitalOcean](https://digitalocean.com) - $5/month
- [Linode](https://linode.com) - $5/month
- [Vultr](https://vultr.com) - $5/month
- [Hetzner](https://hetzner.com) - €4/month (cheapest)

**Setup**:
1. Create a Droplet/Instance (Ubuntu 22.04)
2. Follow [DEPLOYMENT.md](./DEPLOYMENT.md) VPS section
3. Use Docker or PM2 for process management
4. Set up auto-restart
5. Configure firewall

**Specs Needed**:
- **1GB RAM minimum** (2GB recommended)
- **1 CPU core**
- **25GB storage**

### Option 4: Oracle Cloud (Free Forever)

Oracle offers always-free tier:

1. **Sign up**: [oracle.com/cloud/free](https://oracle.com/cloud/free)
2. **Create Compute Instance**:
   - Shape: VM.Standard.A1.Flex
   - OCPU: 1-4 (free)
   - RAM: 6-24GB (free)
3. Install Ubuntu and follow VPS setup

**Free Tier**:
- 4 ARM CPUs
- 24GB RAM
- 200GB storage
- Forever free!

---

## Create Public Invite Link

### Standard Invite Link

Use this link for your website/bot listings:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=36700160&scope=bot%20applications.commands
```

Replace `YOUR_CLIENT_ID` with your actual client ID.

### Custom Short Link

Use a URL shortener:

1. **bit.ly** → Create custom short link
2. **rebrandly.com** → Custom domain
3. Example: `bit.ly/invite-lyra-bot`

### Add to Website

We've created a landing page (see `public/index.html`):

```html
<a href="YOUR_INVITE_LINK" class="invite-button">
  Add to Discord
</a>
```

---

## Create Landing Page

We've created a landing page in `public/index.html`. To host it:

### Option 1: GitHub Pages (Free)

1. Create a new branch: `gh-pages`
2. Push `public/` folder to this branch
3. Go to GitHub repo → Settings → Pages
4. Select `gh-pages` branch → `/root`
5. Your site will be at: `https://yourusername.github.io/discord-music-bot`

### Option 2: Netlify (Free)

1. **Sign up**: [netlify.com](https://netlify.com)
2. **New Site from Git** → Connect GitHub
3. **Build Settings**:
   - Build command: (leave empty)
   - Publish directory: `public`
4. **Deploy**
5. Get custom domain or use `yoursite.netlify.app`

### Option 3: Vercel (Free)

1. **Sign up**: [vercel.com](https://vercel.com)
2. **Import Project** → GitHub
3. Configure to serve `public/` directory
4. **Deploy**

### Custom Domain

1. Buy domain from:
   - Namecheap ($1-10/year)
   - Google Domains
   - Cloudflare ($8-10/year)
2. Point to hosting provider
3. Update DNS records

---

## Submit to Bot Lists

Increase visibility by listing your bot:

### Top Discord Bot Lists

1. **Top.gg** (Most Popular)
   - [top.gg](https://top.gg)
   - Submit bot with description
   - Add tags: Music, Utility
   - Add invite link

2. **Discord.bots.gg**
   - [discord.bots.gg](https://discord.bots.gg)
   - Similar to top.gg

3. **Bots on Discord**
   - [bots.ondiscord.xyz](https://bots.ondiscord.xyz)

4. **Discord Bot List**
   - [discordbotlist.com](https://discordbotlist.com)

5. **Discord.me**
   - [discord.me/servers](https://discord.me/servers)

### What to Include in Listings

**Short Description** (max 200 chars):
```
High-quality music bot with YouTube, Spotify, and file support.
Interactive controls, playlists, and 24/7 uptime. Free and easy to use!
```

**Long Description**:
```markdown
# 🎵 TC Music Bot

TC is a feature-rich Discord music bot that brings high-quality audio to your server!

## ✨ Features

- 🎵 **YouTube** - Play videos and playlists
- 🎧 **Spotify** - Full integration for tracks, playlists, and albums
- 📁 **File Uploads** - Support for MP3, WAV, FLAC, OGG, M4A
- 🔍 **Search** - Find songs with interactive selection
- 📋 **Queue Management** - Add, remove, shuffle, and jump
- 🔁 **Loop Modes** - Off, Song, Queue
- 🎛️ **Volume Control** - 0-200% adjustable
- 🎮 **Interactive Controls** - Buttons and embeds
- 🚀 **Fast & Reliable** - 24/7 uptime

## 📝 Commands

- `/play <query>` - Play a song
- `/pause` - Pause playback
- `/skip` - Skip to next song
- `/queue` - View queue
- `/loop` - Set loop mode
- And more!

## 🔗 Links

- [Invite Bot](YOUR_INVITE_LINK)
- [Support Server](YOUR_SUPPORT_SERVER)
- [Website](YOUR_WEBSITE)
- [GitHub](YOUR_GITHUB)

## 🆓 100% Free

No premium features, no paywalls. Enjoy all features for free!
```

**Tags**: `music`, `audio`, `youtube`, `spotify`, `free`, `24/7`, `queue`, `playlists`

**Categories**: Music, Utility

---

## Scaling Considerations

### Server Limits

- **Free hosting**: 10-50 servers max
- **$5 VPS**: 100-500 servers
- **$10 VPS**: 500-1000 servers
- **$20+ VPS**: 1000+ servers

### When to Upgrade

Monitor these metrics:

1. **Memory Usage**
   - If constantly >80%, upgrade RAM
   - 1GB RAM ≈ 50-100 servers
   - 2GB RAM ≈ 200-500 servers

2. **CPU Usage**
   - If constantly >70%, upgrade CPU
   - Multiple cores help with concurrent playback

3. **Network**
   - Monitor bandwidth usage
   - Audio streaming is bandwidth-intensive

### Optimizations

**Config Updates** (`src/config/config.ts`):

```typescript
// For public bot, consider:
maxQueueSize: 50,        // Reduce from 100
inactivityTimeout: 180,  // Reduce from 300 (3 min)
maxFileSize: 10,         // Reduce from 25MB
```

**Rate Limiting**:

Add command cooldowns to prevent abuse:

```typescript
// In command files
const cooldowns = new Map();
const COOLDOWN_SECONDS = 3;

// Check cooldown before executing
const userId = interaction.user.id;
const now = Date.now();
const cooldownAmount = COOLDOWN_SECONDS * 1000;

if (cooldowns.has(userId)) {
  const expirationTime = cooldowns.get(userId) + cooldownAmount;

  if (now < expirationTime) {
    const timeLeft = (expirationTime - now) / 1000;
    return interaction.reply({
      content: `Please wait ${timeLeft.toFixed(1)} seconds before using this command again.`,
      ephemeral: true
    });
  }
}

cooldowns.set(userId, now);
setTimeout(() => cooldowns.delete(userId), cooldownAmount);
```

### Load Balancing

For 1000+ servers, use multiple bot instances:

1. **Sharding** (Discord.js built-in)
2. **Multiple Bots** (different tokens)
3. **Load Balancer** (Nginx/HAProxy)

---

## Monitoring & Maintenance

### Setup Monitoring

**1. Uptime Monitoring**:
- [UptimeRobot](https://uptimerobot.com) - Free
- Ping health endpoint every 5 minutes
- Get alerts if bot goes down

**2. Error Tracking**:
- [Sentry.io](https://sentry.io) - Free tier
- Already integrated in bot
- Set up in `.env`:
  ```env
  SENTRY_DSN=your_sentry_dsn
  ```

**3. Analytics**:
- Track command usage
- Monitor server count
- Track popular songs

### Create Support Server

1. Create a Discord server
2. Add your bot
3. Create channels:
   - `#announcements`
   - `#support`
   - `#bug-reports`
   - `#feature-requests`
4. Add support staff/moderators
5. Share invite link on website

### Maintenance Tasks

**Daily**:
- Check error logs
- Monitor server count
- Respond to support tickets

**Weekly**:
- Update dependencies: `npm update`
- Review analytics
- Fix reported bugs

**Monthly**:
- Update Node.js if needed
- Review and optimize code
- Plan new features

---

## Legal Requirements

### Terms of Service

Create `public/terms.html` (template provided).

Key points:
- Age requirement (13+)
- Acceptable use
- No guarantee of uptime
- Right to terminate service
- No liability for damages

### Privacy Policy

Create `public/privacy.html` (template provided).

Key points:
- What data you collect (Discord IDs, server IDs)
- How data is used (bot functionality only)
- Data retention (temporary queue storage)
- No selling of data
- User rights

### DMCA Compliance

If hosting publicly:
- Add DMCA contact email
- Respond to takedown requests
- Remove infringing content promptly

---

## Growth Tips

### 1. Marketing

- Post in `/r/discordapp` and `/r/discordbots`
- Share in Discord server listings
- Create YouTube tutorial
- Write blog posts
- Share on Twitter/X

### 2. Community Building

- Create Discord support server
- Engage with users
- Listen to feedback
- Add requested features

### 3. SEO

- Optimize website for search
- Use keywords: "discord music bot", "free music bot"
- Create quality content
- Get backlinks from bot lists

### 4. Quality

- Maintain 99%+ uptime
- Fix bugs quickly
- Respond to support requests
- Regular updates

---

## Checklist

Before making bot public:

- [ ] Bot is public in Developer Portal
- [ ] Terms of Service created and linked
- [ ] Privacy Policy created and linked
- [ ] Bot hosted on reliable server
- [ ] Health monitoring set up
- [ ] Error tracking configured (Sentry)
- [ ] Landing page deployed
- [ ] Invite link created and tested
- [ ] Support server created
- [ ] Bot tested with multiple servers
- [ ] Commands deployed globally
- [ ] Documentation updated
- [ ] Submitted to bot lists

---

## Costs Breakdown

### Free Option (Render/Railway)

- **Hosting**: $0 (with limitations)
- **Domain**: $0 (use .netlify.app or .railway.app)
- **Monitoring**: $0 (free tiers)
- **Total**: $0/month

**Limitations**:
- May sleep after inactivity
- Limited servers
- 512MB RAM

### Budget Option ($5-10/month)

- **VPS**: $5/month (DigitalOcean/Vultr)
- **Domain**: $1/month
- **Monitoring**: $0 (free tiers)
- **Total**: $6/month

**Supports**: 100-500 servers

### Professional Option ($20+/month)

- **VPS**: $10-20/month (better specs)
- **Domain**: $1/month
- **CDN**: $5/month (Cloudflare)
- **Premium Sentry**: $26/month (optional)
- **Total**: $15-50/month

**Supports**: 1000+ servers

---

## Support

For questions about making your bot public:

- Read this guide thoroughly
- Check [DEPLOYMENT.md](./DEPLOYMENT.md)
- Join [Discord.js Discord](https://discord.gg/djs)
- Search Discord developer forums

---

**Good luck with your public bot! 🚀**
