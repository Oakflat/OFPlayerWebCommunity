<template>
  <ToolPageLayout
    tool-id="loudness-scanner"
    processing-mode="local_binary"
    :faq="faq"
    :related-tools="relatedTools"
  >
    <template #hero>
      <ToolHero
        :title="toolHero.title"
        :description="toolHero.description"
        category="audio"
        :category-label="t('tools.audioCategory')"
        :local-first="true"
      />
    </template>

    <!-- Drop zone -->
    <div
      v-if="!file"
      class="ls__drop"
      :class="{ 'ls__drop--over': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="triggerPicker"
    >
      <Volume2 :size="40" class="ls__drop-icon" aria-hidden="true" />
      <p class="ls__drop-label">{{ t('tools.loudness.dropLabel') }}</p>
      <p class="ls__drop-sub">{{ t('tools.loudness.dropSub') }}</p>
      <p class="ls__drop-hint">{{ t('tools.loudness.dropHint') }}</p>
      <input
        ref="fileInput"
        type="file"
        accept="audio/*,.flac,.ogg,.opus,.wma,.m4a,.aac,.wav,.mp3"
        class="ls__file-input"
        @change="onFileChange"
      />
    </div>

    <!-- Work area -->
    <div v-else class="ls__work">
      <!-- File bar -->
      <div class="ls__file-bar">
        <div class="ls__file-bar-info">
          <Music2 :size="16" aria-hidden="true" />
          <span class="ls__file-name">{{ file.name }}</span>
          <span class="ls__file-size">{{ formatBytes(file.size) }}</span>
        </div>
        <button class="ls__action-btn" type="button" @click="reset">
          {{ t('tools.loudness.changeFile') }}
        </button>
      </div>

      <!-- Analyzing -->
      <div v-if="phase === 'analyzing'" class="ls__progress-wrap">
        <div class="ls__progress-bar">
          <div class="ls__progress-fill" :style="{ width: progress + '%' }" />
        </div>
        <p class="ls__progress-label">{{ t('tools.loudness.analyzing') }} {{ progress }}%</p>
      </div>

      <!-- Error -->
      <div v-else-if="phase === 'error'" class="ls__error">
        <AlertTriangle :size="18" aria-hidden="true" />
        <div>
          <p class="ls__error-title">{{ t('tools.loudness.errorTitle') }}</p>
          <p class="ls__error-body">{{ t('tools.loudness.errorBody') }}</p>
        </div>
      </div>

      <!-- Result -->
      <div v-else-if="phase === 'done' && result" class="ls__result">
        <!-- Primary metric: LUFS -->
        <div class="ls__primary">
          <div class="ls__primary-main">
            <span class="ls__primary-value">{{ result.integratedLufs ?? '—' }}</span>
            <span class="ls__primary-unit">LUFS</span>
          </div>
          <p class="ls__primary-label">{{ t('tools.loudness.integratedLabel') }}</p>
        </div>

        <!-- Stats grid -->
        <div class="ls__stats">
          <div class="ls__stat">
            <span class="ls__stat-label">{{ t('tools.loudness.statTruePeak') }}</span>
            <span
              class="ls__stat-value"
              :class="{ 'ls__stat-value--warn': result.truePeakDbfs > -1 }"
              >{{ result.truePeakDbfs != null ? result.truePeakDbfs + ' dBFS' : '—' }}</span
            >
          </div>
          <div class="ls__stat">
            <span class="ls__stat-label">{{ t('tools.loudness.statDynamicRange') }}</span>
            <span class="ls__stat-value">{{
              result.dynamicRange ? result.dynamicRange + ' dB' : '—'
            }}</span>
          </div>
          <div class="ls__stat">
            <span class="ls__stat-label">{{ t('tools.loudness.statDuration') }}</span>
            <span class="ls__stat-value">{{ formatDuration(result.duration) }}</span>
          </div>
          <div class="ls__stat">
            <span class="ls__stat-label">{{ t('tools.loudness.statSampleRate') }}</span>
            <span class="ls__stat-value">{{ formatSampleRate(result.sampleRate) }}</span>
          </div>
        </div>

        <!-- ReplayGain suggestion -->
        <div v-if="result.integratedLufs != null" class="ls__rg-card">
          <div class="ls__rg-header">
            <SlidersHorizontal :size="16" aria-hidden="true" />
            <span>{{ t('tools.loudness.replayGainLabel') }}</span>
          </div>
          <div
            class="ls__rg-value"
            :class="result.replayGainDb > 0 ? 'ls__rg-value--up' : 'ls__rg-value--down'"
          >
            {{ result.replayGainDb > 0 ? '+' : '' }}{{ result.replayGainDb }} dB
          </div>
          <p class="ls__rg-note">
            {{ t('tools.loudness.replayGainNote').replace('{target}', '-14') }}
          </p>
        </div>

        <!-- Clipping warning -->
        <div v-if="result.truePeakDbfs > -1" class="ls__clip-warn">
          <AlertTriangle :size="16" aria-hidden="true" />
          {{ t('tools.loudness.clippingWarning') }}
        </div>

        <!-- Disclaimer -->
        <p class="ls__disclaimer">{{ t('tools.loudness.disclaimer') }}</p>
      </div>
    </div>

    <template #guide>
      <div class="ls__guide">
        <template v-for="(section, idx) in toolGuide" :key="idx">
          <h3>{{ section.heading }}</h3>
          <p>{{ section.body }}</p>
        </template>
      </div>
    </template>
  </ToolPageLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useHead } from '@unhead/vue'
import { Music2, Volume2, SlidersHorizontal, AlertTriangle } from 'lucide-vue-next'
import ToolPageLayout from '../../../components/tools/ToolPageLayout.vue'
import ToolHero from '../../../components/tools/ToolHero.vue'
import { getRelatedTools } from '../../../tools/registry.js'
import { getToolContent } from '../../../tools/content/toolContentRegistry.js'
import { useI18n } from '../../../composables/useI18n.js'
import { scanLoudness } from '../../../tools/audio/loudnessScanner.js'

const { t, locale } = useI18n()
const SITE_URL = ''

useHead({
  title: computed(
    () =>
      getToolContent('loudness-scanner', locale.value)?.metaTitle || 'Loudness Scanner | OFPlayer',
  ),
  meta: [
    {
      name: 'description',
      content: computed(
        () => getToolContent('loudness-scanner', locale.value)?.metaDescription || '',
      ),
    },
    { property: 'og:url', content: `${SITE_URL}/tools/audio/loudness-scanner` },
  ],
})

const toolHero = computed(() => {
  const c = getToolContent('loudness-scanner', locale.value)
  return { title: c?.h1 || 'Loudness Scanner', description: c?.intro || '' }
})
const toolGuide = computed(
  () => getToolContent('loudness-scanner', locale.value)?.guideSections || [],
)
const faq = computed(() => getToolContent('loudness-scanner', locale.value)?.faq || [])
const relatedTools = computed(() =>
  getRelatedTools(['spectrum-viewer', 'audio-converter', 'audio-metadata-viewer']),
)

// ── State ─────────────────────────────────────────────────────────────────────
const file = ref(null)
const phase = ref('idle')
const progress = ref(0)
const result = ref(null)
const isDragging = ref(false)
const fileInput = ref(null)

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}
function formatDuration(secs) {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
function formatSampleRate(hz) {
  return hz >= 1000 ? `${(hz / 1000).toFixed(hz % 1000 === 0 ? 0 : 1)} kHz` : `${hz} Hz`
}

// ── File handling ─────────────────────────────────────────────────────────────
function triggerPicker() {
  fileInput.value?.click()
}
function onFileChange(e) {
  const f = e.target.files?.[0]
  if (f) loadFile(f)
}
function onDrop(e) {
  isDragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) loadFile(f)
}

async function loadFile(f) {
  file.value = f
  phase.value = 'analyzing'
  progress.value = 0
  result.value = null

  try {
    result.value = await scanLoudness(f, {
      onProgress: (p) => {
        progress.value = p
      },
    })
    phase.value = 'done'
  } catch {
    phase.value = 'error'
  }
}

function reset() {
  file.value = null
  phase.value = 'idle'
  progress.value = 0
  result.value = null
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<style scoped>
.ls__drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 220px;
  border: 2px dashed var(--of-neutral-200);
  border-radius: 12px;
  cursor: pointer;
  padding: 40px 24px;
  text-align: center;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.ls__drop:hover,
.ls__drop--over {
  border-color: var(--of-player-accent);
  background: var(--of-player-soft);
}
.ls__drop-icon {
  color: var(--of-text-tertiary);
}
.ls__drop-label {
  font-size: 1rem;
  font-weight: 500;
  color: var(--of-text-primary);
  margin: 0;
}
.ls__drop-sub {
  font-size: 0.85rem;
  color: var(--of-text-secondary);
  margin: 0;
}
.ls__drop-hint {
  font-size: 0.78rem;
  color: var(--of-text-tertiary);
  margin: 0;
}
.ls__file-input {
  display: none;
}

.ls__work {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ls__file-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: var(--of-surface-raised);
  border-radius: 8px;
  border: 1px solid var(--of-neutral-100);
}
.ls__file-bar-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--of-text-secondary);
}
.ls__file-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--of-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ls__file-size {
  font-size: 0.78rem;
  color: var(--of-text-tertiary);
  white-space: nowrap;
}
.ls__action-btn {
  flex-shrink: 0;
  padding: 6px 14px;
  border: 1px solid var(--of-neutral-200);
  border-radius: 6px;
  background: transparent;
  font-size: 0.83rem;
  color: var(--of-text-secondary);
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;
}
.ls__action-btn:hover {
  border-color: var(--of-player-accent);
  color: var(--of-player-accent);
}

.ls__progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 0;
}
.ls__progress-bar {
  height: 4px;
  background: var(--of-neutral-100);
  border-radius: 2px;
  overflow: hidden;
}
.ls__progress-fill {
  height: 100%;
  background: var(--of-player-accent);
  border-radius: 2px;
  transition: width 0.2s;
}
.ls__progress-label {
  font-size: 0.83rem;
  color: var(--of-text-secondary);
  text-align: center;
}

.ls__error {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: var(--of-danger-soft);
  border: 1px solid var(--of-danger-border);
  border-radius: 8px;
  color: var(--of-danger);
}
.ls__error-title {
  font-weight: 600;
  font-size: 0.9rem;
  margin: 0 0 2px;
}
.ls__error-body {
  font-size: 0.83rem;
  margin: 0;
  opacity: 0.85;
}

.ls__result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ls__primary {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 28px 24px;
  background: var(--of-surface-raised);
  border-radius: 12px;
  border: 1px solid var(--of-neutral-100);
}
.ls__primary-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.ls__primary-value {
  font-size: 3rem;
  font-weight: 700;
  color: var(--of-player-accent);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.ls__primary-unit {
  font-size: 1.1rem;
  color: var(--of-text-secondary);
  font-weight: 500;
}
.ls__primary-label {
  font-size: 0.8rem;
  color: var(--of-text-tertiary);
  margin: 0;
}

.ls__stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}
.ls__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 14px;
  background: var(--of-surface-raised);
  border-radius: 8px;
  border: 1px solid var(--of-neutral-100);
}
.ls__stat-label {
  font-size: 0.75rem;
  color: var(--of-text-tertiary);
}
.ls__stat-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--of-text-primary);
  font-variant-numeric: tabular-nums;
}
.ls__stat-value--warn {
  color: var(--of-danger);
}

.ls__rg-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: var(--of-player-soft);
  border: 1px solid var(--of-player-border);
  border-radius: 10px;
}
.ls__rg-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--of-text-secondary);
  white-space: nowrap;
}
.ls__rg-value {
  font-size: 1.3rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin-left: auto;
}
.ls__rg-value--up {
  color: var(--of-success);
}
.ls__rg-value--down {
  color: var(--of-player-accent);
}
.ls__rg-note {
  font-size: 0.78rem;
  color: var(--of-text-tertiary);
  margin: 0;
  white-space: nowrap;
}

.ls__clip-warn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--of-danger-soft);
  border: 1px solid var(--of-danger-border);
  border-radius: 8px;
  color: var(--of-danger);
  font-size: 0.875rem;
}

.ls__disclaimer {
  font-size: 0.78rem;
  color: var(--of-text-tertiary);
  line-height: 1.5;
  margin: 0;
}

.ls__guide h3 {
  margin: 0 0 4px;
  font-size: 0.95rem;
}
.ls__guide p {
  margin: 0 0 16px;
  font-size: 0.875rem;
  color: var(--of-text-secondary);
  line-height: 1.6;
}
</style>
