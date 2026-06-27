# Feature Inventory - Loop 00001

## README Analysis

### README Location
`/Users/thewytchhaus/Documents/GitHub/Amplenote-Spaced-Repetition/README.md`

### README Structure
| Section | Description | Line Numbers |
|---------|-------------|--------------|
| ✨ Features | High-level overview of core capabilities | 18-25 |
| 🧠 What is FSRS & How Does it Work? | Explanation of Spaced Repetition algorithms | 29-50 |
| 🚀 Installation | Guide to installing the plugin manually | 54-66 |
| 📖 Usage Guide | Main guide for using the plugin | 70-101 |
| 🛠️ Development & Testing | Instructions for contributing/running tests | 105-115 |
| 🤝 Contributing | Bug reporting and PR guidelines | 119-144 |

### Features Documented in README
| Feature | Section | Description in README |
|---------|---------|----------------------|
| Native Markdown Tables | Features / Usage Guide | Create flashcards using simple Question/Answer tables |
| Invisible State Tracking | Features | Stores flashcard intervals in a hidden column |
| Auto-correcting Parser | Features | Detects and fixes shifted columns/empty cells |
| Peek Viewer UI | Features | 3D-flipping flashcard UI for paid users |
| Prompt/Alert UI | Features | Fallback UI for free tier users |
| FSRS-5 Algorithm | What is FSRS | 4-button grading system (Again, Hard, Good, Easy) |
| Daily Review Limit | What is FSRS | Setting to cap daily sessions |
| Default Tags | Setup & Configuration | Configuration option for starting sessions |
| Dashboard Generation | Usage Guide | Auto-generates #srs-dashboard note with stats |

---

## Codebase Analysis

### Project Type
- **Language/Framework:** JavaScript (Vanilla, no dependencies)
- **Application Type:** Amplenote Plugin

### Features Found in Code
| Feature | Location | Type | User-Facing? |
|---------|----------|------|--------------|
| "Start Review Session" | `appOption` | CLI/Action | Yes |
| Flashcard Table Parser | Internal | Logic | Yes (implicitly) |
| HTML Dialog UI (Peek) | Internal | UI | Yes |
| Prompt Fallback UI | Internal | UI | Yes |
| FSRS-5 Scheduler | Internal | Logic | Yes (implicitly) |
| Daily Review Limit | `app.settings` | Config | Yes |
| Default Tags | `app.settings` | Config | Yes |
| Review Order | `app.settings` | Config | Yes |
| Dashboard Generation | Internal | Feature | Yes |

---

## Feature Summary

### Totals
- **Features in README:** 9
- **Features in Code:** 9
- **Potential Gaps:** 1 (code features not in README)
- **Potential Stale:** 0 (README features not in code)

### Quick Classification

#### Likely Undocumented (in code, not in README)
1. Review Order - A setting `app.settings["Review Order"]` is checked in the code but not documented in the README.

#### Possibly Stale (in README, not found in code)
None found.

#### Confirmed Documented (in both)
1. Flashcard tables
2. Invisible state tracking
3. UI (Peek/Prompt)
4. FSRS algorithm
5. Dashboard
6. Daily Review Limit setting
7. Default Tags setting
8. Start Review Session action