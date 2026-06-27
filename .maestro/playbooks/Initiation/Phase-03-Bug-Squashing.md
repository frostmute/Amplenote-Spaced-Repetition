# Phase 03: Bug Squashing and Edge Case Handling

A bounty-winning plugin must be resilient. This phase hardens the plugin against unexpected user input, missing data, and Amplenote API quirks. We will systematically identify and handle edge cases to prevent silent failures or crashes.

## Tasks

- [x] Implement robust error handling for Amplenote API interactions:
  - Wrapped API calls (`note.content()`, etc) in `_collectDueCards`, `noteOption`, and `appOption` within safe try/catch structures. 
  - Caught errors surface explicitly via `app.alert()`.

- [x] Handle invalid or malformed flashcard data:
  - Added validations in `_extractFlashcardsFromMarkdown` if content is missing or not a string. 
  - Fallbacks created in the UI prompts so that `card.question || "No question text available"` renders correctly if a table gets mangled by a user.
  - Safe parsing for NaN-resolving dates inside the filter and sort routines so corrupted reviews still bubble to the top.

- [x] Address empty state and missing context scenarios:
  - Implemented strong checks inside prompt processing when contexts miss arrays, and guarded `isMobile` context checks via `app.getContext` gracefully.

- [x] Document identified bugs and resolutions:
  - Created `docs/reports/bug-squash-log.md` detailing the five main vulnerability classes fortified during this phase.
