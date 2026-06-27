---
type: report
tags: [qa, bugs]
---

# Phase 03 Bug Squash Log

## Identified Edge Cases & Resolutions

### 1. Robust API Interaction Handling
* **Resolution**: Added protective `try/catch` blocks inside `_collectDueCards`, `_runFreeTierPromptSession`, `noteOption`, and `appOption`.
* **Details**: Now if an `app.notes.find` or `note.content()` fails, the plugin gracefully catches the error, logs it to the console, and alerts the user cleanly instead of silent failure or halting the entire process for one bad note UUID. The prompt loops are also wrapped in safety catches so a failure updating a single flashcard stops the loop safely without crashing the review session altogether.

### 2. Invalid or Malformed Date Data 
* **Resolution**: Fortified date parsing inside the flashcards filter.
* **Details**: When `card.nextReview` is completely missing or gets parsed as `NaN` (because of manually corrupted data), it now safely falls back to allowing the card to be queued as due (`isNaN(nextReview.getTime()) ? true : ...`), preventing sort and filter logic from failing implicitly.

### 3. Handle Empty State / Missing Content Gracefully
* **Resolution**: Added checks for missing `content` strings in `_extractFlashcardsFromMarkdown` and missing array sets before processing prompts.
* **Details**: 
  - `_extractFlashcardsFromMarkdown` now validates `if (!content || typeof content !== 'string') return { flashcards, lines: [] };` preventing it from choking on `.split` if `app.notes.content()` somehow returns `null`.
  - Empty `dueCards` array checks were pushed deeper into prompt functions.
  - Fallback text was added to prompts: `message: card.question || 'No question text available'` to prevent Amplenote's API from rejecting empty or purely undefined UI prompts when an empty table cell is inadvertently extracted.

### 4. Fortified Mobile Environment Detection
* **Resolution**: Safely wrapped `app.context` checking.
* **Details**: `isMobile` check logic could throw errors if `app.getContext` was not available or `app.context` was somehow a string instead of an object in certain environments. Wrapped this in a `try/catch` and safe default fallback.

### 5. Invalid Rating Submission Guard
* **Resolution**: Added validation to parsed `ratingResult` from the prompt.
* **Details**: If the user submits something other than `1, 2, 3, 4` or cancels, the plugin logs the warning and `continue`s rather than storing a `NaN` into the scheduler ratings dictionary, which previously corrupted stats.