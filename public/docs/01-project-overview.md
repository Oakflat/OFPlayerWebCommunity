# OFPlayer Community Web Overview

OFPlayer Community Web is the public-facing browser build for the local-first OFPlayer experience. It starts at `/app`, keeps docs/tutorials/tools, and removes the former product-site pages.

## Kept

- Local music import, playback, libraries, playlists, lyrics, themes, and settings.
- Browser music tools under `/tools`.
- Docs and tutorials under `/docs` and `/tutorials`.
- Local-first storage through IndexedDB and browser APIs.

## Removed

- Product landing pages.
- Download, refund, terms, policy, promotion, and account-tier UI.
- Production release-ticket and private-domain integrations.

## Routes

| Route | Component |
| --- | --- |
| `/app` | `PlayerPage.vue` |
| `/docs/:slug?` | `DocsPage.vue` |
| `/tutorials/:slug?` | `TutorialsPage.vue` |
| `/tools` | `ToolsIndexPage.vue` |
| `/tools/**` | Individual tool pages |
