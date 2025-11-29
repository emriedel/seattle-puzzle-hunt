```markdown
# Seattle Puzzle Hunts — v1

A mobile-first Progressive Web App (PWA) for handcrafted neighborhood puzzle hunts in Seattle.  
Players (solo or groups) walk to a starting location, confirm arrival, solve on-site puzzles, and follow light riddles to the next location.

---

## Project Vision
- Casual-but-clever puzzle hunts (between family-friendly and hardcore)
- Linear, curated hunts by neighborhood (Seattle-first)
- Single-device cooperative play (no accounts in v1)
- Location verification + controlled puzzle inputs (number_code, word_code)
- Easy authoring via JSON files

---

## Tech Stack (recommended)
- Frontend: Next.js (App Router), React, TypeScript
- Styling & UI: Tailwind CSS + shadcn/ui components
- DB: Neon Postgres + Prisma ORM
- Host: Vercel (frontend) + Neon Postgres
- Local dev: pnpm or npm

---

## Repo layout (recommended)
```
/spec/
  prisma.schema.prisma
  example_hunt_fremont.json
  data-model.md
  ui_flow.md
  mockups.md
  roadmap.md
/prisma/
  schema.prisma (copied from spec)
/src/
  app/
    /hunts/
      page.tsx
      [huntId]/
        page.tsx
        /play/
          page.tsx
          LocationView.tsx
          PuzzleNumber.tsx
          PuzzleWord.tsx
          Completion.tsx
  components/
    DialInput.tsx
    LetterWheel.tsx
    NarrativeBlock.tsx
    LogbookForm.tsx
  lib/
    prisma.ts
    geoutils.ts
    huntSeed.ts
/scripts/
  seed-hunts.ts
README.md
CLAUDE.md
```

---

## Getting started (developer)
1. Clone the repo.
2. Create a Neon Postgres DB and set `DATABASE_URL` in `.env`.
3. Install packages:
   ```bash
   pnpm install
   ```
4. Generate Prisma client & migrate:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. Seed example hunts:
   ```bash
   pnpm run seed
   ```
   (This runs `scripts/seed-hunts.ts` and ingests `spec/*.json`)

6. Run dev server:
   ```bash
   pnpm dev
   ```

---

## v1 scope (recap)
- Linear hunts only
- Two puzzle types: `number_code`, `word_code`
- Global location radius per hunt (default 40m)
- Must be within radius to unlock each location’s puzzle
- UI enforced, fixed-length puzzle inputs
- Track `wrong_location_checks` and `wrong_puzzle_guesses` per session
- Digital logbook at completion (anonymous)
- Author hunts via JSON files

---

## Important notes
- Do not expose puzzle answers via public GET endpoints. Validation happens via server endpoints.
- Store puzzle answers in DB; server-side validation endpoint compares normalized inputs.
- Use shadcn/ui with Tailwind for a polished, mobile-friendly UI.
```

