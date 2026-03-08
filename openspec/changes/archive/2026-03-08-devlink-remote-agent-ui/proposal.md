## Why

Devlink is a personal development machine, but there's no way to supervise or drive coding agents running on it from a phone or another laptop. Claude Code CLI is powerful but requires a local terminal session. We need a web interface that acts as a remote control for Claude CLI, enabling the user to submit tasks, stream live output, review changes, and handle permission prompts — all from a browser on any device.

## What Changes

- Add a web-based remote control UI for Claude Code CLI sessions
- Implement a session manager that spawns and manages `claude -p --output-format stream-json --input-format stream-json` processes
- Build an MCP permission server (stdio) that proxies Claude's permission prompts to the browser, with four runtime-switchable modes: Plan, Ask All, Auto-Edit, and Full Auto
- Stream Claude's output events (text, tool calls, tool results, diffs, bash output) to the browser via SSE, rendering them as rich typed blocks (markdown, syntax-highlighted code, inline diffs, collapsible tool cards)
- Pipe follow-up prompts from the browser back to Claude's stdin as stream-json
- Browse and resume Claude's own session history from `~/.claude/` using `--resume`
- Add a device pairing flow for secure first-time authentication from new devices
- Register and switch between project directories (working directories for Claude)
- Responsive layout: high-density desktop view with sidebar, simplified stacked mobile view

## Capabilities

### New Capabilities

- `session-manager`: Server-side process manager that spawns Claude CLI processes, buffers stream-json events, and bridges stdin/stdout to SSE/POST endpoints
- `permission-proxy`: MCP stdio server embedded in devlink that handles `--permission-prompt-tool` calls, proxies them to the browser, and supports four runtime-switchable permission modes (Plan, Ask All, Auto-Edit, Full Auto)
- `stream-renderer`: Frontend component system that parses stream-json events into typed UI blocks — markdown bubbles, tool cards (Read/Edit/Write/Bash/Grep/Glob), inline diffs, terminal output with ANSI colors, session summary cards
- `device-pairing`: Authentication flow using a time-limited pairing code displayed on the PC, entered on the remote device to establish trust and issue a long-lived session token via better-auth
- `project-registry`: Management of registered project directories that Claude sessions can target, with a picker in the new-session UI
- `session-history`: Browse and resume Claude CLI's own persisted sessions from `~/.claude/`, display session metadata, and launch `--resume` sessions

### Modified Capabilities

_None — this is a greenfield feature set on a fresh SvelteKit scaffold._

## Impact

- **Backend**: New API routes under `/api/sessions/`, `/api/projects/`, `/api/pair/`. New server-side session manager module. New MCP server script (Node.js, stdio transport).
- **Frontend**: New Svelte 5 components for stream rendering, session list, project picker, permission prompt modal, prompt input, and responsive layout shell.
- **Database**: New Drizzle schema tables for `paired_devices` and `projects`. Session data itself lives in Claude's `~/.claude/` — devlink only tracks active process state in memory.
- **Dependencies**: markdown renderer (marked or similar), syntax highlighter (shiki), ANSI-to-HTML converter, diff rendering library.
- **Infrastructure**: Requires the PC to be reachable over the internet (user's existing fixed-IP home server setup). HTTPS termination assumed to be handled externally (reverse proxy).
