export const PLAYBACK_STATUS = Object.freeze({
  IDLE: 'idle',
  PAUSED: 'paused',
  PLAYING: 'playing',
})

export function clampVolume(value, fallback = 0.8) {
  const numeric = Number(value)

  if (!Number.isFinite(numeric)) {
    return fallback
  }

  return Math.min(Math.max(numeric, 0), 1)
}

export function clampTime(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0
}

export function createPlaybackStateModel(overrides = {}) {
  return {
    status: overrides.status ?? PLAYBACK_STATUS.IDLE,
    currentTime: clampTime(overrides.currentTime),
    duration: clampTime(overrides.duration),
    volume: clampVolume(overrides.volume),
    activeTrackId: overrides.activeTrackId ?? null,
    error: overrides.error ?? null,
  }
}

export function isPlayingStatus(status) {
  return status === PLAYBACK_STATUS.PLAYING
}
