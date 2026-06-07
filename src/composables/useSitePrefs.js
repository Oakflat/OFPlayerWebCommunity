import { computed, ref } from 'vue'
import { setLocalePreference } from './useI18n'

const SCHEME_KEY = 'ofplayer-site-scheme'
const LANG_KEY = 'ofplayer-site-lang'
const PLAYER_PREFS_KEY = 'ofplayer:preferences'

// ── CN: 辅助函数 ─── EN: helpers ──────────────────────────────────────────────

function isSystemDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** CN: 从播放器的完整偏好 JSON 中读取 colorScheme。 */
/** EN: Read colorScheme out of the player's full preferences JSON. */
function getPlayerScheme() {
  try {
    const raw = localStorage.getItem(PLAYER_PREFS_KEY)
    if (raw) {
      const prefs = JSON.parse(raw)
      const v = prefs?.colorScheme
      if (v === 'dark' || v === 'light' || v === 'system') return v
    }
  } catch {
    /* storage unavailable or corrupted */
  }
  return null
}

/** CN: 仅修补播放器偏好 JSON 中的 colorScheme 字段。 */
/** EN: Patch only the colorScheme field in the player's preferences JSON. */
function setPlayerScheme(value) {
  try {
    const raw = localStorage.getItem(PLAYER_PREFS_KEY)
    const prefs = raw ? JSON.parse(raw) : {}
    prefs.colorScheme = value
    localStorage.setItem(PLAYER_PREFS_KEY, JSON.stringify(prefs))
  } catch {
    /* storage unavailable */
  }
}

/** CN: 从 html 元素返回有效的配色方案（由播放器设置）。 */
/** EN: Return the effective color scheme from the html element (set by the player). */
function getHtmlEffectiveScheme() {
  if (typeof document === 'undefined') return null
  const v = document.documentElement.dataset.effectiveColorScheme
  return v === 'dark' || v === 'light' ? v : null
}

// ── CN: 模块级共享状态 ─── EN: module-level shared state ─────────────────────

/**
 * CN: document.documentElement[data-effective-color-scheme] 的响应式镜像。
 * CN: 由 MutationObserver 更新，以便读取此 ref 的 Vue 计算属性
 * CN: 在播放器更改配色方案时自动重新评估。
 *
 * EN: Reactive mirror of document.documentElement[data-effective-color-scheme].
 * EN: Updated by a MutationObserver so Vue computed properties that read this
 * EN: ref automatically re-evaluate when the player changes its color scheme.
 */
const _htmlScheme = ref(getHtmlEffectiveScheme())

if (typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') {
  const _obs = new MutationObserver(() => {
    _htmlScheme.value = getHtmlEffectiveScheme()
  })
  _obs.observe(document.documentElement, {
    attributes: true,
    // CN: HTML 属性名使用连字符，而非驼峰式
    // EN: HTML attribute name uses hyphens, not camelCase
    attributeFilter: ['data-effective-color-scheme'],
  })
}

/** CN: 自有回退方案（当播放器尚未设置时使用）。 */
/** EN: Own fallback scheme (used when the player hasn't set one yet). */
const _ownScheme = ref(
  getPlayerScheme() ||
    (() => {
      try {
        return localStorage.getItem(SCHEME_KEY) || 'system'
      } catch {
        return 'system'
      }
    })(),
)

const siteLang = ref(
  (() => {
    try {
      return localStorage.getItem(LANG_KEY) || 'system'
    } catch {
      return 'system'
    }
  })(),
)

setLocalePreference(siteLang.value)

// ── CN: composable ─── EN: composable ─────────────────────────────────────────

export function useSitePrefs() {
  /**
   * CN: isDark 优先级：
   * CN:  1. html[data-effective-color-scheme] — 由播放器偏好存储设置
   * CN:  2. 自有模块级 _ownScheme ref
   * CN:  3. 系统媒体查询
   *
   * EN: isDark priority:
   * EN:  1. html[data-effective-color-scheme] — set by the player preferences store
   * EN:  2. own module-level _ownScheme ref
   * EN:  3. system media query
   */
  const isDark = computed(() => {
    if (_htmlScheme.value !== null) return _htmlScheme.value === 'dark'
    if (_ownScheme.value === 'dark') return true
    if (_ownScheme.value === 'light') return false
    return isSystemDark()
  })

  function toggleDark() {
    const next = isDark.value ? 'light' : 'dark'

    // CN: 1. 更新自有状态
    // EN: 1. Update own state
    _ownScheme.value = next

    // CN: 2. 更新 html 属性，使播放器的 CSS 变量系统立即响应
    // CN:    （两个属性被代码库的不同部分使用）
    // EN: 2. Update html attributes so the player's CSS variable system reacts
    // EN:    immediately (both attributes are used by different parts of the codebase)
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.colorScheme = next
      document.documentElement.dataset.effectiveColorScheme = next
    }

    // CN: 3. 持久化到自有轻量级键
    // EN: 3. Persist in own lightweight key
    try {
      localStorage.setItem(SCHEME_KEY, next)
    } catch {
      /* storage unavailable */
    }

    // CN: 4. 同时修补播放器的完整偏好，以便用户导航回播放器时选择仍然有效
    // EN: 4. Also patch the player's full preferences so the choice survives
    // EN:    when the user navigates back to the player
    setPlayerScheme(next)
  }

  function toggleLang() {
    siteLang.value = siteLang.value === 'zh-CN' ? 'en' : 'zh-CN'
    try {
      localStorage.setItem(LANG_KEY, siteLang.value)
    } catch {
      /* storage unavailable */
    }
    setLocalePreference(siteLang.value)
  }

  return {
    isDark,
    toggleDark,
    siteLang: computed(() => siteLang.value),
    toggleLang,
  }
}
