---
type: note
tags: [refactor, efficiency]
title: Refactoring Notes - Code Efficiency
created: 2026-06-26
---

# Code Efficiency Refactoring

This document outlines the changes made to improve the efficiency and modularity of the Amplenote Spaced Repetition plugin.

## ESLint and Prettier Configuration

We introduced standard linting (`eslint`) and formatting (`prettier`) to the project. The configuration uses the new ESLint "flat config" format (`eslint.config.js`). The `plugin.js` and `tests/` directories have been unified in code style.

- Added `.prettierrc` for Prettier configuration
- Added `eslint.config.js` for ESLint configuration
- Added `format` and `lint` npm scripts

## Monolithic Functions (`plugin.js`)

- Some functions like `_extractFlashcardsFromMarkdown` and `_updateFlashcardInLines` were monolithic and managed parsing string lines, updating state, and tracking column positions.
- *Notes for future work*: We need to extract out pure utility functions. The date mathematics block within `_createScheduler` works as a pseudo-factory, encapsulating the FSRS math variables. This could be extracted out to a pure function import, but due to the Amplenote single-file FSRS packaging requirement, it's safer right now to keep the code bundled within the `plugin.js` IIFE wrapper.

## Data Structure and Loop Optimizations

- In `_collectDueCards`, sorting logic was cleaned up and array methods `filter` and `sort` were used extensively to manage the arrays without excessive memory creation overhead.
- Audited let/const usage across loops to avoid mutable states when immutability was guaranteed.

## Conclusion

The unified formatting prevents stylistic bugs and standardizes development. Moving forward, any FSRS-logic should be rigorously decoupled within test suites to avoid Amplenote-specific API wrapper contamination.
