# Install Plan

- **Provider**: opencode
- **Supported**: yes
- **Date**: 2026-06-26

## Prerequisites
- `git`: 2.54.0
- Harness CLI (`opencode`): /Users/thewytchhaus/.opencode/bin/opencode
- Provider-specific: OpenCode config: ~/.config/opencode/opencode.json (exists)

## Strategy
Since the `opencode` provider relies on a configuration file (`~/.config/opencode/opencode.json`), the automatable step will edit this JSON file to inject the `superpowers` plugin into the `plugins` array. After the file is updated, a user-required step is needed to restart the `opencode` harness so it loads the new plugin.

## Automatable Steps

1. Add `superpowers` to opencode config
   - Action: `Edit ~/.config/opencode/opencode.json: add "superpowers" to the plugins array if not present`
   - Expects: File is successfully written and valid JSON.

## User-Required Steps

1. Restart opencode
   - Run in opencode: `exit` (then restart the CLI)
   - Expects: opencode starts with the superpowers plugin loaded.

## Skip / Block
(None)
