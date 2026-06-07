import { computed, reactive, ref } from 'vue'
import { setLocalePreference } from '../composables/useI18n'
import { createPreferencesModel } from '../models/preferences'
import { writeVersioned } from '../utils/versionedStorage'
import { setTelemetryEnabled } from '../services/telemetryService'

// CN: 用于 main.js 中同步 localStorage 快照的键，在 Vue 挂载前应用视觉偏好，
// CN: 消除首次绘制时的主题闪烁。
// EN: Key for the synchronous localStorage snapshot used in main.js to apply visual
// EN: preferences before Vue mounts, eliminating the first-paint theme flash.
const VISUAL_SNAPSHOT_KEY = 'ofp:visual'

function applyPreferencesState(state, nextState) {
  state.volume = nextState.volume
  state.rememberVolume = nextState.rememberVolume
  state.language = nextState.language
  state.theme = nextState.theme
  state.colorScheme = nextState.colorScheme
  state.motion = nextState.motion
  state.playerColor = nextState.playerColor
  state.playerColorMode = nextState.playerColorMode
  state.playerColorCustom = nextState.playerColorCustom
  state.showTechnicalMetadata = nextState.showTechnicalMetadata
  state.librarySearchQuery = nextState.librarySearchQuery
  state.librarySortOption = nextState.librarySortOption
  state.libraryTypeFilter = nextState.libraryTypeFilter
  state.activeLibrary = nextState.activeLibrary
  state.activeCollection = nextState.activeCollection
  state.sidebarSection = nextState.sidebarSection
  state.dataDriver = nextState.dataDriver
  state.telemetryEnabled = nextState.telemetryEnabled
}

function getEffectiveColorScheme(colorScheme) {
  if (colorScheme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return colorScheme
}

function syncDocumentPreferences(state) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = state.theme
    document.documentElement.dataset.colorScheme = state.colorScheme
    document.documentElement.dataset.effectiveColorScheme = getEffectiveColorScheme(
      state.colorScheme,
    )
    document.documentElement.dataset.motion = state.motion
    document.documentElement.dataset.playerTheme = state.playerColor
    document.documentElement.dataset.playerColorMode = state.playerColorMode

    // CN: 持久化视觉快照，以便 main.js 在下次冷启动时同步应用，
    // CN: 在 Vue 挂载之前（零延迟主题应用）。
    // CN: writeVersioned 会用 __BUILD_ID__ 标记条目 — 上一次部署的过期条目
    // CN: 会在下次启动时自动丢弃。
    // EN: Persist visual snapshot so main.js can apply it synchronously on the
    // EN: next cold start, before Vue even mounts (zero-latency theme application).
    // EN: writeVersioned tags the entry with __BUILD_ID__ — stale entries from
    // EN: a previous deploy are automatically discarded on next startup.
    writeVersioned(VISUAL_SNAPSHOT_KEY, {
      theme: state.theme,
      colorScheme: state.colorScheme,
      motion: state.motion,
      playerColor: state.playerColor,
      playerColorMode: state.playerColorMode,
      playerColorCustom: state.playerColorCustom,
    })
  }

  setLocalePreference(state.language)
}

export function createPreferencesStore({ dataService, initialPreferences } = {}) {
  const state = reactive(createPreferencesModel(initialPreferences))
  const isSettingsOpen = ref(false)

  async function hydrate() {
    const persistedPreferences = await dataService.preferences.load()
    applyPreferencesState(state, createPreferencesModel(persistedPreferences))
    syncDocumentPreferences(state)
    // CN: 每次启动时同步持久化的同意状态到遥测服务。
    // EN: Sync persisted consent to the telemetry service on every startup.
    setTelemetryEnabled(state.telemetryEnabled === true)
    return state
  }

  function persist() {
    void dataService.preferences.save({ ...state })
  }

  function applyNormalizedPatch(patch) {
    const normalized = createPreferencesModel({
      ...state,
      ...patch,
    })

    applyPreferencesState(state, normalized)
    syncDocumentPreferences(state)
    persist()
    return normalized
  }

  function openSettings() {
    isSettingsOpen.value = true
    return true
  }

  function closeSettings() {
    isSettingsOpen.value = false
    return false
  }

  function toggleSettings() {
    isSettingsOpen.value = !isSettingsOpen.value
    return isSettingsOpen.value
  }

  function setSearchQuery(query) {
    return applyNormalizedPatch({ librarySearchQuery: query }).librarySearchQuery
  }

  function setSortOption(option) {
    return applyNormalizedPatch({ librarySortOption: option }).librarySortOption
  }

  function setTypeFilter(option) {
    return applyNormalizedPatch({ libraryTypeFilter: option }).libraryTypeFilter
  }

  function setVolume(volume) {
    return applyNormalizedPatch({ volume }).volume
  }

  function setRememberVolume(rememberVolume) {
    return applyNormalizedPatch({ rememberVolume }).rememberVolume
  }

  function setLanguage(language) {
    return applyNormalizedPatch({ language }).language
  }

  function setTheme(theme) {
    return applyNormalizedPatch({ theme }).theme
  }

  function setColorScheme(colorScheme) {
    return applyNormalizedPatch({ colorScheme }).colorScheme
  }

  function setMotion(motion) {
    return applyNormalizedPatch({ motion }).motion
  }

  function setPlayerColor(playerColor) {
    return applyNormalizedPatch({ playerColor }).playerColor
  }

  function setPlayerColorMode(playerColorMode) {
    return applyNormalizedPatch({ playerColorMode }).playerColorMode
  }

  function setPlayerColorCustom(playerColorCustom) {
    return applyNormalizedPatch({ playerColorCustom }).playerColorCustom
  }

  function setShowTechnicalMetadata(showTechnicalMetadata) {
    return applyNormalizedPatch({ showTechnicalMetadata }).showTechnicalMetadata
  }

  /**
   * CN: 记录用户的遥测同意。
   * CN: 接受 true（选择加入）、false（选择退出）或 null（尚未决定）。
   *
   * EN: Record user consent for telemetry.
   * EN: Accepts true (opted in), false (opted out), or null (not yet decided).
   */
  function setTelemetryConsent(value) {
    const normalized = value === true ? true : value === false ? false : null
    state.telemetryEnabled = normalized
    setTelemetryEnabled(normalized === true)
    persist()
    return normalized
  }

  function setActiveLibrary(activeLibrary) {
    return applyNormalizedPatch({ activeLibrary }).activeLibrary
  }

  function setActiveCollection(activeCollection) {
    return applyNormalizedPatch({ activeCollection }).activeCollection
  }

  function setSidebarSection(sidebarSection) {
    return applyNormalizedPatch({ sidebarSection }).sidebarSection
  }

  return {
    state,
    isSettingsOpen,
    volume: computed(() => state.volume),
    rememberVolume: computed(() => state.rememberVolume),
    language: computed(() => state.language),
    theme: computed(() => state.theme),
    colorScheme: computed(() => state.colorScheme),
    motion: computed(() => state.motion),
    playerColor: computed(() => state.playerColor),
    playerColorMode: computed(() => state.playerColorMode),
    playerColorCustom: computed(() => state.playerColorCustom),
    showTechnicalMetadata: computed(() => state.showTechnicalMetadata),
    searchQuery: computed(() => state.librarySearchQuery),
    sortOption: computed(() => state.librarySortOption),
    typeFilter: computed(() => state.libraryTypeFilter),
    activeLibrary: computed(() => state.activeLibrary),
    activeCollection: computed(() => state.activeCollection),
    sidebarSection: computed(() => state.sidebarSection),
    telemetryEnabled: computed(() => state.telemetryEnabled),
    hydrate,
    openSettings,
    closeSettings,
    toggleSettings,
    setSearchQuery,
    setSortOption,
    setTypeFilter,
    setVolume,
    setRememberVolume,
    setLanguage,
    setTheme,
    setColorScheme,
    setMotion,
    setPlayerColor,
    setPlayerColorMode,
    setPlayerColorCustom,
    setShowTechnicalMetadata,
    setActiveLibrary,
    setActiveCollection,
    setSidebarSection,
    setTelemetryConsent,
  }
}
