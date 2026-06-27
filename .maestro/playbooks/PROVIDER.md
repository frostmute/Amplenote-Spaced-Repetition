# Detected Provider

- **Provider (Maestro toolType)**: opencode
- **Confidence**: high
- **Detected on**: 2026-06-27

## Signals

### Self-identification

I am running inside the OpenCode harness. My canonical Maestro toolType is `opencode`.

### PATH probe

- `claude`: `/Users/thewytchhaus/.local/bin/claude`
- `codex`: `/usr/local/bin/codex`
- `opencode`: `/Users/thewytchhaus/.opencode/bin/opencode`
- `droid`: `/Users/thewytchhaus/.local/bin/droid`
- `copilot`: `/usr/local/bin/copilot`
- `gemini`: `/usr/local/bin/gemini`
- `qwen`: `not-found`

## Reconciliation Notes

I am explicitly configured and running as an `opencode` agent according to my Maestro system context. The PATH probe confirmed that the `opencode` CLI is installed, corroborating my self-identification. While multiple harness CLIs exist on PATH, my system context provides absolute certainty.

## Supported by Superpowers?

yes
