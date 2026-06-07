import { watch } from 'vue'

const CUSTOM_VARS = [
  '--of-player-custom-accent',
  '--of-player-custom-accent-hover',
  '--of-player-custom-accent-active',
  '--of-player-custom-accent-soft',
  '--of-player-custom-accent-border',
]

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function hexToRgb(hex) {
  const cleaned = hex.replace('#', '')
  const full =
    cleaned.length === 3
      ? cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2]
      : cleaned
  const num = parseInt(full, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function rgbToHex(r, g, b) {
  const toHex = (c) => clampChannel(c).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function darken(hex, amount) {
  const { r, g, b } = hexToRgb(hex)
  const factor = 1 - amount
  return rgbToHex(r * factor, g * factor, b * factor)
}

export function lighten(hex, amount) {
  const { r, g, b } = hexToRgb(hex)
  const factor = amount
  return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor)
}

export function withOpacity(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${clampChannel(r)}, ${clampChannel(g)}, ${clampChannel(b)}, ${alpha})`
}

export function deriveColorScheme(accent) {
  return {
    accent,
    accentHover: darken(accent, 0.15),
    accentActive: darken(accent, 0.25),
    accentSoft: withOpacity(accent, 0.12),
    accentBorder: withOpacity(accent, 0.28),
  }
}

export function deriveDarkColorScheme(accent) {
  return {
    accent: lighten(accent, 0.2),
    accentHover: lighten(accent, 0.35),
    accentActive: accent,
    accentSoft: withOpacity(accent, 0.16),
    accentBorder: withOpacity(accent, 0.34),
  }
}

function injectCustomColors(root, scheme) {
  root.style.setProperty('--of-player-custom-accent', scheme.accent)
  root.style.setProperty('--of-player-custom-accent-hover', scheme.accentHover)
  root.style.setProperty('--of-player-custom-accent-active', scheme.accentActive)
  root.style.setProperty('--of-player-custom-accent-soft', scheme.accentSoft)
  root.style.setProperty('--of-player-custom-accent-border', scheme.accentBorder)
}

function clearCustomColors(root) {
  for (const v of CUSTOM_VARS) {
    root.style.removeProperty(v)
  }
}

function applyMode(root, mode, preset, customColors) {
  if (mode === 'custom' && customColors?.accent) {
    root.dataset.playerCustom = 'true'
    root.removeAttribute('data-player-theme')
    const isDark = root.dataset.effectiveColorScheme === 'dark'
    const scheme = isDark
      ? deriveDarkColorScheme(customColors.accent)
      : deriveColorScheme(customColors.accent)
    injectCustomColors(root, scheme)
  } else if (mode === 'preset') {
    root.removeAttribute('data-player-custom')
    clearCustomColors(root)
    root.dataset.playerTheme = preset || 'blue'
  } else {
    root.removeAttribute('data-player-custom')
    clearCustomColors(root)
    root.dataset.playerTheme = preset || 'blue'
  }
}

export function usePlayerColor(preferencesStore) {
  const root = document.documentElement

  function apply() {
    applyMode(
      root,
      preferencesStore.state.playerColorMode,
      preferencesStore.state.playerColor,
      preferencesStore.state.playerColorCustom,
    )
  }

  watch(
    () => [
      preferencesStore.state.playerColorMode,
      preferencesStore.state.playerColor,
      preferencesStore.state.playerColorCustom?.accent,
    ],
    () => {
      apply()
    },
    { immediate: true },
  )

  const darkMedia = window.matchMedia('(prefers-color-scheme: dark)')

  function onColorSchemeChange() {
    if (preferencesStore.state.playerColorMode === 'custom') {
      apply()
    }
  }

  darkMedia.addEventListener('change', onColorSchemeChange)

  function dispose() {
    darkMedia.removeEventListener('change', onColorSchemeChange)
  }

  return { apply, dispose }
}
