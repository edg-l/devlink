## ADDED Requirements

### Requirement: Model dropdown in session header

The session view SHALL display a model dropdown in the header area that shows the current model and allows switching to a different model. The dropdown SHALL be visible only for active sessions (not history mode).

#### Scenario: Model displayed in header

- **WHEN** an active session is loaded with model `claude-sonnet-4-6`
- **THEN** the session header shows a dropdown displaying "Sonnet" as the current selection

#### Scenario: Dropdown lists available models

- **WHEN** user opens the model dropdown
- **THEN** it shows Opus, Sonnet, and Haiku as options

### Requirement: Model switch triggers kill and resume

When a user selects a different model from the session header dropdown, the system SHALL stop the current CLI process and respawn it with `--resume` using the same claude session ID and the new `--model` flag.

#### Scenario: Switch from Sonnet to Opus

- **WHEN** user selects "Opus" while current model is "Sonnet" on an active session
- **THEN** the system sends `PATCH /api/sessions/[id]/model` with `{ model: "claude-opus-4-6" }`
- **THEN** the backend stops the current process, waits for exit, and respawns with `--resume <claudeSessionId> --model claude-opus-4-6`

#### Scenario: Session state during model switch

- **WHEN** a model switch is in progress
- **THEN** the UI shows a transitional state (e.g., status changes briefly) rather than an error

#### Scenario: No-op when same model selected

- **WHEN** user selects the model that is already active
- **THEN** no process restart occurs

### Requirement: Model switch API endpoint

The system SHALL expose a `PATCH /api/sessions/[id]/model` endpoint that accepts `{ model: string }` and orchestrates the kill + resume flow.

#### Scenario: Successful model switch

- **WHEN** a valid PATCH request is sent with a recognized model ID
- **THEN** the endpoint returns 200 with the updated session metadata

#### Scenario: Session not found

- **WHEN** PATCH is sent for a non-existent session ID
- **THEN** the endpoint returns 404

#### Scenario: Session not active

- **WHEN** PATCH is sent for a session that has no running process
- **THEN** the endpoint returns 409 (conflict) with an appropriate error message

### Requirement: Shared model list

The list of available models (ID + label) SHALL be defined in a single shared module (`$lib/models.ts`) and used by both the NewSessionForm and the session header model dropdown.

#### Scenario: Both components use same source

- **WHEN** a new model is added to `$lib/models.ts`
- **THEN** it appears in both the new session form and the session header dropdown without additional changes

### Requirement: Model updated in DB on switch

When a model switch occurs, the session's model field SHALL be updated in the database.

#### Scenario: DB reflects new model

- **WHEN** a model switch from Sonnet to Opus completes
- **THEN** the `claude_session` table row for that session has `model = 'claude-opus-4-6'`
