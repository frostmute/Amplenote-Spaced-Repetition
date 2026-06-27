# Task List: Amplenote Spaced Repetition Plugin Bounty

This document outlines the tasks required to fulfill the $1,000 Amplenote Spaced Repetition Plugin bounty, based on the specifications detailed in `amplenote-srs-bounty-context.md`.

## 1. Architecture & Scaffolding (Priority 1)

- [ ] Set up a Vite or esbuild based mono-repo project structure.
- [ ] Configure the build pipeline to bundle the frontend (React/Svelte UI) and backend (TypeScript Amplenote hooks) into a single `dist/plugin.js` file.
- [ ] Ensure the final bundled `dist/plugin.js` file strictly adheres to the ~260KB undocumented `eval()` payload size limit.
- [ ] Implement a build step or check to ensure the final code block expression evaluates directly to the plugin object (e.g., `function declarations... ({ noteOption: ..., renderEmbed: ... })`).
- [ ] Ensure the plugin's metadata table is correctly formatted with empty column headers (`| | |`) and lowercase keys (`name`, `description`, `icon`, `setting`).

## 2. Zero-Dependency Core Logic (Priority 2)

- [ ] Implement an inline, zero-dependency version of the FSRS scheduling algorithm (e.g., FSRS-5). Do NOT use heavy libraries like `ts-fsrs`.
- [ ] Develop a robust, custom markdown table parser specifically for Amplenote's format. Do NOT use heavy AST parsers like `mdast-util-from-markdown`.
- [ ] Ensure the table parser gracefully handles shifted columns.
- [ ] Ensure the table parser correctly identifies and preserves hidden HTML metadata (e.g., `<!--base64-->`).

## 3. Data Persistence & Integrity (Priority 3 - CRITICAL)

- [ ] Implement encoding/decoding logic for FSRS scheduling data using `btoa(JSON.stringify(data))` and vice versa.
- [ ] Integrate the Base64 encoded payload into a dedicated 3rd column in the markdown tables (`| Question | Answer | SRS_DATA |`).
- [ ] Ensure the `SRS_DATA` payload is wrapped in an HTML comment (`<!--...-->`) so it remains hidden in the rich-text view.
- [ ] Develop logic to perfectly pad table rows upon update to match the header length, preventing Amplenote from spawning empty columns.
- [ ] Implement a pre-save sanitation step to strip compounded backslashes (e.g., using `newContent.replace(/\\\\/g, '')`) before writing the table back to the note.

## 4. Amplenote API Integration (Priority 4)

- [ ] Implement tag-based sourcing of material using `app.filterNotes` (e.g., `app.filterNotes({ tag: "learning" })`).
- [ ] Register the plugin invocation via `appOption` (Command Palette - `Cmd+O`).
- [ ] Register the plugin invocation via `noteOption` (the `...` menu) for reliable manual triggering.
- [ ] Implement a fallback testing loop using `app.alert` and `app.prompt` for users on the free tier (without Peek Viewer access).
- [ ] (Optional but Recommended) Implement a timer embed for triggering memory tests.

## 5. User Interface (Embed) (Priority 5)

- [ ] Design and implement a rich, dark-themed flashcard UI for the Peek Viewer sidebar.
- [ ] Hook up the UI using `renderEmbed` and `onEmbedCall`.
- [ ] Implement reliable communication between the embed UI and the plugin core via `window.callAmplenotePlugin`.
- [ ] Implement card progression state updates exclusively using `app.context.updateEmbedArgs()` followed by `app.context.renderEmbed()`. DO NOT use `app.openSidebarEmbed()` for progression.
- [ ] Implement robust, cross-browser CSS flip animations for the flashcards using horizontal `rotateY(180deg)` with `-webkit-backface-visibility: hidden;` (avoid `rotateX`).

## 6. Testing & Edge Cases (Priority 6)

- [ ] Write and execute rigorous tests for the custom markdown table parser, specifically targeting empty rows and injected metadata scenarios.
- [ ] Test functionality and fallback routing on mobile clients.
- [ ] Continuously verify that the bundled payload size remains under the ~260KB limit.
- [ ] Test the backslash compounding mitigation logic to ensure table integrity over multiple saves.
- [ ] Test the UI animations across different rendering engines (WebKit, Blink, Gecko).

## 7. Documentation & Submission (Priority 7)

- [ ] Create a `BOUNTY_CHECKLIST.md` file documenting the fulfillment of all requirements.
- [ ] Prepare all necessary submission materials according to Amplenote's official bounty guidelines.
- [ ] Final review of the repository against the initial specifications.
