## 1. Database & Project Registry

- [x] 1.1 Add Drizzle schema tables: `paired_devices` (id, name, public_key, paired_at, last_seen) and `projects` (id, path, name, created_at)
- [x] 1.2 Create API routes for project CRUD: `GET/POST /api/projects`, `DELETE /api/projects/:id` with path validation
- [x] 1.3 Build project picker Svelte component for sidebar and new-session form

## 2. Auth & Device Pairing

- [x] 2.1 Add first-boot setup page: detect no accounts exist, show account creation form, redirect to dashboard after
- [x] 2.2 Build auth guard layout: redirect unauthenticated users to login, protect all routes except `/login`, `/setup`, `/pair`
- [x] 2.3 Implement pairing code generation endpoint: `POST /api/pair/generate` — creates 6-digit code with 5-minute TTL, stores in memory
- [x] 2.4 Implement pairing code validation endpoint: `POST /api/pair/validate` — validates code, creates paired device record, issues session token
- [x] 2.5 Build pairing UI: code display page (server-side), code entry page (remote device)
- [x] 2.6 Build paired devices management page: list devices, revoke action

## 3. MCP Permission Server

- [x] 3.1 Create the MCP stdio server script (Node.js) exposing a `permission_prompt` tool that accepts `tool_name`, `input`, and optional `reason`
- [x] 3.2 Implement IPC from MCP server to devlink: HTTP POST to `localhost:<port>/api/internal/permission` with session ID, blocks until response
- [x] 3.3 Implement permission mode logic in the devlink server: receive permission request, evaluate against current session mode (plan/ask/auto-edit/auto), either resolve immediately or push to browser
- [x] 3.4 Create SSE permission event type and browser-side permission prompt component (modal with tool name, args, allow/deny buttons)
- [x] 3.5 Create REST endpoint for permission response: `POST /api/sessions/:id/permission-response` — resolves the pending Promise, unblocks MCP server
- [x] 3.6 Add permission mode toggle UI: segmented control in session header with Plan/Ask/Auto-Edit/Auto buttons, calls `POST /api/sessions/:id/mode`

## 4. Session Manager

- [x] 4.1 Build server-side session manager module: Map of active sessions with process handle, event buffer, status, permission mode, and metadata
- [x] 4.2 Implement session spawn logic: generate temp MCP config, spawn `claude -p` with all required flags, parse stdout NDJSON, track lifecycle
- [x] 4.3 Create API route `POST /api/sessions` — start a new session with prompt, project ID, model, and initial permission mode
- [x] 4.4 Create API route `POST /api/sessions/:id/message` — write follow-up prompt to Claude stdin as stream-json
- [x] 4.5 Create API route `POST /api/sessions/:id/stop` — send SIGINT to the Claude process
- [x] 4.6 Create SSE endpoint `GET /api/sessions/:id/stream` — replay buffered events then stream new events
- [x] 4.7 Handle process exit: update session status, clean up temp MCP config file, emit final status event

## 5. Session History

- [x] 5.1 Investigate `~/.claude/projects/` directory structure to understand how sessions are stored and indexed
- [x] 5.2 Create API route `GET /api/sessions/history` — list past sessions from Claude's storage with metadata (session ID, timestamp, last message, project path)
- [x] 5.3 Implement resume: `POST /api/sessions` with `resume: <session_id>` — spawns Claude with `--resume` flag
- [x] 5.4 Merge active and historical sessions in the session list UI, with visual distinction (running vs idle indicators)

## 6. Stream Renderer — Core Components

- [x] 6.1 Build event parser: transform raw stream-json events into typed block array (markdown, tool-use, tool-result, thinking, result, rate-limit, error)
- [x] 6.2 Build `MarkdownBlock` component: render markdown with a library (marked/markdown-it), integrate syntax highlighting (shiki) for code blocks
- [x] 6.3 Build `ThinkingBlock` component: collapsible block showing Claude's thinking content
- [x] 6.4 Build `ResultBlock` component: session summary card with cost, tokens, duration

## 7. Stream Renderer — Tool Cards

- [x] 7.1 Build `ToolCard` wrapper component: collapsible card with icon, tool name, summary line, expandable content
- [x] 7.2 Build `ReadCard`: display file path and line count, expandable syntax-highlighted content
- [x] 7.3 Build `EditCard`: display file path, render unified diff of old_string → new_string with syntax highlighting
- [x] 7.4 Build `WriteCard`: display file path, preview content with syntax highlighting
- [x] 7.5 Build `BashCard`: display command and description, expandable output with ANSI color rendering
- [x] 7.6 Build `GrepCard`: display pattern and results
- [x] 7.7 Build `GlobCard`: display pattern and file list

## 8. Main UI Shell

- [x] 8.1 Build responsive layout shell: sidebar (desktop) / hamburger menu (mobile), main content area, sticky bottom bar
- [x] 8.2 Build session list component: shows active sessions (with status, time, cost) and historical sessions (with resume action)
- [x] 8.3 Build new session form: project picker, model selector, permission mode selector, prompt textarea, start button
- [x] 8.4 Build session view: stream view with scrollable block list, prompt input bar, status bar (cost/tokens/time), stop button
- [x] 8.5 Wire up SSE client: connect to session stream endpoint, feed events into the block parser, handle reconnection and replay
- [x] 8.6 Wire up prompt submission: POST to session message endpoint, clear input, auto-scroll to bottom

## 9. Dependencies & Infrastructure

- [x] 9.1 Install and configure dependencies: markdown renderer, shiki (syntax highlighting), ansi-to-html, diff rendering library
- [x] 9.2 Set up SSE utility helpers: server-side SSE response builder (SvelteKit streaming response), client-side EventSource wrapper with reconnection
- [x] 9.3 Add environment variables for devlink server port (used by MCP server IPC) and any other configuration
