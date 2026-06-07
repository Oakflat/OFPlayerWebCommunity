import { createApp } from 'vue'
import App from './App.vue'
import { createOFPlayerApp, installOFPlayerApp } from './app/ofplayerApp'
import { router } from './router/index.js'
import { createUnhead, headSymbol } from '@unhead/vue'
import './style.css'

// 导入全局颜色 Token（在主题之前，以便主题可以覆盖）
import './styles/tokens/of-color-tokens.css'
import './styles/tokens/of-theme-mapping.css'
import './styles/tokens/of-component-tokens.css'
import './styles/tokens/of-player-tokens.css'

// 导入主题样式
import './themes/mist.css'
import './themes/paper.css'
import './themes/material.css'

import { exposeBuildInfo } from './utils/buildInfo'
import { readVersioned } from './utils/versionedStorage'
import { deriveColorScheme, deriveDarkColorScheme } from './composables/usePlayerColor'

exposeBuildInfo()

// Apply saved visual preferences synchronously before first paint so the user
// never sees a flash of the default theme on cold start.
// readVersioned checks __BUILD_ID__ — entries from a different deploy are
// discarded automatically, preventing stale theme data from persisting.
const visualSnapshot = readVersioned('ofp:visual')
if (visualSnapshot) {
  const root = document.documentElement
  root.dataset.theme = visualSnapshot.theme ?? 'mist'
  root.dataset.colorScheme = visualSnapshot.colorScheme ?? 'system'
  root.dataset.motion = visualSnapshot.motion ?? 'full'

  if (visualSnapshot.playerColorMode === 'custom' && visualSnapshot.playerColorCustom?.accent) {
    root.dataset.playerCustom = 'true'
    root.dataset.playerColorMode = 'custom'
    const isDark =
      window.matchMedia('(prefers-color-scheme: dark)').matches &&
      visualSnapshot.colorScheme !== 'light'
    const scheme = isDark
      ? deriveDarkColorScheme(visualSnapshot.playerColorCustom.accent)
      : deriveColorScheme(visualSnapshot.playerColorCustom.accent)
    root.style.setProperty('--of-player-custom-accent', scheme.accent)
    root.style.setProperty('--of-player-custom-accent-hover', scheme.accentHover)
    root.style.setProperty('--of-player-custom-accent-active', scheme.accentActive)
    root.style.setProperty('--of-player-custom-accent-soft', scheme.accentSoft)
    root.style.setProperty('--of-player-custom-accent-border', scheme.accentBorder)
  } else {
    root.dataset.playerTheme = visualSnapshot.playerColor ?? 'blue'
  }
}

// createOFPlayerApp is now synchronous — stores are created but not yet hydrated.
const app = createApp(App)
const head = createUnhead()
const ofplayer = createOFPlayerApp()

function removeHydratedDuplicateStructuredData() {
  document
    .querySelectorAll(
      'script[data-static-seo="true"][data-seo-type="WebApplication"], script[data-static-seo="true"][data-seo-type="FAQPage"]',
    )
    .forEach((el) => el.remove())
}

installOFPlayerApp(app, ofplayer)
app.provide(headSymbol, head)
app.use(router)

performance.mark('ofp:mount-start')
app.mount('#app')
removeHydratedDuplicateStructuredData()
performance.mark('ofp:mount-done')

// Hydration runs AFTER mount so the Vue tree is interactive immediately.
// isHydrating (ref) controls skeleton display inside the player page.
void ofplayer.hydrate()
