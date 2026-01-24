# 🍪 YouTube Cookies Setup Guide

If the bot fails to play age-restricted videos or gets blocked by YouTube ("Sign in to confirm you're not a bot"), you need to provide **YouTube Cookies**.

## Why is this needed?
YouTube restricts playback from data center IPs (like Railway). Authenticating with valid user cookies proves you are a human and allows playback to continue.

## 1. Get Your Cookies
1.  Install the **"Get cookies.txt LOCALLY"** extension for Chrome/Edge.
    *   [Chrome Web Store Link](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
2.  Go to [YouTube.com](https://www.youtube.com).
3.  **Log in** with a Google account (use a burner account if you prefer, but a real one works better).
4.  Play any video to ensure you are active.
5.  Click the extension icon and select **"Export"** (ensure it's for `youtube.com`).
6.  Open the downloaded file. It will look like a long text file.

## 2. Format for Railway
The bot expects the cookies as a single string or JSON, but `play-dl` is smart. However, for environment variables, it's best to keep it simple.

**Wait!** Railway variables might struggle with a huge text file.
Instead, we will use the **Cookies String** value.

### Method B: The "Cookie" Header (Easier for Env Vars)
1.  Open Developer Tools (F12) strictly on YouTube.com.
2.  Go to the **Network** tab.
3.  Refresh the page.
4.  Click on the first request (`www.youtube.com`).
5.  Scroll down to **Request Headers**.
6.  Find the `cookie:` field.
7.  Copy the **entire value** of the cookie header.

## 3. Add to Railway
1.  Go to your Railway Project.
2.  Open **Variables**.
3.  Click **New Variable**.
4.  **Name**: `YOUTUBE_COOKIES`
5.  **Value**: Paste the long cookie string you copied.
6.  Click **Add**.

The bot will restart automatically.

## Debugging
If `YOUTUBE_COOKIES` are invalid, the bot logs will say: `warn: Failed to load YouTube cookies`.
If successful, it will say: `info: YouTube cookies loaded successfully`.
