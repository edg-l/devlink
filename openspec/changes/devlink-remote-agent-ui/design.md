## Context

Devlink is a fresh SvelteKit project (Svelte 5, adapter-node, Drizzle ORM with SQLite, better-auth, Tailwind CSS v4, Paraglide i18n). It currently has scaffolded auth and a stub schema. The goal is to add a web UI that remotely controls Claude Code CLI sessions running on the same machine.

Claude CLI supports `--output-format stream-json` and `--input-format stream-json` for programmatic use, `--permission-prompt-tool` for delegating permission prompts to an MCP tool, and `--resume` for session continuity. The user accesses the server over the internet via a fixed-IP home server with HTTPS handled by an external reverse proxy.

## Goals / Non-Goals

**Goals:**
- Remote control of Claude CLI from any browser (phone or laptop)
- Real-time streaming of Claude's output rendered as rich typed blocks
- Permission prompt proxying with four switchable modes (Plan, Ask All, Auto-Edit, Full Auto)
- Session management: create, follow, resume Claude sessions
- Secure single-user access with device pairing

**Non-Goals:**
- Multi-user / team support
- Using the Claude API directly (subscription-only, CLI-based)
- Using the Claude Agent SDK
- Push notifications (future consideration)
- Tunneling solutions (Tailscale, ngrok, etc.) — user has fixed IP
- Building a general-purpose terminal emulator

## Decisions

### 1. Process management: spawn Claude CLI as child process

Spawn `claude -p --output-format stream-json --input-format stream-json --verbose --permission-prompt-tool mcp__devlink__permission_prompt --mcp-config <dynamic>` as a child process per session. Parse stdout line-by-line as NDJSON, write to stdin for follow-ups.

**Why not the Agent SDK?** User has a Claude subscription, not an API key. The CLI is the only interface available.

**Why not PTY?** Stream-json gives structured data. A PTY would give raw terminal output requiring parsing. Stream-json is the documented programmatic interface.

### 2. Permission proxying: MCP stdio server with shared-state IPC

The `--permission-prompt-tool` flag points to an MCP tool served by a stdio server that Claude spawns as a child process. This MCP server needs to communicate with the main devlink Node process to push permission requests to the browser and receive responses.

**IPC mechanism:** The MCP server connects to the devlink server via a local HTTP endpoint (localhost-only) or Unix domain socket. When Claude calls the permission tool, the MCP server POSTs to devlink, which pushes the request to the browser via SSE, and the MCP server blocks until the response comes back.

**Why not in-process?** The MCP server is spawned by Claude CLI as a separate stdio process. It cannot share memory with devlink. IPC is required.

**Alternative considered:** Named pipes or file-based signaling. Rejected — HTTP is simpler, more debuggable, and Node already has an HTTP server running.

### 3. Server→Browser streaming: Server-Sent Events (SSE)

SSE for server-to-browser event streaming. The browser opens an EventSource to `/api/sessions/:id/stream`. The server replays buffered events on connect, then streams new events as they arrive.

**Why not WebSockets?** SSE is simpler, works through more proxies, and the data flow is naturally one-directional (server→client). Client→server communication uses REST POST endpoints, which is sufficient for sending prompts and permission responses.

### 4. Session history: read from Claude's own storage

Claude persists sessions in `~/.claude/projects/`. Devlink reads this directory to list past sessions and uses `--resume <session_id>` to continue them. No duplication of conversation history in devlink's DB.

**Devlink's DB stores only:** paired devices, registered projects, and transient active-session process state (in-memory, not persisted).

### 5. Frontend rendering: typed block components

Stream-json events are parsed into a linear sequence of typed blocks. Each block type has a dedicated Svelte component:

| Stream event | UI Component |
|---|---|
| `assistant.content[type=text]` | `MarkdownBlock` — rendered markdown with syntax-highlighted code |
| `assistant.content[type=tool_use]` | `ToolCard` — collapsible card with icon per tool type |
| `assistant.content[type=thinking]` | `ThinkingBlock` — collapsible thinking/reasoning |
| `type=user` (tool_result) | Nested inside parent `ToolCard` |
| `type=result` | `ResultBlock` — cost, tokens, duration summary |
| `type=rate_limit_event` | `RateLimitBadge` — warning badge if rate limited |

For tool cards, sub-components render tool-specific content:
- `ReadCard`: file path + line count, expandable content
- `EditCard`: inline unified diff with syntax highlighting
- `WriteCard`: full file content preview
- `BashCard`: command + ANSI-colored output
- `GrepCard`: matched lines with context
- `GlobCard`: file list

### 6. Auth: better-auth + pairing code flow

First boot creates an admin account (email/password). New devices pair via a 6-digit code:
1. User triggers pairing on the server (or navigates to `/pair`)
2. Server generates a 6-digit code, valid for 5 minutes, single-use
3. Remote device enters the code at the login page
4. Server validates, creates a paired device record, issues a session token
5. Subsequent connections use the session token via better-auth cookies

### 7. Responsive layout: sidebar on desktop, stacked on mobile

Desktop (≥1024px): persistent sidebar with session list + project list, main area shows active session stream. Mobile (<768px): session list behind hamburger menu, session view is full-screen with tabbed sections, sticky bottom bar for prompt input and actions.

### 8. MCP config generation

Each Claude session needs an MCP config that includes the devlink permission server. This is generated dynamically as a temp file per session, pointing to the devlink MCP server script with session-specific environment variables (session ID, devlink server port) passed via env.

## Risks / Trade-offs

- **[MCP server IPC latency]** → The MCP→devlink HTTP roundtrip adds latency to permission prompts. Mitigated: localhost-only, should be <1ms. User response time dominates.
- **[`--permission-prompt-tool` may be deprecated]** → Anthropic is nudging toward hooks, but hooks have a 60s timeout making them unsuitable for remote use. Mitigated: the MCP approach is confirmed working and the only viable option for async remote approval. If deprecated, hooks timeout may also be addressed.
- **[Claude CLI version coupling]** → Stream-json format may change across CLI versions. Mitigated: the format is documented and stable. Version-check on startup, surface warnings if mismatched.
- **[Session history format undocumented]** → `~/.claude/projects/` internal structure may change. Mitigated: start with listing sessions via `claude --resume` picker output if direct filesystem reading proves fragile.
- **[Single concurrent session limitation]** → Each Claude process is independent, but running many concurrent sessions on one machine uses significant resources. Mitigated: UI shows resource usage, configurable max concurrent sessions.
- **[Security: remote code execution surface]** → This is inherently an RCE system. Mitigated: strong auth (pairing flow), HTTPS required, single-user design, permission modes provide runtime safety controls.
