function createPlaylistTrackRelationId(playlistId, trackId) {
  return `${playlistId}:${trackId}`
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

export function createPlaylistTrackRelationModel(overrides = {}) {
  const playlistId = normalizeText(overrides.playlistId)
  const trackId = normalizeText(overrides.trackId)
  const now = new Date().toISOString()

  return {
    id: overrides.id ?? createPlaylistTrackRelationId(playlistId, trackId),
    playlistId,
    trackId,
    order: normalizeOrder(overrides.order),
    addedAt: normalizeDate(overrides.addedAt, now),
  }
}
