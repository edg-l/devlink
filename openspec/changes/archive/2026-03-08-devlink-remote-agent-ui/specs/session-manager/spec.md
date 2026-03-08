## ADDED Requirements

### Requirement: Spawn Claude CLI sessions

The system SHALL spawn Claude CLI as a child process with the flags `--output-format stream-json`, `--input-format stream-json`, `--verbose`, and `--permission-prompt-tool` pointing to the devlink MCP permission tool. The process SHALL run in a specified working directory.

#### Scenario: Start a new session

- **WHEN** the user submits a prompt with a selected project directory
- **THEN** the system spawns a `claude -p` process with stream-json flags, the specified working directory, and a dynamically generated MCP config file
- **AND** returns a session ID derived from the `system.init` event's `session_id` field

#### Scenario: Start a session with a specific model

- **WHEN** the user submits a prompt with a model selection (e.g., `sonnet`, `opus`)
- **THEN** the system includes `--model <model>` in the spawn arguments

### Requirement: Stream stdout as NDJSON events

The system SHALL read the Claude process's stdout line-by-line, parse each line as JSON, and buffer all events in memory per session. Events SHALL be broadcast to connected SSE clients in real time.

#### Scenario: Events arrive while client is connected

- **WHEN** Claude emits a stream-json event on stdout
- **THEN** the event is parsed, buffered, and immediately pushed to all connected SSE clients for that session

#### Scenario: Client reconnects mid-session

- **WHEN** a client opens an SSE connection to a running session
- **THEN** the server replays all buffered events from the start of the session before streaming new events

### Requirement: Accept follow-up messages via stdin

The system SHALL accept follow-up prompts from the browser and write them to the Claude process's stdin as stream-json formatted messages.

#### Scenario: User sends a follow-up prompt

- **WHEN** the user submits a follow-up message while a session is running
- **THEN** the system writes `{"type":"user","message":{"role":"user","content":"<message>"}}` to the Claude process's stdin

### Requirement: Stop a running session

The system SHALL support stopping a running Claude process by sending SIGINT.

#### Scenario: User clicks stop

- **WHEN** the user triggers the stop action on a running session
- **THEN** the system sends SIGINT to the Claude process
- **AND** the session status transitions to idle or completed based on the process exit

### Requirement: Track session lifecycle

The system SHALL track each session's status as one of: `starting`, `running`, `idle`, `error`.

#### Scenario: Process exits successfully

- **WHEN** the Claude process exits with code 0 and the final event is `type: "result"` with `subtype: "success"`
- **THEN** the session status transitions to `idle`

#### Scenario: Process exits with error

- **WHEN** the Claude process exits with a non-zero exit code
- **THEN** the session status transitions to `error` and the error is surfaced to the client

### Requirement: Generate dynamic MCP config

The system SHALL generate a temporary MCP config JSON file per session that configures the devlink permission MCP server with session-specific environment variables.

#### Scenario: MCP config is created for a new session

- **WHEN** a new session is being spawned
- **THEN** a temp file is created containing an MCP server config pointing to the devlink permission server script, with `DEVLINK_SESSION_ID` and `DEVLINK_PORT` environment variables
- **AND** the temp file path is passed via `--mcp-config` to the Claude process
