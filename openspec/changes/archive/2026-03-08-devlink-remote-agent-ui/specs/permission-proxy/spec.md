## ADDED Requirements

### Requirement: MCP stdio server for permission prompts

The system SHALL provide a Node.js MCP server using stdio transport that exposes a `permission_prompt` tool. This tool is invoked by Claude CLI via `--permission-prompt-tool mcp__devlink__permission_prompt`.

#### Scenario: Claude requests permission for a tool

- **WHEN** Claude CLI calls the `permission_prompt` MCP tool with `tool_name` and `input` arguments
- **THEN** the MCP server forwards the request to the devlink server via a localhost HTTP endpoint
- **AND** blocks until a response is received from the devlink server
- **AND** returns the response (`{ behavior: "allow", updatedInput }` or `{ behavior: "deny", message }`) to Claude

### Requirement: Four permission modes switchable at runtime

The system SHALL support four permission modes that can be changed at any time during a session without restarting the Claude process. The active mode determines how the MCP permission tool responds.

#### Scenario: Plan mode

- **WHEN** the permission mode is set to "plan"
- **AND** Claude requests permission for a read-only tool (Read, Glob, Grep)
- **THEN** the permission tool returns `{ behavior: "allow", updatedInput: input }`

#### Scenario: Plan mode denies writes

- **WHEN** the permission mode is set to "plan"
- **AND** Claude requests permission for a mutating tool (Edit, Write, Bash)
- **THEN** the permission tool returns `{ behavior: "deny", message: "Plan mode — read only" }`

#### Scenario: Ask All mode

- **WHEN** the permission mode is set to "ask"
- **AND** Claude requests permission for any tool
- **THEN** the permission request is pushed to the browser via SSE
- **AND** the MCP tool blocks until the user responds with allow or deny

#### Scenario: Auto-Edit mode

- **WHEN** the permission mode is set to "auto-edit"
- **AND** Claude requests permission for Read, Edit, Write, Glob, or Grep
- **THEN** the permission tool returns `{ behavior: "allow", updatedInput: input }` immediately

#### Scenario: Auto-Edit mode asks for bash

- **WHEN** the permission mode is set to "auto-edit"
- **AND** Claude requests permission for Bash, WebFetch, or other non-file tools
- **THEN** the permission request is pushed to the browser for user approval

#### Scenario: Full Auto mode

- **WHEN** the permission mode is set to "auto"
- **AND** Claude requests permission for any tool
- **THEN** the permission tool returns `{ behavior: "allow", updatedInput: input }` immediately

### Requirement: Switch permission mode mid-session

The system SHALL allow the user to change the permission mode for a session at any time via a REST endpoint. The change takes effect on the next permission prompt.

#### Scenario: User switches from Ask All to Auto-Edit

- **WHEN** the user sends a mode change request for a running session
- **THEN** the session's permission mode is updated in memory
- **AND** the next permission prompt from Claude uses the new mode logic

### Requirement: Permission request UI in browser

The system SHALL display permission requests as a modal or inline prompt in the browser, showing the tool name, its arguments, and allow/deny buttons.

#### Scenario: Bash permission prompt

- **WHEN** a permission request arrives for a Bash tool
- **THEN** the browser displays the command to be executed, a description if available, and allow/deny buttons
- **AND** the user's response is sent back to the server, which unblocks the MCP tool
