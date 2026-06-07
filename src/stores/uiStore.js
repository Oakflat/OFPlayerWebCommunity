import { computed, reactive } from 'vue'
import { createPreferencesModel } from '../models/preferences'

function applyPreferencesState(state, nextState) {
  state.volume = nextState.volume
  state.librarySearchQuery = nextState.librarySearchQuery
  state.librarySortOption = nextState.librarySortOption
  state.libraryTypeFilter = nextState.libraryTypeFilter
  state.dataDriver = nextState.dataDriver
}

export function createUiStore({ dataService, initialPreferences } = {}) {
  const state = reactive(createPreferencesModel(initialPreferences))

  async function hydrate() {
    const persistedPreferences = await dataService.preferences.load()
    applyPreferencesState(state, createPreferencesModel(persistedPreferences))
    return state
  }

  function persist() {
    void dataService.preferences.save({ ...state })
  }

  function applyNormalizedPatch(patch) {
    const normalized = createPreferencesModel({
      ...state,
      ...patch,
    })

    applyPreferencesState(state, normalized)
    persist()
    return normalized
  }

  function setSearchQuery(query) {
    return applyNormalizedPatch({ librarySearchQuery: query }).librarySearchQuery
  }

  function setSortOption(option) {
    return applyNormalizedPatch({ librarySortOption: option }).librarySortOption
  }

  function setTypeFilter(option) {
    return applyNormalizedPatch({ libraryTypeFilter: option }).libraryTypeFilter
  }

  function setVolume(volume) {
    return applyNormalizedPatch({ volume }).volume
  }

  return {
    state,
    volume: computed(() => state.volume),
    searchQuery: computed(() => state.librarySearchQuery),
    sortOption: computed(() => state.librarySortOption),
    typeFilter: computed(() => state.libraryTypeFilter),
    hydrate,
    setSearchQuery,
    setSortOption,
    setTypeFilter,
    setVolume,
  }
}
