# Setup Checklist for TC Discord Bot

Before deploying your bot to the public, follow this checklist:

## 1. Update Bot Name in Discord Developer Portal

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to **General Information**
4. Change the **Name** to "TC" or "TC Music Bot"
5. Update the **Description**:
   ```
   TC is a feature-rich music bot supporting YouTube, Spotify, and file uploads.
   High-quality audio, interactive controls, and 24/7 uptime!
   ```
6. Upload a bot **icon** (512x512 recommended)
7. **Save Changes**

## 2. Update Website Links

In the following files, replace placeholder links with your actual links:

### `public/index.html`

Find and replace these placeholders:
- `YOUR_INVITE_LINK_HERE` → Your actual Discord bot invite link
- `YOUR_SUPPORT_SERVER_LINK` → Your support Discord server invite
- `YOUR_GITHUB_LINK` → https://github.com/yourusername/tc-discord-bot
- `YOUR_GITHUB_ISSUES_LINK` → https://github.com/yourusername/tc-discord-bot/issues
- `YOUR_TWITTER_LINK` → Your Twitter/X profile (optional)

### `public/terms.html`

Find and replace:
- `[Your Jurisdiction]` → Your country/state
- `[Your Support Server Link]` → Your support server
- `[Your Email]` → Your contact email
- `[Your GitHub Link]` → Your GitHub repo

### `public/privacy.html`

Find and replace:
- `[Your Support Server Link]` → Your support server
- `[Your Email]` → Your contact email
- `[Your GitHub Link]` → Your GitHub repo

## 3. Generate Discord Invite Link

1. Go to **OAuth2** → **URL Generator** in Developer Portal
2. Select scopes: `bot` and `applications.commands`
3. Select permissions:
   - Connect
   - Speak
   - Send Messages
   - Embed Links
   - Attach Files
   - Read Message History
   - Use Voice Activity
4. Copy the generated URL
5. Replace `YOUR_INVITE_LINK_HERE` in `public/index.html`

Example link structure:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=36700160&scope=bot%20applications.commands
```

## 4. Host the Website

Choose a hosting option:

### Option A: GitHub Pages (Free)
1. Push your code to GitHub
2. Go to repository **Settings** → **Pages**
3. Select source: `main` branch, `/public` folder
4. Your site will be at: `https://yourusername.github.io/tc-discord-bot/`

### Option B: Netlify (Free)
1. Go to [Netlify](https://netlify.com)
2. Connect your GitHub repository
3. Set publish directory to `public`
4. Deploy
5. Get your site URL: `https://yoursite.netlify.app`

### Option C: Vercel (Free)
1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `public`
4. Deploy
5. Get your site URL

## 5. Deploy the Bot

### For Testing (Local)
```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm run deploy:commands
npm run dev
```

### For Production (Docker)
```bash
# Edit .env with production credentials
docker-compose up -d
```

### For Production (VPS with PM2)
```bash
npm install
npm run build
pm2 start ecosystem.config.js
pm2 save
```

## 6. Update Terms and Privacy URLs

1. After hosting your website, get the URLs for:
   - Terms of Service: `https://yoursite.com/terms.html`
   - Privacy Policy: `https://yoursite.com/privacy.html`

2. Go to Discord Developer Portal → **General Information**
3. Add **Terms of Service URL**
4. Add **Privacy Policy URL**
5. **Save Changes**

## 7. Make Bot Public

1. Go to **Bot** section in Developer Portal
2. Make sure **Public Bot** is **checked**
3. Make sure **Require OAuth2 Code Grant** is **unchecked**
4. **Save Changes**

## 8. Submit to Bot Lists (Optional)

Visit these sites and submit your bot:

1. **Top.gg**
   - Go to [top.gg/dashboard/bots](https://top.gg/dashboard/bots)
   - Click "Add Bot"
   - Fill in information
   - Add your invite link
   - Submit for approval

2. **Discord.bots.gg**
   - Similar process to top.gg

3. **Bots on Discord**
   - [bots.ondiscord.xyz](https://bots.ondiscord.xyz)

## 9. Create Support Server

1. Create a new Discord server
2. Add your bot to it
3. Create channels:
   - `#announcements`
   - `#commands`
   - `#support`
   - `#bug-reports`
4. Get the server invite link
5. Update `YOUR_SUPPORT_SERVER_LINK` in website files

## 10. Final Verification

Before going public, test:

- [ ] Bot responds to `/play` command
- [ ] Music plays from YouTube
- [ ] Music plays from Spotify (if configured)
- [ ] File uploads work
- [ ] All slash commands work
- [ ] Interactive buttons work
- [ ] Website loads correctly
- [ ] Invite link works
- [ ] Terms and Privacy pages load
- [ ] Support server invite works

## 11. Monitoring Setup

Set up monitoring for your production bot:

### Uptime Monitoring
1. Go to [UptimeRobot](https://uptimerobot.com)
2. Create a monitor for your bot's health endpoint
3. URL: `http://your-server:8080/health`
4. Check interval: 5 minutes

### Error Tracking (Optional)
1. Go to [Sentry.io](https://sentry.io)
2. Create a new project (Node.js)
3. Copy the DSN
4. Add to `.env`:
   ```env
   SENTRY_DSN=your_sentry_dsn
   ```

## 12. Post-Launch

After making the bot public:

1. Monitor error logs: `tail -f logs/error-*.log`
2. Check memory usage
3. Respond to support requests
4. Fix bugs quickly
5. Listen to user feedback

## Customization Options

### Change Bot Presence
Edit `src/events/ready.ts`:
```typescript
client.user?.setPresence({
  activities: [{ name: '🎵 /play to start', type: ActivityType.Listening }],
  status: 'online',
});
```

### Change Default Settings
Edit `src/config/config.ts`:
```typescript
defaultVolume: 50,      // Default volume (0-200)
maxQueueSize: 100,      // Max songs in queue
inactivityTimeout: 300, // Seconds before auto-disconnect
maxFileSize: 25,        // Max file upload size in MB
```

### Change Colors
Edit `public/assets/css/style.css`:
```css
:root {
  --primary-color: #5865F2;   /* Main brand color */
  --secondary-color: #EB459E; /* Accent color */
}
```

## Support Resources

- Read [QUICKSTART.md](./QUICKSTART.md) for setup help
- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for hosting options
- Read [PUBLIC_BOT_GUIDE.md](./PUBLIC_BOT_GUIDE.md) for public bot info
- Join [Discord.js Discord](https://discord.gg/djs) for help

---

**Checklist Status:**
- [ ] Bot name updated in Developer Portal
- [ ] Website links updated
- [ ] Invite link generated
- [ ] Website hosted
- [ ] Terms/Privacy URLs added
- [ ] Bot made public
- [ ] Bot deployed to production
- [ ] Monitoring configured
- [ ] Support server created
- [ ] Everything tested

**Once all items are checked, your bot is ready for the public! 🎉**
