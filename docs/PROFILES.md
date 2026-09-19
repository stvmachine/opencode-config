# OCX Profiles & oh-my-opencode-slim Presets

## Architecture

OCX profiles control file visibility, registries, and which OpenCode binary to launch.
`oh-my-opencode-slim` controls agent model assignments via named **presets**.

These two systems are **independent** — OCX does not know about oh-my-opencode-slim presets,
and oh-my-opencode-slim does not read OCX profile configs. They connect through a **wrapper script**.

### How it fits together

```
ocx opencode -p sol-kimi
  → OCX reads ~/.config/opencode/profiles/sol-kimi/ocx.jsonc
  → sees "bin": "~/.config/opencode/profiles/bin/oc-sol-kimi"
  → launches oc-sol-kimi instead of `opencode` directly
  → oc-sol-kimi sets OH_MY_OPENCODE_SLIM_PRESET=sol-kimi
  → exec opencode --port 0 "$@"
  → oh-my-opencode-slim plugin reads OH_MY_OPENCODE_SLIM_PRESET env var
  → loads the "sol-kimi" preset from presets.sol-kimi in oh-my-opencode-slim.json
```

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

| Profile | Wrapper Script | Preset Used | Defined In |
|---------|---------------|-------------|------------|
| `default` | `profiles/bin/oc-default` | `sol-kimi` | root `oh-my-opencode-slim.json` → `presets.sol-kimi` |
| `free` | `profiles/bin/oc-free` | `free` | root `oh-my-opencode-slim.json` → `presets.free` |
| `kimi` | `profiles/bin/oc-kimi` | `kimi` | root `oh-my-opencode-slim.json` → `presets.kimi` |
| `openai` | `profiles/bin/oc-openai` | `openai` | root `oh-my-opencode-slim.json` → `presets.openai` |
| `openai-go` | `profiles/bin/oc-openai-go` | `openai-go` | root `oh-my-opencode-slim.json` → `presets.openai-go` |
| `sol-kimi` | `profiles/bin/oc-sol-kimi` | `sol-kimi` | root `oh-my-opencode-slim.json` → `presets.sol-kimi` |

Note: `oc-default` execs plain `opencode` (no `--port 0`). All other wrappers pass
`--port 0` before `"$@"` to enable the opencode-herdr plugin (`opencode attach --session <id>`).

## Wrapper Scripts

Location: `profiles/bin/` in this repo (installed to `~/.config/opencode/profiles/bin/`).

Each wrapper is a two-to-four-liner:

```bash
#!/usr/bin/env bash
# <name> preset
export OH_MY_OPENCODE_SLIM_PRESET=<preset-name>
exec opencode --port 0 "$@"
```

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
       "**/opencode.json"
     ],
     "include": []
   }
   ```

3. Create the wrapper in this repo:

   ```bash
   cat > profiles/bin/oc-my-profile << 'EOF'
   #!/usr/bin/env bash
   export OH_MY_OPENCODE_SLIM_PRESET=my-preset
   exec opencode --port 0 "$@"
   EOF
   chmod +x profiles/bin/oc-my-profile
   ```

4. Define the preset fragment in this repo as `presets/my-preset.json`, then rebuild:

   ```bash
   node scripts/build-presets.js
   ```

5. Copy/symlink the updated root `oh-my-opencode-slim.json` into `~/.config/opencode/`.

6. Launch: `ocx opencode -p my-profile`

## Running Without a Wrapper

For one-off use, set the env var directly:

```bash
OH_MY_OPENCODE_SLIM_PRESET=free ocx opencode -p free
```

## Reference

- oh-my-opencode-slim uses `OH_MY_OPENCODE_SLIM_PRESET` to override the `preset` field
  from the config file at startup.
- OCX profile `bin` field: custom binary path that replaces the default `opencode` binary
  when launching via `ocx opencode -p <name>`.
- Community discussion of this pattern: https://github.com/alvinunreal/oh-my-opencode-slim/issues/438
