# Install Plan

- **Provider**: opencode
- **Supported**: yes
- **Date**: 2026-06-27

## Prerequisites

- `git`: git version 2.54.0
- Harness CLI (`opencode`): /Users/thewytchhaus/.opencode/bin/opencode
- Provider-specific: OpenCode config: ~/.config/opencode/opencode.json (exists)

## Strategy

Since `INSTALL_RECIPES.md` was missing in this context, but we know this is `opencode`, Document 3 will automate adding the Superpowers git repository to the OpenCode skills configuration file (`~/.config/opencode/opencode.json`) to register it, and then prompt the user to restart OpenCode.

## Automatable Steps

1. Add superpowers repository to `~/.config/opencode/opencode.json`
   - Action: `Edit ~/.config/opencode/opencode.json: add git+https://github.com/obra/superpowers.git to skills array or equivalent configuration`
   - Expects: File is successfully written/edited and parses as valid JSON.

## User-Required Steps

1. Restart OpenCode
   - Run in OpenCode: Exit and restart the OpenCode terminal/session.
   - Expects: OpenCode reloads configuration and detects the new skills.
