const DEFAULT_DB_NAME = 'ofplayer'
const DEFAULT_DB_VERSION = null
const BLOCKED_OPEN_TIMEOUT_MS = 2500

export const STORE_NAMES = Object.freeze({
  keyValue: 'keyValue',
  libraries: 'libraries',
  playlists: 'playlists',
  playlistTracks: 'playlistTracks',
  tracks: 'tracks',
  history: 'history',
  externalLibraries: 'externalLibraries',
  artworks: 'artworks',
})

const STORE_CONFIG = Object.freeze({
  [STORE_NAMES.keyValue]: {
    options: { keyPath: 'key' },
    indexes: [],
  },
  [STORE_NAMES.libraries]: {
    options: { keyPath: 'id' },
    indexes: [
      {
        name: 'byOrder',
        keyPath: 'order',
      },
    ],
  },
  [STORE_NAMES.playlists]: {
    options: { keyPath: 'id' },
    indexes: [
      {
        name: 'byLibraryId',
        keyPath: 'libraryId',
      },
      {
        name: 'byLibraryIdAndOrder',
        keyPath: ['libraryId', 'order'],
      },
      {
        name: 'byLibraryIdAndKind',
        keyPath: ['libraryId', 'kind'],
      },
      {
        name: 'bySystemKey',
        keyPath: 'systemKey',
      },
    ],
  },
  [STORE_NAMES.playlistTracks]: {
    options: { keyPath: 'id' },
    indexes: [
      {
        name: 'byPlaylistIdAndOrder',
        keyPath: ['playlistId', 'order'],
      },
      {
        name: 'byTrackId',
        keyPath: 'trackId',
      },
    ],
  },
  [STORE_NAMES.tracks]: {
    options: { keyPath: 'id' },
    indexes: [
      {
        name: 'byImportedAt',
        keyPath: 'importedAt',
      },
      {
        name: 'byLibraryId',
        keyPath: 'libraryId',
      },
      {
        name: 'byLibraryIdAndOrder',
        keyPath: ['libraryId', 'libraryOrder'],
      },
      {
        name: 'byFavorite',
        keyPath: 'isFavorite',
      },
    ],
  },
  [STORE_NAMES.history]: {
    options: { keyPath: 'id' },
    indexes: [
      {
        name: 'byRecordedAt',
        keyPath: 'recordedAt',
      },
    ],
  },
  [STORE_NAMES.externalLibraries]: {
    options: { keyPath: 'id' },
    indexes: [
      {
        name: 'byProvider',
        keyPath: 'provider',
      },
      {
        name: 'byUpdatedAt',
        keyPath: 'updatedAt',
      },
    ],
  },
  // Artwork data URLs stored separately from track records to avoid
  // loading large base64 strings on every catalog read at startup.
  [STORE_NAMES.artworks]: {
    options: { keyPath: 'trackId' },
    indexes: [],
  },
})

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'))
  })
}

function transactionToPromise(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(true)
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction failed.'))
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction aborted.'))
  })
}

function ensureObjectStore(database, transaction, name) {
  const config = STORE_CONFIG[name]
  const store = database.objectStoreNames.contains(name)
    ? transaction.objectStore(name)
    : database.createObjectStore(name, config.options)

  config.indexes.forEach((index) => {
    if (!store.indexNames.contains(index.name)) {
      store.createIndex(index.name, index.keyPath, index.options)
    }
  })
}

function migrateInlineArtwork(transaction) {
  if (
    !transaction.objectStoreNames.contains(STORE_NAMES.tracks) ||
    !transaction.objectStoreNames.contains(STORE_NAMES.artworks)
  ) {
    return
  }

  const tracksStore = transaction.objectStore(STORE_NAMES.tracks)
  const artworksStore = transaction.objectStore(STORE_NAMES.artworks)
  const request = tracksStore.openCursor()

  request.onsuccess = () => {
    const cursor = request.result

    if (!cursor) {
      return
    }

    const record = cursor.value
    const trackId = record?.id
    const artwork = typeof record?.artwork === 'string' ? record.artwork : ''

    if (!trackId || !artwork) {
      cursor.continue()
      return
    }

    const cleanedRecord = {
      ...record,
      artwork: '',
    }

    const updateRequest = cursor.update(cleanedRecord)

    updateRequest.onsuccess = () => {
      const artworkRequest = artworksStore.put({ trackId, dataUrl: artwork })
      artworkRequest.onsuccess = () => cursor.continue()
      artworkRequest.onerror = (event) => {
        // Losing a cached cover is preferable to aborting the upgrade and
        // leaving old users stuck on the startup skeleton.
        event.preventDefault()
        cursor.continue()
      }
    }

    updateRequest.onerror = (event) => {
      event.preventDefault()
      cursor.continue()
    }
  }

  request.onerror = (event) => {
    event.preventDefault()
  }
}

function openDatabase({
  name = DEFAULT_DB_NAME,
  version = DEFAULT_DB_VERSION,
  migrateInlineArtworkOnUpgrade = false,
} = {}) {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment.'))
      return
    }

    const request = Number.isInteger(version) ? indexedDB.open(name, version) : indexedDB.open(name)
    let blockedTimer = null
    let timedOut = false

    function clearBlockedTimer() {
      if (blockedTimer) {
        clearTimeout(blockedTimer)
        blockedTimer = null
      }
    }

    request.onupgradeneeded = (event) => {
      const database = request.result
      const transaction = request.transaction

      Object.keys(STORE_CONFIG).forEach((storeName) => {
        ensureObjectStore(database, transaction, storeName)
      })

      if (migrateInlineArtworkOnUpgrade && event.oldVersion < 5) {
        migrateInlineArtwork(transaction)
      }
    }

    request.onsuccess = () => {
      clearBlockedTimer()
      const database = request.result

      if (timedOut) {
        database.close()
        return
      }

      database.onversionchange = () => {
        database.close()
      }

      resolve(database)
    }

    request.onerror = () => {
      clearBlockedTimer()
      reject(request.error ?? new Error('Failed to open IndexedDB database.'))
    }

    request.onblocked = () => {
      clearBlockedTimer()
      blockedTimer = setTimeout(() => {
        timedOut = true
        reject(new Error('IndexedDB upgrade is blocked by another OFPlayer tab.'))
      }, BLOCKED_OPEN_TIMEOUT_MS)
    }
  })
}

export function createIndexedDbClient(options = {}) {
  // Kick off indexedDB.open() immediately — this runs concurrently with Vue
  // mounting so the connection is usually ready by the first hydrate query.
  let databasePromise = openDatabase(options)

  async function getDatabase() {
    return databasePromise
  }

  function hasStore(database, storeName) {
    return typeof database?.objectStoreNames?.contains === 'function'
      ? database.objectStoreNames.contains(storeName)
      : false
  }

  async function reopenDatabase(version) {
    const currentDatabase = await databasePromise.catch(() => null)

    if (currentDatabase) {
      currentDatabase.close()
    }

    const nextDatabasePromise = openDatabase({
      ...options,
      version,
      migrateInlineArtworkOnUpgrade: false,
    })
    databasePromise = nextDatabasePromise

    try {
      return await nextDatabasePromise
    } catch (error) {
      databasePromise = openDatabase(options)
      throw error
    }
  }

  async function ensureArtworkStore() {
    const database = await getDatabase()

    if (hasStore(database, STORE_NAMES.artworks)) {
      return true
    }

    const upgradedDatabase = await reopenDatabase(database.version + 1)
    return hasStore(upgradedDatabase, STORE_NAMES.artworks)
  }

  async function getKeyValue(key) {
    const database = await getDatabase()
    const transaction = database.transaction(STORE_NAMES.keyValue, 'readonly')
    const store = transaction.objectStore(STORE_NAMES.keyValue)
    const result = await requestToPromise(store.get(key))

    await transactionToPromise(transaction)
    return result?.value
  }

  async function setKeyValue(key, value) {
    const database = await getDatabase()
    const transaction = database.transaction(STORE_NAMES.keyValue, 'readwrite')
    const store = transaction.objectStore(STORE_NAMES.keyValue)

    store.put({
      key,
      value,
    })

    await transactionToPromise(transaction)
    return true
  }

  async function getRecord(storeName, key) {
    const database = await getDatabase()
    const transaction = database.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const result = await requestToPromise(store.get(key))

    await transactionToPromise(transaction)
    return result ?? null
  }

  async function getAllRecords(storeName) {
    const database = await getDatabase()
    const transaction = database.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const result = await requestToPromise(store.getAll())

    await transactionToPromise(transaction)
    return Array.isArray(result) ? result : []
  }

  async function getTrackRecords() {
    const database = await getDatabase()
    const transaction = database.transaction(STORE_NAMES.tracks, 'readonly')
    const store = transaction.objectStore(STORE_NAMES.tracks)
    const records = []

    await new Promise((resolve, reject) => {
      const request = store.openCursor()

      request.onsuccess = () => {
        const cursor = request.result

        if (!cursor) {
          resolve(true)
          return
        }

        const record = cursor.value
        records.push(
          record?.artwork
            ? {
                ...record,
                artwork: '',
              }
            : record,
        )
        cursor.continue()
      }

      request.onerror = () => reject(request.error ?? new Error('Failed to read track records.'))
    })

    await transactionToPromise(transaction)
    return records
  }

  async function getRecordsByIndex(storeName, indexName, query = null) {
    const database = await getDatabase()
    const transaction = database.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const index = store.index(indexName)
    const result = await requestToPromise(index.getAll(query))

    await transactionToPromise(transaction)
    return Array.isArray(result) ? result : []
  }

  async function putRecord(storeName, record) {
    const database = await getDatabase()
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    store.put(record)
    await transactionToPromise(transaction)
    return record
  }

  async function putRecords(storeName, records) {
    const database = await getDatabase()
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    ;(records ?? []).forEach((record) => {
      store.put(record)
    })

    await transactionToPromise(transaction)
    return records
  }

  async function deleteRecord(storeName, key) {
    const database = await getDatabase()
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    store.delete(key)
    await transactionToPromise(transaction)
    return true
  }

  async function deleteRecords(storeName, keys) {
    const safeKeys = (keys ?? []).filter((key) => key !== null && key !== undefined)

    if (safeKeys.length === 0) {
      return true
    }

    const database = await getDatabase()
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    safeKeys.forEach((key) => {
      store.delete(key)
    })

    await transactionToPromise(transaction)
    return true
  }

  async function appendHistory(record) {
    await putRecord(STORE_NAMES.history, record)
    return record
  }

  async function getRecentHistory(limit = 50) {
    const database = await getDatabase()
    const transaction = database.transaction(STORE_NAMES.history, 'readonly')
    const store = transaction.objectStore(STORE_NAMES.history)
    const index = store.index('byRecordedAt')
    const entries = []

    await new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev')

      request.onsuccess = () => {
        const cursor = request.result

        if (!cursor || entries.length >= limit) {
          resolve(true)
          return
        }

        entries.push(cursor.value)
        cursor.continue()
      }

      request.onerror = () => reject(request.error ?? new Error('Failed to read playback history.'))
    })

    await transactionToPromise(transaction)
    return entries
  }

  async function getAllTrackAssets() {
    const records = await getAllRecords(STORE_NAMES.tracks)
    return records.map((r) => ({
      id: r.id,
      fileName: r.fileName ?? null,
      displayTitle: r.displayTitle ?? r.title ?? null,
      format: r.format ?? null,
      assetBlob: r.assetBlob ?? null,
    }))
  }

  async function clearAllStores() {
    const database = await getDatabase()
    const storeNames = Object.values(STORE_NAMES)
    await Promise.all(
      storeNames.map(
        (name) =>
          new Promise((resolve, reject) => {
            const tx = database.transaction(name, 'readwrite')
            tx.objectStore(name).clear()
            tx.oncomplete = () => resolve(true)
            tx.onerror = () => reject(tx.error ?? new Error(`Failed to clear ${name}`))
          }),
      ),
    )
  }

  // ---------------------------------------------------------------------------
  // Artwork store — keeps artwork data URLs out of the main tracks store so
  // getTracks() at startup doesn't load potentially hundreds of MB of base64.
  // ---------------------------------------------------------------------------

  async function getArtwork(trackId) {
    if (!trackId) {
      return ''
    }

    try {
      const database = await getDatabase()

      if (hasStore(database, STORE_NAMES.artworks)) {
        const transaction = database.transaction(STORE_NAMES.artworks, 'readonly')
        const store = transaction.objectStore(STORE_NAMES.artworks)
        const result = await requestToPromise(store.get(trackId))
        await transactionToPromise(transaction)

        if (result?.dataUrl) {
          return result.dataUrl
        }
      }

      const inlineArtwork = await getInlineArtwork(trackId)

      if (inlineArtwork) {
        void migrateInlineArtworkForTracks(new Map([[trackId, inlineArtwork]]))
      }

      return inlineArtwork
    } catch {
      return ''
    }
  }

  async function getInlineArtwork(trackId) {
    if (!trackId) {
      return ''
    }

    try {
      const database = await getDatabase()
      const transaction = database.transaction(STORE_NAMES.tracks, 'readonly')
      const store = transaction.objectStore(STORE_NAMES.tracks)
      const result = await requestToPromise(store.get(trackId))
      await transactionToPromise(transaction)

      return typeof result?.artwork === 'string' ? result.artwork : ''
    } catch {
      return ''
    }
  }

  async function putArtworkRecord(trackId, dataUrl) {
    if (!trackId || typeof dataUrl !== 'string' || !dataUrl) {
      return false
    }

    const database = await getDatabase()

    if (!hasStore(database, STORE_NAMES.artworks)) {
      return false
    }

    const transaction = database.transaction(STORE_NAMES.artworks, 'readwrite')
    const store = transaction.objectStore(STORE_NAMES.artworks)
    store.put({ trackId, dataUrl })
    await transactionToPromise(transaction)
    return true
  }

  async function putArtwork(trackId, dataUrl) {
    try {
      await ensureArtworkStore()
      return putArtworkRecord(trackId, dataUrl)
    } catch {
      // Artwork storage failure is non-fatal
      return false
    }
  }

  async function clearInlineArtworks(artworkMap) {
    if (!artworkMap || artworkMap.size === 0) {
      return
    }

    try {
      const database = await getDatabase()
      const transaction = database.transaction(STORE_NAMES.tracks, 'readwrite')
      const store = transaction.objectStore(STORE_NAMES.tracks)

      await Promise.all(
        Array.from(artworkMap.entries()).map(
          ([trackId, dataUrl]) =>
            new Promise((resolve) => {
              const request = store.get(trackId)
              request.onsuccess = () => {
                const record = request.result

                if (!record || record.artwork !== dataUrl) {
                  resolve(true)
                  return
                }

                const updateRequest = store.put({
                  ...record,
                  artwork: '',
                })
                updateRequest.onsuccess = () => resolve(true)
                updateRequest.onerror = () => resolve(false)
              }
              request.onerror = () => resolve(false)
            }),
        ),
      )

      await transactionToPromise(transaction)
    } catch {
      // Inline cleanup is best-effort.
    }
  }

  async function migrateInlineArtworkForTracks(artworkMap) {
    if (!artworkMap || artworkMap.size === 0) {
      return
    }

    try {
      await ensureArtworkStore()

      await Promise.all(
        Array.from(artworkMap.entries()).map(([trackId, dataUrl]) =>
          putArtworkRecord(trackId, dataUrl).catch(() => false),
        ),
      )
      await clearInlineArtworks(artworkMap)
    } catch {
      // Keep inline artwork available as a legacy fallback if migration is blocked.
    }
  }

  async function deleteArtwork(trackId) {
    if (!trackId) return

    try {
      await deleteRecord(STORE_NAMES.artworks, trackId)
    } catch {
      // Non-fatal
    }
  }

  async function deleteArtworks(trackIds) {
    const safeIds = (trackIds ?? []).filter(Boolean)
    if (safeIds.length === 0) return

    try {
      await deleteRecords(STORE_NAMES.artworks, safeIds)
    } catch {
      // Non-fatal
    }
  }

  async function getArtworksByTrackIds(trackIds) {
    const safeIds = (trackIds ?? []).filter(Boolean)

    if (safeIds.length === 0) {
      return new Map()
    }

    try {
      const database = await getDatabase()
      const map = new Map()

      if (hasStore(database, STORE_NAMES.artworks)) {
        const transaction = database.transaction(STORE_NAMES.artworks, 'readonly')
        const store = transaction.objectStore(STORE_NAMES.artworks)

        const entries = await Promise.all(
          safeIds.map(
            (trackId) =>
              new Promise((resolve) => {
                const request = store.get(trackId)
                request.onsuccess = () => resolve([trackId, request.result?.dataUrl ?? ''])
                request.onerror = () => resolve([trackId, ''])
              }),
          ),
        )

        await transactionToPromise(transaction)

        for (const [trackId, dataUrl] of entries) {
          if (dataUrl) map.set(trackId, dataUrl)
        }
      }

      const missingIds = safeIds.filter((trackId) => !map.has(trackId))
      const inlineArtworkMap = await getInlineArtworksByTrackIds(missingIds)

      for (const [trackId, dataUrl] of inlineArtworkMap) {
        map.set(trackId, dataUrl)
      }

      if (inlineArtworkMap.size > 0) {
        void migrateInlineArtworkForTracks(inlineArtworkMap)
      }

      return map
    } catch {
      return new Map()
    }
  }

  async function getInlineArtworksByTrackIds(trackIds) {
    const safeIds = (trackIds ?? []).filter(Boolean)

    if (safeIds.length === 0) {
      return new Map()
    }

    try {
      const database = await getDatabase()
      const transaction = database.transaction(STORE_NAMES.tracks, 'readonly')
      const store = transaction.objectStore(STORE_NAMES.tracks)

      const entries = await Promise.all(
        safeIds.map(
          (trackId) =>
            new Promise((resolve) => {
              const request = store.get(trackId)
              request.onsuccess = () => {
                const dataUrl =
                  typeof request.result?.artwork === 'string' ? request.result.artwork : ''
                resolve([trackId, dataUrl])
              }
              request.onerror = () => resolve([trackId, ''])
            }),
        ),
      )

      await transactionToPromise(transaction)

      return new Map(entries.filter(([, dataUrl]) => dataUrl))
    } catch {
      return new Map()
    }
  }

  return {
    getKeyValue,
    setKeyValue,
    getRecord,
    getAllRecords,
    getTrackRecords,
    getRecordsByIndex,
    putRecord,
    putRecords,
    deleteRecord,
    deleteRecords,
    appendHistory,
    getRecentHistory,
    getAllTrackAssets,
    clearAllStores,
    getArtwork,
    putArtwork,
    deleteArtwork,
    deleteArtworks,
    getArtworksByTrackIds,
  }
}
