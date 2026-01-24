# YouTube Cookie Setup Guide

## Why Do I Need This?

YouTube has aggressive bot detection that blocks automated tools like music bots. You'll see errors like:
- `Status code: 403 (Forbidden)`
- `Could not parse decipher function`
- `Video unavailable`

**The solution:** Export your YouTube cookies and configure your bot to use them. This makes your bot's requests appear as if they're coming from your logged-in browser session.

## Step-by-Step Cookie Export

### Method 1: Using "Get cookies.txt LOCALLY" Extension (Recommended)

1. **Install the Browser Extension:**
   - Chrome/Edge: [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
   - Firefox: [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

2. **Login to YouTube:**
   - Go to [youtube.com](https://youtube.com) and login with your account
   - Make sure you're fully logged in (can see your profile picture)

3. **Export Cookies:**
   - Click the extension icon while on youtube.com
   - Click "Export" or the download button
   - This downloads a `youtube.com_cookies.txt` file

4. **Copy Cookie Content:**
   - Open the downloaded `.txt` file in a text editor
   - Copy the ENTIRE content (including the header lines)

5. **Add to .env File:**
   ```bash
   # In your .env file, add:
   YOUTUBE_COOKIES="# Netscape HTTP Cookie File
   .youtube.com	TRUE	/	TRUE	1234567890	CONSENT	YES+1
   .youtube.com	TRUE	/	FALSE	1234567890	VISITOR_INFO1_LIVE	xxxxx
   # ... rest of cookies ..."
   ```

   **Important:**
   - Keep it as one line in the .env file, or use `\n` for newlines
   - Keep the quotes around the entire cookie string
   - Don't share this file - it contains your login session!

### Method 2: Using Browser DevTools (Manual)

1. **Open YouTube:**
   - Go to [youtube.com](https://youtube.com) while logged in

2. **Open DevTools:**
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)

3. **Get Cookies:**
   - Go to the "Application" tab (Chrome) or "Storage" tab (Firefox)
   - Click "Cookies" → "https://youtube.com"
   - You'll see all cookies

4. **Export as JSON:**
   ```javascript
   // In the Console tab, paste this:
   copy(JSON.stringify(
     document.cookie.split('; ').map(c => {
       const [name, value] = c.split('=');
       return { name, value, domain: '.youtube.com', path: '/', secure: true };
     })
   ));
   ```

5. **Add to .env:**
   ```bash
   YOUTUBE_COOKIES='[{"name":"CONSENT","value":"YES+1",...}]'
   ```

## Verifying Cookie Setup

### Check Bot Logs

When you start your bot, look for these log messages:

✅ **Success:**
```
YTDL agent initialized successfully with cookies { count: 15 }
```

❌ **Warning (needs fix):**
```
YTDL agent: No cookies provided. Playback may fail (403) for restricted videos.
Set YOUTUBE_COOKIES in .env to fix 403 errors.
```

### Test Playback

Try playing a video:
```
/play https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

If it works without 403 errors - you're good! 🎉

## Cookie Formats Supported

The bot supports three cookie formats:

1. **Netscape format (Recommended):**
   ```
   # Netscape HTTP Cookie File
   .youtube.com	TRUE	/	TRUE	1234567890	CONSENT	YES+1
   ```

2. **JSON array:**
   ```json
   [{"name":"CONSENT","value":"YES+1","domain":".youtube.com"}]
   ```

3. **Cookie header format:**
   ```
   CONSENT=YES+1; VISITOR_INFO1_LIVE=xxxxx; YSC=xxxxx
   ```

## Security & Privacy

⚠️ **Important Security Notes:**

- **Never share your .env file or cookies publicly!** They contain your login session.
- Add `.env` to `.gitignore` (already done in this project)
- Cookies expire - if playback stops working after weeks/months, re-export fresh cookies
- Use a dedicated YouTube account for your bot (optional but recommended)

## Troubleshooting

### Still Getting 403 Errors?

1. **Re-export fresh cookies** - they may have expired
2. **Verify cookie format** - check bot logs for parse errors
3. **Try a different Google account** - some accounts may have restrictions
4. **Check for special characters** - escape quotes and newlines properly in .env
5. **Update @distube/ytdl-core** - run `npm update @distube/ytdl-core`

### Bot says "Cookies provided but failed to parse"

Your cookie format is wrong. Try:
- Using the browser extension method instead
- Checking for extra quotes or escape characters
- Using JSON format instead of Netscape format

### Videos play but skip after a few seconds

This is usually not a cookie issue. Check:
- FFmpeg is installed (`ffmpeg -version`)
- Network connection is stable
- Bot has enough memory/CPU resources

## Alternative: Using yt-dlp (Advanced)

If ytdl-core continues to fail even with cookies, you can use yt-dlp as a fallback:

1. yt-dlp is already installed in the Docker container
2. It's more resilient to YouTube changes
3. You can configure it to use cookies from a file

(Implementation for yt-dlp fallback is available on request)

## Need More Help?

- Check bot logs for detailed error messages
- Open an issue on GitHub with the error (redact your cookies!)
- Verify YouTube isn't blocking your server's IP address
