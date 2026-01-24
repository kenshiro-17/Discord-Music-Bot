# ✅ Quick Setup Checklist - After Netlify Upload

Follow this simple checklist in order:

---

## 1️⃣ Get Your Bot Invite Link (5 minutes)

**Go to:** [Discord Developer Portal](https://discord.com/developers/applications)

**Steps:**
1. ✅ Click your bot application (or create new application)
2. ✅ Go to **OAuth2** → **URL Generator**
3. ✅ Check: `bot` and `applications.commands`
4. ✅ Select permissions: Connect, Speak, Send Messages, Embed Links, Attach Files
5. ✅ **Copy the generated URL** (this is your bot invite link!)

**Save this link!** Example:
```
https://discord.com/api/oauth2/authorize?client_id=123456789&permissions=36700160&scope=bot%20applications.commands
```

---

## 2️⃣ Create Support Discord Server (3 minutes)

1. ✅ In Discord, click **+** to create server
2. ✅ Name it: "TC Bot Support"
3. ✅ Create channels: #announcements, #support, #bug-reports
4. ✅ Right-click server → Invite People → Set to Never Expire → Copy invite link

**Save this link!** Example: `https://discord.gg/yourserver`

---

## 3️⃣ Update Website Files (10 minutes)

**Edit these 3 files** in your `public/` folder:

### File 1: `public/index.html`

Find and replace (Ctrl+F):

| Find This | Replace With |
|-----------|--------------|
| `YOUR_INVITE_LINK_HERE` | Your bot invite link from Step 1 |
| `YOUR_SUPPORT_SERVER_LINK` | Your Discord server invite from Step 2 |
| `YOUR_GITHUB_LINK` | `https://github.com/yourusername/tc-bot` (or remove if no GitHub) |
| `YOUR_GITHUB_ISSUES_LINK` | `https://github.com/yourusername/tc-bot/issues` (or remove) |
| `YOUR_TWITTER_LINK` | Your Twitter URL (or remove the entire `<a>` tag) |

### File 2: `public/terms.html`

Find and replace:

| Find This | Replace With |
|-----------|--------------|
| `[Your Jurisdiction]` | Your country (e.g., "United States") |
| `[Your Support Server Link]` | Your Discord server invite |
| `[Your Email]` | Your email (e.g., `support@example.com`) |
| `[Your GitHub Link]` | Your GitHub URL |

### File 3: `public/privacy.html`

Find and replace:

| Find This | Replace With |
|-----------|--------------|
| `[Your Support Server Link]` | Your Discord server invite |
| `[Your Email]` | Your email |
| `[Your GitHub Link]` | Your GitHub URL |

---

## 4️⃣ Re-upload to Netlify (2 minutes)

1. ✅ Save all your edited files
2. ✅ Go to Netlify → Your site → **Deploys** tab
3. ✅ Drag and drop the `public/` folder again
4. ✅ Wait for "Published" status

---

## 5️⃣ Update Discord Developer Portal (3 minutes)

**Go to:** [Discord Developer Portal](https://discord.com/developers/applications) → Your bot

**In General Information tab:**

1. ✅ Set **Name**: TC Music Bot
2. ✅ Set **Description**:
   ```
   TC is a feature-rich music bot supporting YouTube, Spotify, and file uploads.
   High-quality audio, interactive controls, and 24/7 uptime!
   ```
3. ✅ Set **Terms of Service URL**: `https://yoursite.netlify.app/terms.html`
4. ✅ Set **Privacy Policy URL**: `https://yoursite.netlify.app/privacy.html`
5. ✅ **Check** "Public Bot" ✅
6. ✅ **Uncheck** "Require OAuth2 Code Grant" ❌
7. ✅ Click **Save Changes**

---

## 6️⃣ Deploy Bot Commands (5 minutes)

**On your computer:**

```bash
# Navigate to your project
cd "C:\Users\rahul\Documents\Jobhunt\Projects\Discord Music Bot"

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Edit .env file with:
# - Your DISCORD_TOKEN
# - Your DISCORD_CLIENT_ID
# (Use Notepad or any text editor)

# Deploy commands
npm run deploy:commands
```

**You should see:** ✅ "Deployed commands globally"

---

## 7️⃣ Host Your Bot (Choose One)

### Option A: Free - Railway (Good for testing)

1. ✅ Go to [railway.app](https://railway.app)
2. ✅ Sign up with GitHub
3. ✅ Click **New Project** → **Empty Project**
4. ✅ Click **Deploy from GitHub repo**
5. ✅ Connect your GitHub (push code first if needed)
6. ✅ Add environment variables:
   - `DISCORD_TOKEN` = your bot token
   - `DISCORD_CLIENT_ID` = your client ID
   - `NODE_ENV` = production
7. ✅ Deploy!

**OR**

### Option B: Paid - VPS ($5/month) - Best for 24/7

1. ✅ Get VPS from [Hetzner](https://hetzner.com) or [DigitalOcean](https://digitalocean.com)
2. ✅ SSH into server
3. ✅ Run:
```bash
git clone https://github.com/yourusername/tc-discord-bot.git
cd tc-discord-bot
nano .env  # Add DISCORD_TOKEN and DISCORD_CLIENT_ID
docker-compose up -d
```

---

## 8️⃣ Test Everything (5 minutes)

1. ✅ Visit your Netlify website
2. ✅ Click "Add to Discord" button → Should open Discord
3. ✅ Add bot to a test server
4. ✅ Join voice channel
5. ✅ Type `/play never gonna give you up`
6. ✅ Verify music plays!
7. ✅ Test `/pause`, `/resume`, `/skip`

---

## 9️⃣ Submit to Bot Lists (Optional - 15 minutes)

**Top.gg (Most Popular):**

1. ✅ Go to [top.gg/dashboard/bots](https://top.gg/dashboard/bots)
2. ✅ Click **Add Bot**
3. ✅ Enter your bot's Client ID
4. ✅ Fill in description, tags, links
5. ✅ Submit for approval (takes 24-48 hours)

**Other sites:**
- [discord.bots.gg](https://discord.bots.gg)
- [bots.ondiscord.xyz](https://bots.ondiscord.xyz)

---

## 🎉 Final Checklist

Before sharing your bot publicly:

- [ ] Website is live on Netlify with updated links
- [ ] "Add to Discord" button works
- [ ] Terms and Privacy pages load
- [ ] Bot is marked Public in Developer Portal
- [ ] Bot is online and hosted somewhere
- [ ] Slash commands deployed
- [ ] Bot responds to `/play` in Discord
- [ ] Music actually plays
- [ ] Support server created
- [ ] Tested in multiple servers

---

## 📋 Your Important Links

Write these down:

**Netlify Website:** `https://______________.netlify.app`

**Bot Invite Link:** `https://discord.com/api/oauth2/authorize?client_id=____________`

**Support Server:** `https://discord.gg/____________`

**GitHub Repo:** `https://github.com/____________/tc-discord-bot`

---

## ✅ You're Done When...

✨ Anyone can click your bot invite link
✨ They can add it to their Discord server
✨ They can type `/play` and music plays
✨ Your website shows up when they search for your bot

**That's it! Your bot is now PUBLIC! 🚀**

---

## 🆘 Quick Fixes

**Bot doesn't respond:**
- Wait 10 minutes after deploying commands
- Check bot is online (green dot in Discord)
- Verify DISCORD_TOKEN is correct

**Website button doesn't work:**
- Make sure you replaced `YOUR_INVITE_LINK_HERE`
- Re-upload to Netlify

**Can't deploy commands:**
- Check DISCORD_TOKEN and DISCORD_CLIENT_ID in .env
- Make sure you ran `npm install`

---

**Need detailed help?** Read `NETLIFY_SETUP_GUIDE.md`
