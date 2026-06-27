---
type: report
tags:
  - bounty
  - release
title: Official Bounty Submission
created: 2026-06-26
---

# Official Bounty Submission: Spaced Repetition Plugin

**Plugin Name:** Spaced Repetition
**Developer:** DeepspaceGhost / Jonathan J. Wagner

## Overview

I am pleased to submit the final version of the Spaced Repetition plugin for the Amplenote Plugin Bounty. This plugin brings a state-of-the-art learning engine directly into the Amplenote workspace, allowing users to create and review flashcards without ever leaving their vault.

## Key Features & Highlights

*   **Zero-Dependency FSRS-5 Implementation:** We have implemented the cutting-edge Free Spaced Repetition Scheduler (FSRS-5) algorithm purely in vanilla JavaScript. This ensures highly accurate, personalized review schedules while strictly adhering to the single-file, zero-dependency requirements of Amplenote plugins.
*   **Invisible State Tracking (Native Markdown):** Flashcards are defined naturally using Markdown tables or quote blocks. The plugin manages scheduling data (intervals, ease factors) by elegantly storing it in a hidden column/metadata, keeping the user's notes clean and unobtrusive.
*   **Bulletproof Custom Parser:** We developed a robust Markdown GFM Table parser specifically designed to handle the quirks of Amplenote's rich-text editor. It intelligently auto-corrects shifted columns or empty cells, guaranteeing that user data and plugin state remain uncorrupted.
*   **Premium User Experience:**
    *   **Peek Viewer Integration (Pro/Founder):** For paid users, the plugin leverages the Peek Viewer sidebar to provide a beautiful, animated, 3D-flipping flashcard interface.
    *   **Graceful Fallback:** Free-tier users receive a streamlined review experience using native Amplenote Prompt/Alert dialogs.
*   **Automated Analytics Dashboard:** The plugin automatically creates and maintains an `#srs-dashboard` note, providing users with a comprehensive view of their lifetime statistics, retention rates, and session history.
*   **Quality of Life Additions:** Features like customizable daily review limits and default tag configurations ensure that studying remains a sustainable, low-friction habit.

## Code Quality & Testing

The plugin has been rigorously tested to ensure stability and reliability. We have a comprehensive suite of unit tests verifying the core FSRS logic, the custom Markdown parsing engine, and edge-case handling (e.g., malformed tables, missing state data). The final `plugin.js` artifact is clean, fully linted, and free of development logs or dead code.

We are confident this plugin provides immense value to the Amplenote community and look forward to your review.
