# OCX Profiles & oh-my-opencode-slim Presets

## Architecture

OCX profiles control file visibility, registries, and which OpenCode binary to launch.
`oh-my-opencode-slim` controls agent model assignments via named **presets**.

These two systems are **independent** — OCX does not know about oh-my-opencode-slim presets,
and oh-my-opencode-slim does not read OCX profile configs. They connect through a **wrapper script**
plus a shared helper that derives the preset name.

### How it fits together

```
ocx opencode -p sol-kimi
  → OCX reads ~/.config/opencode/profiles/sol-kimi/ocx.jsonc
  → sees "bin": "~/.config/opencode/profiles/bin/oc-sol-kimi"
  → launches oc-sol-kimi instead of `opencode` directly, with OCX_PROFILE=sol-kimi
  → oc-sol-kimi sources profiles/bin/oc-slim-preset
  → helper exports OH_MY_OPENCODE_SLIM_PRESET from OCX_PROFILE
  → exec opencode --port 0 "$@"
  → oh-my-opencode-slim plugin reads OH_MY_OPENCODE_SLIM_PRESET env var
  → loads the "sol-kimi" preset from presets.sol-kimi in oh-my-opencode-slim.json
```

OCX passes the profile name in `OCX_PROFILE`; it does **not** map profile names to presets.
The helper applies this repo's one special case: profile `default` → preset `sol-kimi`.
Every other profile name is used directly as the preset name.

### Why not `include`?

The `include` field in `ocx.jsonc` is for **file glob discovery** (making project files visible
to OpenCode's read/glob/grep tools). It does NOT merge JSON config content anywhere.
The oh-my-opencode-slim plugin only reads its config from two locations:

1. `~/.config/opencode/oh-my-opencode-slim.json` (user config)
2. `<project>/.opencode/oh-my-opencode-slim.json` (project override)

Profile-specific `oh-my-opencode-slim.json` files in `profiles/<name>/` are never read
by the plugin — which is why this repo keeps presets as fragments in `presets/` and merges
them into the root `oh-my-opencode-slim.json` with `scripts/build-presets.js`.

## Profile → Preset Mapping

| Profile       | Wrapper Script                | Preset Used   | Defined In                                                                                             |
| ------------- | ----------------------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| `claude-work` | `profiles/bin/oc-claude-work` | `claude-work` | root `oh-my-opencode-slim.json` → `presets.claude-work` (Claude Max via `opencode-with-claude` plugin) |
| `default`     | `profiles/bin/oc-default`     | `sol-kimi`    | root `oh-my-opencode-slim.json` → `presets.sol-kimi`                                                   |
| `free`        | `profiles/bin/oc-free`        | `free`        | root `oh-my-opencode-slim.json` → `presets.free`                                                       |
| `kimi`        | `profiles/bin/oc-kimi`        | `kimi`        | root `oh-my-opencode-slim.json` → `presets.kimi`                                                       |
| `kimi-go`     | `profiles/bin/oc-kimi-go`     | `kimi-go`     | root `oh-my-opencode-slim.json` → `presets.kimi-go`                                                    |
| `openai`      | `profiles/bin/oc-openai`      | `openai`      | root `oh-my-opencode-slim.json` → `presets.openai`                                                     |
| `openai-go`   | `profiles/bin/oc-openai-go`   | `openai-go`   | root `oh-my-opencode-slim.json` → `presets.openai-go`                                                  |
| `sol-kimi`    | `profiles/bin/oc-sol-kimi`    | `sol-kimi`    | root `oh-my-opencode-slim.json` → `presets.sol-kimi`                                                   |

Note: `oc-default` execs plain `opencode` (no `--port 0`). All other wrappers pass
`--port 0` before `"$@"` to enable the opencode-herdr plugin (`opencode attach --session <id>`).

## Wrapper Scripts

Location: `profiles/bin/` in this repo (installed to `~/.config/opencode/profiles/bin/`).
Keep the shared helper `oc-slim-preset` next to the wrappers when installing; it is sourced,
not executed as a wrapper.

Preset names are no longer hard-coded in each wrapper. Every `oc-*` wrapper sources the
shared helper `profiles/bin/oc-slim-preset`:

```bash
#!/usr/bin/env bash
# <name> preset
source "$(dirname "${BASH_SOURCE[0]}")/oc-slim-preset"
exec opencode --port 0 "$@"
```

`oc-default` is identical except that it execs plain `opencode` (no `--port 0`).

The helper resolves `OH_MY_OPENCODE_SLIM_PRESET` in this order:

1. `OCX_PROFILE` when set — OCX provides this automatically at launch.
2. An explicit `OH_MY_OPENCODE_SLIM_PRESET` override (useful for direct wrapper execution).
3. The wrapper basename — `oc-<name>` yields preset `<name>`.

The profile name `default` is normalized to `sol-kimi` in all of the above cases.

## Adding a New Profile with a Different Preset

1. Create the profile directory and `ocx.jsonc`:

    ```bash
    mkdir -p ~/.config/opencode/profiles/my-profile
    ```

2. Write `ocx.jsonc` (note: `bin` must be an **absolute** path pointing at your installed
   wrapper script):

    ```jsonc
    {
    	"$schema": "https://ocx.kdco.dev/schemas/profile.json",
    	"registries": {},
    	"renameWindow": true,
    	"bin": "/absolute/path/to/my-opencode-config/profiles/bin/oc-my-profile",
    	"exclude": [
    		"**/CLAUDE.md",
    		"**/CONTEXT.md",
    		"**/.opencode/**",
    		"**/opencode.jsonc",
    		"**/opencode.json",
    	],
    	"include": [],
    }
    ```

3. Create the wrapper in this repo. The profile name is derived from the filename, so the
   wrapper only needs to source the shared helper:

    ```bash
    cat > profiles/bin/oc-my-profile << 'EOF'
    #!/usr/bin/env bash
    source "$(dirname "${BASH_SOURCE[0]}")/oc-slim-preset"
    exec opencode --port 0 "$@"
    EOF
    chmod +x profiles/bin/oc-my-profile
    ```

    `oc-my-profile` produces preset `my-profile` automatically. If your preset has a
    different name, either name the wrapper after the preset or set
    `OH_MY_OPENCODE_SLIM_PRESET` explicitly when launching. The one built-in exception is
    `default`, which maps to `sol-kimi`.

4. Define the preset fragment in this repo as `presets/my-profile.json`, then rebuild:

    ```bash
    node scripts/build-presets.js
    ```

5. Copy/symlink the updated root `oh-my-opencode-slim.json` into `~/.config/opencode/`.

6. Launch: `ocx opencode -p my-profile`

## Running Without a Wrapper

For one-off use with OCX:

```bash
OH_MY_OPENCODE_SLIM_PRESET=free ocx opencode -p free
```

Here OCX sets `OCX_PROFILE=free`, which is what the helper uses. When running a wrapper
directly (no OCX), an explicit override is honored before the wrapper basename:

```bash
OH_MY_OPENCODE_SLIM_PRESET=free profiles/bin/oc-kimi
```

Without an override, the wrapper basename determines the preset, e.g.
`profiles/bin/oc-kimi` uses `kimi`.

## Reference

- oh-my-opencode-slim uses `OH_MY_OPENCODE_SLIM_PRESET` to override the `preset` field
  from the config file at startup.
- OCX profile `bin` field: custom binary path that replaces the default `opencode` binary
  when launching via `ocx opencode -p <name>`.
- Community discussion of this pattern: https://github.com/alvinunreal/oh-my-opencode-slim/issues/438
