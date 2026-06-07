/**
 * CN: 主题系统架构
 * CN: 支持多主题切换，预埋埋点以适配未来扩展
 *
 * EN: Theme system architecture
 * EN: Supports multi-theme switching, with pre-embedded tracking for future expansion
 */

import { mistTheme } from './mist'
import { paperTheme } from './paper'
import { materialTheme } from './material'

export const THEMES = {
  mist: mistTheme,
  paper: paperTheme,
  material: materialTheme,
}

export const THEME_LIST = Object.keys(THEMES)

export function getThemeConfig(themeName) {
  return THEMES[themeName] || THEMES.mist
}

export function getThemeMeta(themeName) {
  const config = getThemeConfig(themeName)
  return {
    name: config.name,
    label: config.label,
    description: config.description,
    icon: config.icon,
  }
}

export function getAllThemesMeta() {
  return THEME_LIST.map(getThemeMeta)
}
