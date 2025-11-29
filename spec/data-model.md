# Data Model (brief)

## Hunt
- id: string (PK)
- title: string
- neighborhood: string
- estimatedTimeMinutes: int
- globalLocationRadiusMeters: int
- createdAt, updatedAt
- relations: locations[], playSessions[], logbookEntries[]

## Location
- id: string (PK)
- huntId: string (FK)
- name: string
- order: int (1,2,3 ...)
- lat: float
- lng: float
- narrativeSnippet: string
- puzzleType: string ('number_code'|'word_code')
- puzzlePrompt: string
- puzzleImage: string|null
- puzzleAnswer: string (stored canonical answer)
- puzzleAnswerLength: int
- nextRiddle: string
- nextLocationId: string|null
- timestamps

## PlaySession
- id: uuid
- huntId: string
- clientId: string (local client identifier)
- startedAt: timestamp
- completedAt: timestamp|null
- wrongLocationChecks: int
- wrongPuzzleGuesses: int
- totalTimeSeconds: int|null

## LogbookEntry
- id: uuid
- huntId: string
- sessionId: uuid|null
- name: string|null
- message: string|null
- createdAt: timestamp

