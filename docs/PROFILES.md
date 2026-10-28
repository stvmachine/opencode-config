# OCX Profiles & oh-my-opencode-slim Presets

## Architecture

OCX 3 profiles live in a separate repo at `~/.config/ocx/profiles/<name>/`.
Each is a self-contained native OpenCode v2 config directory. The
`oh-my-opencode-slim.json` inside each profile carries the shared settings plus
that profile's preset, with `preset` set to the profile name — so launching a
profile selects its model lineup with no wrapper scripts or env-var tricks.

OCX 3 launches OpenCode with the profile directory as its config directory.
oh-my-opencode-slim honors `OPENCODE_CONFIG_DIR`, so it reads its config from
that directory (`<profile>/oh-my-opencode-slim.json`). This replaces the old V1
mechanism where a `bin` wrapper script set `OH_MY_OPENCODE_SLIM_PRESET`.

## Profile → Preset

| Profile       | Preset       |
| ------------- | ------------ |
| `claude-work` | `claude-work` |
| `trinity`     | `trinity`     |

## build-presets.js

`scripts/build-presets.js` merges `presets/_shared.json` with each preset
fragment in `PRESET_ORDER` and emits:

1. `~/.config/opencode/oh-my-opencode-slim.json` — shared settings + **all**
   presets, used when OpenCode runs directly (no OCX profile).
2. `~/.config/ocx/profiles/<name>/oh-my-opencode-slim.json` — shared settings +
   **that one** preset, with `preset` set to `<name>`.

The shared settings (`preset` default, `multiplexer`, `council`, `companion`,
`fallback`, `disabled_agents`) live in `presets/_shared.json`.

## Adding a Profile

1. Add `presets/<name>.json` with the agent → model map.
2. Add `<name>` to `PRESET_ORDER` in `scripts/build-presets.js`.
3. In the `ocx-config` repo, create `profiles/<name>/` with `ocx.jsonc`
   (OCX v3 schema), `opencode.jsonc`, and `AGENTS.md`.
4. Run `bun scripts/build-presets.js` to generate the profile's
   `oh-my-opencode-slim.json`, then commit both repos.
