---
type: research
title: Feature Ideas for Spaced Repetition Plugin
created: 2026-06-26
tags:
  - features
  - qol
---

# Potential QOL Features

This document outlines potential Quality of Life (QOL) improvements and new features for the Amplenote Spaced Repetition plugin to enhance the user experience.

## 1. Cloze Deletion Support
Allow users to create fill-in-the-blank style flashcards using a specific syntax (e.g., `{{c1::hidden text}}`). This is a highly requested feature in SRS systems as it makes creating cards from existing notes much faster and tests context-dependent recall.

*Implementation Notes:*
- Parse the note content for the cloze syntax.
- During review, present the sentence with the hidden text replaced by `[...]`.
- Reveal the text when the user requests the answer.

## 2. Customizable Review Intervals (FSRS Configuration)
While the core FSRS algorithm is robust, power users often want to tweak parameters like requested retention rate or maximum interval.

*Implementation Notes:*
- Add a settings note or utilize the plugin's configuration options to allow users to set global parameters for the FSRS instance.
- Ensure sensible defaults are maintained so new users aren't overwhelmed.

## 3. Visual Distinction for Due Cards (Tagging/Formatting)
Make it immediately obvious which notes contain cards that are due for review.

*Implementation Notes:*
- Automatically append a specific tag (e.g., `#srs/due`) to notes that have cards scheduled for today or earlier.
- Consider utilizing Amplenote's formatting (highlights, quotes) to make the Q&A pairs visually distinct within the note itself.

## 4. Review Statistics Dashboard
Provide users with insights into their learning progress to keep them motivated.

*Implementation Notes:*
- Generate a summary showing: cards due today, cards reviewed today, overall retention rate, and perhaps a heatmap or streak counter.
- This could be rendered into a specific "Spaced Repetition Dashboard" note.
