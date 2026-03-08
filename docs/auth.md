# Authentication

Devlink uses [better-auth](https://www.better-auth.com/) with email/password and a device pairing flow for remote access.

## Environment Variables

| Variable             | Description                             |
| -------------------- | --------------------------------------- |
| `ORIGIN`             | Base URL (e.g. `http://localhost:5173`) |
| `BETTER_AUTH_SECRET` | Secret key for session encryption       |

## First-Run Setup

On first visit, if no users exist in the database, all routes redirect to `/setup`.

1. User enters email and password
2. A user record is created via `auth.api.signUpEmail`
3. User is redirected to `/`

A race-condition guard re-checks the user count inside the form action to prevent duplicate admin creation.

**File:** `src/routes/setup/+page.server.ts`

## Login

Standard email/password login at `/login`. Already-authenticated users are redirected to `/`.

On success, better-auth sets a session cookie and the user is redirected to `/`.

**File:** `src/routes/login/+page.server.ts`

## Device Pairing

Pairing allows a new device (e.g. a phone) to register itself without having account credentials. Uses a 6-digit numeric code.

### Flow

```
[Authenticated device]              [New device]
        |                                |
  POST /api/pair/generate                |
        |                                |
  Gets 6-digit code  --- tell user --->  |
        |                                |
        |                      Enters code at /pair
        |                                |
        |                   POST /api/pair/validate
        |                                |
        |                   Device registered in DB
```

### Details

- **Code format:** 6 digits (100000–999999)
- **Expiry:** 5 minutes
- **Single-use:** marked as used immediately on validation
- **Storage:** in-memory `Map` (codes are lost on server restart, which is fine since they're short-lived)
- **Default device name:** "My Device" (UI) / "Unknown Device" (API fallback)

### Endpoints

| Endpoint                  | Auth Required | Description                       |
| ------------------------- | ------------- | --------------------------------- |
| `POST /api/pair/generate` | Yes           | Generate a pairing code           |
| `POST /api/pair/validate` | No            | Validate code and register device |

### UI

The `/pair` page has two modes:

- **Authenticated user:** shows a button to generate a code to share
- **Unauthenticated user:** shows a 6-digit input with auto-focus, backspace navigation, and paste support

**Files:** `src/lib/server/pairing.ts`, `src/routes/pair/+page.svelte`, `src/routes/api/pair/`

## Route Protection

### Hooks (`src/hooks.server.ts`)

The `handleBetterAuth` hook runs on every request:

1. Extracts session from request headers via `auth.api.getSession`
2. Populates `event.locals.session` and `event.locals.user`

Hook sequence: Paraglide (i18n) → BetterAuth.

### Protected Routes

| Route group       | Guard                   | Redirect   |
| ----------------- | ----------------------- | ---------- |
| `/` (root layout) | No users in DB?         | → `/setup` |
| `/(app)/*`        | No `event.locals.user`? | → `/login` |
| API routes        | No `event.locals.user`? | → 401      |

All routes under the `(app)` group require authentication. API routes return `401 Unauthorized` for unauthenticated requests.

## Database Tables

Better-auth manages these tables (defined in `src/lib/server/db/auth.schema.ts`):

| Table          | Purpose                                   |
| -------------- | ----------------------------------------- |
| `user`         | User accounts (id, email, name)           |
| `session`      | Auth sessions (token, expiry, user agent) |
| `account`      | Multi-provider support (unused)           |
| `verification` | Email verification codes (unused)         |

Custom table (defined in `src/lib/server/db/schema.ts`):

| Table           | Purpose                                           |
| --------------- | ------------------------------------------------- |
| `paired_device` | Registered devices (id, name, pairedAt, lastSeen) |

## Not Implemented

- OAuth / social login
- Email verification
- Password reset
- Two-factor authentication
- Rate limiting on auth endpoints
