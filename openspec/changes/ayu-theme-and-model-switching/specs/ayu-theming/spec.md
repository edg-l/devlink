## ADDED Requirements

### Requirement: CSS custom property theme system

The app SHALL define semantic color tokens as CSS custom properties on the `<html>` element. Tokens SHALL include at minimum: bg, bg-surface, bg-overlay, bg-input, bg-active, fg, fg-muted, fg-faint, fg-accent, border, border-active, status-ok, status-error, status-warn, btn-primary-bg, btn-primary-fg. These tokens SHALL be registered with Tailwind's `@theme` directive so they are usable as utility classes.

#### Scenario: Tokens available as Tailwind utilities

- **WHEN** a component uses `bg-bg` or `text-fg` or `border-border` Tailwind classes
- **THEN** the classes resolve to the current theme's CSS custom property values

### Requirement: Three ayu theme variants

The app SHALL support three theme variants: dark, mirage, and light. Each variant SHALL define all semantic color tokens using colors from the ayu color palette. The dark variant SHALL use `html.theme-dark`, mirage SHALL use `html.theme-mirage`, and light SHALL use `html.theme-light` as selectors in `layout.css`.

#### Scenario: Dark theme colors applied

- **WHEN** `<html>` has class `theme-dark`
- **THEN** `--color-bg` resolves to `#0d1017` and `--color-fg` resolves to `#bfbdb6`

#### Scenario: Mirage theme colors applied

- **WHEN** `<html>` has class `theme-mirage`
- **THEN** `--color-bg` resolves to `#1f2430` and `--color-fg` resolves to `#cccac2`

#### Scenario: Light theme colors applied

- **WHEN** `<html>` has class `theme-light`
- **THEN** `--color-bg` resolves to `#fafafa` and `--color-fg` resolves to `#575f66`

### Requirement: Default to ayu dark

The app SHALL default to the ayu dark theme when no theme preference is stored.

#### Scenario: First visit with no stored preference

- **WHEN** a user visits the app for the first time (no localStorage entry)
- **THEN** the `theme-dark` class is applied to `<html>`

### Requirement: Theme switcher UI

The app SHALL provide a theme switcher in the sidebar that allows choosing between dark, mirage, and light variants.

#### Scenario: User switches theme

- **WHEN** user selects "Mirage" from the theme switcher
- **THEN** the `<html>` class changes from `theme-dark` to `theme-mirage` and all UI colors update immediately

### Requirement: Theme persistence

The app SHALL persist the selected theme to `localStorage` and restore it on page load.

#### Scenario: Theme restored on reload

- **WHEN** user selected "light" theme and reloads the page
- **THEN** the light theme is applied without a flash of the wrong theme

#### Scenario: Prevent flash of wrong theme

- **WHEN** the page loads with a stored theme preference
- **THEN** the theme class SHALL be applied via an inline script in `<head>` before the body renders, preventing a flash of unstyled/wrong-themed content

### Requirement: Migrate all hardcoded colors

All existing hardcoded Tailwind zinc-_ color classes SHALL be replaced with the corresponding semantic token utility classes. No zinc-_ references SHALL remain in component files after migration.

#### Scenario: Component uses semantic tokens

- **WHEN** a component that previously used `bg-zinc-900` is rendered
- **THEN** it uses `bg-bg-surface` (or the appropriate semantic token) instead
