import { createLibraryModel } from '../../models/library'
import { createPlaybackHistoryEntryModel } from '../../models/playbackHistory'
import { createPlaylistModel } from '../../models/playlist'
import { createPlaylistTrackRelationModel } from '../../models/playlistTrackRelation'
import { createPersistablePreferencesModel, createPreferencesModel } from '../../models/preferences'
import { createSessionSnapshotModel } from '../../models/session'
import { createExternalLibraryConnectionModel } from '../../models/externalLibrary'
import {
  createPersistableTrackMetadata,
  createTrackModel,
  isSupportedAudioFile,
  revokeTrackResource,
  sanitizeTrackPatch,
  updateTrackModel,
} from '../../models/track'

const STORAGE_KEYS = Object.freeze({
  preferences: 'ofplayer:preferences',
  session: 'ofplayer:session',
  libraries: 'ofplayer:libraries',
  playlists: 'ofplayer:playlists',
  playlistTracks: 'ofplayer:playlist-tracks',
  tracks: 'ofplayer:tracks',
  history: 'ofplayer:history',
  externalLibraries: 'ofplayer:external-libraries',
})

function readJson(key, fallback) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback
  }

  try {
    const rawValue = window.localStorage.getItem(key)
    return rawValue ? JSON.parse(rawValue) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Keep local-first behavior resilient even if storage is unavailable.
  }
}

function readTracks() {
  return readJson(STORAGE_KEYS.tracks, []).map((record) => createTrackModel(null, record))
}

function writeTracks(tracks) {
  writeJson(
    STORAGE_KEYS.tracks,
    (tracks ?? []).map((track) => createPersistableTrackMetadata(track)),
  )
}

function readCatalogSnapshot() {
  return {
    libraries: readJson(STORAGE_KEYS.libraries, []).map((record) => createLibraryModel(record)),
    playlists: readJson(STORAGE_KEYS.playlists, []).map((record) => createPlaylistModel(record)),
    tracks: readTracks(),
    playlistTrackRelations: readJson(STORAGE_KEYS.playlistTracks, []).map((record) =>
      createPlaylistTrackRelationModel(record),
    ),
  }
}

export function createLocalDataService(options = {}) {
  const metadataService = options.metadataService

  return {
    driver: 'local',
    capabilities: {
      persistentLibraryAssets: false,
    },
    preferences: {
      async load() {
        return createPreferencesModel(readJson(STORAGE_KEYS.preferences, {}))
      },
      async save(preferences) {
        writeJson(STORAGE_KEYS.preferences, createPersistablePreferencesModel(preferences))
        return true
      },
    },
    session: {
      async loadSnapshot() {
        return createSessionSnapshotModel(readJson(STORAGE_KEYS.session, {}))
      },
      async saveSnapshot(session) {
        writeJson(STORAGE_KEYS.session, createSessionSnapshotModel(session))
        return true
      },
    },
    catalog: {
      async loadSnapshot() {
        return readCatalogSnapshot()
      },
      async getLibraries() {
        return readJson(STORAGE_KEYS.libraries, []).map((record) => createLibraryModel(record))
      },
      async putLibrary(record) {
        const nextRecord = createLibraryModel(record)
        const records = readJson(STORAGE_KEYS.libraries, [])
        const existingIndex = records.findIndex((item) => item.id === nextRecord.id)

        if (existingIndex === -1) {
          writeJson(STORAGE_KEYS.libraries, [...records, nextRecord])
        } else {
          writeJson(
            STORAGE_KEYS.libraries,
            records.map((item, index) => (index === existingIndex ? nextRecord : item)),
          )
        }

        return nextRecord
      },
      async putLibraries(records) {
        const nextRecords = (records ?? []).map((record) => createLibraryModel(record))
        writeJson(STORAGE_KEYS.libraries, nextRecords)
        return nextRecords
      },
      async deleteLibrary(libraryId) {
        writeJson(
          STORAGE_KEYS.libraries,
          readJson(STORAGE_KEYS.libraries, []).filter((item) => item.id !== libraryId),
        )
        return true
      },
      async getPlaylists() {
        return readJson(STORAGE_KEYS.playlists, []).map((record) => createPlaylistModel(record))
      },
      async putPlaylist(record) {
        const nextRecord = createPlaylistModel(record)
        const records = readJson(STORAGE_KEYS.playlists, [])
        const existingIndex = records.findIndex((item) => item.id === nextRecord.id)

        if (existingIndex === -1) {
          writeJson(STORAGE_KEYS.playlists, [...records, nextRecord])
        } else {
          writeJson(
            STORAGE_KEYS.playlists,
            records.map((item, index) => (index === existingIndex ? nextRecord : item)),
          )
        }

        return nextRecord
      },
      async putPlaylists(records) {
        const nextRecords = (records ?? []).map((record) => createPlaylistModel(record))
        writeJson(STORAGE_KEYS.playlists, nextRecords)
        return nextRecords
      },
      async deletePlaylist(playlistId) {
        writeJson(
          STORAGE_KEYS.playlists,
          readJson(STORAGE_KEYS.playlists, []).filter((item) => item.id !== playlistId),
        )
        return true
      },
      async getPlaylistTrackRelations() {
        return readJson(STORAGE_KEYS.playlistTracks, []).map((record) =>
          createPlaylistTrackRelationModel(record),
        )
      },
      async putPlaylistTrackRelation(record) {
        const nextRecord = createPlaylistTrackRelationModel(record)
        const records = readJson(STORAGE_KEYS.playlistTracks, [])
        const existingIndex = records.findIndex((item) => item.id === nextRecord.id)

        if (existingIndex === -1) {
          writeJson(STORAGE_KEYS.playlistTracks, [...records, nextRecord])
        } else {
          writeJson(
            STORAGE_KEYS.playlistTracks,
            records.map((item, index) => (index === existingIndex ? nextRecord : item)),
          )
        }

        return nextRecord
      },
      async putPlaylistTrackRelations(records) {
        const nextRecords = (records ?? []).map((record) =>
          createPlaylistTrackRelationModel(record),
        )
        writeJson(STORAGE_KEYS.playlistTracks, nextRecords)
        return nextRecords
      },
      async deletePlaylistTrackRelation(relationId) {
        writeJson(
          STORAGE_KEYS.playlistTracks,
          readJson(STORAGE_KEYS.playlistTracks, []).filter((item) => item.id !== relationId),
        )
        return true
      },
      async deletePlaylistTrackRelations(relationIds) {
        const relationIdSet = new Set(relationIds ?? [])

        writeJson(
          STORAGE_KEYS.playlistTracks,
          readJson(STORAGE_KEYS.playlistTracks, []).filter((item) => !relationIdSet.has(item.id)),
        )
        return true
      },
      async getTrack(trackId) {
        return readTracks().find((track) => track.id === trackId) ?? null
      },
      async getTracks() {
        return readTracks()
      },
      async importFiles({ libraryId, files, orderStart = 0 }) {
        const candidateFiles = Array.from(files ?? []).filter(isSupportedAudioFile)

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

        if (importedTracks.length === 0) {
          return []
        }

        const storedTracks = readTracks()
        writeTracks([...storedTracks, ...importedTracks])
        return importedTracks
      },
      async updateTrack(trackId, patch) {
        const tracks = readTracks()
        const nextPatch = sanitizeTrackPatch(patch)
        let updatedTrack = null

        writeTracks(
          tracks.map((track) => {
            if (track.id !== trackId) {
              return track
            }

            updatedTrack = updateTrackModel(track, nextPatch)
            return updatedTrack
          }),
        )

        return updatedTrack
      },
      async putTrack(record) {
        const nextTrack = createTrackModel(record?.file ?? null, record)
        const tracks = readTracks()
        const existingIndex = tracks.findIndex((track) => track.id === nextTrack.id)

        if (existingIndex === -1) {
          writeTracks([...tracks, nextTrack])
        } else {
          writeTracks(tracks.map((track, index) => (index === existingIndex ? nextTrack : track)))
        }

        return nextTrack
      },
      async putTracks(records) {
        const nextTracks = (records ?? []).map((record) =>
          createTrackModel(record?.file ?? null, record),
        )
        writeTracks(nextTracks)
        return nextTracks
      },
      async deleteTrack(trackId) {
        writeTracks(readTracks().filter((track) => track.id !== trackId))
        return true
      },
      async deleteTracks(trackIds) {
        const trackIdSet = new Set(trackIds ?? [])
        writeTracks(readTracks().filter((track) => !trackIdSet.has(track.id)))
        return true
      },
      releaseTracks(tracks) {
        ;(tracks ?? []).forEach((track) => {
          revokeTrackResource(track)
        })
      },
    },
    externalLibraries: {
      async getConnections() {
        return readJson(STORAGE_KEYS.externalLibraries, []).map((record) =>
          createExternalLibraryConnectionModel(record),
        )
      },
      async putConnection(record) {
        const nextRecord = createExternalLibraryConnectionModel({
          ...record,
          updatedAt: new Date().toISOString(),
        })

        // localStorage is accessible to any same-origin JS (extensions, XSS).
        // Strip credentials before persisting in this fallback path — IDB is
        // the authoritative store for connections including auth fields.
        // Users will need to re-enter credentials if IDB is unavailable.
        const safeRecord = {
          ...nextRecord,
          auth: { ...nextRecord.auth, password: '', token: '', salt: '' },
        }

        const records = readJson(STORAGE_KEYS.externalLibraries, [])
        const existingIndex = records.findIndex((item) => item.id === safeRecord.id)

        if (existingIndex === -1) {
          writeJson(STORAGE_KEYS.externalLibraries, [...records, safeRecord])
        } else {
          writeJson(
            STORAGE_KEYS.externalLibraries,
            records.map((item, index) => (index === existingIndex ? safeRecord : item)),
          )
        }

        return nextRecord
      },
      async deleteConnection(connectionId) {
        writeJson(
          STORAGE_KEYS.externalLibraries,
          readJson(STORAGE_KEYS.externalLibraries, []).filter((item) => item.id !== connectionId),
        )
        return true
      },
    },
    history: {
      async loadRecent(limit = 50) {
        return readJson(STORAGE_KEYS.history, [])
          .map((entry) => createPlaybackHistoryEntryModel(entry))
          .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))
          .slice(0, limit)
      },
      async append(entry) {
        const nextEntry = createPlaybackHistoryEntryModel(entry)
        const currentHistory = readJson(STORAGE_KEYS.history, [])

        writeJson(STORAGE_KEYS.history, [nextEntry, ...currentHistory].slice(0, 200))
        return nextEntry
      },
    },
    // No-op artwork sub-service — localStorage is not suitable for storing
    // large base64 images. Artwork is unavailable in this fallback driver.
    artwork: {
      async getArtwork() {
        return ''
      },
      async putArtwork() {},
      async deleteArtwork() {},
      async deleteArtworks() {},
      async getArtworksByTrackIds() {
        return new Map()
      },
    },
  }
}
