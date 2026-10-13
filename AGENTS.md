# Repository Guidelines

## Project Overview

This is the **Amplenote Spaced Repetition** plugin (`amplenote-spaced-repetition`
v1.0.0, MIT, by Jonathan J. Wagner / DeepspaceGhost) — a
zero-dependency, local-first implementation of the **FSRS-5** (Free Spaced
Repetition Scheduler) algorithm that runs entirely inside Amplenote. The entire
plugin is a single vanilla JavaScript file that users paste into an Amplenote
plugin note. No bundler, no transpiler, no external runtime libraries.

See [`README.md`](README.md) for user-facing docs and
[`docs/amplenote-plugin-development.md`](docs/amplenote-plugin-development.md)
for the Amplenote plugin SDK contract.

## Architecture & Data Flow

### High-level structure

`plugin.js` exports one object (`module.exports = { ... }`) with three logical
regions:

1. **Parser / scheduler helpers** — pure-ish utility functions for parsing
   Markdown tables, extracting & persisting flashcard SRS state, and running the
   FSRS-5 math.
2. **Core review logic** — session orchestration: collect due cards, run the
   review UI, save updated state, update the dashboard.
3. **Entry points & hooks** — the Amplenote plugin surface keys that the host
   calls into.

### Data flow: a review cycle

```
[noteOption / appOption "Start Review Session"]
        │  1. app.prompt → tags
        ▼
  _collectDueCards(app, tags)
        │  2. app.filterNotes({ tag }) → note handles
        │     for each note: app.notes.find(uuid) → note.content() → _extractFlashcardsFromMarkdown
        │     filter due cards (nextReview ≤ now), sort, apply Daily Review Limit
        │     add #srs/due tags to notes with due cards
        ▼
  _runReviewSession(app, dueCards)
        │  3. Detect mobile context → _runFreeTierPromptSession
        │     or → app.openSidebarEmbed (Peek Viewer embed)
        ▼
  [User rates each card via Peek Viewer buttons or prompt dialogs]
        │  4. callAmplenotePlugin("rate", {rating, time}) → onEmbedCall
        ▼
  _updateCardSRS(card, rating)  ── _createScheduler().next(card, rating)
        │  5. Returns updated card with new stability/difficulty/interval/nextReview
        ▼
  _saveCardToNote(app, card)
        │  6. Re-read note.content(), find card, encode SRS state as base64 HTML comment
        │     → note.replaceContent(newContent)
        ▼
  _updateDashboard(app, session)
        │  7. Create/update "Spaced Repetition Dashboard" note (#srs-dashboard)
        │     with lifetime stats; clean up #srs/due tags
```

### Flashcard object shape

Cards are produced by `_extractFlashcardsFromMarkdown`. A card object has:

| Field | Type | Source |
| --- | --- | --- |
| `question` | string | Parsed from table cell or `> **Q:**` block |
| `answer` | string | Parsed from table cell or `> **A:**` block |
| `format` | string | `'table'` (default) or `'quote'` |
| `lineIndex` | number | For table cards: the row index in the `lines` array |
| `startLine` / `endLine` | number | For quote cards: the block boundaries |
| `srsLineIdx` | number | For quote cards: index of the `<!--…-->` SRS marker line |
| `noteUUID` | string | Attached by `_collectDueCards` |

SRS scheduling fields are spread in from the decoded hidden column:
`interval`, `easinessFactor`, `nextReview`, `reps`, `lapses`, `stability`,
`difficulty`, `elapsed_days`, `scheduled_days`, `state`, `last_review`.

### SRS state persistence

The plugin uses **"invisible state tracking"** — scheduling data is stored as a
base64-encoded JSON string wrapped in an HTML comment (`<--base64-->`),
rendered invisible to the user in Amplenote's rich-text editor:

- **Tables**: an extra `<!--SRS_DATA-->` header column is appended; each card
  row's cell in that column holds `<!--<base64>-->`.
- **Quote blocks**: the SRS marker is stored as a `<!--<base64>-->` comment on
  the line following the block.

`_escapeHtml` also strips stray `\\[`/`\\]` escapes that Amplenote inserts into
Markdown brackets inside tables.

### FSRS-5 algorithm

Implemented in `_createScheduler()` — a factory returning `{ next(card, rating) }`.
The weights array `w` (line ~415) is the canonical FSRS-5 parameter set. Rating
scale: `1` = Again (forgot), `2` = Hard, `3` = Good, `4` = Easy.

- **New cards** (`!card.reps`): stability initialized via `initStability(rating)`,
  difficulty via `initDifficulty(rating)`; rating 1 → interval 0/state 3 (learning),
  ratings 2-4 → interval 1 or 4 (state 2, reviewing).
- **Reviewed cards**: elapsed days since `last_review` are computed; retrievability
  `R` is derived; difficulty is updated via `nextDifficulty`; stability is updated
  via `nextRecallStability` (ratings 2-4) or `nextForgetStability` (rating 1).
- **Interval**: computed from stability via `nextInterval`; next review `due` date
  is `now + interval` days.

`_updateCardSRS(card, rating)` calls the scheduler and merges the result into the
card object, **remapping field names** — `stability` → `easinessFactor` (legacy)
and `stability` (new), both set; `interval` → `interval` and `scheduled_days`.

### Session state

```
_currentReviewSession = {
  cards:    [...],           // the due card list
  index:    0,                // current card position
  ratingsCount: { 1:0, 2:0, 3:0, 4:0 }  // per-rating tally for stats
}
```

### Amplenote plugin entry points

| Key | Signature | Role |
| --- | --- | --- |
| `noteOption['Start Review Session']` | `(app, _noteUUID)` | Per-note menu entry; prompts for tags then runs the session |
| `appOption['Start Review Session']` | `(app)` | Global command-palette entry; honors `Default Tags` setting, then runs the session |
| `renderEmbed(app, ...args)` | — | Renders the Peek Viewer HTML (flashcard UI or completion stats). Called on every `updateEmbedArgs` |
| `onEmbedCall(app, ...args)` | — | Handles `callAmplenotePlugin("rate", ...)` callbacks from the embed |

Both `noteOption` and `appOption` capture `const self = this` to retain the
plugin object as `this` inside the async handlers, then call `self._collectDueCards`
etc.

### Amplenote `app` proxy methods used

- `app.prompt(title, { inputs, message, submitAction })` — tag & rating input;
  returns `false`/`null` on cancel.
- `app.alert(message)` — user notifications.
- `app.filterNotes({ tag })` — find notes by tag (tag without `#`).
- `app.notes.find(uuid)` → note handle.
- `note.content()` — get note Markdown string.
- `note.replaceContent(md)` — replace note body.
- `app.createNote(title, tags)` — create the dashboard note.
- `app.addNoteTag({ uuid }, 'tag')` / `app.removeNoteTag({ uuid }, 'tag')`.
- `app.replaceNoteContent({ uuid }, md)` — whole-note overwrite (dashboard).
- `app.openSidebarEmbed(widthPct, title, ...args)` — launch Peek Viewer embed.
- `app.context.updateEmbedArgs(args)` / `app.context.renderEmbed()` — update the
  live embed after a rating.
- `app.context.environment` / `app.context.isMobile` — mobile detection.
- `app.settings['…']` — read plugin settings (`Default Tags`, `Review Order`,
  `Daily Review Limit`).
- `window.callAmplenotePlugin(action, data)` — embed → host callback.

## Key Directories

| Directory | Purpose |
| --- | --- |
| `.` (root) | `plugin.js` (the plugin), plus all config files |
| `tests/` | Jest test suite (`*.test.js`) + standalone scripts (`test_*.js`, `simulation.js`) |
| `docs/` | Amplenote SDK reference, architecture audits, reports, research |
| `docs/architecture/` | System overview, code audit, refactoring notes |
| `docs/reports/` | Phase reports, recommendations, test coverage summary |
| `docs/research/` | Feature ideas and forward-looking research |
| `.maestro/playbooks/` | Maestro development workflow & Superpowers setup docs |

## Development Commands

All commands run from the project root with `npm`. There is **no build step** —
`plugin.js` is consumed directly by Amplenote.

| Action | Command |
| --- | --- |
| Install dependencies | `npm install` |
| Run tests | `npm test` |
| Run tests with coverage | `npm run test:coverage` |
| Lint | `npm run lint` |
| Format code | `npm run format` |

**Edit-and-reload cycle**: modify `plugin.js` directly, then paste/reload into
Amplenote. No compilation or bundling is required.

## Code Conventions & Common Patterns

### Module system & structure

- **CommonJS**: `module.exports = { ... }` at the end of the file. No ES module
`import`/`export`.
- **ES2022** target (`ecmaVersion: 2022` in ESLint). No transpilation — rely on
  Amplenote's runtime engine support.
- **Single-file constraint**: the plugin must remain one vanilla JS file under
  ~260 KB. Do **not** introduce external dependencies.

### Formatting (Prettier)

Configured in [`.prettierrc`](.prettierrc):

- `semi: true` — semicolons required
- `singleQuote: true` — single quotes
- `trailingComma: 'es5'` — trailing commas in ES5-compatible positions
- `printWidth: 100` — keep lines ≤ 100 chars
- `tabWidth: 2` — 2-space indentation

Run `npm run format` to auto-fix. Run `npm run lint` to check.

### Naming

- **Private/internal functions** are prefixed with `_` (e.g. `_parseCells`,
  `_collectDueCards`, `_createScheduler`).
- **Intentionally unused parameters** are prefixed with `_`
  (e.g. `_qIdx`, `_noteUUID`) — this also satisfies ESLint's `no-unused-vars`
  ignore patterns.
- Public Amplenote entry points (`noteOption`, `appOption`, `renderEmbed`,
  `onEmbedCall`) use their exact host-defined names.

### Error handling

- All `app.*` host calls are wrapped in `try/catch` — host failures should be
  logged (`console.error`) and surfaced to the user via `app.alert`, never thrown
  silently.
- Parse failures (base64 decode, JSON parse of SRS data) use nested `try/catch`
  blocks that fall through gracefully.
- `app.prompt` can return `false` or `null` on cancellation — always check before
  using the result.

### Async patterns

- Every host-facing function is `async`. All `app.*` calls are `await`ed.
- `this` context: `noteOption` and `appOption` handlers capture
  `const self = this` and use `self._method()` to call internal helpers,
  because Amplenote may invoke these with a different `this` binding.

### State management

- In-memory session state lives in `_currentReviewSession`. There is **no
  session namespacing** (see audit finding #3 in `docs/architecture/audit-2026-08-20.md`).
- Persistent state is **inline in the user's notes** as base64 HTML comments —
  there is no separate database or local storage.

## Important Files

| File | Role |
| --- | --- |
| `plugin.js` | The entire plugin — single file, no build step. Main entry point. |
| `package.json` | Package metadata, npm scripts, dependency declarations. |
| `tests/jest.config.js` | Jest configuration: `testEnvironment: 'node'`, coverage from `plugin.js` only. |
| `tests/mock-app.js` | Shared `MockApp` class — hand-rolled stub of the Amplenote host for integration tests. |
| `tests/integration.test.js` | End-to-end test of the review session flow with mocked host. |
| `tests/parse.test.js` | Markdown table parser tests. |
| `tests/srs.test.js` | FSRS-5 scheduler tests. |
| `tests/utils.test.js` | Utility function tests (`_escapeHtml`). |
| `tests/simulation.js` | Standalone jsdom-based smoke harness (not a Jest test). |
| `eslint.config.js` | ESLint flat config (recommended + prettier, browser/jest/node globals). |
| `.prettierrc` | Prettier formatting rules. |
| `docs/amplenote-plugin-development.md` | Amplenote plugin SDK reference — the source of truth for `app` proxy API and data-flow patterns. |
| `docs/architecture/system-overview.md` | Architecture & data persistence overview. |

## Runtime/Tooling Preferences

- **Runtime**: Node.js (CommonJS). The plugin itself runs in Amplenote's sandboxed
  JS environment — not Node.js, Deno, or Bun. No ES module imports at runtime
  (the plugin note is evaluated in a single sandboxed context).
- **Package manager**: **npm** (a `package-lock.json` at lockfile v3 is present).
  Do not mix with `pnpm` or `yarn`.
- **No build step / no bundler**: `plugin.js` is pasted directly into an
  Amplenote plugin note. Keep it as a single vanilla JS file.
- **Linting**: ESLint with flat config (`eslint.config.js`). Uses
  `js.configs.recommended` + `eslint-config-prettier`.
- **Formatting**: Prettier 3.x. Format scope includes `**/*.{js,json,md}`.

## Testing & QA

### Framework & config

- **Jest 29** (`testEnvironment: 'node'`). Config: [`tests/jest.config.js`](tests/jest.config.js).
- Coverage is **always on** (`collectCoverage: true`), measured **only** from
  `plugin.js` (`collectCoverageFrom: ['plugin.js']`).
- The four Jest suites are: `utils.test.js`, `parse.test.js`,
  `srs.test.js`, `integration.test.js`.

### Running tests

```bash
npm test               # run Jest
npm run test:coverage  # run with coverage report
```

### Test conventions

- **Direct import, no mocking of the plugin**: every suite does
  `require('../plugin')` — production code runs as-is. No `jest.mock`.
- **Mocked host**: `tests/mock-app.js` provides a hand-rolled `MockApp` class
  with no-op async methods. Integration tests instantiate `new MockApp()` and
  override individual methods per scenario. No Jest spies (`jest.fn`) are used.
- **Structure**: one top-level `describe` per file with flat `it()` blocks.
  No nested `describe`, no `beforeEach`/`afterEach`.
- **Assertions**: Jest `expect` with `toBe`, `toBeDefined`, `toContain`,
  `toBeGreaterThan`.
- **Time travel**: the SRS tests fake elapsed time with
  `new Date(Date.now() - 86_400_000 * n).toISOString()` rather than clock mocks.

### Coverage status

From `docs/reports/test-coverage-summary.md`:

| Metric | Value |
| --- | --- |
| Statements | 44.27% |
| Branches | 34.33% |
| Functions | 66.66% |
| Lines | 44.06% |

**Thoroughly tested** (100% logic coverage): FSRS-5 math
(`_createScheduler`/`next`), Markdown table parsing (`_extractFlashcardsFromMarkdown`,
`_parseCells`), card extraction and update (`_updateFlashcardInLines`,
`_findColIdx`, `_findHeaderRow`), `_escapeHtml`, `_collectDueCards`.

**Untested** (UI / Amplenote-coupled surfaces — see audit finding #4):
`renderEmbed`, `onEmbedCall`, `_runReviewSession`, `_runFreeTierPromptSession`,
`_updateDashboard`, `appOption`, and the full `_saveCardToNote` table-append /
backslash-sanitization paths.

### Standalone scripts (not run by Jest)

`tests/` also contains `test_*.js` scripts and `simulation.js` that use
`console.log` instead of `expect` and are **not** matched by Jest's default
`testMatch` glob. These are exploratory/manual tooling only:

- `simulation.js` — jsdom-based end-to-end smoke harness with a hardcoded
  absolute path (rebase before running on another machine).
- `test_dash_fix.js` — one-off codemod that rewrites `plugin.js`.
- `test_escape.js`, `test_slash.js`, `test_html_strip.js`, `test_regex.js`,
  `test_parse_slashes.js`, `test_backslash.js`, `test_srs_logic.js` —
  micro-experiments re: backslash escaping, regex, and FSRS logic.

---

## Quick reference

```bash
# Typical contribution flow
npm install
npm run lint
npm run format
npm test
npm run test:coverage
```

- Edit `plugin.js` directly — no build step. Reload in Amplenote to test.
- Keep all changes within `plugin.js` unless adding test/docs files.
- Do **not** add npm dependencies — the plugin must remain single-file and
  zero-dependency at runtime.
- Prefix unused vars/params with `_`.
- Wrap all `app.*` calls in `try/catch`.
- For the full Amplenote SDK contract, see
  [`docs/amplenote-plugin-development.md`](docs/amplenote-plugin-development.md).