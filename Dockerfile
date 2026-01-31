# Production stage with Node.js and Chromium for PoToken
FROM node:20-bullseye-slim

WORKDIR /app

# Install system dependencies
# Chromium is needed for PoToken generation
# ffmpeg is needed for audio processing
# python3/build-essential for node-gyp if needed
RUN apt-get update && apt-get install -y \
    ffmpeg \
    chromium \
    python3 \
    make \
    g++ \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to skip download and use installed chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install yt-dlp (latest)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Create user
RUN groupadd -r tc && useradd -r -g tc -G audio,video tc && \
    mkdir -p /app/logs && chown -R tc:tc /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Prune dev dependencies
RUN npm ci --only=production

# Ensure permissions
RUN chown -R tc:tc /app

# Switch to non-root user
USER tc

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node -e "const port = process.env.PORT || process.env.HEALTH_CHECK_PORT || '8080'; require('http').get('http://localhost:' + port + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose health check port
EXPOSE 8080

# Start the bot
CMD ["node", "dist/index.js"]
