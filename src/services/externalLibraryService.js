import {
  createExternalLibraryConnectionModel,
  createLibraryExternalSource,
} from '../models/externalLibrary'
import { createTrackModel, revokeTrackResource } from '../models/track'
import { invalidateCatalogCache } from './catalogState'
import { createExternalLibraryAdapter } from './externalLibraryAdapters'
import { normalizeFileMetadata } from './metadataService'

function hashString(value = '') {
  let hash = 5381
  const text = String(value)

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 33) ^ text.charCodeAt(index)
  }

  return (hash >>> 0).toString(36)
}

function createExternalTrackId({ provider, connectionId, remoteKey }) {
  return `external-${provider}-${hashString(`${connectionId}:${remoteKey}`)}`
}

function createRemoteKey({ provider, connectionId, remoteTrack }) {
  return [
    provider,
    connectionId,
    remoteTrack?.source?.remoteId ?? remoteTrack?.remoteId ?? '',
    remoteTrack?.source?.path ?? remoteTrack?.path ?? '',
  ]
    .filter(Boolean)
    .join(':')
}

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

function getTrackRemoteKey(track) {
  return (
    track?.source?.remoteKey ||
    [
      track?.source?.provider,
      track?.source?.connectionId,
      track?.source?.remoteId,
      track?.source?.path,
    ]
      .filter(Boolean)
      .join(':')
  )
}

export function createExternalLibraryService({ dataService, libraryService } = {}) {
  if (!dataService) {
    throw new Error('External library service requires a data service.')
  }

  async function listConnections() {
    return dataService.externalLibraries?.getConnections?.() ?? []
  }

  async function getConnection(connectionId) {
    const connections = await listConnections()
    return connections.find((connection) => connection.id === connectionId) ?? null
  }

  function createAdapter(connection) {
    if (dataService.externalSources) {
      return {
        async testConnection() {
          return dataService.externalSources.testConnection(connection)
        },
        async listLibraries(options = {}) {
          return dataService.externalSources.listLibraries({
            connection,
            ...options,
          })
        },
        async listTracks(options = {}) {
          return dataService.externalSources.listTracks({
            connection,
            ...options,
          })
        },
        async resolvePlaybackSource(track) {
          return dataService.externalSources.resolvePlaybackSource({
            connection,
            track,
          })
        },
      }
    }

    return createExternalLibraryAdapter(connection)
  }

  async function saveConnection(connectionInput) {
    const connection = createExternalLibraryConnectionModel(connectionInput)

    if (!dataService.externalLibraries?.putConnection) {
      throw new Error('The active data service does not support external library connections.')
    }

    return dataService.externalLibraries.putConnection(connection)
  }

  async function deleteConnection(connectionId) {
    return dataService.externalLibraries?.deleteConnection?.(connectionId) ?? false
  }

  async function testConnection(connectionInput) {
    const connection = createExternalLibraryConnectionModel(connectionInput)
    const adapter = createAdapter(connection)

    const result = await adapter.testConnection()
    return {
      connection,
      capabilities: result?.capabilities ?? adapter.capabilities,
    }
  }

  async function connectLibrary({ connection: connectionInput, remoteLibrary = null } = {}) {
    if (!libraryService?.createLibrary) {
      throw new Error('Connecting an external library requires the library service.')
    }

    const previewConnection = createExternalLibraryConnectionModel({
      ...connectionInput,
      rootPath: remoteLibrary?.id ?? remoteLibrary?.rootPath ?? connectionInput?.rootPath,
    })
    const adapter = createAdapter(previewConnection)

    await adapter.testConnection()

    const connection = await saveConnection(previewConnection)
    const libraryName = remoteLibrary?.name || connection.name
    const { library, defaultPlaylist } = await libraryService.createLibrary({
      name: libraryName,
      source: createLibraryExternalSource(connection, {
        remoteId: remoteLibrary?.id ?? '',
        rootPath: remoteLibrary?.rootPath ?? connection.rootPath,
      }),
    })
    const syncResult = await syncLibrary({
      libraryId: library.id,
      connectionId: connection.id,
    })

    return {
      connection,
      library,
      defaultPlaylist,
      sync: syncResult,
    }
  }

  async function syncLibrary({ libraryId, connectionId = null, limit = null } = {}) {
    const snapshot = await libraryService.loadCatalog()
    const library = snapshot.libraries.find((item) => item.id === libraryId)

    if (!library) {
      throw new Error('Library not found.')
    }

    const resolvedConnectionId = connectionId || library.source?.connectionId
    const connection = await getConnection(resolvedConnectionId)

    if (!connection) {
      throw new Error('External library connection not found.')
    }

    const adapter = createAdapter(connection)
    const remoteTracks = await adapter.listTracks({
      limit: Number.isInteger(limit) && limit > 0 ? limit : connection.sync.maxTracks,
    })
    const existingLibraryTracks = sortTracksByLibraryOrder(
      snapshot.tracks.filter((track) => track.libraryId === libraryId),
    )
    const existingExternalTracksByKey = new Map(
      existingLibraryTracks
        .filter((track) => track.source?.connectionId === connection.id)
        .map((track) => [getTrackRemoteKey(track), track]),
    )
    let nextOrder = existingLibraryTracks.length
    const importedTracks = []
    const updatedTracks = []
    const seenRemoteKeys = new Set()

    for (const remoteTrack of remoteTracks) {
      const remoteKey = createRemoteKey({
        provider: connection.provider,
        connectionId: connection.id,
        remoteTrack,
      })

      if (!remoteKey || seenRemoteKeys.has(remoteKey)) {
        continue
      }

      seenRemoteKeys.add(remoteKey)
      const existingTrack = existingExternalTracksByKey.get(remoteKey)
      const nextTrack = createTrackModel(null, {
        ...existingTrack,
        ...remoteTrack,
        id:
          existingTrack?.id ??
          createExternalTrackId({
            provider: connection.provider,
            connectionId: connection.id,
            remoteKey,
          }),
        libraryId,
        libraryOrder: existingTrack?.libraryOrder ?? nextOrder,
        isFavorite: existingTrack?.isFavorite ?? false,
        importedAt: existingTrack?.importedAt ?? remoteTrack.importedAt ?? new Date().toISOString(),
        source: {
          ...(existingTrack?.source ?? {}),
          ...(remoteTrack.source ?? {}),
          provider: connection.provider,
          connectionId: connection.id,
          remoteId: remoteTrack.source?.remoteId ?? remoteTrack.remoteId ?? '',
          remoteKey,
        },
      })

      if (!existingTrack) {
        nextOrder += 1
        importedTracks.push(nextTrack)
      } else {
        updatedTracks.push(nextTrack)
      }

      await dataService.catalog.putTrack(nextTrack)
    }

    const updatedConnection = await saveConnection({
      ...connection,
      lastSyncAt: new Date().toISOString(),
    })

    invalidateCatalogCache()

    return {
      connection: updatedConnection,
      libraryId,
      importedTracks,
      updatedTracks,
      remoteTotal: remoteTracks.length,
      skippedTotal: remoteTracks.length - seenRemoteKeys.size,
    }
  }

  async function resolvePlayableTrack(track, options = {}) {
    if (!track?.source || track.source.url) {
      return track
    }

    const connectionId = track.source.connectionId

    if (!connectionId) {
      return track
    }

    const connection = await getConnection(connectionId)

    if (!connection) {
      return track
    }

    const adapter = createAdapter(connection)
    const source = await adapter.resolvePlaybackSource(track, options)

    return {
      ...track,
      source: {
        ...track.source,
        ...source,
      },
    }
  }

  function releasePlayableTrack(track) {
    revokeTrackResource(track)
  }

  async function fetchTrackMetadata(track, options = {}) {
    const connectionId = track?.source?.connectionId

    if (!connectionId) {
      return null
    }

    const connection = await getConnection(connectionId)

    if (!connection) {
      return null
    }

    const adapter = createAdapter(connection)
    let metadata = null

    if (typeof adapter.fetchMetadata === 'function') {
      // Subsonic: uses the API to retrieve enriched metadata + cover art
      metadata = await adapter.fetchMetadata(track, options)
    } else if (typeof adapter.fetchRemoteBlob === 'function') {
      // WebDAV: download the audio file and parse its embedded tags
      const file = await adapter.fetchRemoteBlob(track, options)
      metadata = await normalizeFileMetadata(file)
    }

    if (!metadata) {
      return null
    }

    const updatedTrack = createTrackModel(null, {
      ...track,
      ...metadata,
      // Preserve identity and relational fields — never overwrite with remote values
      id: track.id,
      libraryId: track.libraryId,
      libraryOrder: track.libraryOrder,
      isFavorite: track.isFavorite,
      importedAt: track.importedAt,
      source: track.source,
    })

    await dataService.catalog.putTrack(updatedTrack)
    invalidateCatalogCache()

    return updatedTrack
  }

  return {
    listConnections,
    getConnection,
    saveConnection,
    deleteConnection,
    testConnection,
    connectLibrary,
    syncLibrary,
    resolvePlayableTrack,
    releasePlayableTrack,
    fetchTrackMetadata,
  }
}
