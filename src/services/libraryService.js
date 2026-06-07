import { createLibraryModel } from '../models/library'
import { createDefaultAllTracksPlaylistModel } from '../models/playlist'
import {
  assertDefaultLibraryIsProtected,
  normalizeEntityName,
  reorderEntities,
  sortByOrder,
} from './catalogHelpers'
import { ensureCatalogInitialized, invalidateCatalogCache } from './catalogState'

export function createLibraryService({ dataService }) {
  async function loadCatalog() {
    return ensureCatalogInitialized(dataService)
  }

  async function listLibraries() {
    const snapshot = await loadCatalog()
    return sortByOrder(snapshot.libraries)
  }

  async function createLibrary(input = {}) {
    const name = typeof input === 'string' ? input : input.name
    const source = typeof input === 'object' && input ? input.source : undefined
    const normalizedName = normalizeEntityName(name, 'Library')
    const snapshot = await ensureCatalogInitialized(dataService)
    const libraries = sortByOrder(snapshot.libraries)

    const library = createLibraryModel({
      name: normalizedName,
      order: libraries.length,
      source,
    })
    const defaultPlaylist = createDefaultAllTracksPlaylistModel({
      libraryId: library.id,
      order: 0,
    })

    await Promise.all([
      dataService.catalog.putLibrary(library),
      dataService.catalog.putPlaylist(defaultPlaylist),
    ])

    invalidateCatalogCache()
    return {
      library,
      defaultPlaylist,
    }
  }

  async function renameLibrary(libraryId, name) {
    const normalizedName = normalizeEntityName(name, 'Library')
    const snapshot = await ensureCatalogInitialized(dataService)
    const library = snapshot.libraries.find((item) => item.id === libraryId)

    if (!library) {
      throw new Error('Library not found.')
    }

    const nextLibrary = {
      ...library,
      name: normalizedName,
      updatedAt: new Date().toISOString(),
    }

    await dataService.catalog.putLibrary(nextLibrary)
    invalidateCatalogCache()
    return nextLibrary
  }

  async function deleteLibrary(libraryId) {
    const snapshot = await ensureCatalogInitialized(dataService)
    const library = snapshot.libraries.find((item) => item.id === libraryId)

    if (!library) {
      throw new Error('Library not found.')
    }

    assertDefaultLibraryIsProtected(library)

    const playlists = snapshot.playlists.filter((playlist) => playlist.libraryId === libraryId)
    const playlistIds = playlists.map((playlist) => playlist.id)
    const tracks = snapshot.tracks.filter((track) => track.libraryId === libraryId)
    const trackIds = tracks.map((track) => track.id)
    const deletedRelationIds = snapshot.playlistTrackRelations
      .filter(
        (relation) =>
          playlistIds.includes(relation.playlistId) || trackIds.includes(relation.trackId),
      )
      .map((relation) => relation.id)
    const remainingLibraries = snapshot.libraries.filter((item) => item.id !== libraryId)
    const reorderedLibraries = reorderEntities(
      remainingLibraries,
      remainingLibraries.map((item) => item.id),
    ).map((item) => ({
      ...item,
      updatedAt: new Date().toISOString(),
    }))
    const fallbackLibrary = sortByOrder(reorderedLibraries).find(Boolean) ?? null

    await Promise.all([
      dataService.catalog.deleteLibrary(libraryId),
      dataService.catalog.deleteTracks(trackIds),
      ...playlistIds.map((playlistId) => dataService.catalog.deletePlaylist(playlistId)),
      dataService.catalog.deletePlaylistTrackRelations(deletedRelationIds),
    ])
    await dataService.catalog.putLibraries(reorderedLibraries)

    invalidateCatalogCache()
    return {
      deletedLibraryId: libraryId,
      deletedPlaylistIds: playlistIds,
      deletedTrackIds: trackIds,
      deletedRelationIds,
      fallbackLibraryId: fallbackLibrary?.id ?? null,
    }
  }

  async function reorderLibraries(orderedLibraryIds) {
    const snapshot = await ensureCatalogInitialized(dataService)
    const reorderedLibraries = reorderEntities(snapshot.libraries, orderedLibraryIds).map(
      (library) => ({
        ...library,
        updatedAt: new Date().toISOString(),
      }),
    )

    await dataService.catalog.putLibraries(reorderedLibraries)
    invalidateCatalogCache()
    return reorderedLibraries
  }

  return {
    loadCatalog,
    listLibraries,
    createLibrary,
    renameLibrary,
    deleteLibrary,
    reorderLibraries,
  }
}
