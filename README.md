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

## 🧠 What is FSRS & How Does it Work?

If you are new to Spaced Repetition, here is a quick crash course on how this plugin actually makes you learn faster.

### The Forgetting Curve
When you learn a new fact, your brain naturally starts forgetting it almost immediately. This is known as the "Forgetting Curve". To commit something to long-term memory, you shouldn't review it every single day. Instead, you should review it *just before you are about to forget it*. 

Every time you successfully recall a fact at the edge of forgetting, your memory of it grows stronger, and the time it takes to forget it again gets longer.

### FSRS-5 (Free Spaced Repetition Scheduler)
FSRS is a state-of-the-art mathematical algorithm that predicts your exact forgetting curve. When you review a flashcard in this plugin, you are asked to grade your memory on a scale of 1 to 4:
1. **🔴 Again (Forgot):** You completely forgot the answer. The plugin resets the card's interval to 0 days, forcing you to relearn it immediately.
2. **🟠 Hard:** You remembered it, but it took severe mental effort. The algorithm slightly increases the interval (e.g., from 3 days to 4 days) but flags the card as "difficult" to remember.
3. **🟢 Good:** You remembered it with normal effort. The algorithm significantly increases the interval (e.g., from 3 days to 8 days).
4. **🟣 Easy:** The answer was instantly obvious. The algorithm rapidly pushes the next review date far into the future (e.g., from 3 days to 14 days) so you don't waste time studying things you already know.

### Under the Hood
To calculate exactly how many days to wait before showing you a card again, the plugin's FSRS algorithm tracks three hidden variables for every single flashcard you create:
* **Stability ($S$):** How well you retain the memory. High stability means it takes months to forget.
* **Difficulty ($D$):** How inherently hard the concept is for your brain to grasp. 
* **Retrievability ($R$):** The probability (from 0% to 100%) that you can recall the card *right now*.

By measuring how long it takes you to answer a card (the **timer** running in the background while the flashcard UI is open) and combining it with your 1-4 rating, the FSRS math calculates your unique $S$, $D$, and $R$ for that specific fact, outputting the optimal `nextReview` date.

### Why is there a Daily Limit?
Spaced repetition is a marathon, not a sprint. If you have 500 flashcards due for review, trying to cram them all in one day leads to severe mental fatigue and artificially lowers your retention rates. The plugin allows you to set a `Daily Review Limit` (in Amplenote's plugin settings) to arbitrarily cap your daily sessions to a manageable chunk (e.g., 50 cards a day), ensuring your studying remains a healthy daily habit rather than an exhausting chore.

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

> [!WARNING] Amplenote Escaping Quirk
> If your flashcard contains Markdown brackets like `[ ]` or `[[link]]`, **you must wrap them in backticks** like `` `[ ]` ``. If you don't use backticks, Amplenote's internal editor will try to aggressively escape them by inserting a backslash `\[` every time you run a review session.

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