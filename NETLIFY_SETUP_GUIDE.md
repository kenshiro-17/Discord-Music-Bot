# Netlify Setup Complete - Next Steps

Your website is now live on Netlify! Follow these steps to complete the setup.

## ✅ What You've Done
- Uploaded `public/` folder to Netlify
- Got your website URL (e.g., `https://yoursite.netlify.app`)

---

## 📝 Step 1: Get Your Discord Bot Invite Link

### 1.1 Go to Discord Developer Portal
1. Visit [Discord Developer Portal](https://discord.com/developers/applications)
2. Click on your bot application (or create one if you haven't)

### 1.2 Get Your Client ID
1. Go to **General Information**
2. Copy your **Application ID** (also called Client ID)
3. Save it somewhere - you'll need it

### 1.3 Generate Invite Link
1. Go to **OAuth2** → **URL Generator**
2. Under **Scopes**, select:
   - ✅ `bot`
   - ✅ `applications.commands`

3. Under **Bot Permissions**, select:
   - ✅ View Channels
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Read Message History
   - ✅ Connect
   - ✅ Speak
   - ✅ Use Voice Activity

4. **Copy the Generated URL** at the bottom
   - It will look like: `https://discord.com/api/oauth2/authorize?client_id=123456789...`
   - **Save this URL** - this is your public bot invite link!

---

## 📝 Step 2: Update Your Website Links

Now you need to re-upload your `public/` folder with updated links. Here's what to change:

### 2.1 Links You Need to Prepare

Before editing files, gather these links:

| What | Where to Get It | Example |
|------|----------------|---------|
| **Bot Invite Link** | From Step 1.3 above | `https://discord.com/api/oauth2/authorize?client_id=...` |
| **Netlify Site URL** | Your Netlify dashboard | `https://tc-bot.netlify.app` |
| **Support Server** | Create a Discord server, then get invite | `https://discord.gg/yourserver` |
| **GitHub Repo** | Your GitHub repository | `https://github.com/yourusername/tc-discord-bot` |

### 2.2 Edit `public/index.html`

Open `public/index.html` in a text editor and find/replace:

**Find:** `YOUR_INVITE_LINK_HERE`
**Replace with:** Your actual Discord bot invite link (from Step 1.3)

**Find:** `YOUR_SUPPORT_SERVER_LINK`
**Replace with:** Your Discord support server invite link

**Find:** `YOUR_GITHUB_LINK`
**Replace with:** Your GitHub repository URL (or remove if you don't have one)

**Find:** `YOUR_GITHUB_ISSUES_LINK`
**Replace with:** `https://github.com/yourusername/tc-discord-bot/issues` (or remove if no GitHub)

**Find:** `YOUR_TWITTER_LINK`
**Replace with:** Your Twitter/X URL (or remove the entire link if you don't have one)

### 2.3 Edit `public/terms.html`

Open `public/terms.html`:

**Find:** `[Your Jurisdiction]`
**Replace with:** Your country/state (e.g., "United States" or "California, USA")

**Find:** `[Your Support Server Link]`
**Replace with:** Your Discord support server invite

**Find:** `[Your Email]`
**Replace with:** Your contact email (e.g., `support@yourdomain.com`)

**Find:** `[Your GitHub Link]`
**Replace with:** Your GitHub repo URL

### 2.4 Edit `public/privacy.html`

Open `public/privacy.html`:

**Find:** `[Your Support Server Link]`
**Replace with:** Your Discord support server invite

**Find:** `[Your Email]`
**Replace with:** Your contact email

**Find:** `[Your GitHub Link]`
**Replace with:** Your GitHub repo URL

### 2.5 Re-upload to Netlify

1. After making all changes, go back to Netlify
2. Go to your site's **Deploys** tab
3. Drag and drop the updated `public/` folder
4. Wait for deployment to complete

---

## 📝 Step 3: Create Support Discord Server

1. In Discord, click the **+** button to create a server
2. Name it "TC Bot Support" or similar
3. Create these channels:
   - `#welcome` - Welcome message and rules
   - `#announcements` - Bot updates
   - `#commands` - List of bot commands
   - `#support` - User questions
   - `#bug-reports` - Report bugs
   - `#suggestions` - Feature requests

4. Add your bot to this server (use the invite link)

5. Create a server invite:
   - Right-click your server icon
   - Click **Invite People**
   - Click **Edit Invite Link**
   - Set to **Never Expire**
   - Copy the invite link

6. Use this invite link for `YOUR_SUPPORT_SERVER_LINK` in your website

---

## 📝 Step 4: Update Discord Developer Portal

Now add your legal pages to your bot application:

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your bot application
3. Go to **General Information**

4. Update these fields:
   - **Name**: TC Music Bot (or just "TC")
   - **Description**:
     ```
     TC is a feature-rich music bot supporting YouTube, Spotify, and file uploads.
     High-quality audio, interactive controls, and 24/7 uptime!
     ```
   - **Terms of Service URL**: `https://yoursite.netlify.app/terms.html`
   - **Privacy Policy URL**: `https://yoursite.netlify.app/privacy.html`

5. Make sure **Public Bot** is **CHECKED** ✅

6. Make sure **Require OAuth2 Code Grant** is **UNCHECKED** ❌

7. Click **Save Changes**

---

## 📝 Step 5: Deploy Your Bot (Make It Online)

Now you need to host the bot itself (not just the website). Choose one option:

### Option A: Free Hosting (Railway) - Good for Testing

1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **New Project** → **Deploy from GitHub repo**
4. If you have a GitHub repo:
   - Select the repository
   - Railway will auto-detect and deploy
5. If you DON'T have a GitHub repo yet:
   - First push your code to GitHub (see below)

**Push to GitHub:**
```bash
cd "C:\Users\rahul\Documents\Jobhunt\Projects\Discord Music Bot"
git init
git add .
git commit -m "TC Discord Music Bot"
# Create a repo on GitHub, then:
git remote add origin https://github.com/yourusername/tc-discord-bot.git
git push -u origin main
```

6. In Railway, add **Environment Variables**:
   - Click on your deployed service
   - Go to **Variables** tab
   - Add these:
     ```
     DISCORD_TOKEN=your_bot_token_here
     DISCORD_CLIENT_ID=your_client_id_here
     NODE_ENV=production
     ```

7. Railway will deploy and your bot will come online!

### Option B: VPS Hosting ($5/month) - Best for Production

If you want 24/7 uptime, use a VPS:

1. Get a VPS from:
   - [DigitalOcean](https://digitalocean.com) - $5/month
   - [Hetzner](https://hetzner.com) - €4/month (cheapest)
   - [Vultr](https://vultr.com) - $5/month

2. SSH into your server

3. Deploy with Docker:
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone your repo
git clone https://github.com/yourusername/tc-discord-bot.git
cd tc-discord-bot

# Create .env file
nano .env
# Add your credentials:
# DISCORD_TOKEN=...
# DISCORD_CLIENT_ID=...
# Save with Ctrl+X, Y, Enter

# Deploy
docker-compose up -d

# Check logs
docker-compose logs -f
```

---

## 📝 Step 6: Deploy Bot Commands

Before your bot can respond to slash commands:

```bash
# On your local machine
cd "C:\Users\rahul\Documents\Jobhunt\Projects\Discord Music Bot"
npm install
cp .env.example .env

# Edit .env with your credentials:
# DISCORD_TOKEN=...
# DISCORD_CLIENT_ID=...

# Deploy commands
npm run deploy:commands
```

You should see: "Deployed commands globally"

---

## 📝 Step 7: Test Your Bot

1. **Invite your bot to a test server:**
   - Use your bot invite link (from Step 1.3)
   - Select a test Discord server
   - Authorize

2. **Test basic functionality:**
   - Join a voice channel
   - Type `/play never gonna give you up`
   - Select a song from the menu
   - Verify music plays

3. **Test other commands:**
   - `/pause`
   - `/resume`
   - `/skip`
   - `/queue`
   - `/volume 100`

4. **Test your website:**
   - Visit your Netlify URL
   - Click "Add to Discord" button
   - Verify it opens Discord authorization
   - Check Terms and Privacy pages load

---

## 📝 Step 8: Submit to Bot Lists (Optional)

To get more users, submit your bot to listing sites:

### Top.gg (Most Popular)

1. Go to [top.gg/dashboard/bots](https://top.gg/dashboard/bots)
2. Click **Add Bot**
3. Fill in:
   - **Bot ID**: Your bot's client ID
   - **Prefix**: `/` (slash commands)
   - **Short Description**: "Feature-rich music bot with YouTube, Spotify, and file support. Free and easy to use!"
   - **Long Description**: Copy from `PUBLIC_BOT_GUIDE.md` (the markdown section)
   - **Invite Link**: Your bot invite link
   - **Website**: Your Netlify URL
   - **Support Server**: Your support Discord invite
   - **Tags**: Music, Utility, Fun
4. Upload a bot avatar (512x512 image)
5. Submit for approval

### Other Sites

- [discord.bots.gg](https://discord.bots.gg) - Similar to top.gg
- [bots.ondiscord.xyz](https://bots.ondiscord.xyz)
- [discordbotlist.com](https://discordbotlist.com)

---

## ✅ Final Checklist

Before going fully public, verify:

- [ ] Netlify website is live with updated links
- [ ] Terms and Privacy pages load correctly
- [ ] "Add to Discord" button works
- [ ] Bot is hosted and online 24/7
- [ ] Slash commands are deployed
- [ ] Bot responds to `/play` command
- [ ] Music plays from YouTube
- [ ] Bot marked as Public in Developer Portal
- [ ] Terms/Privacy URLs added to Developer Portal
- [ ] Support Discord server created
- [ ] Bot tested in multiple servers

---

## 🎉 You're Done!

Your bot is now:
- ✅ Publicly available via invite link
- ✅ Has a professional website
- ✅ Complies with Discord's requirements
- ✅ Ready to be added to any server

**Share your bot invite link anywhere and people can add it to their servers!**

---

## 📞 Quick Links

- **Your Website**: https://yoursite.netlify.app (replace with actual)
- **Bot Invite**: Your bot invite link
- **Support Server**: Your Discord server invite
- **Developer Portal**: https://discord.com/developers/applications

---

## 🆘 Troubleshooting

### Bot doesn't respond to commands
- Make sure you ran `npm run deploy:commands`
- Wait 5-10 minutes for commands to propagate
- Check bot is online in Discord

### "Add to Discord" button doesn't work
- Verify you replaced `YOUR_INVITE_LINK_HERE` with actual link
- Re-upload to Netlify after changes

### Bot is offline
- Check your hosting platform (Railway/VPS)
- Check logs for errors
- Verify `DISCORD_TOKEN` in environment variables

### Commands not appearing
- Commands can take up to 1 hour to appear globally
- For faster testing, deploy to a specific server:
  ```bash
  npx ts-node src/scripts/deployCommands.ts YOUR_SERVER_ID
  ```

---

**Need help?** Check the other documentation files:
- `QUICKSTART.md` - Quick setup
- `DEPLOYMENT.md` - Detailed deployment
- `PUBLIC_BOT_GUIDE.md` - Public bot guide
