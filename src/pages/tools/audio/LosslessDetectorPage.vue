<template>
  <ToolPageLayout
    tool-id="lossless-detector"
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
      class="ld__drop"
      :class="{ 'ld__drop--over': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="triggerPicker"
    >
      <ShieldCheck :size="40" class="ld__drop-icon" aria-hidden="true" />
      <p class="ld__drop-label">{{ t('tools.losslessDetect.dropLabel') }}</p>
      <p class="ld__drop-sub">{{ t('tools.losslessDetect.dropSub') }}</p>
      <p class="ld__drop-hint">{{ t('tools.losslessDetect.dropHint') }}</p>
      <input
        ref="fileInput"
        type="file"
        accept="audio/*,.flac,.ogg,.opus,.wma,.m4a,.aac,.wav,.mp3"
        class="ld__file-input"
        @change="onFileChange"
      />
    </div>

    <!-- Work area -->
    <div v-else class="ld__work">
      <!-- File bar -->
      <div class="ld__file-bar">
        <div class="ld__file-bar-info">
          <Music2 :size="16" aria-hidden="true" />
          <span class="ld__file-name">{{ file.name }}</span>
          <span class="ld__file-size">{{ formatBytes(file.size) }}</span>
        </div>
        <button class="ld__action-btn" type="button" @click="reset">
          {{ t('tools.losslessDetect.changeFile') }}
        </button>
      </div>

      <!-- Analyzing -->
      <div v-if="phase === 'analyzing'" class="ld__progress-wrap">
        <div class="ld__progress-bar">
          <div class="ld__progress-fill" :style="{ width: progress + '%' }" />
        </div>
        <p class="ld__progress-label">{{ t('tools.losslessDetect.analyzing') }} {{ progress }}%</p>
      </div>

      <!-- Error -->
      <div v-else-if="phase === 'error'" class="ld__error">
        <AlertTriangle :size="18" aria-hidden="true" />
        <div>
          <p class="ld__error-title">{{ t('tools.losslessDetect.errorTitle') }}</p>
          <p class="ld__error-body">{{ t('tools.losslessDetect.errorBody') }}</p>
        </div>
      </div>

      <!-- Result -->
      <div v-else-if="phase === 'done' && result" class="ld__result">
        <!-- Verdict card -->
        <div class="ld__verdict" :class="`ld__verdict--${result.verdict}`">
          <component :is="verdictIcon" :size="28" class="ld__verdict-icon" aria-hidden="true" />
          <div class="ld__verdict-text">
            <p class="ld__verdict-title">{{ verdictLabel }}</p>
            <p class="ld__verdict-body">{{ verdictDetail }}</p>
          </div>
        </div>

        <!-- Details grid -->
        <div class="ld__details">
          <div class="ld__detail">
            <span class="ld__detail-label">{{ t('tools.losslessDetect.statSampleRate') }}</span>
            <span class="ld__detail-value">{{ formatSampleRate(result.sampleRate) }}</span>
          </div>
          <div class="ld__detail">
            <span class="ld__detail-label">{{ t('tools.losslessDetect.statDuration') }}</span>
            <span class="ld__detail-value">{{ formatDuration(result.duration) }}</span>
          </div>
          <div class="ld__detail">
            <span class="ld__detail-label">{{ t('tools.losslessDetect.statHighestFreq') }}</span>
            <span class="ld__detail-value">{{ formatHz(result.highestActiveHz) }}</span>
          </div>
          <div class="ld__detail">
            <span class="ld__detail-label">{{ t('tools.losslessDetect.statNyquist') }}</span>
            <span class="ld__detail-value">{{ formatHz(result.sampleRate / 2) }}</span>
          </div>
          <div v-if="result.cutoffHz" class="ld__detail">
            <span class="ld__detail-label">{{ t('tools.losslessDetect.statCutoff') }}</span>
            <span class="ld__detail-value ld__detail-value--warn">{{
              formatHz(result.cutoffHz)
            }}</span>
          </div>
        </div>

        <!-- Mini spectrum -->
        <div class="ld__canvas-wrap">
          <canvas ref="canvasEl" class="ld__canvas" :width="canvasW" :height="canvasH" />
        </div>

        <!-- Disclaimer -->
        <p class="ld__disclaimer">{{ t('tools.losslessDetect.disclaimer') }}</p>
      </div>
    </div>

    <template #guide>
      <div class="ld__guide">
        <template v-for="(section, idx) in toolGuide" :key="idx">
          <h3>{{ section.heading }}</h3>
          <p>{{ section.body }}</p>
        </template>
      </div>
    </template>
  </ToolPageLayout>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useHead } from '@unhead/vue'
import { Music2, ShieldCheck, ShieldAlert, ShieldX, AlertTriangle } from 'lucide-vue-next'
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
      getToolContent('lossless-detector', locale.value)?.metaTitle ||
      'Lossless Detector | OFPlayer',
  ),
  meta: [
    {
      name: 'description',
      content: computed(
        () => getToolContent('lossless-detector', locale.value)?.metaDescription || '',
      ),
    },
    { property: 'og:url', content: `${SITE_URL}/tools/audio/lossless-detector` },
  ],
})

const toolHero = computed(() => {
  const c = getToolContent('lossless-detector', locale.value)
  return { title: c?.h1 || 'Lossless Detector', description: c?.intro || '' }
})
const toolGuide = computed(
  () => getToolContent('lossless-detector', locale.value)?.guideSections || [],
)
const faq = computed(() => getToolContent('lossless-detector', locale.value)?.faq || [])
const relatedTools = computed(() =>
  getRelatedTools(['spectrum-viewer', 'audio-metadata-viewer', 'audio-converter']),
)

// ── State ─────────────────────────────────────────────────────────────────────
const file = ref(null)
const phase = ref('idle')
const progress = ref(0)
const result = ref(null)
const isDragging = ref(false)
const fileInput = ref(null)
const canvasEl = ref(null)
const canvasW = 800
const canvasH = 160

// ── Verdict UI ────────────────────────────────────────────────────────────────
const verdictIcon = computed(() => {
  const v = result.value?.verdict
  if (v === 'genuine') return ShieldCheck
  if (v === 'likely_genuine') return ShieldCheck
  if (v === 'suspicious') return ShieldAlert
  return ShieldX
})

const verdictLabel = computed(() => {
  const v = result.value?.verdict
  return t(`tools.losslessDetect.verdict_${v}`) || v
})

const verdictDetail = computed(() => {
  const v = result.value?.verdict
  const hz = result.value?.cutoffHz
  if (v === 'genuine') return t('tools.losslessDetect.verdictDetail_genuine')
  if (v === 'likely_genuine') return t('tools.losslessDetect.verdictDetail_likely_genuine')
  if (v === 'suspicious') {
    return t('tools.losslessDetect.verdictDetail_suspicious').replace('{hz}', formatHz(hz))
  }
  return t('tools.losslessDetect.verdictDetail_lossy').replace('{hz}', formatHz(hz))
})

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
  if (!hz) return '—'
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
    const spectrum = await analyzeSpectrum(f, {
      onProgress: (p) => {
        progress.value = p
      },
    })
    const cutoff = detectCutoff(spectrum.maxDb, spectrum.sampleRate)

    result.value = { ...spectrum, ...cutoff }
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
.ld__drop {
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
.ld__drop:hover,
.ld__drop--over {
  border-color: var(--of-player-accent);
  background: var(--of-player-soft);
}
.ld__drop-icon {
  color: var(--of-text-tertiary);
}
.ld__drop-label {
  font-size: 1rem;
  font-weight: 500;
  color: var(--of-text-primary);
  margin: 0;
}
.ld__drop-sub {
  font-size: 0.85rem;
  color: var(--of-text-secondary);
  margin: 0;
}
.ld__drop-hint {
  font-size: 0.78rem;
  color: var(--of-text-tertiary);
  margin: 0;
}
.ld__file-input {
  display: none;
}

.ld__work {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ld__file-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: var(--of-surface-raised);
  border-radius: 8px;
  border: 1px solid var(--of-neutral-100);
}
.ld__file-bar-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--of-text-secondary);
}
.ld__file-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--of-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ld__file-size {
  font-size: 0.78rem;
  color: var(--of-text-tertiary);
  white-space: nowrap;
}
.ld__action-btn {
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
.ld__action-btn:hover {
  border-color: var(--of-player-accent);
  color: var(--of-player-accent);
}

.ld__progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 0;
}
.ld__progress-bar {
  height: 4px;
  background: var(--of-neutral-100);
  border-radius: 2px;
  overflow: hidden;
}
.ld__progress-fill {
  height: 100%;
  background: var(--of-player-accent);
  border-radius: 2px;
  transition: width 0.2s;
}
.ld__progress-label {
  font-size: 0.83rem;
  color: var(--of-text-secondary);
  text-align: center;
}

.ld__error {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: var(--of-danger-soft);
  border: 1px solid var(--of-danger-border);
  border-radius: 8px;
  color: var(--of-danger);
}
.ld__error-title {
  font-weight: 600;
  font-size: 0.9rem;
  margin: 0 0 2px;
}
.ld__error-body {
  font-size: 0.83rem;
  margin: 0;
  opacity: 0.85;
}

.ld__result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ld__verdict {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 20px;
  border-radius: 10px;
  border: 1.5px solid;
}
.ld__verdict--genuine,
.ld__verdict--likely_genuine {
  background: var(--of-success-soft);
  border-color: var(--of-success-border);
  color: var(--of-success-active);
}
.ld__verdict--suspicious {
  background: var(--of-warning-soft);
  border-color: var(--of-warning-border);
  color: var(--of-warning-active);
}
.ld__verdict--lossy {
  background: var(--of-danger-soft);
  border-color: var(--of-danger-border);
  color: var(--of-danger);
}
.ld__verdict-icon {
  flex-shrink: 0;
  margin-top: 2px;
}
.ld__verdict-title {
  font-weight: 700;
  font-size: 1rem;
  margin: 0 0 4px;
}
.ld__verdict-body {
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
  opacity: 0.85;
}

.ld__details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}
.ld__detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 14px;
  background: var(--of-surface-raised);
  border-radius: 8px;
  border: 1px solid var(--of-neutral-100);
}
.ld__detail-label {
  font-size: 0.75rem;
  color: var(--of-text-tertiary);
}
.ld__detail-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--of-text-primary);
}
.ld__detail-value--warn {
  color: var(--of-danger);
}

.ld__canvas-wrap {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--of-neutral-100);
  background: var(--of-surface-raised);
}
.ld__canvas {
  display: block;
  width: 100%;
  height: auto;
}

.ld__disclaimer {
  font-size: 0.78rem;
  color: var(--of-text-tertiary);
  line-height: 1.5;
  margin: 0;
}

.ld__guide h3 {
  margin: 0 0 4px;
  font-size: 0.95rem;
}
.ld__guide p {
  margin: 0 0 16px;
  font-size: 0.875rem;
  color: var(--of-text-secondary);
  line-height: 1.6;
}
</style>
