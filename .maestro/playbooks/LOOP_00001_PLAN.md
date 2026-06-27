# Documentation Fix Plan - Loop 00001

## Summary
- **Total Gaps:** 2
- **Auto-Fix (PENDING):** 2
- **Needs Review:** 0
- **Won't Do:** 0

## Current README Accuracy: 90%
## Target README Accuracy: 95%

---

## PENDING - Ready for Auto-Fix

### DOC-001: Default Tags Setting\n- **Status:** `IMPLEMENTED`\n- **Implemented In:** Loop 00001\n- **Changes Made:**\n  - [x] Added feature description\n  - [x] Added usage example

### DOC-002: Review Order Setting
- **Status:** `PENDING`
- **Gap ID:** GAP-002
- **Type:** MISSING
- **User Importance:** HIGH
- **Fix Effort:** EASY
- **README Section:** Setup & Configuration (needs a new section or addition to existing configuration notes)
- **Fix Description:**
  Document the "Review Order" setting. Users should know they can change how cards are presented to them during a session.
- **Proposed Content:**
  ```markdown
  ### Review Order

  You can customize the order in which flashcards are presented during a study session via the plugin settings. The available options are:
  - **Due Date (Oldest First):** Reviews cards that have been due the longest.
  - **Random:** Presents cards in a random order.
  - **Easiness (Hardest First):** Prioritizes cards you have found most difficult in the past.
  ```

---

## PENDING - NEEDS REVIEW
None

---

## WON'T DO
None

---

## Fix Order

Recommended sequence based on importance and dependencies:

1. **DOC-001** - Default Tags Setting (HIGH, easy configuration option)
2. **DOC-002** - Review Order Setting (HIGH, easy configuration option)

## README Section Updates Needed

| Section | Gaps to Fix | Action Needed |
|---------|-------------|---------------|
| Configuration (or similar) | DOC-001, DOC-002 | Add details for the new settings |
