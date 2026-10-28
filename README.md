# opencode-config

OpenCode v2 + OCX 3 config monorepo. The repo root is the OpenCode config
(used as `~/.config/opencode`); the `ocx/` subdir holds the OCX 3 profiles
(used as `~/.config/ocx`).

## Layout

```
./
  opencode.jsonc            # OpenCode global config (plugins, providers, MCP, permissions)
  oh-my-opencode-slim.json  # generated: shared settings + all presets
  cli.json / tui.json[c]    # CLI + TUI plugin config
  presets/                  # preset fragments (source for oh-my-opencode-slim.json)
    _shared.json            # shared: multiplexer, council, companion, fallback, default preset
    claude-work.json        # Claude Max lineup
    trinity.json            # claude + openai + opencode-go lineup
  scripts/build-presets.js  # merges presets/*.json into the configs
  skills/                   # vendored agent skills (antfu/skills)
  docs/
  ocx/                      # OCX 3 profiles (~/.config/ocx -> this dir)
    profiles/
      claude-work/
      trinity/
```

## Requirements

- [OpenCode](https://opencode.ai) v2
- [ocx](https://ocx.kdco.dev) (OCX 3 preview): `bun add --global ocx@next`
- oh-my-opencode-slim v3 (loaded as a plugin)
- Bun (or Node >= 18) — for rebuilding the preset configs

## Install

Managed by `stvmachine/dotfiles_v3` → `opencode/install.fish`, which clones this
repo to `~/.config/opencode`, symlinks `~/.config/ocx` → `./ocx`, rebuilds the
presets, and installs `ocx@next`.

Manual:

```bash
git clone git@github-personal:stvmachine/opencode-config.git ~/.config/opencode
ln -s ~/.config/opencode/ocx ~/.config/ocx
bun ~/.config/opencode/scripts/build-presets.js
```

## Usage

```bash
ocx oc -p claude-work
ocx oc -p trinity
```

Each profile is a self-contained native config dir under `ocx/profiles/`; its
`oh-my-opencode-slim.json` selects the profile's preset.

## Editing presets

1. Edit `presets/<name>.json` (or `_shared.json` for shared settings).
2. Run `bun scripts/build-presets.js` — regenerates `oh-my-opencode-slim.json`
   (global) and each profile's `ocx/profiles/<name>/oh-my-opencode-slim.json`.
