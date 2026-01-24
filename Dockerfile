# Multi-stage build for optimized production image

# Builder stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libtool \
    autoconf \
    automake

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install ffmpeg and other dependencies
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++ \
    curl \
    libtool \
    autoconf \
    automake

# Install yt-dlp (latest)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Create non-root user
RUN addgroup -g 1001 -S tc && \
    adduser -S tc -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create logs directory and ensure app permissions for ytdl cache
RUN mkdir -p logs && chown -R tc:tc /app

# Switch to non-root user
USER tc

# Health check (uses PORT env variable, defaults to 8080)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "const port = process.env.PORT || process.env.HEALTH_CHECK_PORT || '8080'; require('http').get('http://localhost:' + port + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose health check port (Railway will use PORT env variable)
EXPOSE 8080

# Start the bot
CMD ["node", "dist/index.js"]
