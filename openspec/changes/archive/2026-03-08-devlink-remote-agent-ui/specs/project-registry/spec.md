## ADDED Requirements

### Requirement: Register project directories

The system SHALL allow the user to register local filesystem directories as projects. Each project has a path and a display name.

#### Scenario: Add a project

- **WHEN** the user provides a directory path to register
- **THEN** the system verifies the path exists and is a directory
- **AND** creates a project record with the path and a derived or user-provided name

#### Scenario: Invalid path

- **WHEN** the user provides a path that does not exist or is not a directory
- **THEN** the system rejects the registration with an error

### Requirement: List registered projects

The system SHALL provide a list of all registered projects for display in the sidebar and the new-session picker.

#### Scenario: View projects

- **WHEN** the user views the sidebar or new-session form
- **THEN** all registered projects are listed with their name and path

### Requirement: Remove a project

The system SHALL allow the user to unregister a project. This does not delete the directory, only the registration.

#### Scenario: Remove project

- **WHEN** the user removes a project from the registry
- **THEN** the project record is deleted
- **AND** the directory on disk is not modified

### Requirement: Select project for new session

The system SHALL require a project directory selection when starting a new Claude session. The selected project's path becomes the working directory for the Claude process.

#### Scenario: Start session with project

- **WHEN** the user starts a new session and selects a project
- **THEN** the Claude process is spawned with `cwd` set to the project's path
