import { createLibraryModel } from '../../models/library'
import { createPlaybackHistoryEntryModel } from '../../models/playbackHistory'
import { createPlaylistModel } from '../../models/playlist'
import { createPlaylistTrackRelationModel } from '../../models/playlistTrackRelation'
import { createPersistablePreferencesModel, createPreferencesModel } from '../../models/preferences'
import { createSessionSnapshotModel } from '../../models/session'
import { createExternalLibraryConnectionModel } from '../../models/externalLibrary'
import {
  createPersistedTrackModel,
  createRuntimeTrackFromPersistedTrack,
  createTrackModel,
  isSupportedAudioFile,
  revokeTrackResource,
  sanitizeTrackPatch,
  updateTrackModel,
} from '../../models/track'
import { createLocalDataService } from './localDataService'
import { createIndexedDbClient, STORE_NAMES } from './indexeddb/client'

const STORAGE_KEYS = Object.freeze({
  preferences: 'preferences',
  session: 'session',
})

function mapTrackRecords(records) {
  return (records ?? []).map((record) => createRuntimeTrackFromPersistedTrack(record))
}

function mergeById(primaryRecords = [], fallbackRecords = []) {
  const recordsById = new Map()

  ;(fallbackRecords ?? []).forEach((record) => {
    if (record?.id) {
      recordsById.set(record.id, record)
    }
  })
  ;(primaryRecords ?? []).forEach((record) => {
    if (!record?.id) {
      return
    }

    const fallbackRecord = recordsById.get(record.id)
    recordsById.set(record.id, {
      ...fallbackRecord,
      ...record,
      artwork: record.artwork || fallbackRecord?.artwork || '',
    })
  })

  return Array.from(recordsById.values())
}

function hasFallbackOnlyTracks(primaryTracks = [], fallbackTracks = []) {
  if ((fallbackTracks ?? []).length === 0) {
    return false
  }

  const primaryTrackIds = new Set((primaryTracks ?? []).map((track) => track?.id).filter(Boolean))
  return (fallbackTracks ?? []).some((track) => track?.id && !primaryTrackIds.has(track.id))
}

export function createIndexedDbDataService(options = {}) {
  const fallback = options.fallback ?? createLocalDataService(options)
  const client = createIndexedDbClient(options)
  const metadataService = options.metadataService

  async function readIndexedDbCatalogSnapshot() {
    const [libraries, playlists, tracks, playlistTrackRelations] = await Promise.all([
      client.getAllRecords(STORE_NAMES.libraries),
      client.getAllRecords(STORE_NAMES.playlists),
      client.getTrackRecords(),
      client.getAllRecords(STORE_NAMES.playlistTracks),
    ])

    return {
      libraries: libraries.map((record) => createLibraryModel(record)),
      playlists: playlists.map((record) => createPlaylistModel(record)),
      tracks: mapTrackRecords(tracks),
      playlistTrackRelations: playlistTrackRelations.map((record) =>
        createPlaylistTrackRelationModel(record),
      ),
    }
  }

  async function readFallbackCatalogSnapshot() {
    if (typeof fallback.catalog.loadSnapshot === 'function') {
      return fallback.catalog.loadSnapshot()
    }

    const [libraries, playlists, tracks, playlistTrackRelations] = await Promise.all([
      fallback.catalog.getLibraries(),
      fallback.catalog.getPlaylists(),
      fallback.catalog.getTracks(),
      fallback.catalog.getPlaylistTrackRelations(),
    ])

    return { libraries, playlists, tracks, playlistTrackRelations }
  }

  async function persistRecoveredCatalogSnapshot(snapshot) {
    const tracks = snapshot?.tracks ?? []
    const persistedTracks = await createPersistedTracksWithArtworkFallback(tracks)

    await Promise.all([
      client.putRecords(STORE_NAMES.libraries, snapshot?.libraries ?? []).catch(() => []),
      client.putRecords(STORE_NAMES.playlists, snapshot?.playlists ?? []).catch(() => []),
      client
        .putRecords(STORE_NAMES.playlistTracks, snapshot?.playlistTrackRelations ?? [])
        .catch(() => []),
      client.putRecords(STORE_NAMES.tracks, persistedTracks).catch(() => []),
    ])
  }

  async function loadCatalogSnapshot() {
    const idbSnapshot = await readIndexedDbCatalogSnapshot()
    const fallbackSnapshot = await readFallbackCatalogSnapshot()

    if (!hasFallbackOnlyTracks(idbSnapshot.tracks, fallbackSnapshot.tracks)) {
      return idbSnapshot
    }

    const recoveredSnapshot = {
      libraries: mergeById(idbSnapshot.libraries, fallbackSnapshot.libraries),
      playlists: mergeById(idbSnapshot.playlists, fallbackSnapshot.playlists),
      tracks: mergeById(idbSnapshot.tracks, fallbackSnapshot.tracks),
      playlistTrackRelations: mergeById(
        idbSnapshot.playlistTrackRelations,
        fallbackSnapshot.playlistTrackRelations,
      ),
    }

    await persistRecoveredCatalogSnapshot(recoveredSnapshot)
    return recoveredSnapshot
  }

  async function createPersistedTrackWithArtworkFallback(track, options = {}) {
    const artwork = typeof track?.artwork === 'string' ? track.artwork : ''
    const persistedTrack = createPersistedTrackModel(track, options)

    if (!artwork) {
      return persistedTrack
    }

    const didStoreArtwork = await client.putArtwork(persistedTrack.id, artwork)
    return didStoreArtwork ? persistedTrack : { ...persistedTrack, artwork }
  }

  async function createPersistedTracksWithArtworkFallback(records = []) {
    return Promise.all(
      (records ?? []).map((record) => createPersistedTrackWithArtworkFallback(record)),
    )
  }

  return {
    driver: 'indexeddb',
    capabilities: {
      persistentLibraryAssets: true,
    },
    preferences: {
      async load() {
        try {
          return createPreferencesModel(await client.getKeyValue(STORAGE_KEYS.preferences))
        } catch {
          return fallback.preferences.load()
        }
      },
      async save(preferences) {
        const nextPreferences = createPersistablePreferencesModel(preferences)

        try {
          await client.setKeyValue(STORAGE_KEYS.preferences, nextPreferences)
          return true
        } catch {
          return fallback.preferences.save(nextPreferences)
        }
      },
    },
    session: {
      async loadSnapshot() {
        try {
          return createSessionSnapshotModel(await client.getKeyValue(STORAGE_KEYS.session))
        } catch {
          return fallback.session.loadSnapshot()
        }
      },
      async saveSnapshot(session) {
        const snapshot = createSessionSnapshotModel(session)

        try {
          await client.setKeyValue(STORAGE_KEYS.session, snapshot)
          return true
        } catch {
          return fallback.session.saveSnapshot(snapshot)
        }
      },
    },
    catalog: {
      async loadSnapshot() {
        try {
          return await loadCatalogSnapshot()
        } catch {
          return readFallbackCatalogSnapshot()
        }
      },
      async getLibraries() {
        try {
          return (await client.getAllRecords(STORE_NAMES.libraries)).map((record) =>
            createLibraryModel(record),
          )
        } catch {
          return fallback.catalog.getLibraries()
        }
      },
      async putLibrary(record) {
        const nextRecord = createLibraryModel(record)

        try {
          await client.putRecord(STORE_NAMES.libraries, nextRecord)
          return nextRecord
        } catch {
          return fallback.catalog.putLibrary(nextRecord)
        }
      },
      async putLibraries(records) {
        const nextRecords = (records ?? []).map((record) => createLibraryModel(record))

        try {
          await client.putRecords(STORE_NAMES.libraries, nextRecords)
          return nextRecords
        } catch {
          return fallback.catalog.putLibraries(nextRecords)
        }
      },
      async deleteLibrary(libraryId) {
        try {
          await client.deleteRecord(STORE_NAMES.libraries, libraryId)
          return true
        } catch {
          return fallback.catalog.deleteLibrary(libraryId)
        }
      },
      async getPlaylists() {
        try {
          return (await client.getAllRecords(STORE_NAMES.playlists)).map((record) =>
            createPlaylistModel(record),
          )
        } catch {
          return fallback.catalog.getPlaylists()
        }
      },
      async putPlaylist(record) {
        const nextRecord = createPlaylistModel(record)

        try {
          await client.putRecord(STORE_NAMES.playlists, nextRecord)
          return nextRecord
        } catch {
          return fallback.catalog.putPlaylist(nextRecord)
        }
      },
      async putPlaylists(records) {
        const nextRecords = (records ?? []).map((record) => createPlaylistModel(record))

        try {
          await client.putRecords(STORE_NAMES.playlists, nextRecords)
          return nextRecords
        } catch {
          return fallback.catalog.putPlaylists(nextRecords)
        }
      },
      async deletePlaylist(playlistId) {
        try {
          await client.deleteRecord(STORE_NAMES.playlists, playlistId)
          return true
        } catch {
          return fallback.catalog.deletePlaylist(playlistId)
        }
      },
      async getPlaylistTrackRelations() {
        try {
          return (await client.getAllRecords(STORE_NAMES.playlistTracks)).map((record) =>
            createPlaylistTrackRelationModel(record),
          )
        } catch {
          return fallback.catalog.getPlaylistTrackRelations()
        }
      },
      async putPlaylistTrackRelation(record) {
        const nextRecord = createPlaylistTrackRelationModel(record)

        try {
          await client.putRecord(STORE_NAMES.playlistTracks, nextRecord)
          return nextRecord
        } catch {
          return fallback.catalog.putPlaylistTrackRelation(nextRecord)
        }
      },
      async putPlaylistTrackRelations(records) {
        const nextRecords = (records ?? []).map((record) =>
          createPlaylistTrackRelationModel(record),
        )

        try {
          await client.putRecords(STORE_NAMES.playlistTracks, nextRecords)
          return nextRecords
        } catch {
          return fallback.catalog.putPlaylistTrackRelations(nextRecords)
        }
      },
      async deletePlaylistTrackRelation(relationId) {
        try {
          await client.deleteRecord(STORE_NAMES.playlistTracks, relationId)
          return true
        } catch {
          return fallback.catalog.deletePlaylistTrackRelation(relationId)
        }
      },
      async deletePlaylistTrackRelations(relationIds) {
        try {
          await client.deleteRecords(STORE_NAMES.playlistTracks, relationIds)
          return true
        } catch {
          return fallback.catalog.deletePlaylistTrackRelations(relationIds)
        }
      },
      async getTrack(trackId) {
        try {
          const record = await client.getRecord(STORE_NAMES.tracks, trackId)
          return record
            ? createRuntimeTrackFromPersistedTrack(record)
            : fallback.catalog.getTrack(trackId)
        } catch {
          return fallback.catalog.getTrack(trackId)
        }
      },
      async getTracks() {
        try {
          const tracks = mapTrackRecords(await client.getTrackRecords())

          if (tracks.length > 0) {
            return tracks
          }

          const fallbackTracks = await fallback.catalog.getTracks()
          return fallbackTracks.length > 0 ? fallbackTracks : tracks
        } catch {
          return fallback.catalog.getTracks()
        }
      },
      async importFiles({ libraryId, files, orderStart = 0 }) {
        const candidateFiles = Array.from(files ?? []).filter(isSupportedAudioFile)

        if (candidateFiles.length === 0) {
          return []
        }

        try {
          const importedTracks = await Promise.all(
            candidateFiles.map(async (file, index) => {
              const metadata = await metadataService?.parseFile(file)
              return createTrackModel(file, {
                ...metadata,
                libraryId,
                libraryOrder: orderStart + index,
                isFavorite: false,
              })
            }),
          )
          const persistedTracks = await createPersistedTracksWithArtworkFallback(importedTracks)

          await client.putRecords(STORE_NAMES.tracks, persistedTracks)

          return importedTracks
        } catch {
          return fallback.catalog.importFiles({
            libraryId,
            files: candidateFiles,
            orderStart,
          })
        }
      },
      async updateTrack(trackId, patch) {
        const nextPatch = sanitizeTrackPatch(patch)

        try {
          const currentRecord = await client.getRecord(STORE_NAMES.tracks, trackId)

          if (!currentRecord) {
            const fallbackUpdatedTrack = await fallback.catalog.updateTrack(trackId, nextPatch)

            if (!fallbackUpdatedTrack) {
              return null
            }

            const persistedFallbackTrack =
              await createPersistedTrackWithArtworkFallback(fallbackUpdatedTrack)
            await client.putRecord(STORE_NAMES.tracks, persistedFallbackTrack)

            return fallbackUpdatedTrack
          }

          // { createObjectUrl: false } prevents leaking a Blob URL that would
          // never be assigned to the in-memory track (the store's
          // mergeTrackPreservingSource always restores source from memory).
          const currentTrack = createRuntimeTrackFromPersistedTrack(currentRecord, {
            createObjectUrl: false,
          })
          const nextTrack = updateTrackModel(currentTrack, nextPatch)
          const persistedTrack = await createPersistedTrackWithArtworkFallback(nextTrack, {
            assetBlob: currentRecord.assetBlob,
          })

          // Artwork is stored in a separate store — sync it if included in the patch.
          if (typeof nextPatch.artwork === 'string') {
            if (nextPatch.artwork) {
              await client.putArtwork(trackId, nextPatch.artwork)
            } else {
              await client.deleteArtwork(trackId)
            }
          }

          await client.putRecord(STORE_NAMES.tracks, persistedTrack)
          return nextTrack
        } catch {
          return fallback.catalog.updateTrack(trackId, nextPatch)
        }
      },
      async putTrack(record) {
        const artwork = typeof record?.artwork === 'string' ? record.artwork : ''
        const persistedTrack = await createPersistedTrackWithArtworkFallback(record)

        try {
          await client.putRecord(STORE_NAMES.tracks, persistedTrack)

          // Return a runtime track with artwork preserved in memory
          return createRuntimeTrackFromPersistedTrack({ ...persistedTrack, artwork })
        } catch {
          return fallback.catalog.putTrack(record)
        }
      },
      async putTracks(records) {
        const persistedTracks = await createPersistedTracksWithArtworkFallback(records)

        try {
          await client.putRecords(STORE_NAMES.tracks, persistedTracks)

          return (records ?? []).map((record, index) =>
            createRuntimeTrackFromPersistedTrack({
              ...persistedTracks[index],
              artwork: typeof record?.artwork === 'string' ? record.artwork : '',
            }),
          )
        } catch {
          return fallback.catalog.putTracks(records)
        }
      },
      async deleteTrack(trackId) {
        try {
          await client.deleteRecord(STORE_NAMES.tracks, trackId)
          await client.deleteArtwork(trackId)
          return true
        } catch {
          return fallback.catalog.deleteTrack(trackId)
        }
      },
      async deleteTracks(trackIds) {
        try {
          await client.deleteRecords(STORE_NAMES.tracks, trackIds)
          await client.deleteArtworks(trackIds)
          return true
        } catch {
          return fallback.catalog.deleteTracks(trackIds)
        }
      },
      // Returns raw IDB records with assetBlob for export purposes.
      async getAllTrackAssets() {
        try {
          return client.getAllTrackAssets()
        } catch {
          return []
        }
      },
      releaseTracks(tracks) {
        ;(tracks ?? []).forEach((track) => {
          revokeTrackResource(track)
        })
      },
    },
    externalLibraries: {
      async getConnections() {
        try {
          return (await client.getAllRecords(STORE_NAMES.externalLibraries)).map((record) =>
            createExternalLibraryConnectionModel(record),
          )
        } catch {
          return fallback.externalLibraries?.getConnections?.() ?? []
        }
      },
      async putConnection(record) {
        const nextRecord = createExternalLibraryConnectionModel({
          ...record,
          updatedAt: new Date().toISOString(),
        })

        try {
          await client.putRecord(STORE_NAMES.externalLibraries, nextRecord)
          return nextRecord
        } catch {
          return fallback.externalLibraries?.putConnection?.(nextRecord) ?? nextRecord
        }
      },
      async deleteConnection(connectionId) {
        try {
          await client.deleteRecord(STORE_NAMES.externalLibraries, connectionId)
          return true
        } catch {
          return fallback.externalLibraries?.deleteConnection?.(connectionId) ?? false
        }
      },
    },
    history: {
      async loadRecent(limit = 50) {
        try {
          const records = await client.getRecentHistory(limit)
          return records.map((entry) => createPlaybackHistoryEntryModel(entry))
        } catch {
          return fallback.history.loadRecent(limit)
        }
      },
      async append(entry) {
        const nextEntry = createPlaybackHistoryEntryModel(entry)

        try {
          await client.appendHistory(nextEntry)
          return nextEntry
        } catch {
          return fallback.history.append(nextEntry)
        }
      },
    },
    // Clears all IDB object stores (tracks, libraries, playlists, history, etc.)
    async clearAllData() {
      try {
        await client.clearAllStores()
        return true
      } catch {
        return false
      }
    },
    // Artwork sub-service — separate store keeps base64 images out of the
    // main tracks store so catalog reads at startup remain fast.
    artwork: {
      async getArtwork(trackId) {
        return client.getArtwork(trackId)
      },
      async putArtwork(trackId, dataUrl) {
        return client.putArtwork(trackId, dataUrl)
      },
      async deleteArtwork(trackId) {
        return client.deleteArtwork(trackId)
      },
      async deleteArtworks(trackIds) {
        return client.deleteArtworks(trackIds)
      },
      async getArtworksByTrackIds(trackIds) {
        return client.getArtworksByTrackIds(trackIds)
      },
    },
  }
}
