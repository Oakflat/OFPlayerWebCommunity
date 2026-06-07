import { PLAYLIST_KINDS, createPlaylistModel, isSystemPlaylist } from '../models/playlist'
import { createPlaylistTrackRelationModel } from '../models/playlistTrackRelation'
import { normalizeEntityName, reorderEntities, sortByOrder } from './catalogHelpers'
import { ensureCatalogInitialized, invalidateCatalogCache } from './catalogState'

function sortRelationsForPlaylist(relations = [], playlistId) {
  return relations
    .filter((relation) => relation.playlistId === playlistId)
    .sort((left, right) => {
      const orderDiff = (left?.order ?? 0) - (right?.order ?? 0)

      if (orderDiff !== 0) {
        return orderDiff
      }

      return String(left?.addedAt ?? left?.id ?? '').localeCompare(
        String(right?.addedAt ?? right?.id ?? ''),
      )
    })
}

function assertUserPlaylist(playlist) {
  if (!playlist) {
    throw new Error('Playlist not found.')
  }

  if (isSystemPlaylist(playlist)) {
    throw new Error('System playlists cannot be modified.')
  }
}

export function createPlaylistService({ dataService }) {
  async function listPlaylists(libraryId = null) {
    const snapshot = await ensureCatalogInitialized(dataService)
    const filteredPlaylists =
      typeof libraryId === 'string'
        ? snapshot.playlists.filter((playlist) => playlist.libraryId === libraryId)
        : snapshot.playlists

    return sortByOrder(filteredPlaylists)
  }

  async function listPlaylistTrackRelations() {
    const snapshot = await ensureCatalogInitialized(dataService)
    return [...snapshot.playlistTrackRelations]
  }

  async function createPlaylist({ libraryId, name }) {
    const normalizedName = normalizeEntityName(name, 'Playlist')
    const snapshot = await ensureCatalogInitialized(dataService)
    const library = snapshot.libraries.find((item) => item.id === libraryId)

    if (!library) {
      throw new Error('Library not found.')
    }

    const playlist = createPlaylistModel({
      libraryId,
      name: normalizedName,
      order: snapshot.playlists.filter((item) => item.libraryId === libraryId).length,
      kind: PLAYLIST_KINDS.USER,
    })

    await dataService.catalog.putPlaylist(playlist)
    invalidateCatalogCache()
    return playlist
  }

  async function renamePlaylist(playlistId, name) {
    const normalizedName = normalizeEntityName(name, 'Playlist')
    const snapshot = await ensureCatalogInitialized(dataService)
    const playlist = snapshot.playlists.find((item) => item.id === playlistId)

    assertUserPlaylist(playlist)

    const nextPlaylist = {
      ...playlist,
      name: normalizedName,
      updatedAt: new Date().toISOString(),
    }

    await dataService.catalog.putPlaylist(nextPlaylist)
    invalidateCatalogCache()
    return nextPlaylist
  }

  async function deletePlaylist(playlistId) {
    const snapshot = await ensureCatalogInitialized(dataService)
    const playlist = snapshot.playlists.find((item) => item.id === playlistId)

    assertUserPlaylist(playlist)

    const relationIds = snapshot.playlistTrackRelations
      .filter((relation) => relation.playlistId === playlistId)
      .map((relation) => relation.id)

    await Promise.all([
      dataService.catalog.deletePlaylist(playlistId),
      dataService.catalog.deletePlaylistTrackRelations(relationIds),
    ])

    const remainingPlaylists = snapshot.playlists.filter(
      (item) => item.libraryId === playlist.libraryId && item.id !== playlistId,
    )
    const reorderedPlaylists = [
      ...sortByOrder(remainingPlaylists.filter((item) => item.kind === PLAYLIST_KINDS.SYSTEM)),
      ...reorderEntities(
        remainingPlaylists.filter((item) => item.kind === PLAYLIST_KINDS.USER),
        remainingPlaylists
          .filter((item) => item.kind === PLAYLIST_KINDS.USER)
          .map((item) => item.id),
      ),
    ].map((item, index) => ({
      ...item,
      order: index,
      updatedAt: new Date().toISOString(),
    }))

    await dataService.catalog.putPlaylists([
      ...snapshot.playlists.filter((item) => item.libraryId !== playlist.libraryId),
      ...reorderedPlaylists,
    ])

    invalidateCatalogCache()
    return {
      deletedPlaylistId: playlistId,
      deletedRelationIds: relationIds,
      libraryId: playlist.libraryId,
    }
  }

  async function reorderPlaylists(libraryId, orderedPlaylistIds) {
    const snapshot = await ensureCatalogInitialized(dataService)
    const libraryPlaylists = snapshot.playlists.filter(
      (playlist) => playlist.libraryId === libraryId,
    )
    const systemPlaylists = sortByOrder(
      libraryPlaylists.filter((playlist) => playlist.kind === PLAYLIST_KINDS.SYSTEM),
    )
    const userPlaylists = libraryPlaylists.filter(
      (playlist) => playlist.kind === PLAYLIST_KINDS.USER,
    )
    const reorderedUserPlaylists = reorderEntities(userPlaylists, orderedPlaylistIds)
    const reorderedPlaylists = [...systemPlaylists, ...reorderedUserPlaylists].map(
      (playlist, index) => ({
        ...playlist,
        order: index,
        updatedAt: new Date().toISOString(),
      }),
    )
    const preservedPlaylists = snapshot.playlists.filter(
      (playlist) => playlist.libraryId !== libraryId,
    )

    await dataService.catalog.putPlaylists([...preservedPlaylists, ...reorderedPlaylists])
    invalidateCatalogCache()
    return sortByOrder(reorderedPlaylists)
  }

  async function addTrackToPlaylist({ playlistId, trackId, index = null }) {
    const snapshot = await ensureCatalogInitialized(dataService)
    const playlist = snapshot.playlists.find((item) => item.id === playlistId)
    const track = snapshot.tracks.find((item) => item.id === trackId)

    assertUserPlaylist(playlist)

    if (!track) {
      throw new Error('Track not found.')
    }

    if (track.libraryId !== playlist.libraryId) {
      throw new Error('Track and playlist must belong to the same library.')
    }

    const existingRelation = snapshot.playlistTrackRelations.find(
      (relation) => relation.playlistId === playlistId && relation.trackId === trackId,
    )

    if (existingRelation) {
      return {
        relation: existingRelation,
        relations: sortRelationsForPlaylist(snapshot.playlistTrackRelations, playlistId),
      }
    }

    const playlistRelations = sortRelationsForPlaylist(snapshot.playlistTrackRelations, playlistId)
    const insertIndex =
      Number.isInteger(index) && index >= 0
        ? Math.min(index, playlistRelations.length)
        : playlistRelations.length
    const nextRelations = [...playlistRelations]

    nextRelations.splice(
      insertIndex,
      0,
      createPlaylistTrackRelationModel({
        playlistId,
        trackId,
        order: insertIndex,
      }),
    )

    const normalizedRelations = nextRelations.map((relation, relationIndex) =>
      createPlaylistTrackRelationModel({
        ...relation,
        order: relationIndex,
      }),
    )

    await dataService.catalog.putPlaylistTrackRelations([
      ...snapshot.playlistTrackRelations.filter((relation) => relation.playlistId !== playlistId),
      ...normalizedRelations,
    ])

    invalidateCatalogCache()
    return {
      relation: normalizedRelations.find((relation) => relation.trackId === trackId) ?? null,
      relations: normalizedRelations,
    }
  }

  async function removeTrackFromPlaylist({ playlistId, trackId }) {
    const snapshot = await ensureCatalogInitialized(dataService)
    const playlist = snapshot.playlists.find((item) => item.id === playlistId)

    assertUserPlaylist(playlist)

    const playlistRelations = sortRelationsForPlaylist(snapshot.playlistTrackRelations, playlistId)
    const relationToDelete = playlistRelations.find((relation) => relation.trackId === trackId)

    if (!relationToDelete) {
      return {
        deletedRelationId: null,
        relations: playlistRelations,
      }
    }

    const normalizedRelations = playlistRelations
      .filter((relation) => relation.id !== relationToDelete.id)
      .map((relation, relationIndex) =>
        createPlaylistTrackRelationModel({
          ...relation,
          order: relationIndex,
        }),
      )

    await dataService.catalog.deletePlaylistTrackRelation(relationToDelete.id)
    await dataService.catalog.putPlaylistTrackRelations([
      ...snapshot.playlistTrackRelations.filter((relation) => relation.playlistId !== playlistId),
      ...normalizedRelations,
    ])

    invalidateCatalogCache()
    return {
      deletedRelationId: relationToDelete.id,
      relations: normalizedRelations,
    }
  }

  async function reorderPlaylistTracks(playlistId, orderedTrackIds) {
    const snapshot = await ensureCatalogInitialized(dataService)
    const playlist = snapshot.playlists.find((item) => item.id === playlistId)

    assertUserPlaylist(playlist)

    const playlistRelations = sortRelationsForPlaylist(snapshot.playlistTrackRelations, playlistId)
    const relationMap = new Map(playlistRelations.map((relation) => [relation.trackId, relation]))
    const reorderedRelations = []
    const seenTrackIds = new Set()

    ;(orderedTrackIds ?? []).forEach((trackId) => {
      const relation = relationMap.get(trackId)

      if (!relation || seenTrackIds.has(trackId)) {
        return
      }

      seenTrackIds.add(trackId)
      reorderedRelations.push(relation)
    })

    playlistRelations.forEach((relation) => {
      if (seenTrackIds.has(relation.trackId)) {
        return
      }

      reorderedRelations.push(relation)
    })

    const normalizedRelations = reorderedRelations.map((relation, relationIndex) =>
      createPlaylistTrackRelationModel({
        ...relation,
        order: relationIndex,
      }),
    )

    await dataService.catalog.putPlaylistTrackRelations([
      ...snapshot.playlistTrackRelations.filter((relation) => relation.playlistId !== playlistId),
      ...normalizedRelations,
    ])

    invalidateCatalogCache()
    return normalizedRelations
  }

  return {
    listPlaylists,
    listPlaylistTrackRelations,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    reorderPlaylists,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
  }
}
