function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeQueueTrackIds(trackIds) {
  if (!Array.isArray(trackIds)) {
    return []
  }

  return [...new Set(trackIds.filter(Boolean).map((trackId) => String(trackId)))]
}

export function createSessionModel(overrides = {}) {
  return {
    id: overrides.id ?? createSessionId(),
    startedAt: overrides.startedAt ?? new Date().toISOString(),
    lastInteractedAt: overrides.lastInteractedAt ?? new Date().toISOString(),
    currentTrackId: overrides.currentTrackId ? String(overrides.currentTrackId) : null,
    queueTrackIds: normalizeQueueTrackIds(overrides.queueTrackIds),
  }
}

export function createSessionSnapshotModel(session) {
  const normalized = createSessionModel(session)

  return {
    id: normalized.id,
    startedAt: normalized.startedAt,
    lastInteractedAt: normalized.lastInteractedAt,
    currentTrackId: normalized.currentTrackId,
    queueTrackIds: [...normalized.queueTrackIds],
  }
}
