# Seattle Puzzle Hunt - Setup Instructions

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start PostgreSQL with Docker

```bash
docker compose up -d
```

This will:
- Start PostgreSQL in a Docker container
- Create the `seattle_puzzle_hunt` database automatically
- Expose it on port 5432
- Persist data in a Docker volume

Check that it's running:
```bash
docker compose ps
```

To stop the database later:
```bash
docker compose down
```

To stop and remove all data:
```bash
docker compose down -v
```

### 3. Push Database Schema

```bash
npx prisma db push
```

This will create all the necessary tables in your database.

### 4. Seed the Database

```bash
npm run seed
```

This will load the Fremont hunt from `spec/example_hunt_fremont.json` into the database.

### 5. Start the Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Testing the App

1. Open http://localhost:3000
2. Click "View Hunts"
3. Select the "Fremont: Hidden Corners" hunt
4. Click "Start Hunt" (you'll need to allow location access)

**Note:** To actually start the hunt, you'll need to be within 40 meters of the first location (The Fremont Troll). For testing purposes, you can:
- Use browser dev tools to mock your geolocation
- Temporarily modify the hunt's `globalLocationRadiusMeters` in the database

## Database Management

### View Database in Prisma Studio

```bash
npx prisma studio
```

### Reset Database

```bash
npx prisma db push --force-reset
npm run seed
```

## Project Structure

```
/app                    - Next.js app router pages
  /api                  - API route handlers
  /hunts                - Hunt browsing and play pages
/lib                    - Shared utilities (Prisma client)
/prisma                 - Database schema
/scripts                - Seed scripts
/spec                   - Hunt data and specifications
```

## Known Issues

1. **Schema Issue Fixed:** The original Prisma schema was missing the reverse relation for `LogbookEntry`. This has been fixed by adding `logbookEntries` to the `PlaySession` model.

## Next Steps

The current skeleton includes:
- ✅ Basic hunt listing and detail pages
- ✅ Location checking API
- ✅ Puzzle validation API
- ✅ Session management
- ⏳ Play page (placeholder - needs puzzle UI implementation)
- ⏳ Completion screen
- ⏳ Logbook UI

To complete the MVP, you'll need to implement:
- Puzzle input components (number and word code)
- Full play flow with location navigation
- Completion screen with stats
- Logbook display
