import { computed, reactive } from 'vue'
import { createSessionModel } from '../models/session'

function normalizeQueue(trackIds) {
  if (!Array.isArray(trackIds)) {
    return []
  }

  return [...new Set(trackIds.filter(Boolean))]
}

function applySessionState(state, nextState) {
  state.id = nextState.id
  state.startedAt = nextState.startedAt
  state.lastInteractedAt = nextState.lastInteractedAt
  state.currentTrackId = nextState.currentTrackId
  state.queueTrackIds = [...nextState.queueTrackIds]
}

export function createSessionStore({ dataService, initialSession } = {}) {
  const state = reactive(createSessionModel(initialSession))

  const currentTrackId = computed(() => state.currentTrackId)
  const queueTrackIds = computed(() => state.queueTrackIds)
  const currentTrackIndex = computed(() => {
    if (!state.currentTrackId) {
      return -1
    }

    return state.queueTrackIds.findIndex((trackId) => trackId === state.currentTrackId)
  })

  async function hydrate() {
    const persistedSession = await dataService.session.loadSnapshot()
    applySessionState(state, createSessionModel(persistedSession))
    return state
  }

  function persist() {
    void dataService.session.saveSnapshot({
      ...state,
      queueTrackIds: [...state.queueTrackIds],
    })
  }

  function touch() {
    state.lastInteractedAt = new Date().toISOString()
  }

  function setQueue(trackIds) {
    state.queueTrackIds = normalizeQueue(trackIds)

    if (state.currentTrackId && !state.queueTrackIds.includes(state.currentTrackId)) {
      state.currentTrackId = null
    }

    touch()
    persist()
    return state.queueTrackIds
  }

  function setCurrentTrack(trackId) {
    if (trackId !== null && !state.queueTrackIds.includes(trackId)) {
      return false
    }

    const didChange = state.currentTrackId !== trackId
    state.currentTrackId = trackId
    touch()
    persist()
    return didChange
  }

  function removeTrackFromQueue(trackId) {
    if (!trackId) {
      return state.queueTrackIds
    }

    return setQueue(state.queueTrackIds.filter((queuedTrackId) => queuedTrackId !== trackId))
  }

  function pruneQueue(validTrackIds) {
    const validTrackIdSet = new Set((validTrackIds ?? []).filter(Boolean))
    return setQueue(state.queueTrackIds.filter((trackId) => validTrackIdSet.has(trackId)))
  }

  function getNextTrackId() {
    if (state.queueTrackIds.length === 0) {
      return null
    }

    if (currentTrackIndex.value === -1) {
      return state.queueTrackIds[0]
    }

    return state.queueTrackIds[(currentTrackIndex.value + 1) % state.queueTrackIds.length]
  }

  function getPreviousTrackId() {
    if (state.queueTrackIds.length === 0) {
      return null
    }

    if (currentTrackIndex.value === -1) {
      return state.queueTrackIds[0]
    }

    return state.queueTrackIds[
      (currentTrackIndex.value - 1 + state.queueTrackIds.length) % state.queueTrackIds.length
    ]
  }

  return {
    state,
    currentTrackId,
    currentTrackIndex,
    queueTrackIds,
    hydrate,
    setQueue,
    setCurrentTrack,
    removeTrackFromQueue,
    pruneQueue,
    getNextTrackId,
    getPreviousTrackId,
  }
}
