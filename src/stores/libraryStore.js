import { computed, ref } from 'vue'
import {
  parseCollectionRef,
  SMART_VIEW_KEYS,
  createPlaylistCollectionRef,
} from '../models/collection'
import { SYSTEM_PLAYLIST_KEYS } from '../models/playlist'

const SMART_VIEW_KEY_SET = new Set(Object.values(SMART_VIEW_KEYS))

function sortByOrder(items = []) {
  return [...items].sort((left, right) => {
    const orderDiff = (left?.order ?? 0) - (right?.order ?? 0)

    if (orderDiff !== 0) {
      return orderDiff
    }

    return String(left?.createdAt ?? left?.id ?? '').localeCompare(
      String(right?.createdAt ?? right?.id ?? ''),
    )
  })
}

export function createLibraryStore({ libraryService, playlistService, trackService }) {
  const libraries = ref([])
  const playlists = ref([])
  const tracks = ref([])
  const playlistTrackRelations = ref([])

  // ---------------------------------------------------------------------------
  // CN: O(1) 查找映射 — 作为计算属性维护，仅在源数组变化时重建，而非每次访问时。
  // EN: O(1) lookup maps — maintained as computed refs so they rebuild only when
  // EN: their source arrays change, not on every access.
  // ---------------------------------------------------------------------------
  const tracksById = computed(() => {
    const m = new Map()
    for (const t of tracks.value) m.set(t.id, t)
    return m
  })
  const librariesById = computed(() => {
    const m = new Map()
    for (const l of libraries.value) m.set(l.id, l)
    return m
  })
  const playlistsById = computed(() => {
    const m = new Map()
    for (const p of playlists.value) m.set(p.id, p)
    return m
  })

  const libraryIds = computed(() => libraries.value.map((library) => library.id))
  const trackIds = computed(() => tracks.value.map((track) => track.id))
  const trackCount = computed(() => tracks.value.length)
  const hasTracks = computed(() => trackCount.value > 0)

  function releaseTrack(track) {
    if (!track) {
      return
    }

    trackService.releaseTracks([track])
  }

  function mergeTrackPreservingSource(nextTrack) {
    const currentTrack = getTrackById(nextTrack.id)

    if (!currentTrack) {
      return nextTrack
    }

    return {
      ...currentTrack,
      ...nextTrack,
      artwork: nextTrack.artwork || currentTrack.artwork,
      source: currentTrack.source,
      file: currentTrack.file ?? nextTrack.file ?? null,
    }
  }

  function replaceTrack(nextTrack) {
    let previousTrack = null

    tracks.value = tracks.value.map((track) => {
      if (track.id !== nextTrack.id) {
        return track
      }

      previousTrack = track
      return nextTrack
    })

    if (
      previousTrack &&
      previousTrack !== nextTrack &&
      previousTrack?.source?.url !== nextTrack?.source?.url
    ) {
      releaseTrack(previousTrack)
    }
  }

  function removeTrackFromState(trackId) {
    let removedTrack = null

    tracks.value = tracks.value.filter((track) => {
      if (track.id !== trackId) {
        return true
      }

      removedTrack = track
      return false
    })

    releaseTrack(removedTrack)
  }

  async function hydrate() {
    const snapshot = await libraryService.loadCatalog()

    // CN: 保留已存在曲目的内存源 URL 和已加载的封面，以便重新水合
    // CN: （例如外部库同步后）不会撤销当前设置在音频元素上的 blob URL。
    // EN: Preserve in-memory source URLs and loaded artwork for tracks that already
    // EN: exist, so that re-hydration (e.g. after an external library sync) does
    // EN: not revoke the blob URL currently set on the audio element.
    const nextTracks = snapshot.tracks.map((newTrack) => mergeTrackPreservingSource(newTrack))

    // CN: 快照通过 createRuntimeTrackFromPersistedTrack 为所有本地曲目创建新的 blob URL。
    // CN: 对于已存在于内存中的曲目，我们在上面保留了原始 URL，所以现在撤销冗余的新 URL
    // CN: 以避免累积不可达的 blob URL。
    // EN: The snapshot creates fresh blob URLs for all local tracks via
    // EN: createRuntimeTrackFromPersistedTrack.  For tracks that already existed in
    // EN: memory we kept the original URL above, so revoke the redundant new ones
    // EN: now to avoid accumulating unreachable blob URLs.
    snapshot.tracks.forEach((newTrack) => {
      const prevTrack = tracksById.value.get(newTrack.id)
      if (prevTrack && newTrack.source?.url && newTrack.source.url !== prevTrack.source?.url) {
        trackService.releaseTracks([newTrack])
      }
    })

    // CN: 释放已从目录中完全移除的曲目。
    // EN: Release tracks that were removed entirely from the catalog.
    const nextTrackIdSet = new Set(nextTracks.map((t) => t.id))
    const removedTracks = tracks.value.filter((t) => !nextTrackIdSet.has(t.id))
    trackService.releaseTracks(removedTracks)

    libraries.value = sortByOrder(snapshot.libraries)
    playlists.value = sortByOrder(snapshot.playlists)
    tracks.value = nextTracks
    playlistTrackRelations.value = snapshot.playlistTrackRelations

    return {
      libraries: libraries.value,
      playlists: playlists.value,
      tracks: tracks.value,
      playlistTrackRelations: playlistTrackRelations.value,
    }
  }

  function getLibraryById(libraryId) {
    return librariesById.value.get(libraryId) ?? null
  }

  function getPlaylistById(playlistId) {
    return playlistsById.value.get(playlistId) ?? null
  }

  function getTrackById(trackId) {
    return tracksById.value.get(trackId) ?? null
  }

  function getTracksForLibrary(libraryId) {
    return tracks.value.filter((track) => track.libraryId === libraryId)
  }

  function getPlaylistTrackRelations(playlistId) {
    return playlistTrackRelations.value
      .filter((relation) => relation.playlistId === playlistId)
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
  }

  function getDefaultPlaylistForLibrary(libraryId) {
    return (
      playlists.value.find(
        (playlist) =>
          playlist.libraryId === libraryId &&
          playlist.systemKey === SYSTEM_PLAYLIST_KEYS.ALL_TRACKS,
      ) ?? null
    )
  }

  function getDefaultCollectionRef(libraryId) {
    const playlist = getDefaultPlaylistForLibrary(libraryId)
    return playlist ? createPlaylistCollectionRef(playlist.id) : null
  }

  function isCollectionAvailableForLibrary(libraryId, collectionRef) {
    const parsedCollection = parseCollectionRef(collectionRef)

    if (parsedCollection.type === 'playlist') {
      const playlist = getPlaylistById(parsedCollection.value)
      return playlist?.libraryId === libraryId
    }

    if (parsedCollection.type === 'view') {
      return SMART_VIEW_KEY_SET.has(parsedCollection.value)
    }

    return false
  }

  async function createLibrary(name) {
    const { library, defaultPlaylist } = await libraryService.createLibrary({ name })

    libraries.value = sortByOrder([...libraries.value, library])
    playlists.value = sortByOrder([...playlists.value, defaultPlaylist])

    return {
      library,
      defaultPlaylist,
    }
  }

  async function renameLibrary(libraryId, name) {
    const nextLibrary = await libraryService.renameLibrary(libraryId, name)

    libraries.value = libraries.value.map((library) =>
      library.id === nextLibrary.id ? nextLibrary : library,
    )
    return nextLibrary
  }

  async function deleteLibrary(libraryId) {
    const result = await libraryService.deleteLibrary(libraryId)

    libraries.value = libraries.value.filter((library) => library.id !== result.deletedLibraryId)
    playlists.value = playlists.value.filter(
      (playlist) => !result.deletedPlaylistIds.includes(playlist.id),
    )
    playlistTrackRelations.value = playlistTrackRelations.value.filter(
      (relation) => !result.deletedRelationIds.includes(relation.id),
    )
    result.deletedTrackIds.forEach((trackId) => {
      removeTrackFromState(trackId)
    })
    libraries.value = sortByOrder(libraries.value)
    playlists.value = sortByOrder(playlists.value)

    return result
  }

  async function reorderLibraries(orderedLibraryIds) {
    const nextLibraries = await libraryService.reorderLibraries(orderedLibraryIds)
    libraries.value = sortByOrder(nextLibraries)
    return libraries.value
  }

  async function createPlaylist({ libraryId, name }) {
    const playlist = await playlistService.createPlaylist({ libraryId, name })
    playlists.value = sortByOrder([...playlists.value, playlist])
    return playlist
  }

  async function renamePlaylist(playlistId, name) {
    const nextPlaylist = await playlistService.renamePlaylist(playlistId, name)
    playlists.value = playlists.value.map((playlist) =>
      playlist.id === nextPlaylist.id ? nextPlaylist : playlist,
    )
    return nextPlaylist
  }

  async function deletePlaylist(playlistId) {
    const result = await playlistService.deletePlaylist(playlistId)

    playlists.value = playlists.value.filter((playlist) => playlist.id !== result.deletedPlaylistId)
    playlistTrackRelations.value = playlistTrackRelations.value.filter(
      (relation) => !result.deletedRelationIds.includes(relation.id),
    )
    playlists.value = sortByOrder(playlists.value)

    return result
  }

  async function reorderPlaylists({ libraryId, orderedPlaylistIds }) {
    const nextLibraryPlaylists = await playlistService.reorderPlaylists(
      libraryId,
      orderedPlaylistIds,
    )
    const libraryPlaylistIdSet = new Set(nextLibraryPlaylists.map((playlist) => playlist.id))
    const preservedPlaylists = playlists.value.filter(
      (playlist) => !libraryPlaylistIdSet.has(playlist.id),
    )

    playlists.value = sortByOrder([...preservedPlaylists, ...nextLibraryPlaylists])
    return nextLibraryPlaylists
  }

  async function importFiles({ libraryId, files }) {
    const importedTracks = await trackService.importFiles({ libraryId, files })

    if (importedTracks.length === 0) {
      return []
    }

    tracks.value = [...tracks.value, ...importedTracks]
    return importedTracks
  }

  async function updateTrackMetadata(trackId, patch) {
    const nextTrack = await trackService.updateTrackMetadata(trackId, patch)
    replaceTrack(mergeTrackPreservingSource(nextTrack))
    return nextTrack
  }

  /**
   * CN: 仅为一组曲目在内存中补丁封面 — 不写入 IDB。
   * CN: 用于在目录已加载但没有封面后，将延迟加载的封面数据 URL 注入响应式曲目数组。
   *
   * CN: @param {Map<string, string>} artworkMap — trackId → data URL
   *
   * EN: Patch artwork for a set of tracks in-memory ONLY — no IDB write.
   * EN: Used to inject lazily-loaded artwork data URLs into the reactive
   * EN: track array after the catalog has already been loaded without artwork.
   *
   * EN: @param {Map<string, string>} artworkMap — trackId → data URL
   */
  function patchTrackArtworks(artworkMap) {
    if (!artworkMap || artworkMap.size === 0) return

    tracks.value = tracks.value.map((track) => {
      const artwork = artworkMap.get(track.id)
      return artwork && !track.artwork ? { ...track, artwork } : track
    })
  }

  async function addTrackToPlaylist({ playlistId, trackId, index }) {
    const result = await playlistService.addTrackToPlaylist({ playlistId, trackId, index })
    const relationIds = new Set(result.relations.map((relation) => relation.id))

    playlistTrackRelations.value = [
      ...playlistTrackRelations.value.filter(
        (relation) => relation.playlistId !== playlistId || !relationIds.has(relation.id),
      ),
      ...result.relations,
    ]

    return result
  }

  async function removeTrackFromPlaylist({ playlistId, trackId }) {
    const result = await playlistService.removeTrackFromPlaylist({ playlistId, trackId })
    const relationIds = new Set(result.relations.map((relation) => relation.id))

    playlistTrackRelations.value = [
      ...playlistTrackRelations.value.filter((relation) => {
        if (relation.playlistId !== playlistId) {
          return true
        }

        if (result.deletedRelationId && relation.id === result.deletedRelationId) {
          return false
        }

        return !relationIds.has(relation.id)
      }),
      ...result.relations,
    ]

    return result
  }

  async function deleteTrackFromLibrary(trackId) {
    const result = await trackService.deleteTrackFromLibrary(trackId)

    removeTrackFromState(result.deletedTrackId)
    playlistTrackRelations.value = playlistTrackRelations.value.filter(
      (relation) => !result.deletedRelationIds.includes(relation.id),
    )
    ;(result.reorderedTracks ?? []).forEach((track) => {
      replaceTrack(mergeTrackPreservingSource(track))
    })

    return result
  }

  async function toggleFavorite(trackId) {
    const nextTrack = await trackService.toggleFavorite(trackId)
    replaceTrack(mergeTrackPreservingSource(nextTrack))
    return nextTrack
  }

  async function setFavorite(trackId, isFavorite) {
    const nextTrack = await trackService.setFavorite(trackId, isFavorite)
    replaceTrack(mergeTrackPreservingSource(nextTrack))
    return nextTrack
  }

  async function reorderPlaylistTracks({ playlistId, orderedTrackIds }) {
    const nextRelations = await playlistService.reorderPlaylistTracks(playlistId, orderedTrackIds)
    const relationIdSet = new Set(nextRelations.map((relation) => relation.id))

    playlistTrackRelations.value = [
      ...playlistTrackRelations.value.filter(
        (relation) => relation.playlistId !== playlistId || !relationIdSet.has(relation.id),
      ),
      ...nextRelations,
    ]

    return nextRelations
  }

  function dispose() {
    trackService.releaseTracks(tracks.value)
    libraries.value = []
    playlists.value = []
    tracks.value = []
    playlistTrackRelations.value = []
  }

  return {
    libraries,
    playlists,
    tracks,
    playlistTrackRelations,
    libraryIds,
    trackIds,
    trackCount,
    hasTracks,
    hydrate,
    getLibraryById,
    getPlaylistById,
    getTrackById,
    getTracksForLibrary,
    getPlaylistTrackRelations,
    getDefaultPlaylistForLibrary,
    getDefaultCollectionRef,
    isCollectionAvailableForLibrary,
    createLibrary,
    renameLibrary,
    deleteLibrary,
    reorderLibraries,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    reorderPlaylists,
    importFiles,
    updateTrackMetadata,
    patchTrackArtworks,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    deleteTrackFromLibrary,
    toggleFavorite,
    setFavorite,
    reorderPlaylistTracks,
    dispose,
  }
}
