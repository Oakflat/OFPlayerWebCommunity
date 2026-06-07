<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, ref, watch } from 'vue'

defineOptions({ name: 'PlayerPage' })

// Always-visible panels — must be ready at first render
import LibraryPanel from '../components/LibraryPanel.vue'
import PlayerPanel from '../components/PlayerPanel.vue'

// Interaction-gated panels — loaded async so they don't block first render.
// Prefetched immediately after hydration so they feel instant when opened.
const ImmersivePlayerView = defineAsyncComponent(
  () => import('../components/ImmersivePlayerView.vue'),
)
const SettingsModal = defineAsyncComponent(() => import('../components/SettingsModal.vue'))
const OnboardingGuide = defineAsyncComponent(() => import('../components/OnboardingGuide.vue'))
const TelemetryConsentDialog = defineAsyncComponent(
  () => import('../components/TelemetryConsentDialog.vue'),
)
const ExternalLibraryDialog = defineAsyncComponent(
  () => import('../components/ExternalLibraryDialog.vue'),
)
import { useOFPlayerApp } from '../app/ofplayerApp'
import { useI18n } from '../composables/useI18n'
import { usePlayerColor } from '../composables/usePlayerColor'
import { buildLibraryNavigation } from '../models/libraryNavigation'

const { locale, t } = useI18n()

const {
  libraries,
  playlists,
  tracks,
  playlistTrackRelations,
  hasTracks,
  isHydrating,
  currentTrackId,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  rememberVolume,
  language,
  theme,
  colorScheme,
  motion,
  playerColor,
  playerColorMode,
  playerColorCustom,
  showTechnicalMetadata,
  recentHistory,
  queueTrackIds,
  searchQuery,
  sortOption,
  typeFilter,
  activeLibrary,
  activeCollection,
  isSettingsOpen,
  telemetryEnabled,
  setTelemetryConsent,
  importFiles,
  selectTrack,
  playGroup,
  togglePlayback,
  playPrevious,
  playNext,
  seek,
  setVolume,
  setSearchQuery,
  setSortOption,
  setTypeFilter,
  setActiveLibrary,
  setActiveCollection,
  createLibrary,
  renameLibrary,
  deleteLibrary,
  createPlaylist,
  renamePlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  deleteTrackFromLibrary,
  toggleFavorite,
  setRememberVolume,
  setLanguage,
  setTheme,
  setColorScheme,
  setMotion,
  setPlayerColor,
  setPlayerColorMode,
  setPlayerColorCustom,
  setShowTechnicalMetadata,
  openSettings,
  closeSettings,
  connectExternalLibrary,
  syncExternalLibrary,
  dispose,
  exportAllTracks,
  clearAllData,
  stores,
} = useOFPlayerApp()

const COMMUNITY_FEATURE_GATE_STATE = 'enabled'
const themeGateState = COMMUNITY_FEATURE_GATE_STATE
const colorGateState = COMMUNITY_FEATURE_GATE_STATE
const multiSourceGateState = COMMUNITY_FEATURE_GATE_STATE

// Player color system — applies CSS variables reactively
usePlayerColor(stores.preferencesStore)

// Export state — kept local to PlayerPage so SettingsModal stays prop-driven
const isExporting = ref(false)
const exportDone = ref(0)
const exportTotal = ref(0)

// External library dialog state
const isExternalLibraryDialogOpen = ref(false)
const isConnectingExternalLibrary = ref(false)
const externalLibraryError = ref('')

function openExternalLibraryDialog() {
  externalLibraryError.value = ''
  isExternalLibraryDialogOpen.value = true
}

function closeExternalLibraryDialog() {
  if (isConnectingExternalLibrary.value) return
  isExternalLibraryDialogOpen.value = false
}

async function handleConnectExternalLibrary(connection) {
  isConnectingExternalLibrary.value = true
  externalLibraryError.value = ''
  try {
    await connectExternalLibrary(connection)
    isExternalLibraryDialogOpen.value = false
  } catch (err) {
    externalLibraryError.value = err?.message ?? t('externalLibrary.errorFallback')
  } finally {
    isConnectingExternalLibrary.value = false
  }
}

async function handleSyncExternalLibrary(libraryId) {
  try {
    await syncExternalLibrary(libraryId)
  } catch (err) {
    alert(err?.message ?? t('externalLibrary.errorFallback'))
  }
}

async function handleExportAllTracks() {
  if (isExporting.value) return
  isExporting.value = true
  exportDone.value = 0
  exportTotal.value = 0
  try {
    await exportAllTracks((done, total) => {
      exportDone.value = done
      exportTotal.value = total
    })
  } finally {
    isExporting.value = false
  }
}

onBeforeUnmount(() => {
  dispose()
})

const navigation = computed(() =>
  buildLibraryNavigation({
    libraries: libraries.value,
    playlists: playlists.value,
    activeLibrary: activeLibrary.value,
    activeCollection: activeCollection.value,
    tracks: tracks.value,
    playlistTrackRelations: playlistTrackRelations.value,
    recentHistory: recentHistory.value,
    queueTrackIds: queueTrackIds.value,
    t,
  }),
)

const activeLibraryItem = computed(() => navigation.value.activeLibraryItem)
const activeCollectionItem = computed(() => navigation.value.activeCollection)
const collectionTracks = computed(() => activeCollectionItem.value?.tracks ?? [])
const isImmersivePlayerOpen = ref(false)

// ── Onboarding guide ──
const ONBOARDING_KEY = 'ofplayer:onboarding:seen:v1'
const isOnboardingOpen = ref(false)
watch(
  () => isHydrating.value,
  (hydrating) => {
    if (!hydrating) {
      try {
        if (!localStorage.getItem(ONBOARDING_KEY)) {
          isOnboardingOpen.value = true
        }
      } catch {
        // private browsing or storage blocked — skip guide silently
      }
    }
  },
  { once: true },
)

function reopenOnboarding() {
  try {
    localStorage.removeItem(ONBOARDING_KEY)
  } catch {
    // storage blocked — still open the guide
  }
  isOnboardingOpen.value = true
}

watch(
  () => currentTrackId.value,
  (trackId) => {
    if (!trackId) {
      isImmersivePlayerOpen.value = false
    }
  },
)

async function handleAddTrackToPlaylist({ playlistId, trackId }) {
  if (!playlistId || !trackId) {
    return
  }

  await addTrackToPlaylist({
    playlistId,
    trackId,
  })
}

function openImmersivePlayer() {
  if (!currentTrack.value) {
    return
  }

  isImmersivePlayerOpen.value = true
}

function closeImmersivePlayer() {
  isImmersivePlayerOpen.value = false
}

// Prefetch heavy panels as soon as the main UI is interactive so they feel
// instant when the user opens them, without blocking first render.
watch(
  () => isHydrating.value,
  (hydrating) => {
    if (!hydrating) {
      void import('../components/ImmersivePlayerView.vue')
      void import('../components/SettingsModal.vue')
      void import('../components/ExternalLibraryDialog.vue')
    }
  },
  { once: true },
)
</script>

<template>
  <main class="page-shell">
    <!-- Skeleton loading overlay — visible while the catalog hydrates after mount -->
    <Transition name="skeleton-fade">
      <div v-if="isHydrating" class="hydrating-skeleton" aria-hidden="true">
        <div class="skeleton-shell">
          <div class="skeleton-sidebar">
            <div class="skeleton-block skeleton-block--title" />
            <div class="skeleton-block skeleton-block--item" />
            <div class="skeleton-block skeleton-block--item" />
            <div class="skeleton-block skeleton-block--item skeleton-block--short" />
          </div>
          <div class="skeleton-main">
            <div class="skeleton-block skeleton-block--heading" />
            <div class="skeleton-block skeleton-block--row" />
            <div class="skeleton-block skeleton-block--row" />
            <div class="skeleton-block skeleton-block--row" />
            <div class="skeleton-block skeleton-block--row skeleton-block--dim" />
            <div class="skeleton-block skeleton-block--row skeleton-block--dim" />
          </div>
          <div class="skeleton-detail">
            <div class="skeleton-block skeleton-block--cover" />
            <div class="skeleton-block skeleton-block--meta" />
            <div class="skeleton-block skeleton-block--meta skeleton-block--short" />
          </div>
        </div>
      </div>
    </Transition>

    <div class="page-stage">
      <section :key="locale" class="player-shell">
        <LibraryPanel
          :libraries="navigation.libraries"
          :playlists="navigation.playlists"
          :smart-collections="navigation.smartCollections"
          :active-library="navigation.activeLibrary"
          :active-collection="activeCollectionItem?.key ?? activeCollection"
          :multi-source-gate-state="multiSourceGateState"
          @import-files="importFiles"
          @set-active-library="setActiveLibrary"
          @set-active-collection="setActiveCollection"
          @open-settings="openSettings"
          @create-library="createLibrary"
          @rename-library="renameLibrary"
          @delete-library="deleteLibrary"
          @create-playlist="createPlaylist"
          @rename-playlist="renamePlaylist"
          @delete-playlist="deletePlaylist"
          @open-external-library="openExternalLibraryDialog"
          @sync-external-library="handleSyncExternalLibrary"
        />

        <PlayerPanel
          :tracks="collectionTracks"
          :current-library="activeLibraryItem"
          :libraries="libraries"
          :playlists="playlists"
          :current-collection="activeCollectionItem"
          :current-track-id="currentTrackId"
          :current-track="currentTrack"
          :has-any-tracks="hasTracks"
          :is-playing="isPlaying"
          :current-time="currentTime"
          :duration="duration"
          :volume="volume"
          :search-query="searchQuery"
          :sort-option="sortOption"
          :type-filter="typeFilter"
          :show-technical-metadata="showTechnicalMetadata"
          @select-track="selectTrack"
          @play-group="playGroup"
          @toggle-playback="togglePlayback"
          @play-previous="playPrevious"
          @play-next="playNext"
          @seek="seek"
          @set-volume="setVolume"
          @set-search-query="setSearchQuery"
          @set-sort-option="setSortOption"
          @set-type-filter="setTypeFilter"
          @add-track-to-playlist="handleAddTrackToPlaylist"
          @remove-track-from-playlist="removeTrackFromPlaylist"
          @delete-track="deleteTrackFromLibrary"
          @toggle-favorite="toggleFavorite"
          @open-immersive-player="openImmersivePlayer"
        />
      </section>

    </div>

    <Transition name="immersive">
      <ImmersivePlayerView
        v-if="isImmersivePlayerOpen"
        :current-track="currentTrack"
        :is-playing="isPlaying"
        :current-time="currentTime"
        :duration="duration"
        :volume="volume"
        @close="closeImmersivePlayer"
        @toggle-playback="togglePlayback"
        @play-previous="playPrevious"
        @play-next="playNext"
        @seek="seek"
        @set-volume="setVolume"
        @toggle-favorite="toggleFavorite"
      />
    </Transition>

    <SettingsModal
      :is-open="isSettingsOpen"
      :language="language"
      :theme="theme"
      :color-scheme="colorScheme"
      :motion="motion"
      :player-color="playerColor"
      :player-color-mode="playerColorMode"
      :player-color-custom="playerColorCustom"
      :sort-option="sortOption"
      :remember-volume="rememberVolume"
      :show-technical-metadata="showTechnicalMetadata"
      :track-count="tracks.length"
      :is-exporting="isExporting"
      :export-done="exportDone"
      :export-total="exportTotal"
      :theme-gate-state="themeGateState"
      :color-gate-state="colorGateState"
      :telemetry-enabled="telemetryEnabled"
      @close="closeSettings"
      @set-language="setLanguage"
      @set-theme="setTheme"
      @set-color-scheme="setColorScheme"
      @set-motion="setMotion"
      @set-player-color="setPlayerColor"
      @set-player-color-mode="setPlayerColorMode"
      @set-player-color-custom="setPlayerColorCustom"
      @set-sort-option="setSortOption"
      @set-remember-volume="setRememberVolume"
      @set-show-technical-metadata="setShowTechnicalMetadata"
      @export-all-tracks="handleExportAllTracks"
      @clear-all-data="clearAllData"
      @reopen-onboarding="reopenOnboarding"
      @set-telemetry-consent="setTelemetryConsent"
    />

    <OnboardingGuide v-if="isOnboardingOpen" @close="isOnboardingOpen = false" />

    <ExternalLibraryDialog
      :is-open="isExternalLibraryDialogOpen"
      :is-connecting="isConnectingExternalLibrary"
      :error="externalLibraryError"
      @close="closeExternalLibraryDialog"
      @connect="handleConnectExternalLibrary"
    />

    <!-- Telemetry consent — shown once on first launch, bottom-right corner -->
    <TelemetryConsentDialog
      v-if="!isHydrating && telemetryEnabled === null"
      @accept="setTelemetryConsent(true)"
      @decline="setTelemetryConsent(false)"
    />
  </main>
</template>

<style scoped>
/* ── Skeleton loading overlay ─────────────────────────────────────────────── */
.hydrating-skeleton {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg, #fff);
  pointer-events: none;
}

.skeleton-shell {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  gap: 0;
  width: min(960px, 90vw);
  height: min(580px, 80vh);
  background: var(--color-surface, #f8f8f8);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.06));
}

.skeleton-sidebar,
.skeleton-main,
.skeleton-detail {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-sidebar {
  border-right: 1px solid var(--color-border, rgba(0, 0, 0, 0.06));
}

.skeleton-detail {
  border-left: 1px solid var(--color-border, rgba(0, 0, 0, 0.06));
  align-items: center;
}

.skeleton-block {
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--color-border, rgba(0, 0, 0, 0.06)) 25%,
    var(--color-surface-raised, rgba(0, 0, 0, 0.03)) 50%,
    var(--color-border, rgba(0, 0, 0, 0.06)) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.6s ease-in-out infinite;
  flex-shrink: 0;
}

.skeleton-block--title {
  height: 12px;
  width: 60%;
}
.skeleton-block--item {
  height: 10px;
  width: 80%;
}
.skeleton-block--short {
  width: 50%;
}
.skeleton-block--heading {
  height: 14px;
  width: 40%;
  margin-bottom: 6px;
}
.skeleton-block--row {
  height: 10px;
  width: 100%;
}
.skeleton-block--dim {
  opacity: 0.5;
}
.skeleton-block--cover {
  height: 120px;
  width: 120px;
  border-radius: 10px;
}
.skeleton-block--meta {
  height: 10px;
  width: 70%;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Fade out when hydration completes */
.skeleton-fade-leave-active {
  transition: opacity 0.3s ease;
}
.skeleton-fade-leave-to {
  opacity: 0;
}

</style>
