
---

### `CLAUDE.md`
```markdown
# CLAUDE.md
Instructions for Claude Code implementation: Seattle Puzzle Hunts v1

## Overview
Build a mobile-first Next.js + TypeScript app implementing the v1 feature set:
- Linear hunts seeded from JSON
- Location-check -> puzzle -> riddle -> next location flow
- Two puzzle UIs: number_code (numeric input) and word_code (letter wheel)
- Session tracking (anonymous sessionId stored in localStorage)
- Server-side validation and counters
- Completion screen + logbook

This document is prescriptive — follow exactly unless otherwise noted.

---

## Project setup (task 0)
- Initialize Next.js app (App Router) with TypeScript.
- Install dependencies:
  - `prisma`, `@prisma/client`
  - `tailwindcss`, `postcss`, `autoprefixer`
  - `shadcn/ui` (see shadcn setup commands)
  - `uuid` (for client session ids)
  - `dotenv`
- Copy `spec/prisma.schema.prisma` to `prisma/schema.prisma`.
- Run `npx prisma generate` and `npx prisma db push` (or migrate).

**Acceptance:** Prisma client builds without errors.

---

## DB & Prisma (task 1)
- Implement models as in `spec/prisma.schema.prisma`.
- Generate Prisma client.

**Acceptance tests:**
- `npx prisma studio` shows the `Hunt`, `Location`, `PlaySession`, `LogbookEntry` models.

---

## Seed script (task 2)
- Implement `scripts/seed-hunts.ts` (Node + Prisma) that:
  - Reads JSON files from `spec/` (e.g., `example_hunt_fremont.json`)
  - Upserts `Hunt` and `Location` records
  - Stores `puzzleAnswer` exactly as provided (numbers as zero-padded strings; words uppercase)

**Acceptance tests:**
- Run `pnpm run seed` -> DB contains seeded hunts and locations.

---

## API (task 3)
Implement minimal server endpoints (Next.js API or app route handlers):

1. `GET /api/hunts`  
   - Return summarized hunt list (id, title, neighborhood, estimated_time_minutes)
   - **Must not include puzzle answers**

2. `GET /api/hunts/:id`  
   - Return hunt details (including locations), but **exclude** `puzzleAnswer` fields.
   - Include `puzzleAnswerLength` (but not the answer).

3. `POST /api/session/start`  
   - Body: `{ huntId, clientId }`  
   - Create PlaySession record (clientId from localStorage uuid)
   - Return `{ sessionId }`

4. `POST /api/session/:sessionId/location-check`
   - Body: `{ locationId, lat, lng }`
   - Compute haversine distance between provided lat/lng and location coords.
   - If within hunt.global_location_radius_meters (default: 40m) => return `{ inRadius: true }`
   - Else: increment PlaySession.wrongLocationChecks, return `{ inRadius: false }`

5. `POST /api/session/:sessionId/validate-puzzle`  
   - Body: `{ locationId, answer }`
   - Normalize incoming answer:
     - If `word_code`: strip non-alpha, uppercase, compare length & equality
     - If `number_code`: strip non-digits, zero-pad to answer_length, compare equality
   - If correct -> return `{ correct: true }`
   - If incorrect -> increment PlaySession.wrongPuzzleGuesses and return `{ correct: false }`
   - **Important:** Server should fetch `puzzleAnswer` from DB for comparison. Do NOT send answer to client.

6. `POST /api/session/:sessionId/complete`  
   - Mark PlaySession.completedAt and compute totalTimeSeconds if possible.

7. `POST /api/logbook`  
   - Body: `{ huntId, sessionId?, name?, message? }`  
   - Insert LogbookEntry

**Acceptance tests:**
- No GET endpoint should ever reveal `puzzleAnswer`.
- Test validation endpoint with correct/incorrect inputs; DB counters update.

---

## Frontend scaffold & pages (task 4)
Create pages & components (mobile-first). Use shadcn/ui components for UI primitives (Buttons, Dialogs, Sheet, Tabs, Form controls).

Key pages:
- `/hunts` — lists hunts
- `/hunts/[huntId]` — overview + start button (disabled until in radius)
- `/hunts/[huntId]/play` — play flow
  - `LocationView` (shows narrative snippet, Search for clues button, puzzle UI)
  - `PuzzleNumber` (3-digit/2-digit dial or numeric input UI)
  - `PuzzleWord` (letter wheel or fixed letter selectors)
  - `Completion` — summary + logbook form

**Frontend behavior:**
- Use `navigator.geolocation.getCurrentPosition()` for location.
- Round lat/lng to reasonable precision; send to server for check.
- Store `sessionId` in localStorage; create a new session at start if none.
- For UI framework: use Tailwind + shadcn/ui. Keep styles minimal and touch-friendly.

**Acceptance tests:**
- Hunt list loads, overview displays start coordinate preview and Start button disabled if outside radius.
- When within radius (simulate via devtools geolocation), Start unlocks and creates session.
- Search for clues triggers `location-check`.
- Puzzle input enforces length and prevents submission if length incorrect.

---

## UX & Input components (task 5)
- `DialInput` or numeric input: enforce `answer_length`. Support keyboard input fallback for accessibility.
- `LetterWheel` / fixed letter inputs: present `answer_length` letter selectors. Allow keyboard typing into a single field but disallow extra length.

**Acceptance tests:**
- Enforce fixed-length inputs client-side.
- Validate correct & incorrect flows via API.

---

## Completion & Logbook (task 6)
- Show stats: time elapsed, wrongLocationChecks, wrongPuzzleGuesses.
- Logbook: POST to `/api/logbook` and show last 10 entries.

**Acceptance tests:**
- Completed run produces accurate counts.
- Logbook entries saved and listed.

---

## QA & Edge Cases (task 7)
- Graceful handling when geolocation permission denied: show clear error + instructions.
- If GPS accuracy is poor (accuracy > 50m), show hint to move or use better signal.

**Acceptance tests:**
- Deny permissions -> app advises enabling.
- Low-accuracy reading triggers accuracy message.

---

## Deliverables (final)
- Running Next.js app with full play flow for sample Fremont hunt
- Prisma schema & migrations
- Seed script and seeded DB
- README, CLAUDE.md, spec files

---

## Rich Text Formatting System

All text fields (narrative snippets, puzzle prompts, location found text, success text, riddles) support custom rich text formatting syntax.

### Supported Syntax

#### Handwritten Notes (Multiple Styles)
Display text as if handwritten on paper or walls - perfect for clues, notes, or messages.

- `{{handwritten}}text{{/handwritten}}` - Default handwriting style (Caveat font)
- `{{handwritten:scrawl}}text{{/handwritten}}` - Messy/hurried writing (Indie Flower)
- `{{handwritten:elegant}}text{{/handwritten}}` - Fancy cursive (Dancing Script)
- `{{handwritten:graffiti}}text{{/handwritten}}` - Street art style (Permanent Marker)

Handwritten blocks are displayed in a separate styled box with amber-tinted background.

**Note:** Handwritten blocks support nested formatting! You can use colors, bold, and italic inside handwritten text:
- `{{handwritten}}Find the **{{color:red}}red{{/color}}** door{{/handwritten}}`

#### Inline Formatting
- `**bold text**` - Bold text
- `*italic text*` - Italic text

#### Colored Text
- `{{color:red}}text{{/color}}` - Red text
- `{{color:blue}}text{{/color}}` - Blue text
- `{{color:green}}text{{/color}}` - Green text
- `{{color:yellow}}text{{/color}}` - Yellow text
- `{{color:orange}}text{{/color}}` - Orange text
- `{{color:purple}}text{{/color}}` - Purple text

#### Images
- `{{image:/puzzle-images/your-image.jpg}}` - Embed an inline image

Images should be placed in the `/public/puzzle-images/` directory and referenced with the path starting from `/puzzle-images/`.

#### Line Breaks
- `\n\n` - Double newline creates a paragraph break
- Single `\n` is ignored (allows line wrapping in JSON without affecting display)

### Example JSON Usage

```json
{
  "hunt_intro_text": "Welcome to the adventure! Your journey begins here...",
  "location_riddle": "On the wall, scrawled in hasty handwriting:\n\n{{handwritten:scrawl}}Meet me at the old bridge at midnight{{/handwritten}}\n\nWhat could this mean?",
  "location_found_text": "You've discovered the hidden alcove!\n\n{{image:/puzzle-images/alcove-clue.jpg}}\n\nFind the **four-digit code** written in {{color:red}}red paint{{/color}} on the north wall.",
  "puzzle_success_text": "Well done! You decoded the message.\n\nThe elegant script reads:\n\n{{handwritten:elegant}}The treasure lies where the river bends{{/handwritten}}"
}
```

### Best Practices

1. **Handwriting Styles**: Match the story context:
   - `scrawl` - Urgent messages, graffiti, quick notes
   - `elegant` - Formal invitations, old manuscripts, fancy signs
   - `graffiti` - Street art, rebellious messages, modern urban clues
   - `default` - General handwritten notes, casual messages
2. **Nested Formatting**: Use colors, bold, and italic inside handwritten blocks for emphasis
3. **Images**: Use sparingly. Best for essential visual clues that can't be described in text.
4. **Colored Text**: Use for emphasis on specific words/phrases, not entire paragraphs.
5. **Formatting**: Don't overuse. Clear, simple text is often more effective than heavy formatting.

### Technical Notes

- All text is parsed on render using a custom parser (`lib/text-parser.ts`)
- Handwriting fonts are loaded via Next.js font optimization
- Images are rendered using Next.js Image component for optimization
- Handwritten blocks support recursive parsing for nested formatting (colors, bold, italic)

---

## Puzzle Types Reference

All available puzzle input types and their configuration.

### Number-Based Puzzles

#### `number_code.cryptex` (Numeric Cryptex Wheels)
- **Description:** Rotating digit wheels (0-9), cryptex-style
- **Answer Format:** Zero-padded number string
- **Interactions:** Swipe/drag/scroll wheels, arrow buttons
- **Use Cases:** Visual combination locks, tactile number entry
- **Example JSON:**
```json
{
  "type": "number_code.cryptex",
  "answer": "3725",
  "answer_length": 4
}
```
**Note:** Puzzle instructions should be included in the `location_found_text` field, not in the puzzle object.

#### `number_code.safe` (Safe Dial)
- **Description:** Realistic safe dial with double-digit numbers (00-99)
- **Answer Format:** Array of numbers (e.g., [62, 31, 12, 12])
- **Interactions:** Drag to rotate dial, auto-snaps to nearest number when released
- **Visual Design:** Shows every 10th number (0, 10, 20...90) with tick marks for individual numbers
- **Use Cases:** Safe combinations, mechanical puzzle locks
- **Example JSON:**
```json
{
  "type": "number_code.safe",
  "answer": [15, 30, 45],
  "answer_length": 3
}
```
**Note:** The dial supports double-digit numbers (00-99). Each entry in the answer array represents one dial turn. The `answer_length` indicates how many numbers the user must enter.

### Word-Based Puzzles

#### `word_code` (Letter Cryptex)
- **Description:** Rotating letter wheels (A-Z), cryptex-style
- **Answer Format:** Uppercase word (e.g., "BOOK")
- **Interactions:** Swipe/drag/scroll wheels, arrow buttons
- **Use Cases:** Word locks, letter combinations
- **Example JSON:**
```json
{
  "type": "word_code",
  "answer": "BOOK",
  "answer_length": 4
}
```

#### `tile_word` (Tile Word Builder)
- **Description:** Drag-and-drop letter tiles into slots
- **Answer Format:** Uppercase word
- **Interactions:** HTML5 drag-and-drop
- **Use Cases:** Anagrams, torn signs, scrambled letters
- **Example JSON:**
```json
{
  "type": "tile_word",
  "prompt": "Rearrange the tiles: B, O, O, K",
  "answer": "BOOK",
  "answer_length": 4
}
```
**Note:** Tiles can be specified in the prompt or puzzle configuration.

### Sequence Puzzles

#### `directional_code` (Directional Pad)
- **Description:** Arrow buttons for Up/Down/Left/Right sequences
- **Answer Format:** Compressed string using UDLR (e.g., "URDL")
- **Interactions:** Tap directional buttons
- **Use Cases:** Paths, dance moves, navigation instructions
- **Example JSON:**
```json
{
  "type": "directional_code",
  "prompt": "Follow the path: Up, Right, Down, Left",
  "answer": "URDL",
  "answer_length": 4
}
```

#### `simon_code` (Simon Pattern)
- **Description:** 4 colored buttons (Red, Green, Blue, Yellow)
- **Answer Format:** Color initials (e.g., "RGYB")
- **Interactions:** Tap colored buttons in sequence
- **Use Cases:** Color patterns, glowing symbols, Simon-style memory
- **Example JSON:**
```json
{
  "type": "simon_code",
  "prompt": "Tap the colors in the correct order",
  "answer": "RGYB",
  "answer_length": 4
}
```

#### `morse_code` (Morse Code Tap)
- **Description:** Single tap button for dots and dashes
- **Answer Format:** Morse code string (e.g., "...---...")
- **Interactions:** Quick tap = dot, long press = dash
- **Use Cases:** Telegraph messages, lighthouse signals
- **Example JSON:**
```json
{
  "type": "morse_code",
  "prompt": "Tap the morse code: SOS",
  "answer": "...---...",
  "answer_length": 9
}
```

### Binary Puzzles

#### `toggle_code` (Toggle Switches)
- **Description:** On/Off switches in a panel
- **Answer Format:** Binary string (e.g., "101100")
- **Interactions:** Toggle switches on/off
- **Use Cases:** Circuit breakers, power switches, fusebox
- **Example JSON:**
```json
{
  "type": "toggle_code",
  "prompt": "Set switches to the correct pattern",
  "answer": "101100",
  "answer_length": 6
}
```

### Image Puzzles

#### `slide_puzzle` (3x3 Slide Puzzle)
- **Description:** Classic sliding tile puzzle with custom image
- **Answer Format:** "SOLVED" (auto-validated when puzzle is completed)
- **Interactions:** Tap tiles adjacent to empty space to slide them
- **Use Cases:** Image-based puzzles, photo clues, visual recognition
- **Features:**
  - 3x3 grid (8 tiles + 1 empty space)
  - Image automatically split into 9 sections
  - Scrambled with 20-30 random moves (always solvable)
  - Smooth slide animations
  - Auto-validates when solved
  - Mobile-friendly touch interactions
- **Image Requirements:**
  - Square images work best
  - Store in `/public/puzzle-images/` directory
  - Reference with path like `/puzzle-images/your-image.jpg`
  - Recommended size: 300x300px or larger
- **Example JSON:**
```json
{
  "type": "slide_puzzle",
  "answer": "SOLVED",
  "answer_length": 6
}
```
**Note:** For slide puzzles, the image should be specified in the JSON using the `{{image:/puzzle-images/your-image.jpg}}` syntax within the `location_found_text` field. The puzzle instructions and image display should all be part of the location text.

### Testing Page

Visit `/test/puzzles` to test all puzzle input types with example answers. This page showcases all available inputs without requiring a full hunt flow.

---

## Handoff notes for future dev
- For authoring hunts, JSON is primary canonical source; consider building an admin UI later.
- Add hints, multi-language support, and optional user accounts in v2.
- Test page at `/test/puzzles` demonstrates all puzzle types.

---

## Deployment & Production Management

This section covers deploying and managing the application in production.

### Target Stack

- **Hosting:** Vercel (frontend + serverless API routes)
- **Database:** Neon Postgres (serverless PostgreSQL)
- **Environment:** Production & Preview environments

### First-Time Deployment

**Prerequisites:**
- Vercel account (free tier works)
- Neon account (free tier works)
- GitHub repository (or GitLab/Bitbucket)

**Steps:**

1. **Create Neon Database**
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project (choose a region near your users)
   - Copy the connection string (starts with `postgresql://`)
   - Format: `postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require`

2. **Connect GitHub to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Select the repository
   - Configure project:
     - Framework Preset: Next.js
     - Root Directory: `./`
     - Build Command: `npm run build` (default)
     - Output Directory: `.next` (default)

3. **Add Environment Variables**
   - In Vercel project settings → Environment Variables
   - Add `DATABASE_URL` with your Neon connection string
   - Apply to: Production, Preview, and Development

4. **Deploy**
   - Click "Deploy" - Vercel will build and deploy
   - Build will succeed but database is empty

5. **Initialize Database Schema**
   ```bash
   # Install Vercel CLI (one-time)
   npm install -g vercel

   # Link to your Vercel project
   vercel link

   # Pull production environment variables
   vercel env pull .env.production.local

   # Push database schema
   DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npx prisma db push
   ```

6. **Seed Hunt Data**
   ```bash
   DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npm run seed
   ```

7. **Verify Deployment**
   - Visit your production URL (e.g., `https://your-project.vercel.app`)
   - Check `/hunts` to see seeded hunts
   - Test `/test/puzzles` to verify puzzle components

**Acceptance:** Production site loads, hunts are visible, database queries work.

---

### Development Phase Deployments (Overwrite-Safe)

During development, you can freely reset and re-seed the database. No user data needs to be preserved.

**Workflow for updating hunts:**

1. Edit hunt JSON files in `/data/hunts/`
2. Test locally:
   ```bash
   npm run seed
   npm run dev
   ```
3. Commit and push:
   ```bash
   git add data/hunts/
   git commit -m "Update Fremont hunt puzzle text"
   git push
   ```
4. Re-seed production:
   ```bash
   vercel env pull .env.production.local
   DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npm run seed
   ```

**Note:** The seed script uses `upsert` operations, so it's safe to run multiple times. It will update existing hunts and create new ones.

**If you need to completely reset production DB:**

```bash
# Pull env vars
vercel env pull .env.production.local

# Reset schema (WARNING: drops all data)
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npx prisma db push --force-reset

# Re-seed
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npm run seed
```

---

### Production Phase Deployments (Preserve User Data)

Once you launch to real users, you must preserve `PlaySession` and `LogbookEntry` data while updating `Hunt` and `Location` data.

**Migration Strategy:**

1. **Switch to Prisma Migrations**

   Instead of `prisma db push`, use migrations:

   ```bash
   # Create initial migration (one-time)
   npx prisma migrate dev --name init
   ```

   This creates a migration file in `/prisma/migrations/`.

2. **Update Schema and Hunt Data**

   When changing the schema (adding fields, etc.):

   ```bash
   # Edit prisma/schema.prisma
   # Create migration
   npx prisma migrate dev --name add_hunt_difficulty

   # Commit migration files
   git add prisma/migrations/
   git commit -m "Add hunt difficulty field"
   git push
   ```

   In production:

   ```bash
   # Pull env
   vercel env pull .env.production.local

   # Apply migration
   DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npx prisma migrate deploy
   ```

3. **Update Hunt Content (Without Dropping Data)**

   To update hunt text, puzzles, or locations:

   - Edit hunt JSON files in `/data/hunts/`
   - Push changes to GitHub
   - Re-run seed script (it uses upsert, won't delete logbook data):
     ```bash
     DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npm run seed
     ```

   **Important:** The seed script only touches `Hunt` and `Location` tables. It never modifies `PlaySession` or `LogbookEntry`.

4. **Testing Migrations**

   Use Neon's branching feature to test migrations safely:

   - Create a branch in Neon dashboard
   - Copy production data to branch
   - Run migration on branch
   - Test thoroughly
   - Apply to main branch when confident

**Acceptance:** Existing logbook entries and play sessions persist after deploying new hunt content.

---

### Hunt Management Best Practices

**Versioning Hunt Content:**

1. Keep hunt JSONs in version control
2. Use descriptive commit messages for hunt changes
3. Test hunt changes locally before deploying

**Common Hunt Update Scenarios:**

| Scenario | Steps | Safe for Production? |
|----------|-------|---------------------|
| Fix typo in riddle | Edit JSON → commit → push → re-seed | Yes (upsert won't affect logbook) |
| Add new hunt | Add JSON file → commit → push → re-seed | Yes (creates new hunt) |
| Change puzzle answer | Edit JSON → commit → push → re-seed | **No** (invalidates in-progress sessions) |
| Add new location to hunt | Edit JSON → commit → push → re-seed | **No** (breaks in-progress sessions) |
| Adjust GPS radius | Edit JSON → commit → push → re-seed | Yes (only affects new sessions) |

**For Breaking Changes (answer/location changes):**

1. Mark old hunt as inactive (add `active: false` field - requires schema update)
2. Create new version of hunt with new ID (e.g., `fremont_hidden_corners_v2`)
3. Allow in-progress sessions to finish old version
4. Promote new version after grace period

---

### Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |

**Local Development:**
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/seattle_puzzle_hunt"
```

**Production (Neon):**
```bash
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.us-west-2.aws.neon.tech/neondb?sslmode=require"
```

---

### Monitoring & Debugging

**Database Access:**

```bash
# Pull production env vars
vercel env pull .env.production.local

# Open Prisma Studio connected to production
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npx prisma studio
```

**Vercel Logs:**

- Go to Vercel Dashboard → Your Project → Deployments
- Click on a deployment → View Function Logs
- Filter by API route to debug issues

**Common Issues:**

1. **Build fails with Prisma error**
   - Ensure `postinstall` script runs `prisma generate`
   - Check that `DATABASE_URL` is set in Vercel env vars

2. **Database connection fails**
   - Verify Neon connection string format
   - Ensure `?sslmode=require` is appended
   - Check Neon project is not suspended (free tier sleeps after inactivity)

3. **Seed script fails**
   - Check hunt JSON syntax with `npm run seed` locally first
   - Verify Prisma schema matches database

---

### Backup & Recovery

**Neon Backups:**

- Neon automatically backs up your database
- Free tier: 7 days of point-in-time recovery
- Paid tier: 30 days

**Manual Backup:**

```bash
# Dump production database
vercel env pull .env.production.local
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) \
  pg_dump -Fc > backup-$(date +%Y%m%d).dump

# Restore from backup
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) \
  pg_restore -d $DATABASE_URL backup-20250101.dump
```

**Export Logbook Data:**

```bash
# Connect to production and export logbook entries as JSON
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) \
  psql -c "COPY (SELECT * FROM \"LogbookEntry\") TO STDOUT WITH CSV HEADER" > logbook.csv
```

---

### Cost Expectations

**Vercel (Hobby Plan - Free):**
- 100 GB-hours compute/month
- Unlimited deployments
- Sufficient for 1000s of hunt completions/month

**Neon (Free Tier):**
- 0.5 GB storage
- Always-available compute (sleeps after 5 min inactivity)
- 100 compute hours/month
- Sufficient for testing and small-scale launch

**Estimated costs for 1000 monthly active users:**
- Vercel: Free (within hobby limits)
- Neon: $0-19/month (may need paid tier for active hours)

---

### Deployment Checklist

**Before First Deploy:**
- [ ] Create Neon database project
- [ ] Copy connection string
- [ ] Connect GitHub repo to Vercel
- [ ] Add `DATABASE_URL` to Vercel env vars
- [ ] Deploy from Vercel dashboard
- [ ] Run `prisma db push` against production
- [ ] Run seed script against production
- [ ] Test production site

**Before Each Hunt Update (Development):**
- [ ] Edit hunt JSON locally
- [ ] Test with `npm run seed && npm run dev`
- [ ] Commit and push to GitHub
- [ ] Re-seed production database
- [ ] Test on production URL

**Before Going Live:**
- [ ] Review all hunt content for errors
- [ ] Test all hunts end-to-end on mobile devices
- [ ] Set up Prisma migrations (`prisma migrate dev --name init`)
- [ ] Document migration workflow for team
- [ ] Consider setting up staging environment (Neon branch + Vercel preview)
- [ ] Monitor Vercel function logs for errors

**After Launch (Ongoing):**
- [ ] Use migrations for schema changes
- [ ] Test hunt updates on staging before production
- [ ] Monitor Neon database usage
- [ ] Back up logbook data regularly
- [ ] Review Vercel analytics for performance issues

---

