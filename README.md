# Devlink

A web-based remote session manager for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Create, monitor, and control AI coding sessions from your browser.

## Features

- **Session management** — Create sessions, stream output in real-time via SSE, view history, resume previous sessions, track costs
- **Per-project organization** — Sessions grouped by project with configurable working directories
- **Permission modes** — Plan (read-only), Ask (prompt for approval), Auto-Edit (accept file changes), Auto (fully autonomous), switchable mid-session
- **Model switching** — Switch between Claude Opus, Sonnet, and Haiku mid-session
- **Device pairing** — 6-digit code-based pairing for accessing sessions from multiple devices
- **Rich streaming UI** — Syntax-highlighted code blocks, tool cards (Bash, Edit, Read, Write, Glob, Grep), thinking blocks, diff rendering, terminal output
- **Themes** — Light and dark mode with persistence

## Tech Stack

- **Frontend**: Svelte 5, SvelteKit, Tailwind CSS 4
- **Backend**: SvelteKit server routes, SQLite via Drizzle ORM
- **Auth**: Better-Auth (email/password)
- **Rendering**: Shiki (syntax highlighting), Marked (markdown), diff2html, ansi-to-html
- **I18n**: Paraglide (en, es)
- **Testing**: Vitest, Playwright

## Getting Started

```sh
npm install
npm run dev
```

On first visit you'll be prompted to create an admin account at `/setup`.

## Building

```sh
npm run build
```

Uses `@sveltejs/adapter-node` — run the output with `node build`.

## API

| Method     | Route                        | Description            |
| ---------- | ---------------------------- | ---------------------- |
| `GET`      | `/api/sessions`              | List active sessions   |
| `POST`     | `/api/sessions`              | Create new session     |
| `GET`      | `/api/sessions/[id]/stream`  | SSE event stream       |
| `POST`     | `/api/sessions/[id]/message` | Send message           |
| `POST`     | `/api/sessions/[id]/stop`    | Stop session           |
| `POST`     | `/api/sessions/[id]/mode`    | Change permission mode |
| `PATCH`    | `/api/sessions/[id]/model`   | Switch model           |
| `GET`      | `/api/sessions/history`      | Session history        |
| `GET`      | `/api/sessions/[id]/history` | Single session history |
| `GET/POST` | `/api/projects`              | List/create projects   |
| `POST`     | `/api/pair/generate`         | Generate pairing code  |
| `POST`     | `/api/pair/validate`         | Validate pairing code  |
