## ADDED Requirements

### Requirement: Parse stream-json events into typed blocks

The system SHALL parse each stream-json event from Claude into a typed block structure suitable for rendering. Block types SHALL include: markdown, tool-use, tool-result, thinking, result, rate-limit, and error.

#### Scenario: Text content from assistant

- **WHEN** an event with `type: "assistant"` contains a content block with `type: "text"`
- **THEN** a markdown block is created with the text content

#### Scenario: Tool use from assistant

- **WHEN** an event with `type: "assistant"` contains a content block with `type: "tool_use"`
- **THEN** a tool-use block is created with the tool name, input, and tool_use_id

#### Scenario: Tool result

- **WHEN** an event with `type: "user"` contains a `tool_result`
- **THEN** the result is associated with its parent tool-use block by `tool_use_id`

#### Scenario: Thinking content

- **WHEN** an event with `type: "assistant"` contains a content block with `type: "thinking"`
- **THEN** a thinking block is created (collapsed by default)

#### Scenario: Session result

- **WHEN** an event with `type: "result"` arrives
- **THEN** a result block is created displaying cost, token usage, duration, and stop reason

### Requirement: Render markdown with syntax highlighting

The system SHALL render markdown text blocks with full GitHub-flavored markdown support, including syntax-highlighted fenced code blocks, tables, lists, bold/italic, links, and inline code.

#### Scenario: Code block in markdown

- **WHEN** a markdown block contains a fenced code block with a language identifier
- **THEN** the code is rendered with syntax highlighting for that language

#### Scenario: Table in markdown

- **WHEN** a markdown block contains a markdown table
- **THEN** it is rendered as a styled HTML table

### Requirement: Render tool cards with type-specific content

The system SHALL render each tool use as a collapsible card with an icon and summary. Tool-specific rendering SHALL apply based on the tool name.

#### Scenario: Read tool card

- **WHEN** a tool-use block has `name: "Read"`
- **THEN** the card displays the file path and line count, with the file content expandable

#### Scenario: Edit tool card

- **WHEN** a tool-use block has `name: "Edit"`
- **THEN** the card displays a unified diff view of `old_string` → `new_string` with syntax highlighting

#### Scenario: Bash tool card

- **WHEN** a tool-use block has `name: "Bash"`
- **THEN** the card displays the command and description, with output (including ANSI colors) expandable

#### Scenario: Write tool card

- **WHEN** a tool-use block has `name: "Write"`
- **THEN** the card displays the file path and a preview of the content with syntax highlighting

#### Scenario: Grep tool card

- **WHEN** a tool-use block has `name: "Grep"`
- **THEN** the card displays the search pattern and matching file paths or content

#### Scenario: Glob tool card

- **WHEN** a tool-use block has `name: "Glob"`
- **THEN** the card displays the glob pattern and resulting file list

### Requirement: Responsive layout adaptation

The system SHALL adapt the stream view layout between desktop and mobile breakpoints.

#### Scenario: Desktop layout

- **WHEN** the viewport width is ≥1024px
- **THEN** a persistent sidebar shows the session list and project list, and the main area shows the active session stream

#### Scenario: Mobile layout

- **WHEN** the viewport width is <768px
- **THEN** the session list is behind a hamburger menu, the session view is full-screen, and the prompt input is sticky at the bottom

### Requirement: Display session metadata

The system SHALL display session metadata from the `system.init` event, including the model name, working directory, and available tools.

#### Scenario: Session header

- **WHEN** a session is active
- **THEN** the UI shows the model, working directory, elapsed time, and accumulated cost

### Requirement: Cost and usage tracking

The system SHALL display running cost and token usage, updated from `result` and `assistant` events' usage fields.

#### Scenario: Cost display updates

- **WHEN** a `result` event arrives with `total_cost_usd`
- **THEN** the status bar updates to show the total cost, input/output token counts, and duration
