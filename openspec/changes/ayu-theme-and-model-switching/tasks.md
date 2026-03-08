## 1. Theme System Foundation

- [x] 1.1 Define all ayu color values for dark, mirage, and light variants as CSS custom properties in `layout.css`, grouped under `html.theme-dark`, `html.theme-mirage`, `html.theme-light` selectors
- [x] 1.2 Register semantic tokens with Tailwind `@theme` directive so they work as utility classes (`bg-bg`, `text-fg`, `border-border`, etc.)
- [x] 1.3 Add inline `<script>` in `app.html` `<head>` to apply stored theme class before render (prevent flash)

## 2. Theme Switcher UI

- [x] 2.1 Create `ThemeSwitcher.svelte` component (dropdown or segmented control with dark/mirage/light options)
- [x] 2.2 Add ThemeSwitcher to sidebar footer in `(app)/+layout.svelte`
- [x] 2.3 Implement localStorage read/write for theme preference, default to `theme-dark`

## 3. Migrate Hardcoded Colors

- [x] 3.1 Migrate `(app)/+layout.svelte` — sidebar and layout chrome colors
- [x] 3.2 Migrate `session/[id]/+page.svelte` — session header, status bar, prompt input, buttons
- [x] 3.3 Migrate `NewSessionForm.svelte` — form inputs, buttons, labels
- [x] 3.4 Migrate `PermissionModeToggle.svelte` and other shared components
- [x] 3.5 Migrate `SessionList.svelte`, `ProjectPicker.svelte`, and sidebar components
- [x] 3.6 Migrate `StreamView.svelte` and stream rendering components
- [x] 3.7 Migrate remaining pages (settings/devices, login, pair, home)
- [x] 3.8 Verify no `zinc-` references remain in component files (grep check)

## 4. Shared Model List

- [x] 4.1 Create `$lib/models.ts` with the shared models array (Opus, Sonnet, Haiku with IDs and labels)
- [x] 4.2 Update `NewSessionForm.svelte` to import models from `$lib/models.ts`

## 5. Model Switch Backend

- [x] 5.1 Add `switchModel` function in `session-spawn.ts` that stops the process, waits for exit, and respawns with `--resume` + new `--model`
- [x] 5.2 Add `setModel` method on `SessionManager` to update session.model in memory
- [x] 5.3 Create `PATCH /api/sessions/[id]/model` endpoint — validates input, calls switchModel, updates DB
- [x] 5.4 Update DB model field on successful switch

## 6. Model Switch Frontend

- [x] 6.1 Add model dropdown to session header in `session/[id]/+page.svelte` (active sessions only), importing from `$lib/models.ts`
- [x] 6.2 Wire dropdown change to `PATCH /api/sessions/[id]/model` call
- [x] 6.3 Handle transitional state during model switch (disable dropdown, show status)
- [x] 6.4 Skip API call when selected model matches current model
