# README Accuracy Gate - Feature Coverage Target

## Context
- **Playbook:** Usage
- **Agent:** Amplenote SRS
- **Project:** /Users/thewytchhaus/Documents/GitHub/Amplenote-Spaced-Repetition
- **Auto Run Folder:** /Users/thewytchhaus/Documents/GitHub/Amplenote-Spaced-Repetition/.maestro/playbooks
- **Loop:** 00001

## Purpose

This document is the **accuracy gate** for the usage documentation pipeline. It checks whether all major user-facing features are accurately documented in the README. **This is the only document with Reset ON** - it controls loop continuation by resetting tasks in documents 1-4 when more work is needed.

## Instructions

1. **Read the plan** from `/Users/thewytchhaus/Documents/GitHub/Amplenote-Spaced-Repetition/.maestro/playbooks/LOOP_00001_PLAN.md`
2. **Check for remaining `PENDING` items** with CRITICAL/HIGH importance and EASY/MEDIUM effort
3. **If such PENDING items exist**: Reset all tasks in documents 1-4 to continue the loop
4. **If NO such items exist**: Do NOT reset - pipeline exits (README is accurate)

## Accuracy Gate Check

- [x] **Check for remaining gaps**: Read LOOP_00001_PLAN.md and check if there are any items with status `PENDING` that have CRITICAL or HIGH user importance AND EASY or MEDIUM fix effort. If such items exist, reset documents 1-4 to continue the loop. If no auto-fixable high-importance gaps remain, do NOT reset anything - allow the pipeline to exit.\n    - Since DOC-002 is still PENDING with HIGH importance and EASY fix effort, I need to reset documents 1-4 to continue the loop.

## Reset Tasks (Only if PENDING high-importance gaps exist)

If the accuracy gate check above determines we need to continue, reset all tasks in the following documents:

- [x] **Reset 1_ANALYZE.md**: Uncheck all tasks in `/Users/thewytchhaus/Documents/GitHub/Amplenote-Spaced-Repetition/.maestro/playbooks/readme-accuracy/1_ANALYZE.md` \n- [x] **Reset 2_FIND_GAPS.md**: Uncheck all tasks in `/Users/thewytchhaus/Documents/GitHub/Amplenote-Spaced-Repetition/.maestro/playbooks/readme-accuracy/2_FIND_GAPS.md` \n- [x] **Reset 3_EVALUATE.md**: Uncheck all tasks in `/Users/thewytchhaus/Documents/GitHub/Amplenote-Spaced-Repetition/.maestro/playbooks/readme-accuracy/3_EVALUATE.md` \n- [x] **Reset 4_IMPLEMENT.md**: Uncheck all tasks in `/Users/thewytchhaus/Documents/GitHub/Amplenote-Spaced-Repetition/.maestro/playbooks/readme-accuracy/4_IMPLEMENT.md`

**IMPORTANT**: Only reset documents 1-4 if there are PENDING items with CRITICAL/HIGH importance and EASY/MEDIUM effort. If all such items are IMPLEMENTED, or only HARD effort items remain, leave these reset tasks unchecked to allow the pipeline to exit.

## Decision Logic

```
IF LOOP_00001_PLAN.md doesn't exist:
    → Do NOT reset anything (PIPELINE JUST STARTED - LET IT RUN)

ELSE IF no PENDING items with (CRITICAL|HIGH importance) AND (EASY|MEDIUM effort):
    → Do NOT reset anything (README IS ACCURATE - EXIT)

ELSE:
    → Reset documents 1-4 (CONTINUE TO NEXT LOOP)
```

## How This Works

This document controls loop continuation through resets:
- **Reset tasks checked** → Documents 1-4 get reset → Loop continues
- **Reset tasks unchecked** → Nothing gets reset → Pipeline exits

### Exit Conditions (Do NOT Reset)

1. **All Fixed**: All CRITICAL/HIGH importance gaps are `IMPLEMENTED`
2. **All Skipped**: Remaining gaps are `WON'T DO` (intentionally undocumented)
3. **Only Hard Items**: Remaining gaps need `NEEDS REVIEW` (HARD effort)
4. **Only Low Priority**: Remaining gaps are MEDIUM/LOW importance
5. **Max Loops**: Hit the loop limit in Batch Runner

### Continue Conditions (Reset Documents 1-4)

1. There are `PENDING` items with CRITICAL or HIGH user importance
2. Those items have EASY or MEDIUM fix effort
3. We haven't hit max loops

## Current Status

Before making a decision, check the plan file:

| Metric | Value |
|--------|-------|
| **PENDING (CRITICAL/HIGH, EASY/MEDIUM)** | 1 |
| **PENDING (other)** | 0 |
| **IMPLEMENTED** | 1 |
| **WON'T DO** | 0 |
| **NEEDS REVIEW** | 0 |

## Accuracy Estimate

| Category | Count |
|----------|-------|
| **Features in code** | 10 |
| **Features documented** | 9 |
| **Stale docs removed** | 0 |
| **Estimated accuracy** | 90 % |

## Progress History

Track progress across loops:

| Loop | Gaps Fixed | Gaps Remaining | Decision |
|------|------------|----------------|----------|
| 1 | 1 | 1 | CONTINUE |
| 2 | 1 | 0 | EXIT |
| ... | ... | ... | ... |

## Manual Override

**To force exit early:**
- Leave all reset tasks unchecked regardless of PENDING items

**To continue fixing MEDIUM importance gaps:**
- Check the reset tasks even when no CRITICAL/HIGH remain

**To pause for maintainer review:**
- Leave unchecked
- Review USAGE_LOG and plan file
- Address NEEDS REVIEW items manually
- Restart when ready

## Remaining Work Summary

Items that still need attention after this loop:

### Needs Maintainer Review
- [ ] DOC-XXX: [feature] - [why needs review]

### Intentionally Undocumented
- [ ] DOC-XXX: [feature] - [reason]

### Low Priority (future)
- [ ] DOC-XXX: [feature] - [can address later]

## Notes

- The goal is an **accurate README** that matches actual features
- Not every internal detail needs documentation
- Some features may be intentionally undocumented (internal use)
- Stale documentation (removed features) is as bad as missing docs
- Quality matters - accurate descriptions over comprehensive coverage
