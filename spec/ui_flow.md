# UI Flow (mobile-first)

Screens (ordered)

## 1. Hunt List (Home)
- Title
- Search/filter (later)
- Hunt card (title, neighborhood, estimated time, Start/Open button)
- Tap card -> Hunt Overview

## 2. Hunt Overview
- Title, short description
- Estimated time & difficulty
- "What you’ll need" bullet list
- Map preview with start coordinate pin (small)
- Start Hunt button (disabled until within radius)
- If user is outside radius -> hint to move to start

## 3. Play — LocationView (for each Location)
Top:
- Location name + step indicator (e.g., 1/4)
- Narrative snippet (1-3 lines)

Middle:
- Big "Search for clues" button (primary)
- On tap -> call `navigator.geolocation.getCurrentPosition()` and POST to `/api/session/:id/location-check`
- If in radius -> show Puzzle UI
- If out -> increment strike and show message (strike counter visible)

Puzzle UI:
- Prompt text
- Optional image (tap to enlarge)
- Puzzle input component:
  - number_code -> DialInput or numeric input with fixed digit count
  - word_code -> LetterWheel or fixed-letter input
- Submit button (disabled until input length correct)
- Feedback on wrong attempts (friendly)
- On success -> show microcopy, reveal `next_riddle`

Bottom:
- Map hint toggle (optional)
- Proceed button disabled until user gets within radius of next location (or until they navigate and do a location check there)

## 4. Completion Screen
- Congratulatory header
- Narrative wrap-up
- Stats: total time, wrong location checks, wrong puzzle guesses
- Logbook sign form (name and message, optional)
- List of recent logbook entries

## 5. Admin/Authoring (dev)
- JSON-based seeding only for v1

