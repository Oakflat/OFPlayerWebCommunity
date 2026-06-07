export const EXTERNAL_LIBRARY_PROVIDERS = Object.freeze({
  WEBDAV: 'webdav',
  FTP: 'ftp',
  SUBSONIC: 'subsonic',
})

export const EXTERNAL_LIBRARY_PROVIDER_SET = new Set(Object.values(EXTERNAL_LIBRARY_PROVIDERS))

function createConnectionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `external-${crypto.randomUUID()}`
  }

  return `external-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeText(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed || fallback
}

function normalizeBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeDate(value, fallback) {
  return typeof value === 'string' && value ? value : fallback
}

function normalizeProvider(value) {
  return EXTERNAL_LIBRARY_PROVIDER_SET.has(value) ? value : EXTERNAL_LIBRARY_PROVIDERS.WEBDAV
}

function normalizeAuth(auth = {}) {
  const value = auth && typeof auth === 'object' ? auth : {}

  return {
    username: normalizeText(value.username),
    password: normalizeText(value.password),
    token: normalizeText(value.token),
    salt: normalizeText(value.salt),
    strategy: normalizeText(value.strategy),
  }
}

function normalizeSyncOptions(sync = {}) {
  const value = sync && typeof sync === 'object' ? sync : {}

  return {
    maxTracks: Number.isInteger(value.maxTracks) && value.maxTracks > 0 ? value.maxTracks : 5000,
    maxAlbums: Number.isInteger(value.maxAlbums) && value.maxAlbums > 0 ? value.maxAlbums : 500,
    lastCursor: normalizeText(value.lastCursor),
  }
}

export function createExternalLibraryConnectionModel(overrides = {}) {
  const now = new Date().toISOString()
  const provider = normalizeProvider(overrides.provider)

  return {
    id: normalizeText(overrides.id, createConnectionId()),
    provider,
    name: normalizeText(overrides.name, provider.toUpperCase()),
    endpoint: normalizeText(overrides.endpoint),
    rootPath: normalizeText(overrides.rootPath),
    auth: normalizeAuth(overrides.auth),
    sync: normalizeSyncOptions(overrides.sync),
    enabled: normalizeBoolean(overrides.enabled, true),
    createdAt: normalizeDate(overrides.createdAt, now),
    updatedAt: normalizeDate(overrides.updatedAt, now),
    lastSyncAt: normalizeDate(overrides.lastSyncAt, ''),
  }
}

export function createLibraryExternalSource(connection, overrides = {}) {
  const normalizedConnection = createExternalLibraryConnectionModel(connection)

  return {
    kind: 'external',
    provider: normalizedConnection.provider,
    connectionId: normalizedConnection.id,
    remoteId: normalizeText(overrides.remoteId),
    rootPath: normalizeText(overrides.rootPath, normalizedConnection.rootPath),
  }
}
