import { computed, inject, ref } from 'vue'
import { createDataService } from '../services/data'
import { createLibraryService } from '../services/libraryService'
import { createPlaylistService } from '../services/playlistService'
import { createTrackService } from '../services/trackService'
import { createExternalLibraryService } from '../services/externalLibraryService'
import { createLibraryStore } from '../stores/libraryStore'
import { createPreferencesStore } from '../stores/preferencesStore'
import { createPlayerStore } from '../stores/playerStore'
import { createSessionStore } from '../stores/sessionStore'
import { trackSkipNext, trackSkipPrev } from '../services/telemetryService'

const OFPLAYER_APP_KEY = Symbol('OFPLAYER_APP')
const INITIAL_HYDRATION_TIMEOUT_MS = 12000

function buildQueueFromCatalog(persistedQueueTrackIds, availableTrackIds) {
  const visibleQueue = (persistedQueueTrackIds ?? []).filter((trackId) =>
    availableTrackIds.includes(trackId),
  )

  if (visibleQueue.length === 0) {
    return availableTrackIds
  }

  return [
    ...visibleQueue,
    ...availableTrackIds.filter((trackId) => !visibleQueue.includes(trackId)),
  ]
}

// ---------------------------------------------------------------------------
// CN: 计时辅助函数 — 仅在开发模式下记录
// EN: Timing helpers — only log in dev mode
// ---------------------------------------------------------------------------
function logMeasure(label, from, to) {
  try {
    performance.measure(label, from, to)
    if (import.meta.env.DEV) {
      const entry = performance.getEntriesByName(label).at(-1)
      console.debug(`[OFPlayer] ${label}: ${entry?.duration.toFixed(1)}ms`)
    }
  } catch {
    // CN: 如果标记缺失（例如 SSR / 测试环境），则忽略
    // EN: Ignore if marks are missing (e.g. SSR / test environments)
  }
}

// ---------------------------------------------------------------------------
// CN: createOFPlayerApp — 现在是同步的。
// CN: 在挂载 Vue 应用后调用 ofplayer.hydrate()，以便 UI 立即可交互，
// CN: 同时数据在后台加载。
//
// EN: createOFPlayerApp — now SYNCHRONOUS.
// EN: Call ofplayer.hydrate() after mounting the Vue app so the UI is interactive
// EN: immediately while data loads in the background.
// ---------------------------------------------------------------------------
export function createOFPlayerApp(options = {}) {
  const dataService = createDataService(options.data ?? {})
  const libraryService = createLibraryService({ dataService })
  const playlistService = createPlaylistService({ dataService })
  const trackService = createTrackService({ dataService })
  const externalLibraryService = createExternalLibraryService({
    dataService,
    libraryService,
  })

  const libraryStore = createLibraryStore({
    libraryService,
    playlistService,
    trackService,
  })
  const sessionStore = createSessionStore({ dataService })
  const preferencesStore = createPreferencesStore({ dataService })

  // CN: playerStore 使用默认音量预先创建。偏好水合后通过 playerStore.setVolume() 修正音量。
  // EN: playerStore is created up-front with default volume.  After preferences
  // EN: hydrate the volume is corrected via playerStore.setVolume().
  const playerStore = createPlayerStore({
    dataService,
    initialVolume: preferencesStore.volume.value,
    onTrackDurationChange: ({ trackId, duration }) => {
      void libraryStore.updateTrackMetadata(trackId, { duration })
    },
    onTrackEnded: () => {
      if (libraryStore.trackCount.value <= 1) {
        return
      }

      void playNext()
    },
  })

  // CN: isHydrating 在第一个水合周期完成前为 true。
  // CN: 组件可以用它来显示骨架/加载状态。
  // EN: isHydrating is true until the first hydration cycle completes.
  // EN: Components can use it to show a skeleton/loading state.
  const isHydrating = ref(true)
  let resolvedExternalTrack = null

  const tracks = libraryStore.tracks
  const libraries = libraryStore.libraries
  const playlists = libraryStore.playlists
  const playlistTrackRelations = libraryStore.playlistTrackRelations
  const hasTracks = libraryStore.hasTracks
  const currentTrackId = computed(() => sessionStore.currentTrackId.value)
  const currentTrack = computed(() => libraryStore.getTrackById(currentTrackId.value))

  function syncQueueWithCatalog() {
    const nextQueue = buildQueueFromCatalog(
      sessionStore.queueTrackIds.value,
      libraryStore.trackIds.value,
    )

    sessionStore.setQueue(nextQueue)

    if (
      sessionStore.currentTrackId.value &&
      libraryStore.getTrackById(sessionStore.currentTrackId.value)
    ) {
      return nextQueue
    }

    sessionStore.setCurrentTrack(nextQueue[0] ?? null)
    return nextQueue
  }

  function ensureActiveLibrarySelection() {
    const activeLibraryId = preferencesStore.activeLibrary.value
    const resolvedLibrary =
      libraryStore.getLibraryById(activeLibraryId) ?? libraryStore.libraries.value[0] ?? null

    if (!resolvedLibrary) {
      return null
    }

    if (resolvedLibrary.id !== activeLibraryId) {
      preferencesStore.setActiveLibrary(resolvedLibrary.id)
    }

    const currentCollection = preferencesStore.activeCollection.value

    if (!libraryStore.isCollectionAvailableForLibrary(resolvedLibrary.id, currentCollection)) {
      preferencesStore.setActiveCollection(libraryStore.getDefaultCollectionRef(resolvedLibrary.id))
    }

    return resolvedLibrary.id
  }

  // ---------------------------------------------------------------------------
  // CN: hydrate() — 异步，在 main.js 中 app.mount() 之后调用，以便 Vue 树
  // CN: 立即渲染一个空但可交互的骨架状态。
  //
  // EN: hydrate() — async, called AFTER app.mount() in main.js so the Vue tree
  // EN: renders immediately with an empty-but-interactive skeleton state.
  // ---------------------------------------------------------------------------
  async function hydrate() {
    performance.mark('ofp:hydrate-start')

    let didRecordHydrationEnd = false
    let timeoutId = null

    function recordHydrationEnd() {
      if (didRecordHydrationEnd) {
        return
      }

      didRecordHydrationEnd = true
      performance.mark('ofp:hydrate-done')
      logMeasure('ofp:total-hydrate', 'ofp:hydrate-start', 'ofp:hydrate-done')
    }

    async function completeInitialHydration() {
      // CN: 所有四个存储并发从 IDB 读取 — 无顺序依赖。
      // CN: 偏好、目录、会话和播放历史同时开始。
      // CN: await 解析后修正音量。
      // EN: All four stores read from IDB concurrently — no sequential dependency.
      // EN: preferences, catalog, session, and play history all start at the same time.
      // EN: Volume is corrected after the await resolves.
      await Promise.all([
        preferencesStore.hydrate(),
        libraryStore.hydrate(),
        sessionStore.hydrate(),
        playerStore.hydrate(),
      ])
      playerStore.setVolume(preferencesStore.volume.value)

      performance.mark('ofp:catalog-done')
      logMeasure('ofp:hydrate', 'ofp:hydrate-start', 'ofp:catalog-done')

      // CN: 阶段 3 — 内存同步（同步）。
      // EN: Phase 3 — in-memory sync (synchronous).
      syncQueueWithCatalog()
      ensureActiveLibrarySelection()

      performance.mark('ofp:sync-done')

      // CN: 阶段 4 — 音频源设置（即发即忘）。
      // CN: 我们故意不 await 这个：设置 audio.src 可能触发耗时的网络/blob 获取。
      // CN: 播放器将以"未加载"状态启动，并在后台静默完成。
      // EN: Phase 4 — audio source setup (fire-and-forget).
      // EN: We deliberately do NOT await this: setting audio.src can trigger a
      // EN: network/blob fetch that takes time.  The player will start in a
      // EN: "not-loaded" state and silently finish in the background.
      if (sessionStore.currentTrackId.value && currentTrack.value) {
        void hydrateTrack(sessionStore.currentTrackId.value, { autoplay: false })
      }

      recordHydrationEnd()
    }

    const hydrationResult = completeInitialHydration().then(
      () => ({ status: 'complete' }),
      (error) => ({ status: 'error', error }),
    )
    const timeoutResult = new Promise((resolve) => {
      timeoutId = setTimeout(() => resolve({ status: 'timeout' }), INITIAL_HYDRATION_TIMEOUT_MS)
    })

    const result = await Promise.race([hydrationResult, timeoutResult])

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    isHydrating.value = false

    if (result.status === 'timeout') {
      console.warn(
        `[OFPlayer] Initial hydration exceeded ${INITIAL_HYDRATION_TIMEOUT_MS}ms; releasing startup skeleton while local data continues loading.`,
      )

      void hydrationResult.then((finalResult) => {
        if (finalResult.status === 'error') {
          console.error('[OFPlayer] Hydration failed after startup timeout.', finalResult.error)
        }
        recordHydrationEnd()
      })
      return
    }

    if (result.status === 'error') {
      console.error(
        '[OFPlayer] Hydration failed; continuing with default local state.',
        result.error,
      )
    }

    recordHydrationEnd()
  }

  function releaseResolvedExternalTrack(nextTrackId = null) {
    if (!resolvedExternalTrack || resolvedExternalTrack.id === nextTrackId) {
      return
    }

    externalLibraryService.releasePlayableTrack(resolvedExternalTrack)
    resolvedExternalTrack = null
  }

  async function hydrateTrack(trackId, options = {}) {
    const track = libraryStore.getTrackById(trackId)

    if (!track) {
      return false
    }

    if (resolvedExternalTrack?.id === track.id) {
      return playerStore.loadTrack(resolvedExternalTrack, options)
    }

    releaseResolvedExternalTrack(track.id)
    const playableTrack = await externalLibraryService.resolvePlayableTrack(track)

    if (playableTrack?.source?.kind === 'external-object-url') {
      resolvedExternalTrack = playableTrack
    }

    // CN: 机会性地在首次播放时丰富外部曲目的元数据，这些曲目从未解析过音频标签（metadataVersion === 0 或缺失）。
    // EN: Opportunistically enrich metadata on first play for external tracks that
    // EN: have never had their audio tags parsed (metadataVersion === 0 or absent).
    if (track.source?.connectionId && !track.metadataVersion) {
      void externalLibraryService.fetchTrackMetadata(track).then((enrichedTrack) => {
        if (enrichedTrack) {
          void libraryStore.updateTrackMetadata(enrichedTrack.id, enrichedTrack)
        }
      })
    }

    // CN: 如果内存中没有此曲目的封面，则延迟加载。
    // EN: Load artwork lazily for this track if not yet in memory.
    if (!track.artwork) {
      void dataService.artwork?.getArtwork?.(trackId).then((artwork) => {
        if (artwork) libraryStore.patchTrackArtworks(new Map([[trackId, artwork]]))
      })
    }

    return playerStore.loadTrack(playableTrack, options)
  }

  async function selectTrack(trackId, options = {}) {
    const autoplay = options.autoplay !== false
    const track = libraryStore.getTrackById(trackId)

    if (!track) {
      return false
    }

    sessionStore.setCurrentTrack(trackId)
    return hydrateTrack(trackId, { autoplay })
  }

  async function ensureSelection() {
    if (currentTrack.value) {
      return true
    }

    const fallbackTrackId = currentTrackId.value ?? libraryStore.trackIds.value[0] ?? null

    if (!fallbackTrackId) {
      return false
    }

    sessionStore.setCurrentTrack(fallbackTrackId)
    return hydrateTrack(fallbackTrackId, { autoplay: false })
  }

  /**
   * CN: 播放一组曲目（专辑/艺术家便当盒视图"播放全部"）。
   * CN: 将 tracks[] 的 id 列表写入队列，然后从第一首开始播放。
   *
   * EN: Play a group of tracks (album/artist bento box view "play all").
   * EN: Write the id list of tracks[] to the queue, then start playing from the first one.
   */
  async function playGroup(tracks = []) {
    if (tracks.length === 0) return false
    const trackIds = tracks.map((t) => t.id).filter(Boolean)
    sessionStore.setQueue(trackIds)
    return selectTrack(trackIds[0], { autoplay: true })
  }

  async function playNext() {
    const nextTrackId = sessionStore.getNextTrackId()

    if (!nextTrackId) {
      return false
    }

    trackSkipNext()
    return selectTrack(nextTrackId, { autoplay: true })
  }

  async function playPrevious() {
    if (playerStore.currentTime.value > 3 && currentTrackId.value) {
      playerStore.seek(0)
      return true
    }

    const previousTrackId = sessionStore.getPreviousTrackId()

    if (!previousTrackId) {
      return false
    }

    trackSkipPrev()
    return selectTrack(previousTrackId, { autoplay: true })
  }

  async function importFiles(files) {
    const activeLibraryId = ensureActiveLibrarySelection()

    if (!activeLibraryId) {
      return []
    }

    const importedTracks = await libraryStore.importFiles({
      libraryId: activeLibraryId,
      files,
    })

    if (importedTracks.length === 0) {
      return []
    }

    syncQueueWithCatalog()

    if (!sessionStore.currentTrackId.value) {
      sessionStore.setCurrentTrack(importedTracks[0].id)
      await hydrateTrack(importedTracks[0].id, { autoplay: false })
    }

    return importedTracks
  }

  async function togglePlayback() {
    const hasSelection = await ensureSelection()

    if (!hasSelection) {
      return false
    }

    return playerStore.toggle()
  }

  function seek(nextTime) {
    return playerStore.seek(nextTime)
  }

  function setVolume(nextVolume) {
    const safeVolume = preferencesStore.setVolume(nextVolume)
    playerStore.setVolume(safeVolume)
    return safeVolume
  }

  function setSearchQuery(query) {
    return preferencesStore.setSearchQuery(query)
  }

  function setSortOption(option) {
    return preferencesStore.setSortOption(option)
  }

  function setTypeFilter(option) {
    return preferencesStore.setTypeFilter(option)
  }

  function setActiveLibrary(libraryId) {
    const library = libraryStore.getLibraryById(libraryId)

    if (!library) {
      return preferencesStore.activeLibrary.value
    }

    const nextLibraryId = preferencesStore.setActiveLibrary(library.id)

    if (
      !libraryStore.isCollectionAvailableForLibrary(
        nextLibraryId,
        preferencesStore.activeCollection.value,
      )
    ) {
      preferencesStore.setActiveCollection(libraryStore.getDefaultCollectionRef(nextLibraryId))
    }

    return nextLibraryId
  }

  function setActiveCollection(collectionKey) {
    if (
      !libraryStore.isCollectionAvailableForLibrary(
        preferencesStore.activeLibrary.value,
        collectionKey,
      )
    ) {
      return preferencesStore.activeCollection.value
    }

    const result = preferencesStore.setActiveCollection(collectionKey)

    // CN: 进入专辑/歌手浏览器视图时延迟加载封面，以便专辑封面缩略图
    // CN: 无需阻止初始目录加载即可显示。
    // EN: Lazily load artworks when entering album/artist browser views so that
    // EN: album cover thumbnails appear without blocking the initial catalog load.
    if (collectionKey === 'view:albums' || collectionKey === 'view:artists') {
      void loadArtworksForTracks(libraryStore.trackIds.value)
    }

    return result
  }

  async function createLibrary(name) {
    const result = await libraryStore.createLibrary(name)
    setActiveLibrary(result.library.id)
    setActiveCollection(libraryStore.getDefaultCollectionRef(result.library.id))
    return result
  }

  async function connectExternalLibrary(connection) {
    const result = await externalLibraryService.connectLibrary({ connection })

    await libraryStore.hydrate()
    setActiveLibrary(result.library.id)
    setActiveCollection(libraryStore.getDefaultCollectionRef(result.library.id))
    syncQueueWithCatalog()
    return result
  }

  async function syncExternalLibrary(libraryId = preferencesStore.activeLibrary.value) {
    const result = await externalLibraryService.syncLibrary({ libraryId })

    await libraryStore.hydrate()
    syncQueueWithCatalog()
    return result
  }

  async function fetchTrackMetadata(trackId) {
    const track = libraryStore.getTrackById(trackId)

    if (!track) {
      return null
    }

    const enrichedTrack = await externalLibraryService.fetchTrackMetadata(track)

    if (enrichedTrack) {
      await libraryStore.updateTrackMetadata(enrichedTrack.id, enrichedTrack)
    }

    return enrichedTrack
  }

  /**
   * CN: 批量加载曲目 ID 列表的封面并将其补丁到内存中的曲目存储。
   * CN: 内存中已有封面的曲目将被跳过。设计为延迟调用（例如专辑浏览器打开时）。
   *
   * EN: Batch-load artworks for a list of track IDs and patch them into the
   * EN: in-memory track store.  Tracks that already have artwork in memory are
   * EN: skipped.  Designed to be called lazily (e.g. when the album browser opens).
   */
  async function loadArtworksForTracks(trackIds) {
    const safeIds = (trackIds ?? []).filter((id) => {
      const track = libraryStore.getTrackById(id)
      return track && !track.artwork
    })

    if (safeIds.length === 0) return

    const artworkMap = await (dataService.artwork?.getArtworksByTrackIds?.(safeIds) ??
      Promise.resolve(new Map()))

    if (artworkMap.size > 0) {
      libraryStore.patchTrackArtworks(artworkMap)
    }
  }

  async function renameLibrary(libraryId, name) {
    return libraryStore.renameLibrary(libraryId, name)
  }

  async function deleteLibrary(libraryId) {
    const result = await libraryStore.deleteLibrary(libraryId)

    if (
      preferencesStore.activeLibrary.value === result.deletedLibraryId &&
      result.fallbackLibraryId
    ) {
      setActiveLibrary(result.fallbackLibraryId)
      setActiveCollection(libraryStore.getDefaultCollectionRef(result.fallbackLibraryId))
    }

    syncQueueWithCatalog()

    if (currentTrackId.value && !libraryStore.getTrackById(currentTrackId.value)) {
      playerStore.reset()
      const fallbackTrackId = sessionStore.currentTrackId.value

      if (fallbackTrackId) {
        await hydrateTrack(fallbackTrackId, { autoplay: false })
      }
    }

    return result
  }

  async function reorderLibraries(orderedLibraryIds) {
    return libraryStore.reorderLibraries(orderedLibraryIds)
  }

  async function createPlaylist(name) {
    const libraryId = preferencesStore.activeLibrary.value
    return libraryStore.createPlaylist({
      libraryId,
      name,
    })
  }

  async function renamePlaylist(playlistId, name) {
    return libraryStore.renamePlaylist(playlistId, name)
  }

  async function deletePlaylist(playlistId) {
    const result = await libraryStore.deletePlaylist(playlistId)

    if (preferencesStore.activeCollection.value === `playlist:${result.deletedPlaylistId}`) {
      preferencesStore.setActiveCollection(libraryStore.getDefaultCollectionRef(result.libraryId))
    }

    return result
  }

  async function reorderPlaylists(orderedPlaylistIds) {
    return libraryStore.reorderPlaylists({
      libraryId: preferencesStore.activeLibrary.value,
      orderedPlaylistIds,
    })
  }

  async function addTrackToPlaylist({ playlistId, trackId, index }) {
    return libraryStore.addTrackToPlaylist({
      playlistId,
      trackId,
      index,
    })
  }

  async function removeTrackFromPlaylist({ playlistId, trackId }) {
    return libraryStore.removeTrackFromPlaylist({
      playlistId,
      trackId,
    })
  }

  async function deleteTrackFromLibrary(trackId) {
    const result = await libraryStore.deleteTrackFromLibrary(trackId)

    // CN: 在 syncQueueWithCatalog() 更新 currentTrackId.value 之前捕获 —
    // CN: 计算属性在 syncQueueWithCatalog 内部调用 sessionStore.setCurrentTrack() 后立即重新评估，
    // CN: 因此之后检查总是 false。
    // EN: Capture before syncQueueWithCatalog() updates currentTrackId.value —
    // EN: the computed re-evaluates immediately after sessionStore.setCurrentTrack()
    // EN: is called inside syncQueueWithCatalog, so checking afterwards is always false.
    const wasCurrentTrack = currentTrackId.value === result.deletedTrackId

    syncQueueWithCatalog()

    if (wasCurrentTrack) {
      playerStore.reset()
      const fallbackTrackId = sessionStore.currentTrackId.value

      if (fallbackTrackId) {
        await hydrateTrack(fallbackTrackId, { autoplay: false })
      }
    }

    return result
  }

  async function toggleFavorite(trackId) {
    return libraryStore.toggleFavorite(trackId)
  }

  async function reorderPlaylistTracks({ playlistId, orderedTrackIds }) {
    return libraryStore.reorderPlaylistTracks({
      playlistId,
      orderedTrackIds,
    })
  }

  function dispose() {
    releaseResolvedExternalTrack()
    playerStore.dispose()
    libraryStore.dispose()
  }

  // ---------------------------------------------------------------------------
  // CN: 导出所有曲目 → ZIP 下载
  // CN: onProgress(done, total) 在每个文件处理后调用。
  //
  // EN: Export all tracks → ZIP download
  // EN: onProgress(done, total) is called after each file is processed.
  // ---------------------------------------------------------------------------
  async function exportAllTracks(onProgress) {
    const assets = await dataService.catalog.getAllTrackAssets()
    const validAssets = assets.filter((a) => a.assetBlob instanceof Blob)

    if (validAssets.length === 0) {
      return false
    }

    // CN: 使用原始 fileName 字段构建去重的文件名。
    // CN: 前置零填充索引以保证唯一性。
    // EN: Build de-duplicated file names using the original fileName field.
    // EN: Prepend a zero-padded index to guarantee uniqueness.
    const padLen = String(validAssets.length).length
    const entries = validAssets.map((asset, index) => {
      const paddedIdx = String(index + 1).padStart(padLen, '0')
      const rawName = asset.fileName
        ? asset.fileName
        : `${asset.displayTitle ?? 'track'}.${asset.format ?? 'bin'}`
      // CN: 为安全起见，从存储的文件名中剥离任何路径分隔符
      // EN: Strip any path separators from stored filename for safety
      const safeName = rawName.replace(/[\\/]/g, '_')
      return {
        name: `${paddedIdx}_${safeName}`,
        blob: asset.assetBlob,
      }
    })

    const { buildZip, downloadBlob } = await import('../utils/zipBuilder')
    const zip = await buildZip(entries, { onProgress })
    const isoDate = new Date().toISOString().slice(0, 10)
    downloadBlob(zip, `ofplayer-library-${isoDate}.zip`)
    return true
  }

  // ---------------------------------------------------------------------------
  // CN: 清除 IDB 中的所有库数据，然后重新加载页面。
  // EN: Clear all library data from IDB, then reload the page.
  // ---------------------------------------------------------------------------
  async function clearAllData() {
    playerStore.dispose()
    libraryStore.dispose()
    await dataService.clearAllData()
    location.reload()
  }

  return {
    libraries,
    playlists,
    tracks,
    playlistTrackRelations,
    hasTracks,
    isHydrating,
    hydrate,
    currentTrackId,
    currentTrack,
    isPlaying: playerStore.isPlaying,
    currentTime: playerStore.currentTime,
    duration: computed(() => playerStore.duration.value || currentTrack.value?.duration || 0),
    volume: preferencesStore.volume,
    rememberVolume: preferencesStore.rememberVolume,
    language: preferencesStore.language,
    theme: preferencesStore.theme,
    colorScheme: preferencesStore.colorScheme,
    motion: preferencesStore.motion,
    playerColor: preferencesStore.playerColor,
    playerColorMode: preferencesStore.playerColorMode,
    playerColorCustom: preferencesStore.playerColorCustom,
    showTechnicalMetadata: preferencesStore.showTechnicalMetadata,
    recentHistory: playerStore.recentHistory,
    queueTrackIds: sessionStore.queueTrackIds,
    searchQuery: preferencesStore.searchQuery,
    sortOption: preferencesStore.sortOption,
    typeFilter: preferencesStore.typeFilter,
    activeLibrary: preferencesStore.activeLibrary,
    activeCollection: preferencesStore.activeCollection,
    sidebarSection: preferencesStore.sidebarSection,
    isSettingsOpen: preferencesStore.isSettingsOpen,
    importFiles,
    selectTrack,
    playGroup,
    togglePlayback,
    playPrevious,
    playNext,
    seek,
    setVolume,
    setSearchQuery,
    setSortOption,
    setTypeFilter,
    setActiveLibrary,
    setActiveCollection,
    createLibrary,
    connectExternalLibrary,
    syncExternalLibrary,
    fetchTrackMetadata,
    loadArtworksForTracks,
    renameLibrary,
    deleteLibrary,
    reorderLibraries,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    reorderPlaylists,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    deleteTrackFromLibrary,
    toggleFavorite,
    reorderPlaylistTracks,
    setRememberVolume: preferencesStore.setRememberVolume,
    setLanguage: preferencesStore.setLanguage,
    setTheme: preferencesStore.setTheme,
    setColorScheme: preferencesStore.setColorScheme,
    setMotion: preferencesStore.setMotion,
    setPlayerColor: preferencesStore.setPlayerColor,
    setPlayerColorMode: preferencesStore.setPlayerColorMode,
    setPlayerColorCustom: preferencesStore.setPlayerColorCustom,
    setShowTechnicalMetadata: preferencesStore.setShowTechnicalMetadata,
    setSidebarSection: preferencesStore.setSidebarSection,
    telemetryEnabled: preferencesStore.telemetryEnabled,
    setTelemetryConsent: preferencesStore.setTelemetryConsent,
    openSettings: preferencesStore.openSettings,
    closeSettings: preferencesStore.closeSettings,
    toggleSettings: preferencesStore.toggleSettings,
    stores: {
      libraryStore,
      sessionStore,
      playerStore,
      preferencesStore,
      externalLibraryService,
    },
    dispose,
    exportAllTracks,
    clearAllData,
  }
}

export function installOFPlayerApp(app, ofplayer) {
  app.provide(OFPLAYER_APP_KEY, ofplayer)
}

export function useOFPlayerApp() {
  const ofplayer = inject(OFPLAYER_APP_KEY, null)

  if (!ofplayer) {
    throw new Error('OFPlayer app has not been installed.')
  }

  return ofplayer
}
