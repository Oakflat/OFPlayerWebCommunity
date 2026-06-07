<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Globe,
  Monitor,
  MonitorCog,
  Moon,
  Palette,
  SlidersHorizontal,
  Sun,
  Trash2,
  X,
} from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'
import PlayerColorCustomizer from './settings/PlayerColorCustomizer.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  language: {
    type: String,
    default: 'system',
  },
  theme: {
    type: String,
    default: 'mist',
  },
  colorScheme: {
    type: String,
    default: 'system',
  },
  motion: {
    type: String,
    default: 'full',
  },
  playerColor: {
    type: String,
    default: 'blue',
  },
  playerColorMode: {
    type: String,
    default: 'preset',
  },
  playerColorCustom: {
    type: Object,
    default: () => ({ accent: '#0EA5E9' }),
  },
  sortOption: {
    type: String,
    default: 'recent',
  },
  rememberVolume: {
    type: Boolean,
    default: true,
  },
  showTechnicalMetadata: {
    type: Boolean,
    default: true,
  },
  trackCount: {
    type: Number,
    default: 0,
  },
  isExporting: {
    type: Boolean,
    default: false,
  },
  exportDone: {
    type: Number,
    default: 0,
  },
  exportTotal: {
    type: Number,
    default: 0,
  },
  themeGateState: {
    type: String,
    default: 'enabled',
    validator: (v) => ['enabled', 'preview', 'soft_locked', 'hard_locked'].includes(v),
  },
  colorGateState: {
    type: String,
    default: 'enabled',
    validator: (v) => ['enabled', 'preview', 'soft_locked', 'hard_locked'].includes(v),
  },
  telemetryEnabled: {
    type: Boolean,
    default: null,
  },
})

const emit = defineEmits([
  'close',
  'set-language',
  'set-theme',
  'set-color-scheme',
  'set-motion',
  'set-player-color',
  'set-player-color-mode',
  'set-player-color-custom',
  'set-sort-option',
  'set-remember-volume',
  'set-show-technical-metadata',
  'export-all-tracks',
  'clear-all-data',
  'reopen-onboarding',
  'set-telemetry-consent',
])

const { t } = useI18n()
const activeCategory = ref('general')
const isSortMenuOpen = ref(false)
const sortMenuRef = ref(null)
const sortMenuButtonRef = ref(null)

// Data category state
const clearStep = ref(0) // 0=idle, 1=danger zone expanded
const clearInput = ref('') // user must type "DELETE"
const clearConfirmText = 'DELETE'

const isClearConfirmed = computed(() => clearInput.value.trim().toUpperCase() === clearConfirmText)

function openClearStep() {
  clearStep.value = 1
  clearInput.value = ''
}

function cancelClear() {
  clearStep.value = 0
  clearInput.value = ''
}

function confirmClear() {
  if (!isClearConfirmed.value) return
  emit('clear-all-data')
}

const categories = computed(() => [
  {
    key: 'general',
    label: t('settings.categories.general'),
    description: t('settings.categories.generalCopy'),
  },
  {
    key: 'appearance',
    label: t('settings.categories.appearance'),
    description: t('settings.categories.appearanceCopy'),
  },
  {
    key: 'playback',
    label: t('settings.categories.playback'),
    description: t('settings.categories.playbackCopy'),
  },
  {
    key: 'library',
    label: t('settings.categories.library'),
    description: t('settings.categories.libraryCopy'),
  },
  {
    key: 'data',
    label: t('settings.categories.data'),
    description: t('settings.categories.dataCopy'),
  },
])

const languageOptions = computed(() => [
  {
    value: 'system',
    label: t('settings.language.system'),
    description: t('settings.language.systemCopy'),
  },
  {
    value: 'zh-CN',
    label: t('settings.language.zhCN'),
    description: t('settings.language.zhCNCopy'),
  },
  {
    value: 'en',
    label: t('settings.language.en'),
    description: t('settings.language.enCopy'),
  },
])

const themeOptions = computed(() => [
  {
    value: 'mist',
    label: t('settings.theme.mist'),
    description: t('settings.theme.mistCopy'),
    isPremium: false,
  },
  {
    value: 'paper',
    label: t('settings.theme.paper'),
    description: t('settings.theme.paperCopy'),
    isPremium: true,
  },
  {
    value: 'material',
    label: t('settings.theme.material'),
    description: t('settings.theme.materialCopy'),
    isPremium: true,
  },
])

const colorSchemeOptions = computed(() => [
  {
    value: 'light',
    label: t('settings.colorScheme.light'),
    description: t('settings.colorScheme.lightCopy'),
  },
  {
    value: 'dark',
    label: t('settings.colorScheme.dark'),
    description: t('settings.colorScheme.darkCopy'),
  },
  {
    value: 'system',
    label: t('settings.colorScheme.system'),
    description: t('settings.colorScheme.systemCopy'),
  },
])

const motionOptions = computed(() => [
  {
    value: 'full',
    label: t('settings.motion.full'),
    description: t('settings.motion.fullCopy'),
  },
  {
    value: 'reduced',
    label: t('settings.motion.reduced'),
    description: t('settings.motion.reducedCopy'),
  },
])

const playerColorOptions = computed(() => [
  {
    value: 'blue',
    label: t('settings.playerColor.blue'),
    color: '#0EA5E9',
  },
  {
    value: 'orange',
    label: t('settings.playerColor.orange'),
    color: '#F97316',
  },
  {
    value: 'green',
    label: t('settings.playerColor.green'),
    color: '#10B981',
  },
  {
    value: 'rose',
    label: t('settings.playerColor.rose'),
    color: '#F43F5E',
  },
  {
    value: 'violet',
    label: t('settings.playerColor.violet'),
    color: '#8B5CF6',
  },
  {
    value: 'amber',
    label: t('settings.playerColor.amber'),
    color: '#F59E0B',
  },
  {
    value: 'teal',
    label: t('settings.playerColor.teal'),
    color: '#14B8A6',
  },
  {
    value: 'slate',
    label: t('settings.playerColor.slate'),
    color: '#475569',
  },
])

const sortOptions = computed(() => [
  {
    value: 'recent',
    label: t('player.sortRecent'),
  },
  {
    value: 'title',
    label: t('player.sortTitle'),
  },
  {
    value: 'duration',
    label: t('player.sortDuration'),
  },
  {
    value: 'size',
    label: t('player.sortSize'),
  },
])

const activeCategoryTitle = computed(() => {
  return categories.value.find((item) => item.key === activeCategory.value) ?? categories.value[0]
})

const currentSortOption = computed(() => {
  return (
    sortOptions.value.find((option) => option.value === props.sortOption) ?? sortOptions.value[0]
  )
})

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      activeCategory.value = 'general'

      if (typeof document !== 'undefined') {
        document.body.classList.add('has-modal-open')
      }
    } else {
      isSortMenuOpen.value = false
      clearStep.value = 0
      clearInput.value = ''

      if (typeof document !== 'undefined') {
        document.body.classList.remove('has-modal-open')
      }
    }
  },
  { immediate: true },
)

function closeSortMenu() {
  isSortMenuOpen.value = false
}

function toggleSortMenu() {
  isSortMenuOpen.value = !isSortMenuOpen.value
}

function selectSortOption(value) {
  emit('set-sort-option', value)
  closeSortMenu()
}

function handleDocumentPointerDown(event) {
  if (!props.isOpen || !isSortMenuOpen.value) {
    return
  }

  const target = event.target

  if (sortMenuRef.value?.contains(target) || sortMenuButtonRef.value?.contains(target)) {
    return
  }

  closeSortMenu()
}

function handleKeydown(event) {
  if (!props.isOpen) {
    return
  }

  if (event.key === 'Escape') {
    if (isSortMenuOpen.value) {
      closeSortMenu()
      return
    }

    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.classList.remove('has-modal-open')
  }

  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>

<template>
  <Teleport to="body">
    <transition name="settings-modal">
      <div v-if="isOpen" class="settings-modal-root">
        <div class="settings-modal-backdrop" @click="emit('close')"></div>

        <section
          class="settings-modal"
          role="dialog"
          aria-modal="true"
          :aria-label="t('settings.title')"
        >
          <header class="settings-modal-header">
            <div>
              <p class="eyebrow">{{ t('settings.eyebrow') }}</p>
              <h2>{{ t('settings.title') }}</h2>
            </div>

            <button
              class="settings-modal-close"
              type="button"
              :aria-label="t('settings.close')"
              @click="emit('close')"
            >
              <X aria-hidden="true" />
            </button>
          </header>

          <div class="settings-modal-body">
            <aside class="settings-modal-nav" :aria-label="t('settings.navAria')">
              <button
                v-for="item in categories"
                :key="item.key"
                class="settings-nav-item"
                :class="{ 'is-active': item.key === activeCategory }"
                type="button"
                @click="activeCategory = item.key"
              >
                <span>{{ item.label }}</span>
                <small>{{ item.description }}</small>
              </button>
            </aside>

            <section class="settings-modal-content">
              <Transition
                name="settings-content"
                mode="out-in"
                :duration="{ enter: 600, leave: 220 }"
              >
                <div :key="activeCategory" class="settings-category-wrap">
                  <header class="settings-category-head">
                    <strong>{{ activeCategoryTitle.label }}</strong>
                    <span>{{ activeCategoryTitle.description }}</span>
                  </header>

                  <div v-if="activeCategory === 'general'" class="settings-panel-list">
                    <article class="settings-panel-card">
                      <div class="settings-panel-copy">
                        <span class="settings-panel-label">{{
                          t('settings.fields.language')
                        }}</span>
                        <p>{{ t('settings.fields.languageCopy') }}</p>
                      </div>

                      <div class="settings-choice-grid">
                        <button
                          v-for="option in languageOptions"
                          :key="option.value"
                          class="settings-choice"
                          :class="{ 'is-active': option.value === language }"
                          type="button"
                          @click="emit('set-language', option.value)"
                        >
                          <Globe class="settings-choice-icon" aria-hidden="true" />
                          <strong>{{ option.label }}</strong>
                          <span>{{ option.description }}</span>
                          <Check v-if="option.value === language" class="settings-choice-check" />
                        </button>
                      </div>
                    </article>
                  </div>

                  <div v-else-if="activeCategory === 'appearance'" class="settings-panel-list">
                    <article class="settings-panel-card">
                      <div class="settings-panel-copy">
                        <span class="settings-panel-label">{{ t('settings.fields.theme') }}</span>
                        <p>{{ t('settings.fields.themeCopy') }}</p>
                      </div>

                      <div class="settings-choice-grid">
                        <button
                          v-for="option in themeOptions"
                          :key="option.value"
                          class="settings-choice"
                          :class="{ 'is-active': option.value === theme }"
                          type="button"
                          @click="emit('set-theme', option.value)"
                        >
                          <Palette class="settings-choice-icon" aria-hidden="true" />
                          <strong>{{ option.label }}</strong>
                          <span>{{ option.description }}</span>
                          <Check v-if="option.value === theme" class="settings-choice-check" />
                        </button>
                      </div>
                    </article>

                    <article class="settings-panel-card">
                      <div class="settings-panel-copy">
                        <span class="settings-panel-label">{{
                          t('settings.fields.colorScheme')
                        }}</span>
                        <p>{{ t('settings.fields.colorSchemeCopy') }}</p>
                      </div>

                      <div class="settings-choice-grid">
                        <button
                          v-for="option in colorSchemeOptions"
                          :key="option.value"
                          class="settings-choice"
                          :class="{ 'is-active': option.value === colorScheme }"
                          type="button"
                          @click="emit('set-color-scheme', option.value)"
                        >
                          <Sun
                            v-if="option.value === 'light'"
                            class="settings-choice-icon"
                            aria-hidden="true"
                          />
                          <Moon
                            v-else-if="option.value === 'dark'"
                            class="settings-choice-icon"
                            aria-hidden="true"
                          />
                          <Monitor v-else class="settings-choice-icon" aria-hidden="true" />
                          <strong>{{ option.label }}</strong>
                          <span>{{ option.description }}</span>
                          <Check
                            v-if="option.value === colorScheme"
                            class="settings-choice-check"
                          />
                        </button>
                      </div>
                    </article>

                    <article class="settings-panel-card">
                      <div class="settings-panel-copy">
                        <span class="settings-panel-label">{{ t('settings.fields.motion') }}</span>
                        <p>{{ t('settings.fields.motionCopy') }}</p>
                      </div>

                      <div class="settings-choice-grid">
                        <button
                          v-for="option in motionOptions"
                          :key="option.value"
                          class="settings-choice"
                          :class="{ 'is-active': option.value === motion }"
                          type="button"
                          @click="emit('set-motion', option.value)"
                        >
                          <MonitorCog class="settings-choice-icon" aria-hidden="true" />
                          <strong>{{ option.label }}</strong>
                          <span>{{ option.description }}</span>
                          <Check v-if="option.value === motion" class="settings-choice-check" />
                        </button>
                      </div>
                    </article>

                    <article class="settings-panel-card">
                      <div class="settings-panel-copy">
                        <span class="settings-panel-label">{{ t('settings.fields.playerColor') }}</span>
                        <p>{{ t('settings.fields.playerColorCopy') }}</p>
                      </div>

                      <PlayerColorCustomizer
                        :mode="playerColorMode"
                        :preset="playerColor"
                        :custom-colors="playerColorCustom"
                          color-gate-state="enabled"
                        @set-mode="emit('set-player-color-mode', $event)"
                        @set-preset="emit('set-player-color', $event)"
                        @set-custom-colors="emit('set-player-color-custom', $event)"
                      />
                    </article>
                  </div>

                  <div v-else-if="activeCategory === 'playback'" class="settings-panel-list">
                    <article class="settings-panel-card">
                      <div class="settings-panel-copy">
                        <span class="settings-panel-label">{{
                          t('settings.fields.rememberVolume')
                        }}</span>
                        <p>{{ t('settings.fields.rememberVolumeCopy') }}</p>
                      </div>

                      <button
                        class="settings-toggle"
                        :class="{ 'is-active': rememberVolume }"
                        type="button"
                        :aria-pressed="rememberVolume"
                        @click="emit('set-remember-volume', !rememberVolume)"
                      >
                        <span>{{ rememberVolume ? t('settings.on') : t('settings.off') }}</span>
                        <span class="settings-toggle-thumb"></span>
                      </button>
                    </article>
                  </div>

                  <div v-else-if="activeCategory === 'library'" class="settings-panel-list">
                    <article
                      class="settings-panel-card"
                      :class="{ 'has-open-menu': isSortMenuOpen }"
                    >
                      <div class="settings-panel-copy">
                        <span class="settings-panel-label">{{
                          t('settings.fields.defaultSort')
                        }}</span>
                        <p>{{ t('settings.fields.defaultSortCopy') }}</p>
                      </div>

                      <div ref="sortMenuRef" class="settings-select-menu">
                        <button
                          ref="sortMenuButtonRef"
                          class="settings-select settings-select-trigger"
                          :class="{ 'is-open': isSortMenuOpen }"
                          type="button"
                          :aria-label="t('settings.fields.defaultSort')"
                          :aria-expanded="isSortMenuOpen"
                          aria-controls="settings-default-sort-menu"
                          @click="toggleSortMenu"
                        >
                          <SlidersHorizontal aria-hidden="true" />
                          <strong>{{ currentSortOption?.label }}</strong>
                          <ChevronDown aria-hidden="true" />
                        </button>

                        <Transition name="toolbar-menu">
                          <div
                            v-if="isSortMenuOpen"
                            id="settings-default-sort-menu"
                            class="settings-select-dropdown"
                            role="listbox"
                            :aria-label="t('settings.fields.defaultSort')"
                          >
                            <button
                              v-for="option in sortOptions"
                              :key="option.value"
                              class="settings-select-option"
                              :class="{ 'is-active': option.value === sortOption }"
                              type="button"
                              role="option"
                              :aria-selected="option.value === sortOption"
                              @click="selectSortOption(option.value)"
                            >
                              {{ option.label }}
                            </button>
                          </div>
                        </Transition>
                      </div>
                    </article>

                    <article class="settings-panel-card">
                      <div class="settings-panel-copy">
                        <span class="settings-panel-label">{{
                          t('settings.fields.metaVisibility')
                        }}</span>
                        <p>{{ t('settings.fields.metaVisibilityCopy') }}</p>
                      </div>

                      <button
                        class="settings-toggle"
                        :class="{ 'is-active': showTechnicalMetadata }"
                        type="button"
                        :aria-pressed="showTechnicalMetadata"
                        @click="emit('set-show-technical-metadata', !showTechnicalMetadata)"
                      >
                        <span>{{
                          showTechnicalMetadata ? t('settings.on') : t('settings.off')
                        }}</span>
                        <span class="settings-toggle-thumb"></span>
                      </button>
                    </article>
                  </div>
                  <div v-else-if="activeCategory === 'data'" class="settings-panel-list">
                    <!-- Reopen guide card -->
                    <article class="settings-panel-card">
                      <div class="settings-panel-copy">
                        <span class="settings-panel-label">{{
                          t('settings.data.reopenGuide')
                        }}</span>
                        <p>{{ t('settings.data.reopenGuideCopy') }}</p>
                      </div>
                      <button
                        class="settings-action-btn"
                        type="button"
                        @click="emit('reopen-onboarding')"
                      >
                        {{ t('settings.data.reopenGuideButton') }}
                      </button>
                    </article>

                    <!-- Export card -->
                    <article class="settings-panel-card">
                      <div class="settings-panel-copy">
                        <span class="settings-panel-label">
                          <Download class="settings-panel-label-icon" aria-hidden="true" />
                          {{ t('settings.data.exportTitle') }}
                        </span>
                        <p v-if="trackCount > 0">
                          {{ t('settings.data.exportCopy', { count: trackCount }) }}
                        </p>
                        <p v-else>{{ t('settings.data.exportCopyEmpty') }}</p>
                      </div>

                      <button
                        class="settings-action-btn"
                        type="button"
                        :disabled="trackCount === 0 || isExporting"
                        @click="emit('export-all-tracks')"
                      >
                        <span v-if="isExporting && exportTotal > 0">
                          {{
                            t('settings.data.exportProgress', {
                              done: exportDone,
                              total: exportTotal,
                            })
                          }}
                        </span>
                        <span v-else-if="isExporting">{{
                          t('settings.data.exportProgress', { done: 0, total: trackCount })
                        }}</span>
                        <span v-else>{{ t('settings.data.exportButton') }}</span>
                      </button>
                    </article>

                    <!-- Telemetry card -->
                    <article class="settings-panel-card">
                      <div class="settings-panel-copy">
                        <span class="settings-panel-label">{{
                          t('settings.telemetry.title')
                        }}</span>
                        <p>{{ t('settings.telemetry.copy') }}</p>
                      </div>
                      <button
                        class="settings-action-btn"
                        :class="telemetryEnabled === true ? 'settings-action-btn--active' : ''"
                        type="button"
                        @click="emit('set-telemetry-consent', telemetryEnabled !== true)"
                      >
                        {{
                          telemetryEnabled === true
                            ? t('settings.telemetry.on')
                            : t('settings.telemetry.off')
                        }}
                      </button>
                    </article>

                    <!-- Clear card -->
                    <article
                      class="settings-panel-card settings-panel-card--danger"
                      :class="{ 'is-expanded': clearStep === 1 }"
                    >
                      <div class="settings-panel-copy">
                        <span class="settings-panel-label">
                          <AlertTriangle
                            class="settings-panel-label-icon settings-panel-label-icon--warn"
                            aria-hidden="true"
                          />
                          {{ t('settings.data.clearTitle') }}
                        </span>
                        <p>{{ t('settings.data.clearCopy') }}</p>
                      </div>

                      <button
                        v-if="clearStep === 0"
                        class="settings-action-btn settings-action-btn--danger"
                        type="button"
                        :disabled="trackCount === 0"
                        @click="openClearStep"
                      >
                        <Trash2 aria-hidden="true" />
                        {{ t('settings.data.clearButton') }}
                      </button>

                      <!-- Danger zone expanded (step 1) -->
                      <div v-else class="settings-danger-zone">
                        <p class="settings-danger-warning">
                          {{ t('settings.data.clearWarning') }}
                        </p>

                        <label class="settings-danger-label" for="settings-clear-input">
                          {{ t('settings.data.clearConfirmPrompt') }}
                        </label>
                        <input
                          id="settings-clear-input"
                          v-model="clearInput"
                          class="settings-danger-input"
                          type="text"
                          autocomplete="off"
                          spellcheck="false"
                          :placeholder="t('settings.data.clearConfirmPlaceholder')"
                        />

                        <div class="settings-danger-actions">
                          <button
                            class="settings-action-btn settings-action-btn--ghost"
                            type="button"
                            @click="cancelClear"
                          >
                            {{ t('settings.data.clearCancelButton') }}
                          </button>
                          <button
                            class="settings-action-btn settings-action-btn--danger-confirm"
                            type="button"
                            :disabled="!isClearConfirmed"
                            @click="confirmClear"
                          >
                            <Trash2 aria-hidden="true" />
                            {{ t('settings.data.clearConfirmButton') }}
                          </button>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
              </Transition>
            </section>
          </div>
        </section>
      </div>
    </transition>
  </Teleport>
</template>

<style>
/* ─── Settings Modal: nav item stagger ───────────────────────────────
   Placed here (not in style.css) so esbuild doesn't merge these rules
   into the global .settings-nav-item block and silently drop them.
   Same pattern as PlayerPanel.vue's content-copy-swap.
──────────────────────────────────────────────────────────────────── */
.settings-nav-item {
  animation: settings-nav-in 240ms var(--ease-emphasized-decelerate) both;
}
.settings-nav-item:nth-child(1) {
  animation-delay: 160ms;
}
.settings-nav-item:nth-child(2) {
  animation-delay: 195ms;
}
.settings-nav-item:nth-child(3) {
  animation-delay: 230ms;
}
.settings-nav-item:nth-child(4) {
  animation-delay: 265ms;
}
.settings-nav-item:nth-child(5) {
  animation-delay: 300ms;
}

@keyframes settings-nav-in {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ─── Category content switch (blur-fade, same feel as content-copy-swap) ── */
.settings-content-leave-active {
  transition:
    opacity var(--duration-md) var(--ease-standard),
    transform var(--duration-md) var(--ease-emphasized-accelerate),
    filter var(--duration-md) var(--ease-standard);
  will-change: opacity, transform, filter;
}
.settings-content-leave-to {
  opacity: 0;
  transform: translateY(6px);
  filter: blur(10px);
}
/* Enter: container appears instantly; children carry the visual animation */
.settings-content-enter-from,
.settings-content-enter-to {
  opacity: 1;
}

/* ─── Category head + panel card stagger ─────────────────────────────────
   Triggered via parent .settings-content-enter-active so they only animate
   during the enter phase. Vue keeps enter-active for :duration.enter (600ms),
   which is long enough for the last card (240+300 = 540ms < 600ms).
──────────────────────────────────────────────────────────────────────── */
.settings-content-enter-active .settings-category-head {
  animation: settings-card-in 300ms var(--ease-emphasized-decelerate) both;
  animation-delay: 0ms;
}
.settings-content-enter-active .settings-panel-card:nth-child(1) {
  animation: settings-card-in 300ms var(--ease-emphasized-decelerate) both;
  animation-delay: 60ms;
}
.settings-content-enter-active .settings-panel-card:nth-child(2) {
  animation: settings-card-in 300ms var(--ease-emphasized-decelerate) both;
  animation-delay: 120ms;
}
.settings-content-enter-active .settings-panel-card:nth-child(3) {
  animation: settings-card-in 300ms var(--ease-emphasized-decelerate) both;
  animation-delay: 180ms;
}
.settings-content-enter-active .settings-panel-card:nth-child(4) {
  animation: settings-card-in 300ms var(--ease-emphasized-decelerate) both;
  animation-delay: 240ms;
}

@keyframes settings-card-in {
  from {
    opacity: 0;
    transform: translateY(10px);
    filter: blur(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}
</style>
