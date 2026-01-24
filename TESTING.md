# Testing Guide

This document provides comprehensive testing instructions for the Lyra Discord Music Bot.

## Testing Setup

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run integration tests only
npm run test:integration
```

## Manual Testing Checklist

### Pre-Testing Setup

1. Create a test Discord server
2. Invite the bot to the test server
3. Deploy commands: `npm run deploy:commands YOUR_GUILD_ID`
4. Ensure you have:
   - A voice channel to test in
   - Test audio files (mp3, wav, flac)
   - YouTube URLs ready
   - Spotify URLs ready (if configured)

### Basic Functionality

#### Play Command

- [ ] `/play <search query>` - Search and select a song
  - Example: `/play never gonna give you up`
  - Verify search results appear
  - Select a result from menu
  - Verify bot joins voice channel
  - Verify song starts playing
  - Verify "Now Playing" embed shows correct info

- [ ] `/play <youtube url>` - Play YouTube video
  - Example: `/play https://www.youtube.com/watch?v=dQw4w9WgXcQ`
  - Verify song plays immediately
  - Verify thumbnail and info are correct

- [ ] `/play <youtube playlist>` - Add YouTube playlist
  - Example: `/play https://www.youtube.com/playlist?list=...`
  - Verify all songs are added
  - Verify playlist confirmation message
  - Check `/queue` shows all songs

- [ ] `/play <spotify track>` - Play Spotify track (if enabled)
  - Example: `/play https://open.spotify.com/track/...`
  - Verify track is converted to YouTube
  - Verify playback works

- [ ] `/play <spotify playlist>` - Add Spotify playlist (if enabled)
  - Example: `/play https://open.spotify.com/playlist/...`
  - Verify tracks are converted
  - Verify playlist is added

- [ ] `/play file:<attachment>` - Upload audio file
  - Upload an mp3/wav/flac file
  - Verify file plays correctly
  - Verify duration is extracted
  - Test with different formats (.mp3, .wav, .flac, .ogg, .m4a)

#### Playback Controls

- [ ] `/pause` - Pause playback
  - Verify playback stops
  - Verify confirmation message

- [ ] `/resume` - Resume playback
  - Verify playback continues
  - Verify confirmation message

- [ ] `/skip` - Skip to next song
  - Verify next song plays
  - Verify "Now Playing" updates
  - Test when it's the last song (should stop)

- [ ] `/stop` - Stop and disconnect
  - Verify playback stops
  - Verify queue is cleared
  - Verify bot leaves voice channel

#### Queue Management

- [ ] `/queue` - Display queue
  - Verify current song shows at top
  - Verify upcoming songs listed
  - Verify pagination works (if > 10 songs)
  - Test with different page numbers

- [ ] `/nowplaying` - Show current song
  - Verify song info is displayed
  - Verify interactive buttons work
  - Test clicking each button

- [ ] `/remove <position>` - Remove song
  - Add multiple songs to queue
  - Remove a song by position
  - Verify it's removed from queue
  - Try removing current song (should fail)

- [ ] `/jump <position>` - Jump to song
  - Add multiple songs
  - Jump to a specific position
  - Verify that song starts playing
  - Check queue updates correctly

- [ ] `/clear` - Clear queue
  - Add multiple songs
  - Run `/clear`
  - Verify only current song remains
  - Check queue shows 1 song

- [ ] `/shuffle` - Shuffle queue
  - Add 5+ songs
  - Run `/shuffle`
  - Verify order changes
  - Verify current song stays first

#### Settings

- [ ] `/volume <0-200>` - Set volume
  - Test with 0 (muted)
  - Test with 50 (default)
  - Test with 100 (normal)
  - Test with 200 (max)
  - Verify changes apply to next song

- [ ] `/loop off` - Disable loop
  - Enable loop first
  - Disable with command
  - Verify next song skips normally

- [ ] `/loop song` - Loop current song
  - Enable loop mode
  - Let song finish
  - Verify same song plays again

- [ ] `/loop queue` - Loop entire queue
  - Add multiple songs
  - Enable queue loop
  - Let all songs play
  - Verify queue repeats from start

### Interactive UI

#### Now Playing Buttons

- [ ] Play/Pause button
  - Click to pause
  - Click again to resume
  - Verify button label updates

- [ ] Skip button
  - Click to skip
  - Verify next song plays

- [ ] Stop button
  - Click to stop
  - Verify bot disconnects

- [ ] Loop button
  - Click to cycle: off → song → queue → off
  - Verify button style changes
  - Verify loop mode applies

- [ ] Shuffle button
  - Add multiple songs
  - Click shuffle
  - Verify queue is shuffled

### Error Handling

#### Invalid Input

- [ ] `/play` with no arguments
  - Should show error message

- [ ] `/play <invalid url>`
  - Should show error about invalid URL

- [ ] `/play <deleted video>`
  - Should show error about unavailable video

- [ ] `/play` with oversized file (>25MB)
  - Should reject with file size error

- [ ] `/play` with invalid file type (.txt, .exe)
  - Should reject with file type error

#### Permission Errors

- [ ] Run command while not in voice channel
  - Should show error

- [ ] Bot doesn't have Connect permission
  - Should show permission error

- [ ] Bot doesn't have Speak permission
  - Should show permission error

- [ ] Voice channel is full
  - Should show channel full error

- [ ] User in different voice channel than bot
  - Control commands should fail
  - Should show error about being in same channel

#### Queue Errors

- [ ] Try to skip when queue is empty
  - Should show error

- [ ] Try to remove with invalid position (0, -1, 999)
  - Should show error

- [ ] Try to jump to invalid position
  - Should show error

- [ ] Add more than 100 songs (max queue size)
  - Should reject with queue full error

### Edge Cases

#### Auto-Disconnect

- [ ] Everyone leaves voice channel
  - Bot should stay for 5 minutes
  - After 5 minutes, bot should leave
  - Should send message about leaving

- [ ] No playback for 5 minutes
  - Bot should auto-disconnect
  - Should send inactivity message

#### Concurrent Operations

- [ ] Multiple users run `/play` at same time
  - All songs should be added
  - No songs should be lost
  - Queue order should be consistent

- [ ] User skips while song is loading
  - Should handle gracefully
  - Next song should load

#### Network Issues

- [ ] YouTube rate limit
  - Should show error message
  - Should retry with backoff

- [ ] Slow internet connection
  - Should buffer properly
  - Should not crash

- [ ] Voice connection drops
  - Should attempt to reconnect
  - Should restore playback

### File Upload Tests

- [ ] Upload .mp3 file
- [ ] Upload .wav file
- [ ] Upload .flac file
- [ ] Upload .ogg file
- [ ] Upload .m4a file
- [ ] Upload file exactly at 25MB limit
- [ ] Upload file over 25MB limit (should fail)
- [ ] Upload invalid audio file (should fail)
- [ ] Verify temp files are cleaned up after playback

### YouTube Tests

- [ ] Normal video
- [ ] Long video (>1 hour)
- [ ] Very short video (<10 seconds)
- [ ] Age-restricted video
- [ ] Region-locked video
- [ ] Private video (should fail)
- [ ] Deleted video (should fail)
- [ ] Live stream (should fail with error)

### Spotify Tests (if enabled)

- [ ] Single track
- [ ] Small playlist (5 songs)
- [ ] Large playlist (50+ songs, should cap at 50)
- [ ] Album
- [ ] Unavailable track (region-locked)
- [ ] Verify YouTube conversion works
- [ ] Verify metadata is preserved

### Production Tests

#### Docker

- [ ] Build Docker image successfully
  ```bash
  npm run docker:build
  ```

- [ ] Run container
  ```bash
  npm run docker:run
  ```

- [ ] Check health endpoint
  ```bash
  curl http://localhost:8080/health
  ```

- [ ] View logs
  ```bash
  docker-compose logs -f
  ```

- [ ] Stop and restart container
  ```bash
  docker-compose restart
  ```

- [ ] Verify auto-restart on crash
  - Stop bot with error
  - Container should restart automatically

#### PM2

- [ ] Start with PM2
  ```bash
  npm run pm2:start
  ```

- [ ] Check status
  ```bash
  pm2 status
  ```

- [ ] View logs
  ```bash
  pm2 logs lyra-bot
  ```

- [ ] Restart
  ```bash
  pm2 restart lyra-bot
  ```

- [ ] Monitor resources
  ```bash
  pm2 monit
  ```

- [ ] Verify auto-restart on crash

#### Logging

- [ ] Check logs are created in `logs/` directory
- [ ] Verify daily rotation works
- [ ] Check error logs separate from info logs
- [ ] Verify old logs are cleaned up (14 days for app, 30 for errors)

#### Health Check

- [ ] Access `/health` endpoint
- [ ] Verify response includes:
  - Status
  - Uptime
  - Memory usage
  - Active queues
  - Timestamp
- [ ] Verify returns 200 OK when healthy

### Stress Testing

- [ ] Add 100 songs to queue (max limit)
- [ ] Run 10+ commands rapidly in succession
- [ ] Have 5+ servers use bot simultaneously
- [ ] Play continuous music for 1+ hours
- [ ] Monitor memory usage doesn't grow unbounded

### Performance Testing

- [ ] Measure command response time (should be <2s)
- [ ] Measure time to join voice channel (should be <5s)
- [ ] Measure time to start playback (should be <3s)
- [ ] Check memory usage (should stay <500MB for single server)
- [ ] Check CPU usage (should stay <50% during playback)

## Test Results Template

```markdown
## Test Session: [Date]

**Tester:** [Your Name]
**Bot Version:** [Git Commit/Version]
**Environment:** [Development/Production]

### Test Results

| Category | Test | Status | Notes |
|----------|------|--------|-------|
| Basic | /play search | ✅ | Working |
| Basic | /play url | ✅ | Working |
| Basic | /play playlist | ❌ | Error on large playlists |
| ... | ... | ... | ... |

### Issues Found

1. **Issue:** Playlist loading fails for 50+ songs
   **Severity:** Medium
   **Steps to Reproduce:** ...
   **Expected:** Should load all songs
   **Actual:** Fails after 30 songs

### Performance Metrics

- Average command response time: 1.2s
- Memory usage after 1 hour: 245MB
- CPU usage during playback: 15%

### Recommendations

- Fix playlist loading bug
- Optimize memory usage
- Add retry logic for network errors
```

## Automated Testing

### Unit Tests

Run unit tests to verify individual functions:

```bash
npm test
```

Key areas covered:
- URL validation
- Search query sanitization
- Queue management functions
- File validation
- Embed builders

### Integration Tests

Run integration tests to verify component interactions:

```bash
npm run test:integration
```

Key areas covered:
- Voice connection flow
- Playback lifecycle
- Command execution
- Error handling

### Coverage Report

Generate coverage report:

```bash
npm run test:coverage
```

Target coverage: 70%+

## Debugging

### Enable Debug Logging

Set in `.env`:

```env
LOG_LEVEL=debug
```

### Check Logs

```bash
# View application logs
tail -f logs/application-*.log

# View error logs
tail -f logs/error-*.log
```

### Discord.js Debug

Add to code for detailed Discord.js logs:

```typescript
client.on('debug', console.log);
```

## Reporting Issues

When reporting bugs, include:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Error messages/logs
5. Environment (OS, Node version, Docker/PM2)
6. Bot version/commit hash

## Test Sign-Off

Before deploying to production, ensure:

- [ ] All manual tests pass
- [ ] All automated tests pass
- [ ] Coverage is at least 70%
- [ ] No critical bugs
- [ ] Performance metrics are acceptable
- [ ] Docker build succeeds
- [ ] Health check endpoint works

**Tested by:** _______________
**Date:** _______________
**Approved for deployment:** Yes / No
