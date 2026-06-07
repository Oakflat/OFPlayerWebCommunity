import { DEFAULT_LIBRARY_ID } from './library'

export const PLAYLIST_KINDS = Object.freeze({
  SYSTEM: 'system',
  USER: 'user',
})

export const SYSTEM_PLAYLIST_KEYS = Object.freeze({
  ALL_TRACKS: 'all-tracks',
})

export const DEFAULT_ALL_TRACKS_PLAYLIST_ID = 'playlist-default-all-tracks'

function createPlaylistId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `playlist-${crypto.randomUUID()}`
  }

  return `playlist-${Date.now()}-${Math.random().toString(16).slice(2)}`
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

function normalizeDate(value, fallback) {
  return typeof value === 'string' && value ? value : fallback
}

function normalizeKind(value) {
  return value === PLAYLIST_KINDS.SYSTEM ? PLAYLIST_KINDS.SYSTEM : PLAYLIST_KINDS.USER
}

function normalizeSystemKey(value) {
  return value === SYSTEM_PLAYLIST_KEYS.ALL_TRACKS ? value : null
}

export function createPlaylistModel(overrides = {}) {
  const now = new Date().toISOString()
  const kind = normalizeKind(overrides.kind)

  return {
    id: overrides.id ?? createPlaylistId(),
    libraryId: normalizeText(overrides.libraryId),
    name: normalizeText(overrides.name),
    order: normalizeOrder(overrides.order),
    kind,
    systemKey: kind === PLAYLIST_KINDS.SYSTEM ? normalizeSystemKey(overrides.systemKey) : null,
    createdAt: normalizeDate(overrides.createdAt, now),
    updatedAt: normalizeDate(overrides.updatedAt, now),
  }
}

export function createDefaultAllTracksPlaylistModel({
  libraryId,
  order = 0,
  id,
  ...overrides
} = {}) {
  return createPlaylistModel({
    id: id ?? (libraryId === DEFAULT_LIBRARY_ID ? DEFAULT_ALL_TRACKS_PLAYLIST_ID : undefined),
    libraryId,
    order,
    kind: PLAYLIST_KINDS.SYSTEM,
    systemKey: SYSTEM_PLAYLIST_KEYS.ALL_TRACKS,
    name: '',
    ...overrides,
  })
}

export function isSystemPlaylist(playlist) {
  return playlist?.kind === PLAYLIST_KINDS.SYSTEM
}
