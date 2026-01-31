# Multi-stage build for Discord Bot + Lavalink

# Builder stage for Node.js
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage with Java + Node.js (Debian based for better compatibility)
FROM eclipse-temurin:21-jre

WORKDIR /app

# Install Node.js, ffmpeg, and other dependencies
# Note: We need to install Node.js 20.x from nodesource or similar, 
# but simply using the default repo nodejs might be old.
# Let's use a multi-stage approach or just install what's available if recent enough.
# Actually, easiest way is to use a Node image and install Java, or Java image and install Node.
# Let's stick to installing Node on the Java image.

RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    ffmpeg \
    netcat-openbsd \
    python3 \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp (latest)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Create lavalink directory and user
RUN mkdir -p /app/lavalink /app/logs && \
    groupadd -r tc && useradd -r -g tc -G audio,video tc && \
    chown -R tc:tc /app

# Download Lavalink
RUN curl -L https://github.com/lavalink-devs/Lavalink/releases/download/4.0.8/Lavalink.jar \
    -o /app/lavalink/Lavalink.jar

# Copy Lavalink configuration
COPY lavalink/application.yml /app/lavalink/application.yml

# Copy package files for Node.js
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Ensure proper permissions
RUN chown -R tc:tc /app

# Switch to non-root user
USER tc

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "const port = process.env.PORT || process.env.HEALTH_CHECK_PORT || '8080'; require('http').get('http://localhost:' + port + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose ports
EXPOSE 8080
EXPOSE 2333

# Start both services
CMD ["/app/start.sh"]
