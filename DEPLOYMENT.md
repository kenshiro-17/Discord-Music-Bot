# Deployment Guide

This guide will help you deploy the TC Discord Music Bot to production.

## Prerequisites

- Node.js 18+ installed
- Discord bot token and client ID
- (Optional) Spotify API credentials
- (Optional) Sentry DSN for error tracking
- For Docker deployment: Docker and Docker Compose installed
- For VPS deployment: A Linux server with at least 1GB RAM

## Discord Bot Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "TC" (or your preferred name)
4. Go to the "Bot" section
5. Click "Add Bot" and confirm
6. Copy the bot token (keep it secret!)
7. Enable the following Privileged Gateway Intents:
   - Presence Intent (optional)
   - Server Members Intent (optional)
   - Message Content Intent (optional)

### 2. Get Application ID

1. Go to "General Information" in your application
2. Copy the Application ID

### 3. Generate Invite Link

1. Go to "OAuth2" → "URL Generator"
2. Select scopes:
   - `bot`
   - `applications.commands`
3. Select bot permissions:
   - Connect
   - Speak
   - Send Messages
   - Embed Links
   - Attach Files
   - Read Message History
   - Use Slash Commands
4. Copy the generated URL and use it to invite the bot to your server

## Spotify Setup (Optional)

If you want Spotify integration:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy the Client ID and Client Secret
4. You don't need to set a redirect URI for this bot

## Sentry Setup (Optional)

For error tracking in production:

1. Go to [Sentry.io](https://sentry.io)
2. Create a free account
3. Create a new project (Node.js)
4. Copy the DSN

## Local Development

### 1. Clone and Install

```bash
git clone <repository-url>
cd "Discord Music Bot"
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here

# Optional
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SENTRY_DSN=your_sentry_dsn

NODE_ENV=development
LOG_LEVEL=debug
```

### 3. Deploy Commands

```bash
npm run deploy:commands
```

For faster deployment during development (guild-specific):

```bash
npx ts-node src/scripts/deployCommands.ts YOUR_GUILD_ID
```

### 4. Run the Bot

Development mode with auto-reload:

```bash
npm run dev
```

## Production Deployment

### Option 1: Docker (Recommended)

#### Build and Run

```bash
# Build the image
npm run docker:build

# Run with Docker Compose
npm run docker:run

# View logs
docker-compose logs -f lyra-bot

# Stop the bot
docker-compose down
```

#### Manual Docker Commands

```bash
# Build
docker build -t lyra-bot .

# Run
docker run -d \
  --name lyra-bot \
  --restart unless-stopped \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  lyra-bot

# View logs
docker logs -f lyra-bot

# Stop
docker stop lyra-bot
docker rm lyra-bot
```

### Option 2: PM2 (Process Manager)

#### Install PM2

```bash
npm install -g pm2
```

#### Build and Start

```bash
# Build the TypeScript code
npm run build

# Start with PM2
npm run pm2:start

# Or directly:
pm2 start ecosystem.config.js
```

#### PM2 Management Commands

```bash
# View status
pm2 status

# View logs
pm2 logs lyra-bot

# Monitor
pm2 monit

# Restart
pm2 restart lyra-bot

# Stop
pm2 stop lyra-bot

# Delete
pm2 delete lyra-bot

# Save PM2 configuration (auto-start on reboot)
pm2 save

# Setup auto-start on system boot
pm2 startup
# Follow the instructions shown
```

### Option 3: Direct Node.js

```bash
# Build
npm run build

# Run
NODE_ENV=production node dist/index.js
```

For production, use a process manager like systemd:

```bash
# Create systemd service file
sudo nano /etc/systemd/system/lyra-bot.service
```

```ini
[Unit]
Description=TC Discord Music Bot
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/Discord Music Bot
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable lyra-bot
sudo systemctl start lyra-bot

# Check status
sudo systemctl status lyra-bot

# View logs
sudo journalctl -u lyra-bot -f
```

## VPS Deployment (Ubuntu/Debian)

### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install build tools
sudo apt install -y build-essential git

# Install FFmpeg
sudo apt install -y ffmpeg
```

### 2. Setup Application

```bash
# Clone repository
git clone <repository-url>
cd "Discord Music Bot"

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env
# Add your credentials

# Build
npm run build

# Deploy commands
npm run deploy:commands
```

### 3. Run with PM2

```bash
# Install PM2
sudo npm install -g pm2

# Start bot
pm2 start ecosystem.config.js

# Save configuration
pm2 save

# Setup auto-start
pm2 startup
# Run the command it outputs
```

## Docker Deployment on VPS

### 1. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install -y docker-compose

# Logout and login for group changes to take effect
```

### 2. Deploy Application

```bash
# Clone repository
git clone <repository-url>
cd "Discord Music Bot"

# Configure environment
cp .env.example .env
nano .env
# Add your credentials

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f
```

## Monitoring

### Health Check

The bot exposes a health check endpoint on port 8080:

```bash
curl http://localhost:8080/health
```

Response:

```json
{
  "status": "healthy",
  "uptime": 3600,
  "memory": {
    "used": 150000000,
    "total": 2000000000,
    "percentage": 7.5
  },
  "activeQueues": 3,
  "timestamp": 1234567890
}
```

### Logs

Logs are stored in the `logs/` directory:

- `application-YYYY-MM-DD.log` - All logs (retained for 14 days)
- `error-YYYY-MM-DD.log` - Error logs only (retained for 30 days)

## Troubleshooting

### Bot doesn't respond to commands

1. Check if commands are deployed:
   ```bash
   npm run deploy:commands
   ```

2. Check bot has proper permissions in Discord server

3. Check logs for errors:
   ```bash
   # Docker
   docker-compose logs lyra-bot

   # PM2
   pm2 logs lyra-bot

   # Direct
   tail -f logs/application-*.log
   ```

### Voice connection issues

1. Ensure FFmpeg is installed:
   ```bash
   ffmpeg -version
   ```

2. Check bot has "Connect" and "Speak" permissions

3. Restart the bot

### Memory issues

1. Check memory usage:
   ```bash
   # Docker
   docker stats lyra-bot

   # PM2
   pm2 monit
   ```

2. Increase memory limit in ecosystem.config.js or docker-compose.yml

3. Check for memory leaks in logs

### YouTube playback fails

1. May be rate limited - wait a few minutes
2. Check if video is available in your region
3. Check if video is age-restricted

## Security Best Practices

1. **Never commit .env file**
   - Always use .env.example as a template
   - Keep tokens and secrets secure

2. **Use environment variables**
   - Set production credentials via environment variables
   - Don't hardcode sensitive data

3. **Regular updates**
   - Keep dependencies updated: `npm update`
   - Update Node.js and system packages

4. **Monitor logs**
   - Regularly check error logs
   - Set up Sentry for error alerts

5. **Firewall**
   - Only expose necessary ports
   - Use firewall rules on your VPS

## Performance Tips

1. **Use Docker** for consistent environment
2. **Set appropriate volume levels** (default 50%)
3. **Limit queue size** (default 100 songs)
4. **Monitor memory usage** regularly
5. **Use PM2 cluster mode** for high availability (if needed)

## Updating the Bot

### Docker

```bash
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

### PM2

```bash
git pull
npm install
npm run build
pm2 restart lyra-bot
```

## Support

For issues and questions:

1. Check the logs for error messages
2. Review this deployment guide
3. Open an issue on GitHub

## Recommended VPS Providers

- DigitalOcean (Starting at $5/month)
- Linode (Starting at $5/month)
- Vultr (Starting at $5/month)
- AWS EC2 (t2.micro free tier)
- Google Cloud (f1-micro free tier)

Minimum specs: 1GB RAM, 1 CPU core, 10GB storage
