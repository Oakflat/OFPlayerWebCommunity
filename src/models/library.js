export const DEFAULT_LIBRARY_ID = 'library-default'

function createLibraryId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `library-${crypto.randomUUID()}`
  }

  return `library-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeText(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed || fallback
}

function normalizeOrder(value, fallback = 0) {
  return Number.isInteger(value) && value >= 0 ? value : fallback
}

function normalizeBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeDate(value, fallback) {
  return typeof value === 'string' && value ? value : fallback
}

function normalizeLibrarySource(value = {}) {
  const source = value && typeof value === 'object' ? value : {}
  const kind = source.kind === 'external' ? 'external' : 'local'

  return {
    kind,
    provider: normalizeText(source.provider, kind === 'external' ? 'external' : 'local'),
    connectionId: normalizeText(source.connectionId),
    remoteId: normalizeText(source.remoteId),
    rootPath: normalizeText(source.rootPath),
  }
}

export function createLibraryModel(overrides = {}) {
  const now = new Date().toISOString()

  return {
    id: overrides.id ?? createLibraryId(),
    name: normalizeText(overrides.name),
    order: normalizeOrder(overrides.order),
    isDefault: normalizeBoolean(overrides.isDefault),
    source: normalizeLibrarySource(overrides.source),
    createdAt: normalizeDate(overrides.createdAt, now),
    updatedAt: normalizeDate(overrides.updatedAt, now),
  }
}

export function createDefaultLibraryModel(overrides = {}) {
  return createLibraryModel({
    id: DEFAULT_LIBRARY_ID,
    isDefault: true,
    order: 0,
    name: '',
    ...overrides,
  })
}
