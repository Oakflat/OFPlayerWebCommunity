import { ref } from 'vue'
import { createPlaybackHistoryEntryModel, PLAYBACK_HISTORY_TYPES } from '../models/playbackHistory'
import { useAudioPlayer } from '../composables/useAudioPlayer'
import { trackPlay, trackPause, trackSeek } from '../services/telemetryService'

const HISTORY_LIMIT = 100

export function createPlayerStore({
  dataService,
  initialVolume,
  onTrackEnded,
  onTrackDurationChange,
} = {}) {
  const activeTrack = ref(null)
  const recentHistory = ref([])

  function recordHistory(type, overrides = {}) {
    const trackId = overrides.trackId ?? activeTrack.value?.id ?? null

    if (!trackId) {
      return null
    }

    const nextEntry = createPlaybackHistoryEntryModel({
      trackId,
      type,
      position: overrides.position ?? audioPlayer.currentTime.value,
      duration:
        overrides.duration ?? audioPlayer.duration.value ?? activeTrack.value?.duration ?? 0,
      recordedAt: overrides.recordedAt,
    })

    recentHistory.value = [nextEntry, ...recentHistory.value].slice(0, HISTORY_LIMIT)
    void dataService.history.append(nextEntry)
    return nextEntry
  }

  const audioPlayer = useAudioPlayer({
    initialVolume,
    onPlay: () => trackPlay(),
    onPause: () => trackPause(),
    onSeek: () => trackSeek(),
    onTrackEnded: ({ trackId }) => {
      recordHistory(PLAYBACK_HISTORY_TYPES.ENDED, { trackId })
      onTrackEnded?.({ trackId })
    },
    onTrackDurationChange,
  })

  async function hydrate() {
    recentHistory.value = await dataService.history.loadRecent(HISTORY_LIMIT)
    return recentHistory.value
  }

  async function loadTrack(track, loadOptions = {}) {
    const autoplay = loadOptions.autoplay === true
    const loaded = await audioPlayer.loadTrack(track, loadOptions)

    if (loaded) {
      activeTrack.value = track ?? null

      if (autoplay) {
        recordHistory(PLAYBACK_HISTORY_TYPES.PLAYED)
      }
    }

    return loaded
  }

  async function play() {
    const didPlay = await audioPlayer.play()

    if (didPlay) {
      recordHistory(PLAYBACK_HISTORY_TYPES.PLAYED)
    }

    return didPlay
  }

  function pause() {
    audioPlayer.pause()
    recordHistory(PLAYBACK_HISTORY_TYPES.PAUSED)
  }

  async function toggle() {
    if (audioPlayer.isPlaying.value) {
      pause()
      return true
    }

    return play()
  }

  function seek(nextTime) {
    return audioPlayer.seek(nextTime)
  }

  function setVolume(nextVolume) {
    return audioPlayer.setVolume(nextVolume)
  }

  function reset() {
    activeTrack.value = null
    audioPlayer.reset()
  }

  function dispose() {
    activeTrack.value = null
    audioPlayer.dispose()
  }

  return {
    status: audioPlayer.status,
    currentTime: audioPlayer.currentTime,
    duration: audioPlayer.duration,
    volume: audioPlayer.volume,
    activeTrackId: audioPlayer.activeTrackId,
    isPlaying: audioPlayer.isPlaying,
    error: audioPlayer.error,
    activeTrack,
    recentHistory,
    hydrate,
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
