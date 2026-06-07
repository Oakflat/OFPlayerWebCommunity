import { DEFAULT_LIBRARY_ID } from './library'
import { DEFAULT_ACTIVE_COLLECTION_REF } from './collection'
import { clampVolume } from './playback'

export const DEFAULT_VOLUME = 0.8
export const DEFAULT_LIBRARY_SORT = 'recent'
export const DEFAULT_LIBRARY_FILTER = 'all'
export const DEFAULT_LANGUAGE = 'system'
export const DEFAULT_THEME = 'mist'
export const DEFAULT_COLOR_SCHEME = 'system'
export const DEFAULT_MOTION = 'full'
export const DEFAULT_PLAYER_COLOR = 'blue'
export const DEFAULT_PLAYER_COLOR_MODE = 'preset'
export const DEFAULT_PLAYER_COLOR_CUSTOM = Object.freeze({
  accent: '#0EA5E9',
})
export const DEFAULT_SIDEBAR_SECTION = 'library'

// CN: null = 尚未决定（同意对话框未显示）；true/false = 已选择加入/退出
// EN: null = not yet decided (consent dialog not shown); true/false = opted in/out
export const DEFAULT_TELEMETRY_ENABLED = null

export const LIBRARY_SORT_OPTIONS = Object.freeze(['recent', 'title', 'duration', 'size'])
export const LANGUAGE_OPTIONS = Object.freeze(['system', 'en', 'zh-CN'])
export const THEME_OPTIONS = Object.freeze(['mist', 'paper', 'material'])
export const COLOR_SCHEME_OPTIONS = Object.freeze(['light', 'dark', 'system'])
export const MOTION_OPTIONS = Object.freeze(['full', 'reduced'])
export const PLAYER_COLOR_OPTIONS = Object.freeze([
  'blue',
  'orange',
  'green',
  'rose',
  'violet',
  'amber',
  'teal',
  'slate',
])
export const PLAYER_COLOR_MODE_OPTIONS = Object.freeze(['preset', 'custom'])
export const SIDEBAR_SECTION_OPTIONS = Object.freeze(['library', 'playlist', 'view'])

function normalizeSearchQuery(value) {
  return typeof value === 'string' ? value : ''
}

function normalizeBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeEnum(value, options, fallback) {
  return options.includes(value) ? value : fallback
}

function normalizeText(value, fallback) {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed || fallback
}

export function normalizeLibrarySort(option) {
  return LIBRARY_SORT_OPTIONS.includes(option) ? option : DEFAULT_LIBRARY_SORT
}

export function normalizeLibraryTypeFilter(option) {
  const value = String(option ?? DEFAULT_LIBRARY_FILTER).trim()
  return value || DEFAULT_LIBRARY_FILTER
}

export function normalizeLanguage(option) {
  return normalizeEnum(option, LANGUAGE_OPTIONS, DEFAULT_LANGUAGE)
}

export function normalizeTheme(option) {
  return normalizeEnum(option, THEME_OPTIONS, DEFAULT_THEME)
}

export function normalizeColorScheme(option) {
  return normalizeEnum(option, COLOR_SCHEME_OPTIONS, DEFAULT_COLOR_SCHEME)
}

export function normalizeMotion(option) {
  return normalizeEnum(option, MOTION_OPTIONS, DEFAULT_MOTION)
}

export function normalizePlayerColor(option) {
  return normalizeEnum(option, PLAYER_COLOR_OPTIONS, DEFAULT_PLAYER_COLOR)
}

export function normalizePlayerColorMode(option) {
  return normalizeEnum(option, PLAYER_COLOR_MODE_OPTIONS, DEFAULT_PLAYER_COLOR_MODE)
}

export function normalizePlayerColorCustom(value) {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_PLAYER_COLOR_CUSTOM }
  }
  const accent =
    typeof value.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.accent)
      ? value.accent
      : DEFAULT_PLAYER_COLOR_CUSTOM.accent
  return { accent }
}

export function normalizeSidebarSection(option) {
  return normalizeEnum(option, SIDEBAR_SECTION_OPTIONS, DEFAULT_SIDEBAR_SECTION)
}

export function normalizeActiveLibrary(option) {
  return normalizeText(option, DEFAULT_LIBRARY_ID)
}

export function normalizeActiveCollection(option) {
  return normalizeText(option, DEFAULT_ACTIVE_COLLECTION_REF)
}

export function normalizeTelemetryEnabled(value) {
  if (value === true || value === false) return value
  return DEFAULT_TELEMETRY_ENABLED
}

export function createPreferencesModel(overrides = {}) {
  return {
    volume: clampVolume(overrides.volume, DEFAULT_VOLUME),
    rememberVolume: normalizeBoolean(overrides.rememberVolume, true),
    language: normalizeLanguage(
      overrides.language ?? overrides.localePreference ?? overrides.locale,
    ),
    theme: normalizeTheme(overrides.theme),
    colorScheme: normalizeColorScheme(overrides.colorScheme),
    motion: normalizeMotion(overrides.motion),
    playerColor: normalizePlayerColor(overrides.playerColor),
    playerColorMode: normalizePlayerColorMode(overrides.playerColorMode),
    playerColorCustom: normalizePlayerColorCustom(overrides.playerColorCustom),
    showTechnicalMetadata: normalizeBoolean(
      overrides.showTechnicalMetadata ?? overrides.showBitrateFileSize,
      true,
    ),
    librarySearchQuery: normalizeSearchQuery(overrides.librarySearchQuery ?? overrides.searchQuery),
    librarySortOption: normalizeLibrarySort(overrides.librarySortOption ?? overrides.sortOption),
    libraryTypeFilter: normalizeLibraryTypeFilter(overrides.libraryTypeFilter),
    activeLibrary: normalizeActiveLibrary(overrides.activeLibrary),
    activeCollection: normalizeActiveCollection(
      overrides.activeCollection ?? overrides.activePlaylist,
    ),
    sidebarSection: normalizeSidebarSection(overrides.sidebarSection),
    dataDriver: overrides.dataDriver ?? 'indexeddb',
    telemetryEnabled: normalizeTelemetryEnabled(overrides.telemetryEnabled),
  }
}

export function createPersistablePreferencesModel(preferences) {
  const normalized = createPreferencesModel(preferences)

  return {
    ...normalized,
    volume: normalized.rememberVolume ? normalized.volume : DEFAULT_VOLUME,
  }
}
