## ADDED Requirements

### Requirement: List Claude session history
The system SHALL read Claude CLI's persisted session data to display a list of past sessions. Sessions SHALL show metadata including session ID, the last prompt or message, timestamp, and associated project directory.

#### Scenario: View session history
- **WHEN** the user views the session list
- **THEN** past sessions from Claude's storage are listed alongside any currently active devlink sessions
- **AND** sessions are sorted by most recent activity

### Requirement: Resume a past session
The system SHALL allow the user to resume a past Claude session by spawning a new Claude process with `--resume <session_id>`.

#### Scenario: Resume session
- **WHEN** the user selects a past session and provides a follow-up prompt
- **THEN** a new Claude process is spawned with `--resume <session_id>` and the follow-up prompt
- **AND** the session appears as an active session in the UI with full streaming

### Requirement: Distinguish active and historical sessions
The system SHALL visually distinguish between currently running sessions (managed by devlink's process manager) and historical sessions (from Claude's storage, not currently running).

#### Scenario: Active session display
- **WHEN** a session has a running Claude process
- **THEN** it is shown with a "running" indicator, elapsed time, and cost

#### Scenario: Historical session display
- **WHEN** a session exists in Claude's storage but has no running process
- **THEN** it is shown with an "idle" indicator and a "Resume" action
