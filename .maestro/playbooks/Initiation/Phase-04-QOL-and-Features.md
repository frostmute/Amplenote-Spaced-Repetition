# Phase 04: QOL Improvements and Feature Additions

This phase adds polish and user-centric features to make the Spaced Repetition experience delightful. We will add Quality of Life (QOL) enhancements that set the plugin apart and make it feel like a native Amplenote feature.

## Tasks

- [x] Brainstorm and document potential QOL features:
  - Created `docs/research/feature-ideas.md` with YAML front matter (`type: research`, `tags: [features, qol]`).
  - Outlined 4 potential QOL features including Cloze deletions, customizable review intervals, visually distinct formatting for due cards, and a review statistics dashboard.

- [x] Implement improved flashcard formatting:
  - Added support for flashcards formatted using Quote Blocks (e.g. `> **Q:** Question \n > **A:** Answer`). This provides a visually distinct way to define cards directly inline.
  - The plugin reads these blocks, extracts the question/answer, and hides the `<!--base64-->` SRS string below the answer.
  - No `#srs/due` tag logic added yet (moved to next item).

- [x] Add a review summary or stats generation feature:
  - Updated the Review Dashboard logic to generate a `# Spaced Repetition Dashboard` note showing total cards reviewed, lifetime retention percentage, and a Markdown table with the distribution of Again/Hard/Good/Easy.
  - This updates automatically after every session.

- [x] Add `#srs/due` tag logic for notes with cards ready for review:
  - Upgraded `_collectDueCards` to identify which specific notes have due cards, and apply the `srs/due` tag to them.
  - Upgraded `_updateDashboard` (called at the end of every session) to check the remaining cards in reviewed notes, and clean up (remove) the `srs/due` tag if the note has no more due cards.

- [x] Update documentation to reflect new features:
  - Updated `README.md` to show the new Quote Block format.
  - Mentioned the automatic `#srs/due` tagging in the setup instructions.
