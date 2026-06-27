# Amplenote Spaced Repetition Plugin - Bounty Context & Specifications

## Overview

This document provides a detailed description of the Amplenote Spaced Repetition Plugin project, specifically tailored to fulfill the requirements of the $1,000 Amplenote plugin bounty. It is designed to serve as \"project understanding confidence\" context for Maestro, enabling it to generate a highly prioritized and detailed task list focused entirely on claiming the bounty.

## Bounty Information

- **Bounty Name:** Spaced Repetition Plugin
- **Bounty Value:** $1,000
- **Bounty URL:** [Amplenote Bounty Plugins](https://www.amplenote.com/bounty_plugins)
- **Status:** Unclaimed / Open

## Core Specifications & Requirements

The plugin must capture the best ideas from popular spaced repetition apps and incorporate them into a seamless Amplenote experience.

### 1. Triggering & Invocation

- Users must be able to invoke memory tests via:
  - `appOption` (Command Palette - `Cmd+O`)
  - Timer embed (optional, but highly recommended for a complete experience)
  - _Recommendation based on Amplenote quirks:_ Also include `noteOption` (the `...` menu) for reliable manual triggering, as `appOption` can be flaky for first-time users.

### 2. Sourcing Material

- **Primary Source:** The plugin must source questions from tables (preferred by Amplenote).
- **Secondary Source:** Consistent markdown formatting.
- **Tag-Based Processing:** The plugin must allow users to process all notes under a specific tag to pull source material (e.g., using `app.filterNotes({ tag: \"learning\" })`).

### 3. Data Storage & Formatting (CRITICAL)

Based on established Amplenote plugin development best practices and past spaced repetition project attempts, the following constraints must be strictly adhered to:

- **Dedicated Column:** The optimal markdown table structure is a 3-column format: `| Question | Answer | SRS_DATA |`.
- **Base64 Encoding:** Never store raw structured data in table cells. Amplenote re-escapes `|` characters inside cells on every save, compounding exponentially (e.g., `%7C` → `%257C`). All FSRS scheduling data MUST be encoded: `btoa(JSON.stringify(data))`.
- **Hidden Styling:** To keep the `SRS_DATA` column invisible in the rich-text view, wrap the base64 payload in an HTML comment (e.g., `<!--base64-->`).
- **Table Alignment:** When updating a row, ensure all rows are perfectly padded to match the header length. Failure to do so will cause Amplenote to spawn empty columns.
- **Backslash Mitigation:** Before saving tables back to the note, strip compounded backslashes (`newContent.replace(/\\\\/g, '')`) created by Amplenote's aggressive escaping of markdown brackets.

### 4. Scheduling Algorithm

- Implement a robust spaced repetition algorithm (e.g., FSRS-5).
- **CRITICAL:** Do NOT bundle heavy libraries like `ts-fsrs` or full AST parsers (`mdast-util-from-markdown`). Amplenote has an undocumented `eval()` payload size limit of ~260-280KB. Payloads exceeding this will fail silently. Write a zero-dependency, inline implementation of the scheduler.

### 5. User Interface (UI)

- **Paid Tier (Peek Viewer):** Utilize `renderEmbed` and `onEmbedCall` to create a rich, dark-themed flashcard UI inside the Peek Viewer sidebar.
- **Free Tier (Fallback):** Implement a fallback loop using `app.alert` and `app.prompt` for users without access to the paid Peek Viewer feature.
- **Card Progression:** Use `app.context.updateEmbedArgs()` followed by `app.context.renderEmbed()` to progress through cards. Do NOT repeatedly call `app.openSidebarEmbed()`, as this breaks multi-card sessions.
- **CSS Animations:** Use horizontal `rotateY(180deg)` with `-webkit-backface-visibility: hidden;` for reliable cross-browser animations (avoiding `rotateX` bugs in Chromium).

### 6. Development Workflow & Architecture

- Use a Vite/esbuild mono-repo setup.
- Split into a frontend (React/Svelte embed UI) and backend (TypeScript wrapper with Amplenote hooks).
- Compile down to a single `dist/plugin.js` file.
- Ensure the final code block expression evaluates to the plugin object (e.g., function declarations followed by `({ noteOption: ..., renderEmbed: ... })`).
- The metadata table must have empty column headers (`| | |`) and strictly lowercase keys (`name`, `description`, `icon`, `setting`).

## Prioritization for Maestro

Maestro should prioritize tasks in the following order to maximize the chances of a successful bounty claim:

1.  **Architecture & Scaffolding:** Set up the build pipeline (Vite/esbuild) ensuring a single file output under the ~260KB limit.
2.  **Zero-Dependency Core Logic:** Implement the inline FSRS scheduler and robust markdown table parser (handling shifted columns and hidden HTML metadata).
3.  **Data Persistence:** Implement the Base64 encoding/decoding logic for the `SRS_DATA` column and robust table row reconstruction (handling the backslash compounding bug).
4.  **Amplenote API Integration:** Implement `app.filterNotes` for tag-based sourcing, `noteOption`/`appOption` triggers, and the free-tier `app.prompt` fallback loop.
5.  **UI Development (Embed):** Build the flashcard UI using `renderEmbed`, ensuring correct communication via `window.callAmplenotePlugin` and state updates using `updateEmbedArgs`.
6.  **Testing & Edge Cases:** Rigorous testing of the table parser (empty rows, injected metadata), mobile client handling (fallback routing), and payload size verification.
7.  **Documentation & Submission:** Prepare the `BOUNTY_CHECKLIST.md` and submission materials according to Amplenote's guidelines.
