import { ensureCatalogInitialized, invalidateCatalogCache } from './catalogState'

function sortTracksByLibraryOrder(tracks = []) {
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

export function createTrackService({ dataService }) {
  async function listTracks(libraryId = null) {
    const snapshot = await ensureCatalogInitialized(dataService)
    const tracks =
      typeof libraryId === 'string'
        ? snapshot.tracks.filter((track) => track.libraryId === libraryId)
        : snapshot.tracks

    return sortTracksByLibraryOrder(tracks)
  }

  async function importFiles({ libraryId, files }) {
    const snapshot = await ensureCatalogInitialized(dataService)
    const library = snapshot.libraries.find((item) => item.id === libraryId)

    if (!library) {
      throw new Error('Library not found.')
    }

    const libraryTracks = sortTracksByLibraryOrder(
      snapshot.tracks.filter((track) => track.libraryId === libraryId),
    )
    const imported = await dataService.catalog.importFiles({
      libraryId,
      files,
      orderStart: libraryTracks.length,
    })
    invalidateCatalogCache()
    return imported
  }

  async function updateTrackMetadata(trackId, patch) {
    const nextTrack = await dataService.catalog.updateTrack(trackId, patch)

    if (!nextTrack) {
      throw new Error('Track not found.')
    }

    invalidateCatalogCache()
    return nextTrack
  }

  async function deleteTrackFromLibrary(trackId) {
    const snapshot = await ensureCatalogInitialized(dataService)
    const track = snapshot.tracks.find((item) => item.id === trackId)

    if (!track) {
      throw new Error('Track not found.')
    }

    const relationIds = snapshot.playlistTrackRelations
      .filter((relation) => relation.trackId === trackId)
      .map((relation) => relation.id)

    await Promise.all([
      dataService.catalog.deleteTrack(trackId),
      dataService.catalog.deletePlaylistTrackRelations(relationIds),
    ])

    const libraryTracks = sortTracksByLibraryOrder(
      snapshot.tracks.filter((item) => item.libraryId === track.libraryId && item.id !== trackId),
    )

    const reorderedLibraryTracks = (
      await Promise.all(
        libraryTracks.map((libraryTrack, index) =>
          dataService.catalog.updateTrack(libraryTrack.id, {
            libraryOrder: index,
          }),
        ),
      )
    ).filter(Boolean)

    invalidateCatalogCache()
    return {
      deletedTrackId: trackId,
      deletedRelationIds: relationIds,
      libraryId: track.libraryId,
      reorderedTracks: reorderedLibraryTracks,
    }
  }

  async function setFavorite(trackId, isFavorite) {
    return updateTrackMetadata(trackId, {
      isFavorite: Boolean(isFavorite),
    })
  }

  async function toggleFavorite(trackId) {
    const snapshot = await ensureCatalogInitialized(dataService)
    const track = snapshot.tracks.find((item) => item.id === trackId)

    if (!track) {
      throw new Error('Track not found.')
    }

    return setFavorite(trackId, !track.isFavorite)
  }

  function releaseTracks(tracks) {
    dataService.catalog.releaseTracks(tracks)
  }

  return {
    listTracks,
    importFiles,
    updateTrackMetadata,
    deleteTrackFromLibrary,
    setFavorite,
    toggleFavorite,
    releaseTracks,
  }
}
