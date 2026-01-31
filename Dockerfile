# Dockerfile for Discord Music Bot
FROM node:20-alpine

WORKDIR /app

# Install system dependencies (ffmpeg is required for audio)
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++

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

# Create logs directory
RUN mkdir -p logs && chown -R node:node /app

# Switch to non-root user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node -e "const port = process.env.PORT || process.env.HEALTH_CHECK_PORT || '8080'; require('http').get('http://localhost:' + port + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose health check port
EXPOSE 8080

# Start the bot
CMD ["node", "dist/index.js"]
