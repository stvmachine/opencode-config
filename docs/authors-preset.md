# Author's Preset: `sol-kimi`

This is the exact configuration the author runs day-to-day.

The `default` OCX profile launches it via `profiles/bin/oc-default`, so it is what
starts when running `ocx opencode -p default`.

## The Config

```jsonc
{
  "presets": {
    "sol-kimi": {
      "orchestrator": {
        "model": "openai/gpt-5.6-sol",
        "variant": "xhigh",
        "skills": ["*"],
        "mcps": ["*", "!context7"]
      },
      "oracle": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "max",
        "skills": ["simplify"],
        "mcps": []
      },
      "council": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "librarian": {
        "model": "openai/gpt-5.6-luna",
        "skills": [],
        "mcps": ["websearch", "context7", "gh_grep"]
      },
      "explorer": {
        "model": "openai/gpt-5.6-luna",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "designer": {
        "model": "openai/gpt-5.6-sol",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "fixer": {
        "model": "openai/gpt-5.6-terra",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "observer": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-ui-checker": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-advisor-researcher": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-ai-researcher": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-assumptions-analyzer": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-code-fixer": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-code-reviewer": {
        "model": "openai/gpt-5.6-sol",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-codebase-mapper": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-debug-session-manager": {
        "model": "openai/gpt-5.6-sol",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-debugger": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-doc-classifier": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-doc-synthesizer": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-doc-verifier": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-doc-writer": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-domain-researcher": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-eval-auditor": {
        "model": "openai/gpt-5.6-sol",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-eval-planner": {
        "model": "openai/gpt-5.6-sol",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-executor": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-framework-selector": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-integration-checker": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-intel-updater": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-mempalace-curator": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-nyquist-auditor": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-pattern-mapper": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-phase-researcher": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-plan-checker": {
        "model": "openai/gpt-5.6-terra",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-planner": {
        "model": "openai/gpt-5.6-sol",
        "variant": "xhigh",
        "skills": [],
        "mcps": []
      },
      "gsd-project-researcher": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-research-synthesizer": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-roadmapper": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-security-auditor": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-ui-auditor": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-ui-researcher": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-user-profiler": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      },
      "gsd-verifier": {
        "model": "kimi-for-coding/kimi-for-coding",
        "variant": "high",
        "skills": [],
        "mcps": []
      }
    }
  }
}
```

## How it's launched

```
ocx opencode -p default
  → profiles/bin/oc-default
  → OH_MY_OPENCODE_SLIM_PRESET=sol-kimi
  → oh-my-opencode-slim loads presets.sol-kimi from oh-my-opencode-slim.json
```

`oc-default` is the one wrapper that execs plain `opencode` without `--port 0`;
the other wrappers enable the opencode-herdr plugin with `--port 0`. See
[PROFILES.md](./PROFILES.md) for the full mapping.

## Skill Reference

| Skill | Description |
|-------|-------------|
| `*` | All installed skills (granted to the orchestrator) |
| `simplify` | Simplifies code for clarity without changing behavior (granted to the oracle) |

### Notable installed skills

Installed under `~/.config/opencode/skills/`:

| Skill | Description | Source |
|-------|-------------|--------|
| `clonedeps` | Clone important project dependency source into a local workspace so OpenCode can inspect library internals | author |
| `codemap` | Generate hierarchical codemaps for unfamiliar repositories | public |
| `deepwork` | High-cost orchestrator workflow for large, high-risk, multi-phase coding efforts with review gates | author |
| `llm-docs-optimizer` | Optimize documentation for AI coding assistants (c7score, llms.txt, quality scoring) | public |
| `oh-my-opencode-slim` | Configure and improve oh-my-opencode-slim (agents, models, presets, plugin behavior) | public |
| `reflect` | Review recent work, find repeated workflow patterns, suggest reusable skills/agents/config changes | author |
| `release-smoke-test` | Test an oh-my-opencode-slim release candidate or bugfix before publishing | public |
| `simplify` | Simplifies code for clarity without changing behavior | public |
| `verification-planning` | Build an evidence path (verification plan) before non-trivial coding work | author |
| `worktrees` | Manage Git worktrees as isolated coding lanes for complex or parallel work | public |
| `gsd-code-review` | Review source files changed during a phase for bugs, security issues, and quality | public |
| `gsd-debug` | Systematic debugging with persistent state across context resets | public |
| `gsd-new-project` | Initialize a new project with deep context gathering and PROJECT.md | public |
| `gsd-ship` | Create PR, run review, and prepare for merge after verification passes | public |
| `gsd-fast` | Execute a trivial task inline — no subagents, no planning overhead | public |

(`gsd-*` skills ship with the GSD / compound-engineering plugin ecosystem and are
third-party; the rest are a mix of own/custom and public skills.)

## See Also

- [PROFILES.md](./PROFILES.md) — how the OCX profiles and wrapper scripts connect to presets
- [oh-my-opencode-slim docs](https://github.com/alvinunreal/oh-my-opencode-slim) — upstream plugin documentation, including the [authors-preset doc](https://github.com/alvinunreal/oh-my-opencode-slim/blob/master/docs/authors-preset.md) this page is modeled on
