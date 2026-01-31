#!/bin/bash

# Start script for running Lavalink and Discord Bot together

echo "Starting Lavalink server..."
cd /app/lavalink

# Start Lavalink in background but pipe output to stdout and file
# We use tee to see logs in Railway console
java -Xmx512M -jar Lavalink.jar > >(tee /app/logs/lavalink.log) 2>&1 &
LAVALINK_PID=$!

# Wait for Lavalink to be ready (check port 2333)
echo "Waiting for Lavalink to be ready..."
MAX_RETRIES=60
RETRY_COUNT=0

while ! nc -z localhost 2333 && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for Lavalink... ($RETRY_COUNT/$MAX_RETRIES)"
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "ERROR: Lavalink failed to start within timeout"
    echo "Last 50 lines of Lavalink log:"
    tail -n 50 /app/logs/lavalink.log
    exit 1
fi

# Additional wait to ensure WebSocket is ready
sleep 5

echo "Lavalink is ready!"

# Start the Discord bot
echo "Starting Discord Bot..."
cd /app
exec node dist/index.js
