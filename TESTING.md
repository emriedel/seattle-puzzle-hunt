# Testing Guide - Seattle Puzzle Hunt

## Quick Start Testing

### 1. Start the Database and App

```bash
# Start PostgreSQL
npm run db:start

# Push schema (first time only)
npx prisma db push

# Seed the Fremont hunt
npm run seed

# Start the dev server
npm run dev
```

### 2. Enable Debug Mode

Open http://localhost:3000/hunts?debug=true

This enables the debug panel which lets you simulate being at any location without physically traveling there.

## Testing the Full Hunt Flow

### Step 1: Browse Hunts
- Navigate to http://localhost:3000
- Click "View Hunts"
- You should see "Fremont: Hidden Corners" hunt

### Step 2: View Hunt Details
- Click on the hunt
- You'll see hunt details with 4 locations
- The "Start Hunt" button will check if you're near the first location

### Step 3: Simulate Location (Debug Mode)
- You'll see a purple "🐛 Debug" button in the bottom-right
- Click it to open the debug panel
- Check "Enable Debug Mode"
- Click "The Fremont Troll" to simulate being at the first location

### Step 4: Start the Hunt
- Click "Start Hunt"
- The app will use your simulated location
- You should be redirected to the play page

### Step 5: Play Through the Hunt

#### Location 1: The Fremont Troll
1. Click "🔍 Search for Clues" (it will use your debug location)
2. Puzzle appears: **Number Code** (2 digits)
3. Answer: **27**
4. After solving, you'll see the next riddle
5. Click "Continue to Next Location →"

#### Location 2: Lenin Statue
1. Use debug panel to simulate being at "Lenin Statue"
2. Click "🔍 Search for Clues"
3. Puzzle: **Word Code** (6 letters)
4. Answer: **RUSSIA**
5. Continue to next location

#### Location 3: Ophelia's Books
1. Simulate location
2. Search for clues
3. Puzzle: **Word Code** (4 letters)
4. Answer: **BOOK**
5. Continue

#### Location 4: Gas Works Park - Sundial
1. Simulate location
2. Search for clues
3. Puzzle: **Number Code** (3 digits)
4. Answer: **033**
5. Click "Complete Hunt! 🎉"

### Step 6: Completion Screen
- View your stats (time, wrong attempts)
- Sign the logbook (optional)
- See recent logbook entries
- Try again or browse more hunts

## Debug Features

### Debug Panel Controls
- **Enable/Disable Debug Mode**: Toggle location simulation
- **Simulate Being At**: Click any location to set your position
- **Current Location**: Shows which location you're simulating
- **Clear**: Remove simulated location to use real GPS

### Debug Mode Persistence
- Enabled via `?debug=true` in URL
- Persists in localStorage
- Can be toggled on/off from the debug panel

## Testing Without Debug Mode

To test with real geolocation:
1. Disable debug mode in the panel
2. Use browser dev tools to mock your GPS coordinates:
   - Chrome: DevTools → Console → Three dots → More tools → Sensors
   - Set custom location coordinates

### Fremont Hunt Coordinates
```
Troll:    47.6540, -122.3476
Lenin:    47.6546, -122.3505
Ophelia:  47.6519, -122.3490
Gasworks: 47.6456, -122.3344
```

## Common Issues

### "No active session found"
- Make sure you started the hunt from the hunt detail page
- Check localStorage for 'current-session-id'

### Location check fails
- Verify database is running: `docker compose ps`
- Check browser console for errors
- Try enabling debug mode

### Puzzle answers not working
- Answers are case-insensitive and strip non-alphanumeric characters
- Number codes are zero-padded (e.g., "27" becomes "27")
- Word codes are uppercase (e.g., "russia" becomes "RUSSIA")

## API Testing

You can also test the API directly:

```bash
# Get hunts
curl http://localhost:3000/api/hunts

# Get hunt details
curl http://localhost:3000/api/hunts/fremont_hidden_corners

# Start a session (replace CLIENT_ID with any UUID)
curl -X POST http://localhost:3000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"huntId":"fremont_hidden_corners","clientId":"test-client-123"}'

# Check location (use session ID from above)
curl -X POST http://localhost:3000/api/session/SESSION_ID/location-check \
  -H "Content-Type: application/json" \
  -d '{"locationId":"troll","lat":47.6540,"lng":-122.3476}'

# Validate puzzle
curl -X POST http://localhost:3000/api/session/SESSION_ID/validate-puzzle \
  -H "Content-Type: application/json" \
  -d '{"locationId":"troll","answer":"27"}'
```

## Database Inspection

View the database with Prisma Studio:

```bash
npx prisma studio
```

This opens a web UI at http://localhost:5555 where you can:
- Browse all hunts and locations
- See active play sessions
- View logbook entries
- Manually edit data for testing

## Resetting Everything

To start fresh:

```bash
# Reset database and reseed
npm run db:reset

# Clear browser data
# - Open DevTools → Application → Local Storage
# - Delete all keys for localhost:3000
```
