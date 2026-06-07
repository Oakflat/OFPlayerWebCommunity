# Architecture

The community web app is a Vue 3 + Vite single-page application. The app shell creates local services and stores, then renders the player, docs, tutorials, and tools through Vue Router.

## Layers

| Layer | Responsibility |
| --- | --- |
| `src/app/ofplayerApp.js` | App composition, services, stores, shared actions |
| `src/stores/**` | Local reactive state for libraries, playback, preferences, sessions |
| `src/services/**` | IndexedDB, metadata, import/export, playback, lyrics, external libraries |
| `src/components/**` | Player and reusable UI components |
| `src/pages/**` | Routed player/docs/tutorials/tools pages |
| `src/tools/**` | Tool registry and tool content metadata |

## Community Boundaries

- Feature gates resolve to enabled in this branch.
- No release-ticket API, ad network, or official-domain SEO generation is used.
- Build output is a generic static app from `vite build`.
