# Seattle Puzzle Hunts

A mobile-first Progressive Web App for handcrafted neighborhood puzzle hunts in Seattle. Players walk to locations, confirm arrival via GPS, solve on-site puzzles, and follow riddles to the next stop.

## Project Overview

**What is this?** Location-based puzzle hunts for casual-but-clever players. Each hunt is a linear sequence of locations around a Seattle neighborhood, combining GPS verification, interactive puzzles, and light riddles.

**Who is this for?** Solo adventurers or small groups looking for a 60-90 minute outdoor puzzle experience—between family-friendly scavenger hunts and hardcore puzzle competitions.

**Current Status:** Development (v1) - Two sample hunts in Fremont and Phinney Ridge

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database:** Neon Postgres + Prisma ORM
- **Hosting:** Vercel (frontend) + Neon (database)
- **Local Dev:** Docker Compose for local PostgreSQL

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+ and npm/pnpm
- Docker Desktop (for local database)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd seattle-puzzle-hunt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start local database**
   ```bash
   npm run db:start
   ```
   This starts a PostgreSQL container on port 5434.

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   The default `.env` should work for local development:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5434/seattle_puzzle_hunt"
   ```

5. **Initialize database**
   ```bash
   npx prisma db push
   ```

6. **Seed hunt data**
   ```bash
   npm run seed
   ```
   This loads hunts from `/data/hunts/` directory.

7. **Start development server**
   ```bash
   npm run dev
   ```

8. **Visit the app**
   - Open [http://localhost:3000](http://localhost:3000)
   - Browse hunts at `/hunts`
   - Test puzzle inputs at `/test/puzzles`

## Production Deployment

This app is designed to deploy on **Vercel** with a **Neon Postgres** database.

### First-Time Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed step-by-step instructions.

**Quick summary:**

1. **Create Neon Database**
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add `DATABASE_URL` environment variable
   - Deploy

3. **Initialize Production Database**
   ```bash
   # Install Vercel CLI if needed
   npm install -g vercel

   # Set up database schema
   vercel env pull .env.production.local
   DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npx prisma db push

   # Seed hunt data
   DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npm run seed
   ```

### Regular Deployments

**During Development (okay to overwrite data):**

When you push to your main branch, Vercel automatically deploys. To update hunts:

```bash
# Edit hunt JSON files in /data/hunts/
# Commit and push changes
git add data/hunts/
git commit -m "Update hunt content"
git push

# Re-seed production database
vercel env pull .env.production.local
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npm run seed
```

**After Launch (preserve user data):**

Once you have real players, you'll need to preserve `PlaySession` and `LogbookEntry` data:

1. Switch to Prisma migrations (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#migrations))
2. Use migration scripts to update `Hunt` and `Location` data without dropping tables
3. Keep logbook data intact

## Managing Hunt Content

### Adding or Editing Hunts

1. **Edit hunt JSON files** in `/data/hunts/`
   - See `/spec/example_hunt_fremont.json` for full schema
   - Follow [CLAUDE.md](CLAUDE.md) for puzzle types and formatting syntax

2. **Test locally**
   ```bash
   npm run seed        # Reload hunt data
   npm run dev         # Test in browser
   ```

3. **Deploy to production**
   ```bash
   git add data/hunts/
   git commit -m "Add new hunt: Capitol Hill"
   git push

   # Re-seed production
   DATABASE_URL=<your-neon-url> npm run seed
   ```

### Hunt JSON Structure

Hunts are defined in `/data/hunts/` as JSON files. Key fields:

- `id` - Unique identifier (e.g., "fremont_hidden_corners")
- `title` - Display name
- `neighborhood` - Seattle neighborhood
- `locations[]` - Array of stops with coordinates, puzzles, riddles

See [CLAUDE.md - Puzzle Types Reference](CLAUDE.md#puzzle-types-reference) for all available puzzle types.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed database from `/data/hunts/` |
| `npm run db:start` | Start local PostgreSQL (Docker) |
| `npm run db:stop` | Stop local PostgreSQL |
| `npm run db:reset` | Reset local DB and re-seed |
| `npm run db:push` | Push schema to database (dev/prod) |
| `npm run db:migrate:dev` | Create migration (for production use) |
| `npm run db:migrate:deploy` | Apply migrations (for production) |

## Project Structure

```
/app/                      # Next.js App Router pages
  /hunts/                  # Hunt list and detail pages
  /api/                    # API routes (hunts, sessions, validation)
  /test/puzzles/           # Puzzle testing page
/components/               # React components
  /ui/                     # shadcn/ui primitives
  /puzzles/                # Puzzle input components (cryptex, safe, tiles, etc.)
/data/hunts/               # Hunt JSON files (canonical source)
/docs/                     # Additional documentation
/lib/                      # Utilities (prisma, geoutils, text-parser)
/prisma/                   # Database schema
/public/puzzle-images/     # Static assets for puzzle clues
/scripts/                  # Seed script
/spec/                     # Original specification files
```

## Features (v1)

- **GPS Location Verification** - Players must be within ~40m to unlock each location
- **Multiple Puzzle Types** - Cryptex wheels, safe dials, word tiles, directional codes, and more
- **Rich Text Formatting** - Handwritten notes, colored text, inline images
- **Session Tracking** - Anonymous play sessions with accuracy counters
- **Digital Logbook** - Players can leave comments after completing a hunt
- **Mobile-First Design** - Touch-optimized puzzle interactions
- **No Accounts Required** - Frictionless play (v1)

## Documentation

- **[CLAUDE.md](CLAUDE.md)** - Comprehensive implementation guide (for AI and developers)
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Detailed deployment instructions
- **[/spec/](spec/)** - Original specification files and data models

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |

Local development uses Docker Compose (see `.env.example`). Production uses Neon Postgres connection string.

## Testing

- **Local Hunt Testing:** Visit `/hunts` and use browser geolocation override to simulate being at hunt locations
- **Puzzle Testing:** Visit `/test/puzzles` to test all puzzle input types without GPS requirements
- **Database Inspection:** Run `npx prisma studio` to browse data

## Roadmap

**v1 (Current):**
- Linear hunts with location verification
- 10+ puzzle input types
- Rich text formatting system
- Anonymous sessions and logbook

**v2 (Future):**
- Hints system
- Multi-language support
- User accounts (optional)
- Admin UI for hunt authoring
- Hunt analytics

## Contributing

Hunt content contributions welcome! See [CLAUDE.md](CLAUDE.md) for hunt authoring guidelines.

## License

MIT (or your preferred license)

## Contact

[Your contact information or team info]

---

**Questions?** Check [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment help or [CLAUDE.md](CLAUDE.md) for development guidance.
