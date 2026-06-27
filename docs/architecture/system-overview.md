---
type: reference
tags:
  - architecture
  - final
title: System Overview
created: 2026-06-26
---

# System Overview: Amplenote Spaced Repetition Plugin

## Architecture

The Amplenote Spaced Repetition plugin is a local-first, zero-dependency implementation of the FSRS-5 (Free Spaced Repetition Scheduler) algorithm, designed to run natively within the Amplenote environment. The entire application logic is contained within a single `plugin.js` file to comply with Amplenote's plugin limitations (no external dependencies, ~260KB size limit).

## Data Persistence

A core design requirement was "Invisible State Tracking." The plugin avoids creating separate database files or requiring external APIs. Instead, it persists state directly within the user's notes:

1.  **Flashcard Data:** Flashcards are defined using standard Markdown tables (with `Question` and `Answer` headers) or distinct Quote blocks (`> **Q:**` / `> **A:**`).
2.  **Scheduling State:** When a user reviews a flashcard, the FSRS algorithm calculates the new scheduling state (Stability, Difficulty, Retrievability, and Next Review Date). This state is encoded and stored in a *hidden column* added to the Markdown table (or hidden metadata in the quote block). This ensures the data remains unobtrusive while the user edits the note text.
3.  **Note Tagging:** The plugin automatically manages the `#srs/due` tag. It appends this tag to notes that contain flashcards currently due for review, making it easy for the user to find their daily study material.
4.  **Statistics:** A dedicated `#srs-dashboard` note is automatically generated and updated after each review session to persist lifetime statistics and review history.

## Spaced Repetition Algorithm: FSRS-5

We chose the FSRS-5 (Free Spaced Repetition Scheduler) algorithm over older models like SM-2 (used by standard Anki) because:

1.  **Accuracy:** FSRS-5 is demonstrably more accurate at predicting the forgetting curve, leading to more efficient study sessions (fewer reviews required for the same retention rate).
2.  **Mathematical Foundation:** It uses a sophisticated model tracking Stability ($S$), Difficulty ($D$), and Retrievability ($R$) based on the user's grading (1-4 scale) and response time.
3.  **Stand-alone Viability:** The core mathematical model can be implemented purely in vanilla JavaScript without requiring heavy external machine learning libraries, fitting perfectly within our zero-dependency constraint.

## Robust Parsing

Because Amplenote's rich-text editor can sometimes introduce formatting quirks (like shifted columns or empty cells in Markdown tables), the plugin includes a custom-built, robust Markdown GFM Table parser. This parser is designed to detect and auto-correct corrupted rows on the fly, ensuring that the hidden state column remains intact and the flashcards function reliably even if the user accidentally modifies the table structure slightly.
