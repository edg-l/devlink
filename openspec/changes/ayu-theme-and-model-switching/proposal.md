## Why

The app uses hardcoded Tailwind zinc colors with no theming system. Adopting the ayu color palette gives devlink a distinctive, cohesive look and enables light/dark/mirage theme switching. Additionally, model selection is locked at session creation — users can't switch models mid-conversation like they can in the Claude CLI.

## What Changes

- Replace all hardcoded zinc-\* Tailwind color classes with CSS custom properties mapped to the ayu color scheme
- Default theme: ayu dark, with mirage and light as switchable alternatives
- Add a theme switcher to the UI (persisted to localStorage)
- Add a model dropdown in the session header for mid-session model switching
- Backend support for kill + resume with a different `--model` flag
- New API endpoint for model switching on active sessions

## Capabilities

### New Capabilities

- `ayu-theming`: CSS custom properties system mapping ayu dark/mirage/light color palettes to semantic UI tokens, with theme switching and persistence
- `model-switching`: Mid-session model switching via UI dropdown, implemented by killing the CLI process and respawning with `--resume` + new `--model` flag

### Modified Capabilities

(none — no existing specs)

## Impact

- **CSS/Styling**: Every component using zinc-\* colors needs migration to CSS variables (~50+ class replacements across layout, sidebar, session view, forms, etc.)
- **layout.css**: New CSS custom property definitions and theme class selectors
- **Session header UI**: New model dropdown component
- **session-spawn.ts**: New function to kill + resume with different model
- **session-manager.ts**: Method to update model on a session
- **API routes**: New endpoint for PATCH/PUT model on a session
- **DB schema**: Model field already exists, just needs update on switch
- **localStorage**: Theme preference persistence (no server-side storage needed)
