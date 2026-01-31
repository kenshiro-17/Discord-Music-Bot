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

# Production stage with Java + Node.js
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install Node.js, ffmpeg, and other dependencies
RUN apk add --no-cache \
    nodejs \
    npm \
    ffmpeg \
    curl \
    python3 \
    netcat-openbsd \
    bash

# Install yt-dlp (latest)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Create lavalink directory
RUN mkdir -p /app/lavalink /app/logs

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
RUN chmod -R 755 /app

# Health check (uses PORT env variable, defaults to 8080)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "const port = process.env.PORT || process.env.HEALTH_CHECK_PORT || '8080'; require('http').get('http://localhost:' + port + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose ports (8080 for health check, 2333 for Lavalink internal)
EXPOSE 8080
EXPOSE 2333

# Start both services
CMD ["/app/start.sh"]
