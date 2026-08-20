---
type: reference
title: Amplenote Plugin Development Context
created: 2026-08-20
tags:
  - amplenote
  - sdk
  - plugins
  - architecture
---

# Amplenote Plugin Development Context

> A working reference distilled from the published Amplenote plugin API, real
> production plugins (this repo, `frostmute/Amplenote-Spaced-Repetition`,
> `Capta1nCool/an-kanban`), and Amplenote's documented constraints.
>
> Used as the source of truth for plugin audits in this workspace.

## 1. What an Amplenote plugin *is*

An Amplenote plugin is **a single Markdown note tagged `plugins`** whose body
contains a metadata table plus a `​```javascript` code block that exports one
configuration object. Amplenote evaluates that block at load time and binds
its keys to UI surfaces in the host app.

Plugins are sandboxed: they cannot touch the DOM directly, and the host injects
a globally-defined `app` proxy at evaluation time. Embeds render inside an
isolated iframe that talks back to the host via `callAmplenotePlugin(...)`.

There are two layout categories:

| Surface | Where it shows | How it renders |
| --- | --- | --- |
| **Embed plugins** (sidebar, note peek) | Side panel / inline modal | You return an HTML string; `renderEmbed` rebuilds it on each `updateEmbedArgs` |
| **Action plugins** | Command palette and `...` note menu | You define `appOption` and `noteOption` async functions; no UI to render |

Spaced Repetition is an **embed plugin** with an additional `noteOption`
promoter. AMK targets Sidebar embed too.

## 2. Manifest / note metadata

A plugin note starts with a 4-row GFM table (empty header row). Host reads:

| Source field | Purpose |
| --- | --- |
| `name` | Display name in plugin settings |
| `icon` | Emoji or URL |
| `description` | One-line description shown in plugin catalog |
| `slot` | (Embed plugins only) `sidebar`, `window`, `note` etc. |
| `toggle` | Boolean — note must have an empty metadata header to be installable |

If any row is missing, the plugin will be skipped or imported silently — always
validate the host comment about "import in incognito" before debugging.

## 3. Exported object shape

Every plugin note's JS block must end with an expression whose value is an
object with at least one of these keys. Amplenote is forgiving about
`module.exports` vs assignment, but a bare `module.exports = {...}` is the
convention used by both well-known plugins in this audit.

### Lifecycle keys (`appOption` / `noteOption`)

```js
module.exports = {
  appOption: {
    'Menu Label': async function (app) { /* .. */ }
  },
  noteOption: {
    'Menu Label': async function (app, noteUUID) { /* .. */ }
  },
};
```

- `appOption`: appears in the global Amplenote **command palette / app menu**.
- `noteOption`: appears in the per-note `...` menu. Receives the note UUID so
  the handler can scope itself to a note.

Both receive the same `app` proxy. Returning `void` is fine — the host won't
re-open the menu.

### Embed keys

```js
renderEmbed:   async (app, ...embedArgs) => '<html>...</html>',  // initial render
onEmbedCall:   async (app, ...embedArgs) => { /* handler  */ }, // runtime callbacks
contextMenuEmbed: { 'Foo': async (app, ...args) => '...' },     // right-click in embed
insertFloatButtonIntoNoteEmbeds: async (app, ...args) => '...' // inject HTML into note blocks
```

The host iframe calls back into the plugin via
`window.callAmplenotePlugin(action, data)`. The host either:

- calls `onEmbedCall('rate', JSON.stringify(data))` (legacy wrapping), or
- calls `onEmbedCall('rate', { rating: 3 })` (object form),
- or pipes through `callAmplenotePlugin('rate', data)` for newer embeds.

`renderEmbed` is called on every `app.context.updateEmbedArgs(newArgs)` so the
HTML must be regenerable from those args alone.

### Settings

```js
settingsSchema: [
  { label: 'Review Order', type: 'string', default: 'Due Date (Oldest First)' },
  { label: 'Daily Review Limit', type: 'number', default: 50 },
],
app.settings = { 'Review Order': 'Random', 'Daily Review Limit': 30 }
```

Plugin code reads `app.settings` at the point of need. There is no reactivity
— if the user changes a setting mid-session, state must be re-queried.

## 4. The `app` proxy

Method inventory observed in real plugin code:

### Query / find

| Method | Returns | Notes |
| --- | --- | --- |
| `app.filterNotes({ tag: 'foo' })` | `[{ uuid, name, tags }]` | Tag value **without** the leading `#` |
| `app.notes.find(uuidOrObj)` | note handle | Accepts `'uuid'` string or `{ uuid }` object |
| `note.content()` | string | Markdown source |
| `note.tags` | array | Reactive, not a function |
| `note.replaceContent(markdown)` | promise | Whole-note overwrite — expensive and lossy |
| `app.replaceNoteContent({ uuid }, markdown)` | promise | Whole-note overwrite via app |
| `app.replaceNoteContent(noteHandle, md)` | promise | Some host versions accept the handle directly |
| `note.appendBlock(block)` | promise | Block-level append; safer when preserving other blocks |
| `app.createNote(title, tags)` | new UUID | Creates a note in the current vault |
| `app.addNoteTag({ uuid }, 'tag')` | promise | Tag without `#` |
| `app.removeNoteTag({ uuid }, 'tag')` | promise | Same convention |

### UX

| Method | Returns | Notes |
| --- | --- | --- |
| `app.alert(message)` | `void` (always resolves) | Promise still resolves after dismissal |
| `app.prompt(title, { inputs, message, submitAction })` | `false` if cancelled, otherwise `{ ...inputs }` | `inputs` is an array of `{ label, type, options }` |
| `app.prompt` with single text-only signature | string or `null` | Used in some embed contexts |
| `app.openSidebarEmbed(widthPct, title, ...args)` | promise | `widthPct` 1–100; renders `renderEmbed` with the args |
| `app.context.updateEmbedArgs(args)` | promise | Memoizes for the next `renderEmbed` |
| `app.context.renderEmbed()` | promise | Re-runs `renderEmbed` with memoized args |
| `app.context.environment` | `'mobile' \| 'web' \| 'desktop'` | Best-effort — sometimes `undefined` |
| `app.context.isMobile` | boolean | Older key, prefer `environment === 'mobile'` |

### Things that **don't** exist

- No `note.deleteBlock(uuid)` in the host API used by Amplenote ≤ v4 —
  plugins achieve deletion by re-writing the note with the block removed.
- No direct DOM access. The embed is an iframe with no DOMException access to
  the parent's nodes.
- No ES module imports at runtime — the plugin note is `eval`'d in a single
  sandboxed context. This is why production plugins often bundle their deps.

## 5. Build & packaging

For embed plugins with bundlers (Vite, esbuild), the output **must be a single
JS file** you paste into the plugin note. Constraints:

- **Bundle size**: ≤ ~260 KB raw / ≤ ~500 KB minified. Larger plugins must
  declare permissions in the host plugin settings.
- **No external runtime imports**: `import` statements are evaluated by the
  host, which may strip or refuse them. Inline dep code into the bundle.
- **Single eval surface**: `module.exports = { ... }` exactly once at the end.
- **CSP**: The iframe refuses `eval`, inline `<script>` source from external
  origins, and CDN imports loaded after embed.

For pure-vanilla plugins (like Spaced Repetition), no build at all is required —
paste the file in a `​```javascript` fence.

## 6. Canonical data-flow patterns

### Round-trip MD ↔ UI

For a kanban/flashcard plugin the loop is:

1. `note.content()` → parse Markdown to in-memory model.
2. Render model to user (HTML string or React tree inside embed).
3. User action → update in-memory model + regenerate serialized Markdown.
4. `note.replaceContent(md)` (whole note overwrite) **or**, if available,
   `note.appendBlock` / block-precise mutation.

The whole-note overwrite is the de-facto approach because block-precise APIs
are inconsistent across Amplenote versions. This **always** carries a small
risk of lost concurrent edits — flaky edit behavior on the globally-renamed
table cell is the most common production bug class.

### "Hidden column" pattern (Spaced Repetition)

Encode plugin state inside the note in a way that:

- Doesn't add visible UI chrome for the user.
- Survives round-trip parsing.
- Is recoverable when corruption occurs.

A column whose header is `<!--SRS_DATA-->` and whose every value is
`<!--<base64>-->` is invisible in Amplenote's rich-text view while remaining
parsing-stable. The audit notes this works well for SRS; AMK should adopt the
same idea **only if** columns are part of the persisted shape.

### Event-driven vs polling

Polling / `runEveryMinute` from the `amplenote-app` package isn't part of the
SDK seen in these plugins. Anything that needs time-driven triggers must run
inside a long-lived embed (open once, keep alive) **or** be triggered by
user actions. The Spaced Repetition plugin relies on the latter.

## 7. Sandbox limitations & workarounds

| Limitation | Practical workaround |
| --- | --- |
| No DOM access | Embed HTML strings; live inside your own iframe scope |
| Markdown escaping brackets aggressively inside tables | Wrap user input in backticks before rendering; strip stray `\\` on round-trip |
| `app.prompt` returns `false`/`null` on cancel | Always check both before parsing values |
| `app.replaceNoteContent`'s success is silent | Verify by re-reading note content when invariants matter |
| Setting changes need re-read | Re-read `app.settings` at the top of every public action |
| Embed re-render can lose focus at certain breakpoints | Cache focus before re-render if `renderEmbed` is invoked programmatically |
| `note.tags` is an array, not live-bound | Re-read after every `note.replaceContent` |

## 8. Best practices checklist

These are the practices observed in well-reviewed Amplenote plugin repos plus
the gaps surfaced during this audit:

- **Single bundle, zero runtime dependencies** unless absolutely necessary.
  Inline, minify, lint, and test the bundle before publishing.
- **Pure parser modules** — keep Markdown parsing separate from API calls so
  Jest can exercise it without mocking the whole host.
- **Whole-note overwrite invariants** — define a snapshot of the original note
  and only re-write if the new content differs. Otherwise concurrent edits
  will be clobbered.
- **Defensive `app.*` calls** — every `app.notes.find`, `app.filterNotes`,
  `app.alert`, `app.prompt`, `app.context.*` should be `try`-wrapped because
  the proxy is version-dependent.
- **Deterministic IDs** for embed actions so analytics / dashboards stay
  consistent across version bumps.
- **Test the SDK shape**, not just your business logic. A `MockApp` that
  implements the same surface your code calls (currently in this repo's
  `tests/mock-app.js`) protects against host-API drifts.
- **Bundle size budget**. Run `wc -c` on the build output before publish;
  archive the size in CI.
- **Feature flags via `app.settings`** instead of hard-coded paths so
  users can opt-out / tune.

## 9. Sources / further reading

- Production plugin reference: `frostmute/Amplenote-Spaced-Repetition` (this repo)
- Public kanban reference: `Capta1nCool/an-kanban` (`@dnd-kit/react` + Vite +
  `callAmplenotePlugin` interface for board <-> host round-trip)
- Amplenote app + plugin docs: https://www.amplenote.com/api (canonical surface)

> Editor: when you update Amplenote APIs in plugin code, update this doc
> alongside. Treat it as the contract both plugin repos point at.
