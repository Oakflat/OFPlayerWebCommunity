<template>
  <ToolPageLayout
    tool-id="spectrum-viewer"
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
      class="sv__drop"
      :class="{ 'sv__drop--over': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="triggerPicker"
    >
      <ChartBar :size="40" class="sv__drop-icon" aria-hidden="true" />
      <p class="sv__drop-label">{{ t('tools.spectrum.dropLabel') }}</p>
      <p class="sv__drop-sub">{{ t('tools.spectrum.dropSub') }}</p>
      <p class="sv__drop-hint">{{ t('tools.spectrum.dropHint') }}</p>
      <input
        ref="fileInput"
        type="file"
        accept="audio/*,.flac,.ogg,.opus,.wma,.m4a,.aac,.wav,.mp3"
        class="sv__file-input"
        @change="onFileChange"
      />
    </div>

    <!-- Work area -->
    <div v-else class="sv__work">
      <!-- File bar -->
      <div class="sv__file-bar">
        <div class="sv__file-bar-info">
          <Music2 :size="16" aria-hidden="true" />
          <span class="sv__file-name">{{ file.name }}</span>
          <span class="sv__file-size">{{ formatBytes(file.size) }}</span>
        </div>
        <button class="sv__action-btn" type="button" @click="reset">
          {{ t('tools.spectrum.changeFile') }}
        </button>
      </div>

      <!-- Analyzing -->
      <div v-if="phase === 'analyzing'" class="sv__progress-wrap">
        <div class="sv__progress-bar">
          <div class="sv__progress-fill" :style="{ width: progress + '%' }" />
        </div>
        <p class="sv__progress-label">{{ t('tools.spectrum.analyzing') }} {{ progress }}%</p>
      </div>

      <!-- Error -->
      <div v-else-if="phase === 'error'" class="sv__error">
        <AlertTriangle :size="18" aria-hidden="true" />
        <div>
          <p class="sv__error-title">{{ t('tools.spectrum.errorTitle') }}</p>
          <p class="sv__error-body">{{ t('tools.spectrum.errorBody') }}</p>
        </div>
      </div>

      <!-- Result -->
      <div v-else-if="phase === 'done' && result" class="sv__result">
        <!-- Stats row -->
        <div class="sv__stats">
          <div class="sv__stat">
            <span class="sv__stat-label">{{ t('tools.spectrum.statSampleRate') }}</span>
            <span class="sv__stat-value">{{ formatSampleRate(result.sampleRate) }}</span>
          </div>
          <div class="sv__stat">
            <span class="sv__stat-label">{{ t('tools.spectrum.statDuration') }}</span>
            <span class="sv__stat-value">{{ formatDuration(result.duration) }}</span>
          </div>
          <div class="sv__stat">
            <span class="sv__stat-label">{{ t('tools.spectrum.statHighestFreq') }}</span>
            <span class="sv__stat-value">{{ formatHz(result.highestActiveHz) }}</span>
          </div>
          <div class="sv__stat">
            <span class="sv__stat-label">{{ t('tools.spectrum.statResolution') }}</span>
            <span class="sv__stat-value">{{ result.freqResolution.toFixed(1) }} Hz/bin</span>
          </div>
        </div>

        <!-- Canvas spectrum -->
        <div class="sv__canvas-wrap">
          <canvas ref="canvasEl" class="sv__canvas" :width="canvasW" :height="canvasH" />
          <div class="sv__canvas-yaxis">
            <span>0 dB</span>
            <span>-40</span>
            <span>-80</span>
          </div>
          <div class="sv__canvas-xaxis">
            <span>20 Hz</span>
            <span>1 kHz</span>
            <span>{{ formatHz(result.sampleRate / 2) }}</span>
          </div>
        </div>

        <!-- Legend -->
        <div v-if="result.cutoffHz" class="sv__legend">
          <span class="sv__legend-dot sv__legend-dot--cutoff" />
          {{ t('tools.spectrum.cutoffMarker').replace('{hz}', formatHz(result.cutoffHz)) }}
        </div>
      </div>
    </div>

    <template #guide>
      <div class="sv__guide">
        <template v-for="(section, idx) in toolGuide" :key="idx">
          <h3>{{ section.heading }}</h3>
          <p>{{ section.body }}</p>
        </template>
      </div>
    </template>
  </ToolPageLayout>
</template>

<script setup>
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { useHead } from '@unhead/vue'
import { Music2, ChartBar, AlertTriangle } from 'lucide-vue-next'
import ToolPageLayout from '../../../components/tools/ToolPageLayout.vue'
import ToolHero from '../../../components/tools/ToolHero.vue'
import { getRelatedTools } from '../../../tools/registry.js'
import { getToolContent } from '../../../tools/content/toolContentRegistry.js'
import { useI18n } from '../../../composables/useI18n.js'
import {
  analyzeSpectrum,
  detectCutoff,
  renderSpectrum,
} from '../../../tools/audio/spectrumAnalyzer.js'

const { t, locale } = useI18n()
const SITE_URL = ''

useHead({
  title: computed(
    () =>
      getToolContent('spectrum-viewer', locale.value)?.metaTitle || 'Spectrum Viewer | OFPlayer',
  ),
  meta: [
    {
      name: 'description',
      content: computed(
        () => getToolContent('spectrum-viewer', locale.value)?.metaDescription || '',
      ),
    },
    { property: 'og:url', content: `${SITE_URL}/tools/audio/spectrum-viewer` },
  ],
})

const toolHero = computed(() => {
  const c = getToolContent('spectrum-viewer', locale.value)
  return { title: c?.h1 || 'Spectrum Viewer', description: c?.intro || '' }
})
const toolGuide = computed(
  () => getToolContent('spectrum-viewer', locale.value)?.guideSections || [],
)
const faq = computed(() => getToolContent('spectrum-viewer', locale.value)?.faq || [])
const relatedTools = computed(() =>
  getRelatedTools(['lossless-detector', 'audio-metadata-viewer', 'loudness-scanner']),
)

// ── State ─────────────────────────────────────────────────────────────────────
const file = ref(null)
const phase = ref('idle') // idle | analyzing | done | error
const progress = ref(0)
const result = ref(null)
const isDragging = ref(false)
const fileInput = ref(null)
const canvasEl = ref(null)
const canvasW = 800
const canvasH = 240

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

function formatSampleRate(hz) {
  return hz >= 1000 ? `${(hz / 1000).toFixed(hz % 1000 === 0 ? 0 : 1)} kHz` : `${hz} Hz`
}

function formatDuration(secs) {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatHz(hz) {
  if (hz >= 1000) return `${(hz / 1000).toFixed(hz % 1000 === 0 ? 0 : 1)} kHz`
  return `${hz} Hz`
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
    const spectrum = await analyzeSpectrum(f, {
      onProgress: (p) => {
        progress.value = p
      },
    })
    const cutoff = detectCutoff(spectrum.maxDb, spectrum.sampleRate)

    result.value = {
      ...spectrum,
      ...cutoff,
    }
    phase.value = 'done'

    await nextTick()
    if (canvasEl.value) {
      renderSpectrum(canvasEl.value, spectrum.maxDb, spectrum.sampleRate, {
        cutoffHz: cutoff.cutoffHz,
        minDb: -100,
        maxDb: 0,
      })
    }
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
.sv__drop {
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
.sv__drop:hover,
.sv__drop--over {
  border-color: var(--of-player-accent);
  background: var(--of-player-soft);
}
.sv__drop-icon {
  color: var(--of-text-tertiary);
}
.sv__drop-label {
  font-size: 1rem;
  font-weight: 500;
  color: var(--of-text-primary);
  margin: 0;
}
.sv__drop-sub {
  font-size: 0.85rem;
  color: var(--of-text-secondary);
  margin: 0;
}
.sv__drop-hint {
  font-size: 0.78rem;
  color: var(--of-text-tertiary);
  margin: 0;
}
.sv__file-input {
  display: none;
}

.sv__work {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sv__file-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: var(--of-surface-raised);
  border-radius: 8px;
  border: 1px solid var(--of-neutral-100);
}
.sv__file-bar-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--of-text-secondary);
}
.sv__file-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--of-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sv__file-size {
  font-size: 0.78rem;
  color: var(--of-text-tertiary);
  white-space: nowrap;
}
.sv__action-btn {
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
.sv__action-btn:hover {
  border-color: var(--of-player-accent);
  color: var(--of-player-accent);
}

.sv__progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 0;
}
.sv__progress-bar {
  height: 4px;
  background: var(--of-neutral-100);
  border-radius: 2px;
  overflow: hidden;
}
.sv__progress-fill {
  height: 100%;
  background: var(--of-player-accent);
  border-radius: 2px;
  transition: width 0.2s;
}
.sv__progress-label {
  font-size: 0.83rem;
  color: var(--of-text-secondary);
  text-align: center;
}

.sv__error {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: var(--of-danger-soft);
  border: 1px solid var(--of-danger-border);
  border-radius: 8px;
  color: var(--of-danger);
}
.sv__error-title {
  font-weight: 600;
  font-size: 0.9rem;
  margin: 0 0 2px;
}
.sv__error-body {
  font-size: 0.83rem;
  margin: 0;
  opacity: 0.85;
}

.sv__result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sv__stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}
.sv__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 14px;
  background: var(--of-surface-raised);
  border-radius: 8px;
  border: 1px solid var(--of-neutral-100);
}
.sv__stat-label {
  font-size: 0.75rem;
  color: var(--of-text-tertiary);
}
.sv__stat-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--of-text-primary);
  font-variant-numeric: tabular-nums;
}

.sv__canvas-wrap {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--of-neutral-100);
  background: var(--of-surface-raised);
}
.sv__canvas {
  display: block;
  width: 100%;
  height: auto;
}
.sv__canvas-yaxis {
  position: absolute;
  top: 0;
  left: 4px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 4px 0 20px;
  font-size: 0.65rem;
  color: var(--of-text-tertiary);
  pointer-events: none;
}
.sv__canvas-xaxis {
  position: absolute;
  bottom: 2px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 8px;
  font-size: 0.65rem;
  color: var(--of-text-tertiary);
  pointer-events: none;
}

.sv__legend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.83rem;
  color: var(--of-text-secondary);
}
.sv__legend-dot {
  display: inline-block;
  width: 12px;
  height: 2px;
  border-radius: 1px;
}
.sv__legend-dot--cutoff {
  background: var(--of-danger);
  border: 1px dashed var(--of-danger);
}

.sv__guide h3 {
  margin: 0 0 4px;
  font-size: 0.95rem;
}
.sv__guide p {
  margin: 0 0 16px;
  font-size: 0.875rem;
  color: var(--of-text-secondary);
  line-height: 1.6;
}
</style>
