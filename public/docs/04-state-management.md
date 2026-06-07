# State Management

The community web build uses small Vue stores created inside `createOFPlayerApp()`. Stores stay local to the app context and are injected through `useOFPlayerApp()`.

## Stores

| Store | Responsibility |
| --- | --- |
| `libraryStore` | Libraries, playlists, tracks, relations, catalog changes |
| `playerStore` | Playback state, active track, history, output controls |
| `preferencesStore` | Language, theme, color, motion, settings, active navigation |
| `sessionStore` | Current queue, current track, playback session restore |
| Feature access | Community build treats supported local features as enabled |

Account-tier state is not present in this branch.
