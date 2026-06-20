<div align="center">

# 🧠 Amplenote Spaced Repetition

**Zero-dependency, local-first FSRS-5 Flashcards built entirely within Amplenote.**

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Amplenote Plugin](https://img.shields.io/badge/Platform-Amplenote-blue.svg)](https://www.amplenote.com/)

</div>

<br>

A completely standalone implementation of the state-of-the-art **[FSRS-5 (Free Spaced Repetition Scheduler)](https://github.com/open-spaced-repetition/fsrs4anki)** algorithm designed natively for Amplenote. This plugin turns your workspace into a learning engine without relying on external APIs, heavy AST parsing libraries, or leaving your vault.

---

## ✨ Features

- **⚡️ Zero-Dependency Architecture:** Full Spaced Repetition logic implemented in pure vanilla JavaScript. No bloated dependencies!
- **📝 Native Markdown Tables:** Define flashcards seamlessly by simply creating a table with `Question` and `Answer` headers anywhere in your notes.
- **👻 Invisible State Tracking:** Keeps your notes visually clean. It encodes and stores flashcard intervals inside a hidden column, so your data remains unobtrusive while you edit text.
- **🛡️ Bulletproof Parsing:** Amplenote's rich-text editor can occasionally shift columns or introduce empty cells. Our custom parser detects shifted columns and auto-corrects corrupted rows on the fly.
- **🎨 Premium UI & Fallback:** 
  - *Paid Users:* If you are an paying for Amplenote monthly you have access to the Peek Viewer sidebar feature within Amplenote and will experience a smooth, animated, 3D-flipping flashcard interface injected directly into Peek View.
  - *Free Tier Users:* Run review sessions gracefully via native Amplenote Prompt/Alert dialogs directly within the note pane.
- **📊 Auto-Generating Dashboard:** Automatically creates and maintains an `srs-dashboard` note tracking your lifetime review statistics, retention rates, and session history!

<br>

## 🚀 Installation

### Manual Install

Because this plugin is pure JavaScript, there is no build step required. 

1. Create a new note in Amplenote and assign it the `plugins` tag.
2. At the top of the note, create a markdown table with **empty headers** to serve as the plugin metadata:
   ```markdown
   | | |
   |-|-|
   | name | Spaced Repetition |
   | icon | 🧠 |
   | description | Full FSRS-5 Flashcards right in your Amplenote workspace. |
   ```
3. Below the table, create a Javascript code block (` ```javascript `) and paste the complete contents of [`plugin.js`](plugin.js) from this repository.
4. **Important Installation Quirk:** If you expierience any issues installing the plugin (frozen plugin import, plugin dissappears from installed plugin list within plugin settings, etc) open Amplenote in an **incognito Chrome window**, and login to your Amplenote account as usual. Navigate to **Settings -> Plugins**, search for and select the plugin note then click **Add Plugin**.

<br>

## 📖 Usage Guide

### 1. Creating Flashcards
Creating a flashcard is as simple as creating a table with **Question** and **Answer** headers. You can put as many tables in a note as you want.

| Question | Answer |
| --- | --- |
| What does DOM stand for? | Document Object Model |
| How do you initialize a list in Python? | `my_list = []` |

Add a tag to the note containing your flashcards (e.g., `#learning/javascript`).

### 2. Reviewing Flashcards
1. Open the **Command Palette** (`Cmd+O` / `Ctrl+O`) or click the `...` menu in the top right of any note.
2. Select **Start Review Session**.
3. The plugin will prompt you for the tags you wish to review. Type the tag you used (e.g., `learning/javascript`).
4. The review session will begin!

*As you review, the plugin will automatically append a hidden third column to your tables to track intervals and easiness factors. Do not delete this column!*

### 3. Your Stats Dashboard
After completing your first review session, the plugin will automatically generate a new note titled **Spaced Repetition Dashboard** and tag it `#srs-dashboard`.

This note tracks your lifetime statistics, calculating how many cards you've reviewed and showing a breakdown of your performance. It updates automatically at the end of every single review session.

<br>

## 🛠️ Development & Testing

This project uses a custom-built, zero-dependency Markdown GFM Table parser to handle Amplenote's specific rich-text edge cases. 

To run the unit tests locally:

```bash
git clone https://github.com/thewytchhaus/Amplenote-Spaced-Repetition.git
cd Amplenote-Spaced-Repetition
npm install
npm test
```

*Note: You do not need to run a build or compilation step to use the plugin. Modifications to `plugin.js` can be pasted directly into Amplenote.*

<br>

<div align="center">
  <i>Built for the Nexus Vault</i><br>
  <b>DeepspaceGhost / Jonathan J. Wagner</b>
</div>