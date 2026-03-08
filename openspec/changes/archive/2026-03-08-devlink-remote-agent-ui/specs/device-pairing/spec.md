## ADDED Requirements

### Requirement: First-boot admin account creation

The system SHALL require creating an admin account (email and password) on first access before any other functionality is available.

#### Scenario: First visit with no accounts

- **WHEN** a user navigates to devlink and no accounts exist
- **THEN** they are shown a setup page to create the admin account
- **AND** after creation they are logged in and redirected to the dashboard

### Requirement: Pairing code generation

The system SHALL generate a 6-digit numeric pairing code when requested. The code SHALL be single-use and expire after 5 minutes.

#### Scenario: Generate pairing code

- **WHEN** the authenticated user requests a new pairing code (from the settings page or via API)
- **THEN** a 6-digit code is generated, stored with an expiration timestamp, and displayed on screen

#### Scenario: Code expires

- **WHEN** a pairing code is not used within 5 minutes
- **THEN** it becomes invalid and cannot be used to pair a device

### Requirement: Device pairing via code entry

The system SHALL allow unauthenticated devices to pair by entering a valid pairing code. Successful pairing creates a paired device record and issues a session token.

#### Scenario: Valid code entered

- **WHEN** a device submits a valid, unexpired pairing code
- **THEN** a paired device record is created in the database with a device name and timestamp
- **AND** a session token is issued via better-auth
- **AND** the pairing code is invalidated

#### Scenario: Invalid or expired code

- **WHEN** a device submits an invalid or expired pairing code
- **THEN** the pairing is rejected with an error message

### Requirement: Paired device management

The system SHALL allow the user to view and revoke paired devices.

#### Scenario: View paired devices

- **WHEN** the user navigates to the devices settings page
- **THEN** all paired devices are listed with name, paired date, and last seen

#### Scenario: Revoke a device

- **WHEN** the user revokes a paired device
- **THEN** the device's session tokens are invalidated and it can no longer access devlink

### Requirement: Auth guard on all routes

The system SHALL require authentication on all routes except the login/pairing page and the first-boot setup page.

#### Scenario: Unauthenticated access

- **WHEN** an unauthenticated request hits any protected route
- **THEN** it is redirected to the login page
