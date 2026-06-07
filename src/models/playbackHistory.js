import { clampTime } from './playback'

export const PLAYBACK_HISTORY_TYPES = Object.freeze({
  PLAYED: 'played',
  PAUSED: 'paused',
  ENDED: 'ended',
})

function createHistoryId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `history-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createPlaybackHistoryEntryModel(overrides = {}) {
  return {
    id: overrides.id ?? createHistoryId(),
    trackId: overrides.trackId ?? null,
    type: overrides.type ?? PLAYBACK_HISTORY_TYPES.PLAYED,
    position: clampTime(overrides.position),
    duration: clampTime(overrides.duration),
    recordedAt: overrides.recordedAt ?? new Date().toISOString(),
  }
}
