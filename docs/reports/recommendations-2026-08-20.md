---
type: report
title: Spaced Repetition Plugin — Recommendations (2026-08-20)
created: 2026-08-20
tags:
  - report
  - srs
  - recommendations
parent: '[[../architecture/audit-2026-08-20]]'
---

# Recommendations — Spaced Repetition

Concrete, ordered steps from the August 2026 audit. Each step lists the
target file, expected harness/assertion pattern, and an estimated difficulty
rating. Diff-sized snippets are intentionally left out; the goal is a
checklist that any contributor can pick up.

## R1. Split `renderEmbed` into two render routes

- **Where**: `plugin.js:792-998`.
- **What**: extract `_renderCardHtml(card, progress)` and
  `_renderCompleteHtml(stats, total, avgEf)`. `renderEmbed` becomes a small
  dispatcher.
- **Tests**: jest snapshot for each route; one snapshot for an empty-card
  state (line 912 guard preserved).
- **Difficulty**: medium.

## R2. Normalize onEmbedCall signature parser

- **Where**: `plugin.js:1000-1027`.
- **What**: a `_parseEmbedCallArgs(args)` helper returning `{ action, data }`
  with explicit `console.warn` on unknown shapes.
- **Tests**: jest table covering all three documented shapes plus a
  `(action, object)` shape for forward compatibility. Cover the empty `args`
  case.
- **Difficulty**: low.

## R3. Session ID, not global `_currentReviewSession`

- **Where**: `plugin.js:1162`, `plugin.js:846`, `plugin.js:1037`.
- **What**: replace singleton with a `Map<sessionId, session>`, generate
  `sessionId` when `noteOption/appOption` opens the session, pass it
  through `updateEmbedArgs`, lookup on every embed read.
- **Tests**: integration test that fires two review sessions concurrently
  and asserts dashboards separately.
- **Difficulty**: medium.

## R4. Dashboard write safety

- **Where**: `plugin.js:1062-1126`.
- **What**: stage the new dashboard content in memory; assert that the
  generated `<!--STATS:…-->` block parses to valid JSON before calling
  `app.replaceNoteContent`. On parse failure, abort the write.
- **Tests**: jest test with deliberately malformed `ratchetsCount` to
  verify rollback.
- **Difficulty**: low.

## R5. Expand Jest suite

- **Where**: `tests/`.
- **What**: add `tests/render.test.js`, `tests/embed-call.test.js`,
  `tests/collect-due.test.js`. Move `simulation.js` checkout path to a
  jest test or delete it (its template path is hard-coded — dead code).
- **Target**: lift coverage above 70 % lines (currently ~44 %).
- **Difficulty**: medium.

## R6. Bundle size budget

- **Where**: `package.json`.
- **What**: add a `scripts:{"size-check":"node -e \"if(require('fs').statSync('plugin.js').size>220*1024){process.exit(1)}\""}`.
- **Pre-commit hook recommended**: bash 1-liner.
- **Difficulty**: trivial.

## R7. README clean-up

- **Where**: `README.md:124-126`.
- **What**: convert literal `\n\n` into real newlines and reflow the
  "Setup & Configuration" section.
- **Difficulty**: trivial.

## R8. Validate settings before use

- **Where**: `plugin.js:610`, `plugin.js:758`.
- **What**: replace inline `parseInt(..., 10)` with a `_readDailyLimit(app)`
  helper returning a clamped positive int or the default.
- **Tests**: jest test for empty, NaN, negative, fractional, and large
  values.
- **Difficulty**: trivial.

## R9. Attribute FSRS weights

- **Where**: `plugin.js:414-418`.
- **What**: comment-only attribution: `// FSRS-5 default weights (open-spaced-repetition/fsrs4anki v5.x)`.
- **Difficulty**: trivial.

## R10. CI wiring (later)

- **What**: ensure `npm test`, `npm run lint`, `npm run size-check` run on
  GitHub Actions before merge. Skill note: the project does not yet have
  `.github/workflows/`.

## Done definition

- R1–R2 ship in one PR; R3 in a separate PR after Jest tests are
  expanded; R4 piggy-backs on R5.
- README + size-check land in the same PR as R1.
- The audit doc references this report as `parent`.
