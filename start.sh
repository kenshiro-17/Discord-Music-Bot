#!/bin/bash

# Start script for running Lavalink and Discord Bot together

echo "Starting Lavalink server..."
cd /app/lavalink

# Start Lavalink in background
java -Xmx512M -jar Lavalink.jar &
LAVALINK_PID=$!

# Wait for Lavalink to be ready (check port 2333)
echo "Waiting for Lavalink to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while ! nc -z localhost 2333 && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for Lavalink... ($RETRY_COUNT/$MAX_RETRIES)"
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "ERROR: Lavalink failed to start within timeout"
    exit 1
fi

echo "Lavalink is ready!"

# Start the Discord bot
echo "Starting Discord Bot..."
cd /app
exec node dist/index.js
