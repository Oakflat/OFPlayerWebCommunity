import { createDefaultLibraryModel } from '../models/library'
import { createDefaultAllTracksPlaylistModel } from '../models/playlist'
import { ensureLibraryHasDefaultPlaylist, sortByOrder } from './catalogHelpers'

// ---------------------------------------------------------------------------
// CN: 模块级目录缓存
// CN: 初始水合后，服务层在每次变更时重新读取目录（每次写入前调用 ensureCatalogInitialized）。
// CN: 我们缓存最后成功的快照，以便这些读取命中内存而非 IDB。
// CN: 任何写入操作必须在返回前调用 invalidateCatalogCache()。
//
// EN: Module-level catalog cache
// EN: After initial hydration the service layer re-reads the catalog on every
// EN: mutation (ensureCatalogInitialized is called before each write).  We cache
// EN: the last successful snapshot so those reads hit memory instead of IDB.
// EN: Any write operation must call invalidateCatalogCache() before returning.
// ---------------------------------------------------------------------------
let _catalogCache = null

export function invalidateCatalogCache() {
  _catalogCache = null
}

function sortTracks(tracks = []) {
  return [...tracks].sort((left, right) => {
    const orderDiff = (left?.libraryOrder ?? 0) - (right?.libraryOrder ?? 0)

    if (orderDiff !== 0) {
      return orderDiff
    }

    return String(left?.importedAt ?? left?.id ?? '').localeCompare(
      String(right?.importedAt ?? right?.id ?? ''),
    )
  })
}

function sortRelations(relations = []) {
  return [...relations].sort((left, right) => {
    if (left?.playlistId !== right?.playlistId) {
      return String(left?.playlistId ?? '').localeCompare(String(right?.playlistId ?? ''))
    }

    const orderDiff = (left?.order ?? 0) - (right?.order ?? 0)

    if (orderDiff !== 0) {
      return orderDiff
    }

    return String(left?.addedAt ?? left?.id ?? '').localeCompare(
      String(right?.addedAt ?? right?.id ?? ''),
    )
  })
}

export async function loadCatalogState(dataService) {
  performance.mark('ofp:idb-read-start')

  const snapshot =
    typeof dataService.catalog.loadSnapshot === 'function'
      ? await dataService.catalog.loadSnapshot()
      : await Promise.all([
          dataService.catalog.getLibraries(),
          dataService.catalog.getPlaylists(),
          dataService.catalog.getTracks(),
          dataService.catalog.getPlaylistTrackRelations(),
        ]).then(([libraries, playlists, tracks, playlistTrackRelations]) => ({
          libraries,
          playlists,
          tracks,
          playlistTrackRelations,
        }))
  const { libraries, playlists, tracks, playlistTrackRelations } = snapshot

  performance.mark('ofp:idb-read-done')
  performance.measure('ofp:idb-read', 'ofp:idb-read-start', 'ofp:idb-read-done')

  if (import.meta.env.DEV) {
    const m = performance.getEntriesByName('ofp:idb-read').at(-1)
    console.debug(
      `[OFPlayer] IDB read: ${tracks.length} tracks, ${libraries.length} libs, ${playlists.length} playlists — ${m?.duration.toFixed(1)}ms`,
    )
  }

  return {
    libraries: sortByOrder(libraries),
    playlists: [...playlists],
    tracks: sortTracks(tracks),
    playlistTrackRelations: sortRelations(playlistTrackRelations),
  }
}

export async function ensureCatalogInitialized(dataService) {
  // CN: 如果有缓存快照则返回（避免变更时冗余的 IDB 读取）
  // EN: Return cached snapshot if available (avoids redundant IDB reads on mutations)
  if (_catalogCache) {
    return _catalogCache
  }

  const snapshot = await loadCatalogState(dataService)

  if (snapshot.libraries.length === 0) {
    const library = createDefaultLibraryModel()
    const playlist = createDefaultAllTracksPlaylistModel({
      libraryId: library.id,
    })

    await Promise.all([
      dataService.catalog.putLibrary(library),
      dataService.catalog.putPlaylist(playlist),
    ])

    const seededTracks =
      snapshot.tracks.length > 0
        ? (
            await Promise.all(
              snapshot.tracks.map((track, index) =>
                dataService.catalog.updateTrack(track.id, {
                  libraryId: library.id,
                  libraryOrder: Number.isInteger(track.libraryOrder) ? track.libraryOrder : index,
                  isFavorite: typeof track.isFavorite === 'boolean' ? track.isFavorite : false,
                }),
              ),
            )
          ).filter(Boolean)
        : []

    // CN: 迁移写入了新记录 — 此路径的缓存现在已过期
    // EN: Migration wrote new records — cache is now stale for this path
    const result = {
      libraries: [library],
      playlists: [playlist],
      tracks: sortTracks(seededTracks),
      playlistTrackRelations: snapshot.playlistTrackRelations,
    }
    _catalogCache = result
    return result
  }

  const defaultLibrary = snapshot.libraries[0]
  const tracksMissingLibrary = snapshot.tracks.filter((track) => !track.libraryId)
  const missingDefaultPlaylists = snapshot.libraries
    .map((library) => ensureLibraryHasDefaultPlaylist(snapshot.playlists, library.id))
    .filter((result) => result.didCreate)
    .map((result) => result.playlist)

  let nextTracks = snapshot.tracks

  if (tracksMissingLibrary.length > 0) {
    const repairedTracks = await Promise.all(
      tracksMissingLibrary.map((track, index) =>
        dataService.catalog.updateTrack(track.id, {
          libraryId: defaultLibrary.id,
          libraryOrder: Number.isInteger(track.libraryOrder) ? track.libraryOrder : index,
          isFavorite: typeof track.isFavorite === 'boolean' ? track.isFavorite : false,
        }),
      ),
    )

    const repairedMap = new Map(repairedTracks.filter(Boolean).map((track) => [track.id, track]))
    nextTracks = sortTracks(snapshot.tracks.map((track) => repairedMap.get(track.id) ?? track))
  }

  if (missingDefaultPlaylists.length > 0) {
    await dataService.catalog.putPlaylists([...snapshot.playlists, ...missingDefaultPlaylists])
  }

  const result = {
    libraries: snapshot.libraries,
    playlists: [...snapshot.playlists, ...missingDefaultPlaylists],
    tracks: nextTracks,
    playlistTrackRelations: snapshot.playlistTrackRelations,
  }
  _catalogCache = result
  return result
}
