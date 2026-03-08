## Context

Devlink is a SvelteKit web UI for managing Claude CLI sessions. It uses Tailwind CSS v4 with hardcoded zinc-\* color classes (~50+ instances across all components). There is no theme system, no CSS variables, and no way to switch appearance. Model selection happens only at session creation time — there's no way to change models mid-conversation.

The app communicates with Claude CLI via `--input-format stream-json` / `--output-format stream-json`, so the interactive `/model` TUI picker is not available. However, the CLI supports `--resume` with a different `--model` flag.

## Goals / Non-Goals

**Goals:**

- Implement ayu color palette as a CSS custom property system
- Support all three ayu variants (dark, mirage, light) with dark as default
- Allow theme switching with localStorage persistence
- Allow switching models on an active session via the session header UI
- Keep the model list in a single shared location

**Non-Goals:**

- Custom/user-defined color themes beyond the three ayu variants
- System-preference-based auto theme detection (can add later)
- Changing permission mode and model atomically in one operation
- Server-side theme persistence (localStorage is sufficient)

## Decisions

### 1. CSS custom properties on `<html>` element with Tailwind `@theme`

**Decision:** Define semantic color tokens as CSS custom properties (e.g., `--color-bg`, `--color-fg`, `--color-border`) and register them with Tailwind's `@theme` directive so they're usable as utility classes (`bg-bg`, `text-fg`, `border-border`).

Theme variants applied via `html.theme-dark`, `html.theme-mirage`, `html.theme-light` class selectors in `layout.css`.

**Why over alternatives:**

- _Redefining zinc:_ Fragile — zinc is a Tailwind built-in, overriding it is confusing and limits the palette to one scale
- _Data attributes:_ Class-based is simpler and consistent with how Tailwind themes typically work
- _Tailwind dark mode:_ Only supports two modes, we need three

### 2. Semantic token naming

**Decision:** Use a small set of semantic tokens rather than mapping the entire ayu palette:

| Token                    | Purpose                         | Dark value |
| ------------------------ | ------------------------------- | ---------- |
| `--color-bg`             | Page/main background            | `#0d1017`  |
| `--color-bg-surface`     | Cards, sidebar, panels          | `#0f131a`  |
| `--color-bg-overlay`     | Modals, dropdowns               | `#131721`  |
| `--color-bg-input`       | Form inputs                     | `#131721`  |
| `--color-bg-active`      | Active/selected states          | `#1a1f29`  |
| `--color-fg`             | Primary text                    | `#bfbdb6`  |
| `--color-fg-muted`       | Secondary text                  | `#5a6673`  |
| `--color-fg-faint`       | Disabled/hint text              | `#404953`  |
| `--color-fg-accent`      | Accent text (links, highlights) | `#e6b450`  |
| `--color-border`         | Default borders                 | `#1a1f29`  |
| `--color-border-active`  | Focused/active borders          | `#5a6673`  |
| `--color-status-ok`      | Running/success indicator       | `#aad94c`  |
| `--color-status-error`   | Error indicator                 | `#f07178`  |
| `--color-status-warn`    | Warning indicator               | `#ffb454`  |
| `--color-btn-primary-bg` | Primary button background       | `#bfbdb6`  |
| `--color-btn-primary-fg` | Primary button text             | `#0d1017`  |

**Why:** Keeps the mapping small and maintainable. Accent colors from the full ayu palette (syntax colors) can be added incrementally as needed.

### 3. Model switching via kill + resume

**Decision:** When user selects a different model on an active session:

1. Frontend sends `PATCH /api/sessions/[id]/model` with `{ model: "claude-opus-4-6" }`
2. Backend calls `stopSession()` to SIGINT the current process
3. Waits for process exit
4. Calls `spawnSession()` with `--resume <claudeSessionId>` and `--model <newModel>`
5. Updates session.model in memory and DB
6. Frontend receives status events via existing SSE connection

**Why over alternatives:**

- _Sending `/model` via stdin:_ Not supported in stream-json mode — the `/model` command is a TUI feature
- _New process without resume:_ Would lose conversation context
- _WebSocket for model change:_ Over-engineered — a simple REST call + existing SSE is sufficient

### 4. Theme switcher placement

**Decision:** Small dropdown/toggle in the app sidebar footer area. The sidebar is persistent across all views and is the natural home for app-level settings.

**Why not session header:** Theme is app-global, not session-specific. The session header already has mode toggle and will get model switcher.

### 5. Shared model list

**Decision:** Extract the models array to a shared module (`$lib/models.ts`) so both `NewSessionForm` and the session header model dropdown use the same source of truth.

## Risks / Trade-offs

- **[Resume changes model but keeps history]** → The resumed conversation will show the previous model's responses mixed with the new model's. This is the same behavior as Claude CLI's `/model` — acceptable.
- **[Process restart causes brief disconnection]** → The SSE stream will see a status change (running → idle → running). Frontend should handle this gracefully — show a brief "switching model..." state rather than an error.
- **[~50+ color class replacements]** → High volume of changes across many files. Risk of missing some or introducing visual regressions. → Mitigate by doing a codebase-wide search for `zinc-` and systematically replacing each occurrence.
- **[Three theme variants to maintain]** → Each new UI element needs colors defined for all three variants. → Semantic tokens keep this manageable — add the token once in three places.
