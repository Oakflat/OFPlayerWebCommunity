# Components

This community branch keeps the player and utility components, and removes product-site and account-tier components.

## Main Components

| Component | Responsibility |
| --- | --- |
| `PlayerPage.vue` | Player route composition |
| `LibraryPanel.vue` | Library, playlist, smart collection, import, and settings entry |
| `PlayerPanel.vue` | Track list, playback controls, sorting, search, and metadata |
| `SettingsModal.vue` | Local preferences, data export/reset, theme, and privacy settings |
| `ImmersivePlayerView.vue` | Full-screen playback view |
| `ExternalLibraryDialog.vue` | External library connection form |
| `DocsPage.vue` | Markdown documentation reader |
| `TutorialsPage.vue` | Markdown tutorial reader |
| `ToolPageLayout.vue` | Shared tool page layout |

## Removed Component Families

- Official product/download/policy pages.
- Ad slot components.
- Plan, badge, upgrade, and feature-gate monetization components.
