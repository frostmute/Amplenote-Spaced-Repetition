# Detected Provider

- **Provider (Maestro toolType)**: opencode
- **Confidence**: high
- **Detected on**: 2026-06-27

## Signals

### Self-identification
The agent running this session is OpenCode, which maps to the Maestro toolType `opencode`.

### PATH probe
- `claude`: `/Users/thewytchhaus/.local/bin/claude`
- `codex`: `/usr/local/bin/codex`
- `opencode`: `/Users/thewytchhaus/.opencode/bin/opencode`
- `droid`: `/Users/thewytchhaus/.local/bin/droid`
- `copilot`: `/usr/local/bin/copilot`
- `gemini`: `/usr/local/bin/gemini`
- `qwen`: `not-found`

## Reconciliation Notes
I confidently self-identified as OpenCode (`opencode`). The PATH probe confirmed that the `opencode` binary is present at `/Users/thewytchhaus/.opencode/bin/opencode`. Although other AI harnesses are also installed on this machine, my self-identification is authoritative.

## Supported by Superpowers?
yes
