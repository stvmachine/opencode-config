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
  ocx/                      # OCX 3 profiles (copied to ~/.config/ocx by build-presets.js)
    profiles/
      claude-work/
      trinity/
```

## Requirements

- [OpenCode](https://opencode.ai) v2
- [ocx](https://ocx.kdco.dev) (OCX 3 preview): `bun add --global ocx@next`
- oh-my-opencode-slim v3 (loaded as a plugin)
- Bun (or Node >= 18) — for rebuilding the preset configs
- Node >= 24 with npm — `npx` launches the GitHub, Firecrawl, codegraph, and
  GSD MCP servers, and runs the GSD installer. With the dotfiles' nvm:
  `nvm install 24 && nvm alias default 24`

## Install

Managed by `stvmachine/dotfiles_v3` → `opencode/install.fish`, which clones this
repo to `~/.config/opencode`, rebuilds the presets (which also copies the
profiles into `~/.config/ocx/profiles/`), and installs `ocx@next`.

OCX 3 rejects symlinks on its managed path, so `~/.config/ocx` is a real
directory holding copies. Edit profiles in this repo, never in
`~/.config/ocx`: rerunning `build-presets.js` overwrites the copies.

Manual:

```bash
git clone git@github-personal:stvmachine/opencode-config.git ~/.config/opencode
bun ~/.config/opencode/scripts/build-presets.js
bun add --global ocx@next
```

### Secrets

API keys are read from `secrets/` (gitignored, never committed), one key per
file. Create the ones for the providers and MCP servers you use, or those
entries fail to resolve at startup:

```
secrets/openai_api_key      secrets/github_token       secrets/firecrawl_api_key
secrets/hass_token          secrets/stitch_api_key
```

## GSD Core (optional)

To install the GSD workflows and agents on top of this setup:

```bash
npx -y @opengsd/gsd-core@latest --opencode --global
```

GSD installs into `~/.config/opencode/`: `agents/`, `commands/`, `gsd-core/`,
`hooks/`, `plugins/`, `skills/gsd-*/`, a few files under `scripts/`, and its
manifest/state files. All of these are gitignored, so nothing GSD installs is
committed. It also writes `~/.gsd/defaults.json`.

The installer also edits `opencode.jsonc`, adding a top-level `mcp.gsd` entry
and a v1-style `permission` block. The repo already carries the v2 equivalents
(`mcp.servers.gsd` with `--no-prompts`, plus the `gsd-core/*` read and
`external_directory` rules in `permissions`), so discard those edits:

```bash
git -C ~/.config/opencode checkout -- opencode.jsonc
```

That restores the whole file from the last commit, so commit any of your own
`opencode.jsonc` changes before running the installer.

To update, rerun the install command, then the same `git checkout`. To remove
GSD, run it with `--uninstall`.

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

A new preset also needs its name added to `PRESET_ORDER` in
`scripts/build-presets.js`; files not listed there are skipped. See
`docs/PROFILES.md` → "Adding a Profile" for the full steps.
