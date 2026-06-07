import { computed, ref } from 'vue'
import {
  clampTime,
  clampVolume,
  createPlaybackStateModel,
  isPlayingStatus,
  PLAYBACK_STATUS,
} from '../models/playback'

const TRACK_END_GUARD_MAX_SECONDS = 0.25

const ALLOWED_SOURCE_PROTOCOLS = new Set(['blob:', 'https:', 'http:'])

function isSafeSourceUrl(url) {
  try {
    return ALLOWED_SOURCE_PROTOCOLS.has(new URL(url).protocol)
  } catch {
    return false
  }
}

export function useAudioPlayer(options = {}) {
  const audio = new Audio()
  const playbackState = createPlaybackStateModel({
    volume: options.initialVolume,
  })

  const status = ref(playbackState.status)
  const currentTime = ref(playbackState.currentTime)
  const duration = ref(playbackState.duration)
  const volume = ref(playbackState.volume)
  const activeTrackId = ref(playbackState.activeTrackId)
  const error = ref(playbackState.error)

  audio.preload = 'metadata'
  audio.volume = volume.value

  function getActiveDuration() {
    return clampTime(audio.duration || duration.value)
  }

  function getTrackEndGuard(activeDuration = getActiveDuration()) {
    if (!Number.isFinite(activeDuration) || activeDuration <= 0) {
      return 0
    }

    return Math.min(TRACK_END_GUARD_MAX_SECONDS, activeDuration / 20)
  }

  function getSafeSeekTime(nextTime, activeDuration = getActiveDuration()) {
    const safeTime = clampTime(nextTime)

    if (!Number.isFinite(activeDuration) || activeDuration <= 0) {
      return safeTime
    }

    const maxSeekTime = Math.max(activeDuration - getTrackEndGuard(activeDuration), 0)
    return Math.min(safeTime, maxSeekTime)
  }

  function isNearTrackEnd(position = audio.currentTime, activeDuration = getActiveDuration()) {
    if (!Number.isFinite(activeDuration) || activeDuration <= 0) {
      return false
    }

    const restartThreshold = Math.max(activeDuration - getTrackEndGuard(activeDuration), 0)
    return clampTime(position) >= restartThreshold
  }

  function syncDuration(nextDuration) {
    const safeDuration = clampTime(nextDuration)
    duration.value = safeDuration

    if (activeTrackId.value) {
      options.onTrackDurationChange?.({
        trackId: activeTrackId.value,
        duration: safeDuration,
      })
    }
  }

  async function loadTrack(track, loadOptions = {}) {
    const autoplay = loadOptions.autoplay === true
    const sourceUrl = track?.source?.url

    if (!track || !sourceUrl) {
      return false
    }

    if (!isSafeSourceUrl(sourceUrl)) {
      return false
    }

    activeTrackId.value = track.id ?? null
    currentTime.value = 0
    duration.value = Number.isFinite(track.duration) ? track.duration : 0
    error.value = null
    status.value = PLAYBACK_STATUS.PAUSED

    audio.src = sourceUrl
    audio.currentTime = 0
    audio.load()

    if (!autoplay) {
      audio.pause()
      return true
    }

    return play()
  }

  async function play() {
    if (!audio.src) {
      return false
    }

    if (audio.ended || isNearTrackEnd()) {
      audio.currentTime = 0
      currentTime.value = 0
    }

    try {
      await audio.play()
      status.value = PLAYBACK_STATUS.PLAYING
      error.value = null
      options.onPlay?.()
      return true
    } catch (playbackError) {
      status.value = PLAYBACK_STATUS.PAUSED
      error.value = playbackError
      return false
    }
  }

  function pause() {
    audio.pause()
    status.value = activeTrackId.value ? PLAYBACK_STATUS.PAUSED : PLAYBACK_STATUS.IDLE
    options.onPause?.()
  }

  function toggle() {
    if (isPlaying.value) {
      pause()
      return true
    }

    return play()
  }

  function seek(nextTime) {
    const safeTime = getSafeSeekTime(nextTime)
    audio.currentTime = safeTime
    currentTime.value = safeTime
    error.value = null
    options.onSeek?.()
    return safeTime
  }

  function setVolume(nextVolume) {
    const safeVolume = clampVolume(nextVolume, volume.value)
    volume.value = safeVolume
    audio.volume = safeVolume
    return safeVolume
  }

  function reset() {
    audio.pause()
    audio.removeAttribute('src')
    audio.load()

    status.value = PLAYBACK_STATUS.IDLE
    currentTime.value = 0
    duration.value = 0
    activeTrackId.value = null
    error.value = null
  }

  function handleTimeUpdate() {
    currentTime.value = clampTime(audio.currentTime)
  }

  function handleLoadedMetadata() {
    syncDuration(audio.duration)
  }

  function handleDurationChange() {
    syncDuration(audio.duration)
  }

  function handlePlay() {
    status.value = PLAYBACK_STATUS.PLAYING
  }

  function handlePause() {
    status.value = activeTrackId.value ? PLAYBACK_STATUS.PAUSED : PLAYBACK_STATUS.IDLE
  }

  function handleEnded() {
    status.value = PLAYBACK_STATUS.PAUSED
    options.onTrackEnded?.({
      trackId: activeTrackId.value,
    })
  }

  function dispose() {
    audio.removeEventListener('timeupdate', handleTimeUpdate)
    audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
    audio.removeEventListener('durationchange', handleDurationChange)
    audio.removeEventListener('play', handlePlay)
    audio.removeEventListener('pause', handlePause)
    audio.removeEventListener('ended', handleEnded)
    reset()
  }

  audio.addEventListener('timeupdate', handleTimeUpdate)
  audio.addEventListener('loadedmetadata', handleLoadedMetadata)
  audio.addEventListener('durationchange', handleDurationChange)
  audio.addEventListener('play', handlePlay)
  audio.addEventListener('pause', handlePause)
  audio.addEventListener('ended', handleEnded)

  const isPlaying = computed(() => isPlayingStatus(status.value))

  return {
    status,
    currentTime,
    duration,
    volume,
    activeTrackId,
    isPlaying,
    error,
    loadTrack,
    play,
    pause,
    toggle,
    seek,
    setVolume,
    reset,
    dispose,
  }
}
