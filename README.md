# my-opencode-config

Personal OpenCode configuration: the main `opencode.jsonc`, OCX profiles with
wrapper scripts, and oh-my-opencode-slim presets — kept as fragments and merged
by a small build script.

## Layout

```
my-opencode-config/
  opencode.jsonc              # main OpenCode config (plugins, providers, MCP servers; secrets via env vars)
  ocx.jsonc                   # root OCX config
  tui.json                    # TUI plugin config
  settings.json               # OpenCode settings
  oh-my-opencode-slim.json    # generated preset config (committed; rebuild with scripts/build-presets.js)
  presets/                    # preset fragments merged into oh-my-opencode-slim.json
    _shared.json              # shared fields: preset, multiplexer, disabled_agents, companion
    openai.json, openai-go.json, sol-kimi.json, kimi.json, free.json
  scripts/
    build-presets.js          # merges presets/*.json into oh-my-opencode-slim.json (node, no deps)
  profiles/
    <name>/ocx.jsonc          # OCX profile config (bin, include/exclude, registries)
    <name>/AGENTS.md          # profile instructions
    bin/oc-*                  # wrapper scripts that set OH_MY_OPENCODE_SLIM_PRESET and launch opencode
  docs/
    PROFILES.md               # how profiles, wrappers, and presets fit together
    authors-preset.md         # the day-to-day sol-kimi preset, documented
```

## Requirements

- [OpenCode](https://opencode.ai)
- [ocx (kdco)](https://ocx.kdco.dev) — profile launcher
- Node >= 18 — only for rebuilding `oh-my-opencode-slim.json`
- oh-my-opencode-slim plugin
- opencode-herdr plugin — used by the `--port 0` wrappers (`oc-free`, `oc-kimi`,
  `oc-openai`, `oc-openai-go`, `oc-sol-kimi`; not `oc-default`)

## Install

```bash
git clone <this-repo> my-opencode-config
cd my-opencode-config
node scripts/build-presets.js   # regenerates oh-my-opencode-slim.json from presets/

# main config (symlink or copy)
ln -s "$PWD/opencode.jsonc"   ~/.config/opencode/opencode.jsonc
ln -s "$PWD/oh-my-opencode-slim.json" ~/.config/opencode/oh-my-opencode-slim.json
ln -s "$PWD/ocx.jsonc"        ~/.config/opencode/ocx.jsonc
# tui.json / settings.json optional — copy only if you want them

# profiles
cp -R profiles/ ~/.config/opencode/profiles/
```

Then adjust the absolute `bin` paths in `profiles/*/ocx.jsonc` — they reference
`/Users/estvmachine` and must point at your own install location
(e.g. `~/.config/opencode/profiles/bin/oc-<name>`).

## Environment variables

| Variable | Used by | Notes |
|----------|---------|-------|
| `GITHUB_ACCESS_TOKEN` | github MCP server | GitHub personal access token |
| `HASS_TOKEN` | homeassistant MCP server | Home Assistant long-lived access token |
| `STITCH_API_KEY` | stitch MCP server | optional — server is disabled by default |

## Usage

Launch a profile with ocx:

```bash
ocx opencode -p <profile>
```

| Profile | Preset | Notes |
|---------|--------|-------|
| `default` | `sol-kimi` | day-to-day config; no `--port 0` |
| `free` | `free` | free models only; `--port 0` (herdr) |
| `kimi` | `kimi` | kimi models; `--port 0` |
| `openai` | `openai` | OpenAI models; `--port 0` |
| `openai-go` | `openai-go` | OpenAI + opencode-go models; `--port 0` |
| `sol-kimi` | `sol-kimi` | sol orchestrator + kimi workers; `--port 0` |

See [docs/PROFILES.md](docs/PROFILES.md) for how profiles connect to presets.

## Editing presets

1. Edit the fragment in `presets/<name>.json`.
2. Re-run `node scripts/build-presets.js`.
3. Copy/symlink the regenerated `oh-my-opencode-slim.json` into `~/.config/opencode/`.

The fragments exist because oh-my-opencode-slim only reads the root
`~/.config/opencode/oh-my-opencode-slim.json` (plus per-project
`.opencode/oh-my-opencode-slim.json`) — it never reads the `presets/` directory.
The build script merges `_shared.json` and each preset fragment, in the fixed
order `openai, openai-go, sol-kimi, kimi, free`.

## Credits

- [oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim) — the
  agent/preset system these configs target
- [OH_MY_OPENCODE_SLIM_PRESET wrapper pattern](https://github.com/alvinunreal/oh-my-opencode-slim/issues/438) —
  how a wrapper script selects a preset per profile
- [ocx (kdco)](https://ocx.kdco.dev) — the profile launcher
