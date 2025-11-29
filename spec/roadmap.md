# Roadmap & step-by-step plan (what to ask Claude to implement first)

This is the exact prioritized checklist to hand to Claude Code. Each step includes how to test it.

---

## Phase 0 — Scaffold & DB
1. Scaffold Next.js TypeScript app, Tailwind, shadcn/ui setup.
   - Test: dev server runs, Tailwind utilities apply.
2. Add Prisma & copy `spec/prisma.schema.prisma`. Generate and push schema.
   - Test: `npx prisma studio` shows models.

## Phase 1 — Seed & API
3. Add `scripts/seed-hunts.ts` to seed `spec/*.json`.
   - Test: run seed -> DB populated.
4. Implement API endpoints for hunts (no answers exposed).
   - Test: GET endpoints return hunt JSON without `puzzleAnswer`.
5. Implement session APIs: start, location-check, validate-puzzle, complete, logbook.
   - Test: Using curl or Postman, ensure validation endpoints behave and DB counters update.

## Phase 2 — Frontend basic flow
6. Hunt list and Hunt overview pages (Start button disabled outside radius).
   - Test: simulate geolocation to unlock start.
7. Play page with LocationView & Search for clues which calls location-check and reveals puzzle.
   - Test: location check success reveals puzzle, failure increments strike.
8. Puzzle UI components (number_code, word_code) with length enforcement.
   - Test: submit correct/incorrect; server updates play session counters.
9. Completion screen & logbook.
   - Test: end-to-end run, submit logbook entry.

## Phase 3 — Polish & QA
10. Accessibility, GPS edge-cases, small UI polish, and mobile layout tweaks.
   - Test: deny geolocation, low accuracy handling, keyboard input support.

---

## How to test on a phone
- Deploy to a preview URL (Vercel) or run `pnpm dev` and connect phone to dev machine via LAN + modify `HOST` as needed.
- Use real GPS to test radius behavior (preferred).

---

## What to ask Claude to implement first
1. Project scaffold + Prisma schema
2. Seed script + example JSON
3. Minimal APIs (hunts + validation)
4. Hunt list + overview + play shell (without puzzle widgets)
5. Puzzle widgets + validation wiring
6. Completion & logbook
7. QA & polish

Each step should be merged into its own branch with an accompanying PR and brief testing notes.


