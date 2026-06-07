<template>
  <header class="tools-nav">
    <div class="tools-nav__inner">
      <RouterLink to="/tools" class="tools-nav__logo">
        <span class="tools-nav__logo-name">OFPLAYER TOOLS</span>
      </RouterLink>
      <nav class="tools-nav__links">
        <RouterLink to="/tools" class="tools-nav__link">{{
          t('tools.layout.navTools')
        }}</RouterLink>
        <button
          class="tools-nav__icon-btn"
          :aria-label="isDark ? '切到浅色' : '切到深色'"
          @click="toggleDark"
        >
          <Sun v-if="isDark" :size="15" aria-hidden="true" />
          <Moon v-else :size="15" aria-hidden="true" />
        </button>
        <button
          class="tools-nav__lang"
          :aria-label="siteLang === 'zh-CN' ? 'Switch to English' : '切换中文'"
          @click="toggleLang"
        >
          {{ siteLang === 'zh-CN' ? 'EN' : '中文' }}
        </button>
        <RouterLink to="/app" class="tools-nav__link tools-nav__link--cta">{{
          t('tools.layout.navLaunchPlayer')
        }}</RouterLink>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { Sun, Moon } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'
import { useSitePrefs } from '../../composables/useSitePrefs.js'

const { t } = useI18n()
const { siteLang, toggleLang, isDark, toggleDark } = useSitePrefs()
</script>

<style scoped>
.tools-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--of-surface-glass, rgba(250, 250, 250, 0.45));
  backdrop-filter: blur(40px) saturate(2.2);
  -webkit-backdrop-filter: blur(40px) saturate(2.2);
  border-bottom: 1px solid var(--of-divider, var(--of-border));
  transition:
    background-color var(--transition-normal),
    border-color var(--transition-fast);
}

.tools-nav__inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 var(--space-6);
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tools-nav__logo {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.tools-nav__logo-name {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--of-ink-muted);
  transition: color var(--transition-fast);
}

.tools-nav__logo:hover .tools-nav__logo-name {
  color: var(--of-ink);
}

.tools-nav__links {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.tools-nav__link {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--of-ink-muted);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.tools-nav__link:hover {
  color: var(--of-ink);
}

.tools-nav__link--cta {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--of-radius-full, 9999px);
  background: var(--of-brand);
  color: var(--of-brand-contrast, #fff);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
}

.tools-nav__link--cta:hover {
  background: var(--of-brand-hover, var(--of-brand-active));
  color: var(--of-brand-contrast, #fff);
}

.tools-nav__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--of-radius-full, 9999px);
  border: 1px solid var(--of-border);
  background: transparent;
  color: var(--of-ink-muted);
  cursor: pointer;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast);
}

.tools-nav__icon-btn:hover {
  color: var(--of-ink);
  border-color: var(--of-brand-border, var(--of-brand));
  background: var(--of-brand-soft);
}

.tools-nav__lang {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--of-radius-full, 9999px);
  border: 1px solid var(--of-border);
  background: transparent;
  color: var(--of-ink-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast);
  line-height: 1;
}

.tools-nav__lang:hover {
  color: var(--of-ink);
  border-color: var(--of-brand-border, var(--of-brand));
  background: var(--of-brand-soft);
}
</style>
