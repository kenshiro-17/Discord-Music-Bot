#!/bin/bash

# Start script for running Lavalink and Discord Bot together

echo "Starting Lavalink server..."
cd /app/lavalink

# Start Lavalink in background and pipe output to log file
# Reduced memory to 256M to fit in container alongside Node.js
java -Xmx256M -jar Lavalink.jar > /app/logs/lavalink.log 2>&1 &
LAVALINK_PID=$!

echo "Lavalink started with PID $LAVALINK_PID"

# Tail the log file to stdout in background so we can see it in Railway logs
tail -f /app/logs/lavalink.log &
TAIL_PID=$!

# Wait for Lavalink to be ready (check port 2333)
echo "Waiting for Lavalink to be ready..."
MAX_RETRIES=60
RETRY_COUNT=0

# Check if process died
while ! nc -z localhost 2333 && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if ! kill -0 $LAVALINK_PID 2>/dev/null; then
        echo "ERROR: Lavalink process died unexpectedly!"
        echo "Dumping log file:"
        cat /app/logs/lavalink.log
        exit 1
    fi
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for Lavalink... ($RETRY_COUNT/$MAX_RETRIES)"
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "ERROR: Lavalink failed to start within timeout"
    exit 1
fi

# Additional wait to ensure WebSocket is ready
echo "Port is open, waiting 10s for full initialization..."
sleep 10

echo "Lavalink is ready!"

# Start the Discord bot
echo "Starting Discord Bot..."
cd /app
exec node dist/index.js
