# Deployment Guide: Seattle Puzzle Hunts

This guide walks you through deploying the Seattle Puzzle Hunts app to production using **Vercel** (hosting) and **Neon** (database).

## Table of Contents

- [First-Time Deployment](#first-time-deployment)
- [Regular Deployments](#regular-deployments)
- [Updating Hunt Content](#updating-hunt-content)
- [Database Management](#database-management)
- [Troubleshooting](#troubleshooting)
- [Going to Production](#going-to-production)

---

## First-Time Deployment

Follow these steps to deploy your app for the first time.

### Step 1: Create a Neon Database

1. **Sign up for Neon**
   - Go to [neon.tech](https://neon.tech)
   - Sign up for a free account (no credit card required)

2. **Create a new project**
   - Click "Create Project"
   - Name it something like `seattle-puzzle-hunt`
   - Choose a region (select one close to your users, e.g., US West for Seattle)
   - Click "Create Project"

3. **Get your connection string**
   - After project creation, you'll see a connection string
   - It looks like: `postgresql://username:password@ep-xxx-xxx.us-west-2.aws.neon.tech/neondb?sslmode=require`
   - **Copy this entire string** - you'll need it in the next step
   - You can always find it later in Settings → Connection Details

4. **Keep the tab open** - you'll verify the connection later

---

### Step 2: Connect GitHub to Vercel

1. **Push your code to GitHub** (if you haven't already)
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Sign up for Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign Up"
   - Choose "Continue with GitHub" for easy integration

3. **Import your repository**
   - Click "Add New..." → "Project"
   - You'll see your GitHub repositories
   - Find `seattle-puzzle-hunt` and click "Import"

4. **Configure the project**
   - **Framework Preset:** Next.js (should auto-detect)
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (leave as default)
   - **Output Directory:** `.next` (leave as default)
   - **Install Command:** `npm install` (leave as default)

5. **Add environment variables**
   - Expand "Environment Variables"
   - Add a new variable:
     - **Key:** `DATABASE_URL`
     - **Value:** Paste the Neon connection string you copied in Step 1
     - **Environment:** Check all three boxes (Production, Preview, Development)
   - Click "Add"

6. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your app (takes 2-3 minutes)
   - **The build will succeed, but the database will be empty** - we'll fix that next

7. **Copy your production URL**
   - After deployment, you'll see a URL like `https://seattle-puzzle-hunt-xxx.vercel.app`
   - Keep this handy

---

### Step 3: Initialize the Database

Now we'll set up the database schema and seed it with hunt data from your local machine.

1. **Install Vercel CLI** (one-time setup)
   ```bash
   npm install -g vercel
   ```

2. **Link your project**
   ```bash
   vercel link
   ```

   Answer the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **Yes**
   - What's the name? `seattle-puzzle-hunt` (or whatever you named it)
   - Directory location? `.` (press Enter)

3. **Pull environment variables**
   ```bash
   vercel env pull .env.production.local
   ```

   This creates a `.env.production.local` file with your production `DATABASE_URL`.

4. **Push database schema**
   ```bash
   DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npx prisma db push
   ```

   This creates the tables (`Hunt`, `Location`, `PlaySession`, `LogbookEntry`) in your Neon database.

   You should see output like:
   ```
   ✔ Generated Prisma Client
   ✔ Successfully applied schema to database
   ```

5. **Seed hunt data**
   ```bash
   DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npm run seed
   ```

   This loads the hunt JSON files from `/data/hunts/` into your database.

   You should see output like:
   ```
   ✅ Seeding complete! Loaded 2 hunts with X locations.
   ```

---

### Step 4: Verify Deployment

1. **Visit your production site**
   - Go to your Vercel URL (e.g., `https://seattle-puzzle-hunt-xxx.vercel.app`)

2. **Check the hunt list**
   - Navigate to `/hunts`
   - You should see "Fremont: Hidden Corners" and "Phinney Ridge: The Phantom"

3. **Test puzzle components**
   - Navigate to `/test/puzzles`
   - Verify all puzzle types load correctly

4. **Check database in Neon**
   - Go back to your Neon dashboard
   - Click "SQL Editor" in the sidebar
   - Run this query:
     ```sql
     SELECT title, neighborhood FROM "Hunt";
     ```
   - You should see your seeded hunts

**Congratulations!** Your app is now deployed and running in production.

---

## Regular Deployments

Once your app is set up, deploying updates is automatic.

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes to your code
# Test locally with npm run dev

# Commit and push
git add .
git commit -m "Update hunt intro text"
git push origin main
```

Vercel will:
- Detect the push
- Build your app
- Deploy to production (usually in 2-3 minutes)
- You'll get a notification when it's live

### Preview Deployments

Every pull request gets its own preview deployment:
- Create a feature branch
- Push to GitHub
- Open a PR
- Vercel creates a unique preview URL
- Test before merging to main

---

## Updating Hunt Content

Hunt content (puzzles, locations, riddles) is stored in JSON files in `/data/hunts/`.

### During Development (Data Can Be Overwritten)

1. **Edit hunt JSON files**
   ```bash
   # Edit files in /data/hunts/
   # For example: data/hunts/fremont_hidden_corners.json
   ```

2. **Test locally**
   ```bash
   npm run seed        # Reload hunt data into local DB
   npm run dev         # Test in browser
   ```

3. **Commit and push**
   ```bash
   git add data/hunts/
   git commit -m "Fix typo in Fremont hunt riddle"
   git push
   ```

4. **Re-seed production database**
   ```bash
   # Pull latest env vars (if needed)
   vercel env pull .env.production.local

   # Re-seed production
   DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npm run seed
   ```

**Note:** The seed script uses `upsert` operations, so it's safe to run multiple times. It updates existing hunts and creates new ones.

### After Launch (Preserve User Data)

Once you have real players, you need to preserve `PlaySession` and `LogbookEntry` data. The seed script only touches `Hunt` and `Location` tables, so it's safe to run.

**Safe updates:**
- Fix typos in riddles or narrative text
- Adjust GPS radius
- Add new hunts
- Update hunt descriptions

**Unsafe updates (require special handling):**
- Change puzzle answers (invalidates in-progress sessions)
- Add/remove locations from existing hunts (breaks in-progress sessions)

For unsafe updates, see [Going to Production](#going-to-production).

---

## Database Management

### Viewing Production Data

**Option 1: Prisma Studio**

```bash
# Pull env vars
vercel env pull .env.production.local

# Open Prisma Studio connected to production
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npx prisma studio
```

Browse and edit data in a visual interface at `http://localhost:5555`.

**Option 2: Neon SQL Editor**

- Go to your Neon dashboard
- Click "SQL Editor"
- Run queries directly

Example queries:
```sql
-- View all hunts
SELECT * FROM "Hunt";

-- View all logbook entries
SELECT * FROM "LogbookEntry" ORDER BY "createdAt" DESC;

-- Count play sessions per hunt
SELECT h.title, COUNT(ps.id) as sessions
FROM "Hunt" h
LEFT JOIN "PlaySession" ps ON h.id = ps."huntId"
GROUP BY h.title;
```

### Resetting Production Database

**WARNING:** This deletes all data, including logbook entries and play sessions.

Only use during development when you have no real user data.

```bash
# Pull env vars
vercel env pull .env.production.local

# Force reset schema (DROPS ALL TABLES)
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npx prisma db push --force-reset

# Re-seed
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npm run seed
```

### Backing Up Data

**Automated Backups (Neon):**
- Neon automatically backs up your database
- Free tier: 7 days of point-in-time recovery
- Access via Neon dashboard → Backups

**Manual Backup:**

```bash
# Export all data to CSV
vercel env pull .env.production.local

# Backup logbook entries
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) \
  npx prisma studio
# Then use the export feature in Prisma Studio
```

---

## Troubleshooting

### Build Failures

**Error: "Prisma Client not generated"**

- Ensure `postinstall` script in `package.json` includes `prisma generate`
- Check that `DATABASE_URL` is set in Vercel environment variables
- Try re-deploying from Vercel dashboard

**Error: "Cannot find module '@prisma/client'"**

- Same as above - Prisma Client needs to be generated during build
- Verify `package.json` has `postinstall: "prisma generate"`

### Database Connection Issues

**Error: "Can't reach database server"**

1. Check your `DATABASE_URL` format:
   - Should start with `postgresql://`
   - Should end with `?sslmode=require`
   - No extra quotes or spaces

2. Verify Neon project is active:
   - Free tier databases sleep after 5 minutes of inactivity
   - First query after sleep takes longer
   - Check Neon dashboard for project status

3. Test connection locally:
   ```bash
   DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) \
     npx prisma db pull
   ```

**Error: "SSL connection required"**

- Ensure your connection string ends with `?sslmode=require`
- Neon requires SSL connections

### Seed Script Failures

**Error: "Invalid JSON"**

- Validate your hunt JSON files:
  ```bash
  # Use a JSON validator
  cat data/hunts/your-hunt.json | npx jsonlint
  ```

**Error: "Foreign key constraint failed"**

- Ensure `nextLocationId` in your hunt JSON references valid location IDs
- The last location should have `null` as `nextLocationId`

### Runtime Errors

**Check Vercel Logs:**

1. Go to Vercel dashboard
2. Click on your project
3. Click "Deployments"
4. Click on the latest deployment
5. Click "Functions" tab
6. Select an API route to see logs

**Check Neon Logs:**

1. Go to Neon dashboard
2. Click "Monitoring"
3. View query performance and errors

---

## Going to Production

Once you're ready to launch to real users, you need to change how you manage the database.

### <a name="migrations"></a>Switching to Migrations

Instead of using `prisma db push` (which can drop data), use migrations:

1. **Create initial migration** (one-time)
   ```bash
   npx prisma migrate dev --name init
   ```

   This creates a migration file in `/prisma/migrations/`.

2. **Commit migration files**
   ```bash
   git add prisma/migrations/
   git commit -m "Add initial migration"
   git push
   ```

3. **Apply migration to production**
   ```bash
   vercel env pull .env.production.local
   DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) \
     npx prisma migrate deploy
   ```

### Making Schema Changes

When you need to add fields or modify the schema:

1. **Edit `prisma/schema.prisma`**

2. **Create migration**
   ```bash
   npx prisma migrate dev --name add_hunt_difficulty
   ```

3. **Test locally**
   ```bash
   npm run dev
   ```

4. **Commit and push**
   ```bash
   git add prisma/
   git commit -m "Add difficulty field to Hunt model"
   git push
   ```

5. **Apply to production**
   ```bash
   vercel env pull .env.production.local
   DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) \
     npx prisma migrate deploy
   ```

### Handling Breaking Hunt Changes

If you need to change puzzle answers or add/remove locations from an active hunt:

**Option 1: Create a new version of the hunt**

1. Copy the hunt JSON to a new file with `_v2` suffix:
   ```bash
   cp data/hunts/fremont_hidden_corners.json \
      data/hunts/fremont_hidden_corners_v2.json
   ```

2. Update the `id` field:
   ```json
   {
     "id": "fremont_hidden_corners_v2",
     "title": "Fremont: Hidden Corners (Updated)",
     ...
   }
   ```

3. Make your changes, commit, and seed:
   ```bash
   git add data/hunts/
   git commit -m "Add updated version of Fremont hunt"
   git push

   DATABASE_URL=... npm run seed
   ```

4. Old hunt stays active for in-progress sessions
5. New sessions use the new version

**Option 2: Add an "active" field** (requires schema change)

1. Update Prisma schema:
   ```prisma
   model Hunt {
     // ... existing fields
     active Boolean @default(true)
   }
   ```

2. Create migration and apply

3. Mark old hunt as inactive in the JSON or database

4. Create new version and mark as active

### Setting Up Staging Environment

For production, it's recommended to have a staging environment:

1. **Create a Neon branch**
   - In Neon dashboard, click "Branches"
   - Click "New Branch"
   - Name it "staging"
   - This creates a copy of your production data

2. **Set up staging in Vercel**
   - Vercel automatically creates preview deployments for PRs
   - Add `DATABASE_URL_STAGING` environment variable
   - Point it to your Neon staging branch

3. **Test migrations on staging first**
   ```bash
   # Use staging DATABASE_URL
   DATABASE_URL=<staging-url> npx prisma migrate deploy
   DATABASE_URL=<staging-url> npm run seed
   ```

4. **Verify, then apply to production**

---

## Quick Reference

### Common Commands

```bash
# Deploy to production (automatic on git push)
git push origin main

# Re-seed production database
vercel env pull .env.production.local
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npm run seed

# View production database
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npx prisma studio

# Apply migration to production
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npx prisma migrate deploy

# View Vercel logs
vercel logs

# Check deployment status
vercel ls
```

### Environment Variables

| Environment | DATABASE_URL |
|-------------|--------------|
| Local Development | `postgresql://postgres:postgres@localhost:5434/seattle_puzzle_hunt` |
| Production (Neon) | `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require` |

### Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Neon Dashboard:** https://console.neon.tech
- **Prisma Docs:** https://www.prisma.io/docs
- **Vercel Docs:** https://vercel.com/docs
- **Neon Docs:** https://neon.tech/docs

---

## Support

- **Vercel Issues:** Check [Vercel Community](https://github.com/vercel/vercel/discussions)
- **Neon Issues:** Check [Neon Docs](https://neon.tech/docs/introduction) or Discord
- **Prisma Issues:** Check [Prisma Docs](https://www.prisma.io/docs) or Discord

---

**Next Steps:** Return to [README.md](../README.md) for development workflow or [CLAUDE.md](../CLAUDE.md) for implementation details.
