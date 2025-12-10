
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
   - If within hunt.global_location_radius_meters => return `{ inRadius: true }`
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

#### Page Breaks
For longer narrative content, you can split text into multiple pages:
- `---PAGE---` - Page break marker

When page breaks are present, users navigate with Next/Back buttons and see a page indicator (e.g., "Page 1 of 3").

### Example JSON Usage

```json
{
  "narrative_snippet": "You arrive at the location and notice something strange.\n\n---PAGE---\n\nOn the wall, scrawled in hasty handwriting:\n\n{{handwritten:scrawl}}Meet me at the old bridge at midnight{{/handwritten}}\n\nWhat could this mean?",
  "puzzle_prompt": "Find the **four-digit code** written in {{color:red}}red paint{{/color}} on the north wall.",
  "location_found_text": "You've discovered the hidden alcove!\n\n{{image:/puzzle-images/alcove-clue.jpg}}\n\nLook carefully at the symbols above.",
  "puzzle_success_text": "Well done! You decoded the message.\n\nThe elegant script reads:\n\n{{handwritten:elegant}}The treasure lies where the river bends{{/handwritten}}",
  "next_riddle": "Head north to where *ancient stones* mark the crossing point."
}
```

### Best Practices

1. **Page Breaks**: Use for intro narratives (3+ paragraphs). Keep each page focused - 2-4 paragraphs max.
2. **Handwriting Styles**: Match the story context:
   - `scrawl` - Urgent messages, graffiti, quick notes
   - `elegant` - Formal invitations, old manuscripts, fancy signs
   - `graffiti` - Street art, rebellious messages, modern urban clues
   - `default` - General handwritten notes, casual messages
3. **Images**: Use sparingly. Best for essential visual clues that can't be described in text.
4. **Colored Text**: Use for emphasis on specific words/phrases, not entire paragraphs.
5. **Formatting**: Don't overuse. Clear, simple text is often more effective than heavy formatting.

### Technical Notes

- All text is parsed on render using a custom parser (`lib/text-parser.ts`)
- Handwriting fonts are loaded via Next.js font optimization
- Images are rendered using Next.js Image component for optimization
- Single-page content shows no pagination UI; multi-page shows Next/Back buttons
- Page state resets when moving to a new location

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
  "prompt": "Set the cryptex wheels",
  "answer": "3725",
  "answer_length": 4
}
```

#### `number_code.safe` (Safe Dial)
- **Description:** Rotating dial with direction-based input
- **Answer Format:** Zero-padded number string
- **Interactions:** Rotate clockwise/counter-clockwise alternately
- **Use Cases:** Safe combinations, mechanical puzzle locks
- **Example JSON:**
```json
{
  "type": "number_code.safe",
  "prompt": "Open the safe",
  "answer": "033",
  "answer_length": 3
}
```

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
  "prompt": "Spell the word on the sign",
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
  "prompt": "Solve the slide puzzle to reveal the location",
  "image": "/puzzle-images/fremont-troll.jpg",
  "answer": "SOLVED",
  "answer_length": 6
}
```
**Note:** The image path is required in the `image` field, not `puzzleImage`.

### Testing Page

Visit `/test/puzzles` to test all puzzle input types with example answers. This page showcases all available inputs without requiring a full hunt flow.

---

## Handoff notes for future dev
- For authoring hunts, JSON is primary canonical source; consider building an admin UI later.
- Add hints, multi-language support, and optional user accounts in v2.
- Test page at `/test/puzzles` demonstrates all puzzle types.

