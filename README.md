# Amplenote Spaced Repetition Plugin

A completely local, standalone implementation of the FSRS-5 (Free Spaced Repetition Scheduler) algorithm designed natively for Amplenote. This plugin turns your Amplenote workspace into a flashcard learning engine without relying on external APIs or bulky AST parsing libraries.

## Features

- **Inline FSRS-5 Scheduler**: Full Spaced Repetition logic implemented in ~70 lines of pure JavaScript. No bloated dependencies, easily bypassing Amplenote's internal 260KB plugin eval() limit.
- **GFM Table Parsing**: Define flashcards simply by creating a Markdown table with `Question` and `Answer` headers in your note. The plugin handles the rest.
- **Hidden SRS Data**: Keeps your notes clean! It encodes and stores flashcard state inside HTML comments (`<!--SRS_DATA-->`) within the table, so they remain invisible while you edit text in Amplenote.
- **Robust Table Resiliency**: Amplenote sometimes introduces empty columns or strips cells when converting back and forth between rich text and markdown. Our custom parser detects shifted columns and corrupted rows seamlessly.
- **Premium UI & Free Tier Fallback**: 
  - Free users: Run review sessions via native Amplenote Prompt/Alert dialogs.
  - Peek Viewer users: Experience a smooth, animated 3D-flipping flashcard interface injected directly into the side pane.
- **SRS Dashboard**: Automatically generates an `srs-dashboard` note tracking your lifetime review statistics, retention rates, and session history!

## Installation

1. Create a new note in Amplenote. Add the `plugins` tag to it.
2. In the note, create a table with empty headers to serve as the metadata block:
   ```markdown
   | | |
   |-|-|
   | name | Spaced Repetition |
   | icon | 🧠 |
   | description | Full FSRS-5 Flashcards right in your Amplenote workspace. |
   ```
3. Below the table, create a Javascript code block (` ```javascript `) and paste the complete contents of `plugin.js` from this repository.
4. **Important:** Open Amplenote in an **incognito Chrome window** (to bypass desktop sandbox installation bugs). Navigate to **Settings -> Plugins**, locate your note, and click **Add Plugin**.

## Creating Flashcards

To create flashcards, simply make a table in any note with the headers **Question** and **Answer**.

| Question | Answer |
| --- | --- |
| What does DOM stand for? | Document Object Model |
| How do you initialize a list in Python? | `my_list = []` |

Add a tag to the note containing your flashcards (e.g., `#learning/javascript`).

## Reviewing Flashcards

1. Open the **Command Palette** (`Cmd+O` / `Ctrl+O`) or click the `...` menu on any note.
2. Select **Start Review Session**.
3. The plugin will prompt you for the tags you wish to review. Type the tag (e.g., `learning/javascript`).
4. The review session will begin in the side pane (or via prompts for free-tier users)!

As you review, a hidden third column (`<!--SRS_DATA-->`) will automatically be appended to your tables to track intervals and easiness factors.

## The Dashboard

After completing your first review session, the plugin will automatically create a new note titled **Spaced Repetition Dashboard** and tag it `#srs-dashboard`.

This note tracks your lifetime statistics, calculating how many cards you've reviewed and showing a breakdown of your performance (Again vs Hard vs Good vs Easy). It updates automatically at the end of every session.
