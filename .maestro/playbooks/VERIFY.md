# Verification Report

- **Provider**: opencode
- **Date**: 2026-06-27

## Provider-level check

- Command run: `opencode run --print-logs "hello" 2>&1 | grep -i superpowers`
- Output (truncated to ~20 lines):

  ```text
  INFO  2026-06-27T00:49:39 +1ms service=plugin path=superpowers@git+https://github.com/obra/superpowers.git loading plugin
  ```

- Verdict: PASS

## Config sanity check (opencode only — omit otherwise)

- File: `~/.config/opencode/opencode.json`
- Parses as JSON: yes
- `plugin` contains superpowers entry: yes
- Restart-required: yes (OpenCode does not hot-reload plugin changes)

## In-session probe

I checked the available skills injected into this prompt, and they include many skills bundled with Superpowers such as `brainstorming`, `writing-plans`, `using-git-worktrees`, `test-driven-development`, and `using-superpowers`. The `using-superpowers` instructions state that it is "ALREADY LOADED", confirming that Superpowers is indeed active in this current session.

## Final verdict

INSTALLED-AND-ACTIVE

## Notes

The Superpowers plugin is correctly configured in `~/.config/opencode/opencode.json` and the skills are fully loaded and active in the current `opencode` session. No further action is required.
