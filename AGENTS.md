# AGENTS.md

## Project
Build a local-first web music player with a SaaS-like shell.
The app should feel clean, restrained, premium, and desktop-like.

## Product constraints
- White background with subtle soft glows
- Centered 16:10 rounded rectangle as the player shell
- The shell should not visually dominate the page
- Use a left-right layout inside the shell
- Prioritize whitespace and calm visual balance

## Information architecture
- `Library` is the top-level container.
- `Playlist` must belong to a specific library.
- Each library must have a default playlist created with it.
- Imported tracks enter the current library first, then automatically appear in that library's default playlist.
- `Recently Played`, `Favorites`, and `Current Queue` are never libraries. They can only be smart playlists or system views.
- The left sidebar is navigation only: libraries, playlists, smart playlists/system views, import, and settings.
- Do not present libraries, playlists, and views as peer-level switch buttons.
- Do not turn the left sidebar into an overview dashboard or summary-card stack.
- Do not place the import action in the main content area.
- Layout responsibility is fixed:
  - Left: library selector, playlist list, smart playlists/system views, import, settings
  - Center: current playlist/view title, search/sort/filter, track table
  - Right: current track details
  - Bottom: global playback controls

## MVP scope
- Import local audio files
- Show a simple track list
- Play / pause / next / previous
- Progress bar and volume control
- Show current track info
- Save lightweight UI preferences locally

## Non-goals
- No online music sources
- No login or account system
- No cloud sync
- No social features
- No heavy visualizers
- No large UI frameworks unless clearly justified

## Engineering rules
- Keep dependencies minimal
- Prefer browser-native APIs
- Keep component boundaries clean
- Build structure first, styling second
- Do not expand scope unless explicitly requested

## Color system rules
1. Do not introduce new hard-coded colors in components.
2. Prefer semantic tokens beginning with `--of-*`.
3. Theme files may define actual color values.
4. Components should consume semantic tokens, not palette values.
5. Danger actions must use `--of-danger` tokens.
6. Current playing state must use `--of-playing` tokens.
7. Like/favorite state must use `--of-like` tokens.
8. Community support badges should use semantic status tokens.
9. Marketing/warm accent must use `--of-warm` tokens.
10. Material purple is allowed only inside the Material theme mapping.
11. Default OFplayer visual direction should be clean, direct, youthful, and not purple-dominant.

### Token files
- `src/styles/tokens/of-color-tokens.css` — Brand, neutral, semantic, music-specific, platform, pricing, shadow, gradient
- `src/styles/tokens/of-theme-mapping.css` — Mist/Paper/Material/Dark theme overrides
- `src/styles/tokens/of-component-tokens.css` — Component-level tokens (buttons, player, cards, dialogs, etc.)

### Token hierarchy
```
of-color-tokens.css (base palette + semantic)
    ↓
of-theme-mapping.css (theme overrides --of-* based on data-theme / data-effective-color-scheme)
    ↓
of-component-tokens.css (component-level tokens referencing --of-*)
    ↓
Components (consume --of-* or component tokens only)
```

### Player color customization system
- `src/styles/tokens/of-player-tokens.css` — Player color subsystem (presets + custom mode)
- `src/composables/usePlayerColor.js` — Color derivation, CSS injection, reactive sync
- `src/components/settings/PlayerColorCustomizer.vue` — Settings UI (preset/custom mode)

#### Data model
- `playerColorMode`: `'preset' | 'custom'`
- `playerColor`: preset name (`'blue'`, `'orange'`, etc.)
- `playerColorCustom`: `{ accent: '#RRGGBB' }` — single accent, other variants derived

#### CSS injection mechanism
- Preset mode: sets `data-player-theme` attribute on `<html>`
- Custom mode: sets `data-player-custom="true"` + injects `--of-player-custom-*` CSS variables
- `[data-player-custom="true"]` selector overrides preset theme variables

#### Cold start recovery
- `main.js` reads visual snapshot from localStorage and applies colors synchronously before Vue mounts
- Custom colors derive hover/active/soft/border variants at cold start time

#### Rules
12. Player color customization must use `--of-player-*` tokens, not direct color values.
13. Custom color variants (hover, active, soft, border) must be derived from the accent color.
14. Dark mode custom colors must use `deriveDarkColorScheme()` for adjusted lightness.
15. Preset themes are defined in `of-player-tokens.css` via `[data-player-theme]` selectors.
16. The `usePlayerColor` composable must be initialized once in the root page component.
