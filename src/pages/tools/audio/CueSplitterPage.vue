<template>
  <ToolPageLayout
    tool-id="cue-splitter"
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
        :requires-wasm="true"
      />
    </template>

    <div class="cs__work">
      <!-- Step 1: Load CUE + Audio -->
      <div class="cs__drop-row">
        <!-- CUE file drop -->
        <div
          class="cs__drop-zone"
          :class="{ 'cs__drop-zone--over': isDraggingCue, 'cs__drop-zone--loaded': cueFile }"
          @dragover.prevent="isDraggingCue = true"
          @dragleave.prevent="isDraggingCue = false"
          @drop.prevent="onDropCue"
          @click="triggerCuePicker"
        >
          <FileText :size="28" class="cs__drop-icon" aria-hidden="true" />
          <span v-if="!cueFile" class="cs__drop-label">{{ t('tools.cueSplit.dropCue') }}</span>
          <span v-else class="cs__drop-label cs__drop-label--loaded">{{ cueFile.name }}</span>
          <input
            ref="cueInput"
            type="file"
            accept=".cue,text/plain"
            class="cs__file-input"
            @change="onCueChange"
          />
        </div>

        <!-- Audio file drop -->
        <div
          class="cs__drop-zone"
          :class="{ 'cs__drop-zone--over': isDraggingAudio, 'cs__drop-zone--loaded': audioFile }"
          @dragover.prevent="isDraggingAudio = true"
          @dragleave.prevent="isDraggingAudio = false"
          @drop.prevent="onDropAudio"
          @click="triggerAudioPicker"
        >
          <Music2 :size="28" class="cs__drop-icon" aria-hidden="true" />
          <span v-if="!audioFile" class="cs__drop-label">{{ t('tools.cueSplit.dropAudio') }}</span>
          <span v-else class="cs__drop-label cs__drop-label--loaded">{{ audioFile.name }}</span>
          <input
            ref="audioInput"
            type="file"
            accept="audio/*,.flac,.wav,.ape,.m4a,.mp3"
            class="cs__file-input"
            @change="onAudioChange"
          />
        </div>
      </div>

      <!-- CUE parse error -->
      <div v-if="parseError" class="cs__error">
        <AlertTriangle :size="16" aria-hidden="true" />
        {{ t('tools.cueSplit.parseError') }}
      </div>

      <!-- Format mismatch warning -->
      <div v-if="audioFile && sheet && formatMismatch && !isSplitting" class="cs__warn">
        <AlertTriangle :size="16" aria-hidden="true" />
        {{ t('tools.cueSplit.formatMismatchWarning') }}
      </div>

      <!-- Album info + track list -->
      <div v-if="sheet && !parseError" class="cs__sheet">
        <div class="cs__album-info">
          <span v-if="sheet.title" class="cs__album-title">{{ sheet.title }}</span>
          <span v-if="sheet.performer" class="cs__album-performer">{{ sheet.performer }}</span>
          <span class="cs__track-count"
            >{{ sheet.tracks.length }} {{ t('tools.cueSplit.tracks') }}</span
          >
        </div>

        <!-- Output format -->
        <div class="cs__format-row">
          <label class="cs__format-label">{{ t('tools.cueSplit.outputFormat') }}</label>
          <select v-model="outputFormat" class="cs__select" :disabled="isSplitting">
            <option value="flac">FLAC</option>
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
            <option value="m4a">M4A (AAC)</option>
          </select>
        </div>

        <!-- Track list -->
        <div class="cs__track-list">
          <div
            v-for="(track, idx) in sheet.tracks"
            :key="track.number"
            class="cs__track"
            :class="{
              'cs__track--done': trackStates[idx]?.done,
              'cs__track--error': trackStates[idx]?.error,
            }"
          >
            <span class="cs__track-num">{{ String(track.number).padStart(2, '0') }}</span>
            <div class="cs__track-info">
              <span class="cs__track-title">{{
                track.title || t('tools.cueSplit.unknownTitle')
              }}</span>
              <span class="cs__track-time">{{ secToHuman(track.startSec) }}</span>
            </div>
            <span v-if="trackStates[idx]?.done" class="cs__track-status cs__track-status--done">
              <CheckCircle :size="14" aria-hidden="true" />
              <button class="cs__dl-btn" @click="downloadTrack(idx)">
                {{ t('tools.cueSplit.download') }}
              </button>
            </span>
            <span
              v-else-if="trackStates[idx]?.splitting"
              class="cs__track-status cs__track-status--splitting"
            >
              <span class="cs__spinner" aria-hidden="true" />
            </span>
            <span
              v-else-if="trackStates[idx]?.error"
              class="cs__track-status cs__track-status--error"
            >
              <AlertTriangle :size="14" aria-hidden="true" />
            </span>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="cs__actions">
          <button
            class="cs__btn cs__btn--primary"
            :disabled="!audioFile || isSplitting || runtimeError"
            @click="splitAll"
          >
            <span v-if="isSplitting" class="cs__spinner cs__spinner--sm" aria-hidden="true" />
            {{ isSplitting ? t('tools.cueSplit.splitting') : t('tools.cueSplit.splitAll') }}
          </button>
          <button
            v-if="anyDone"
            class="cs__btn cs__btn--secondary"
            :disabled="isSplitting"
            @click="downloadAllDone"
          >
            {{ t('tools.cueSplit.downloadAll') }}
          </button>
          <button class="cs__btn cs__btn--ghost" @click="resetAll">
            {{ t('tools.cueSplit.reset') }}
          </button>
        </div>

        <!-- Runtime status -->
        <div
          v-if="runtimeMessage"
          class="cs__runtime-msg"
          :class="{ 'cs__runtime-msg--error': runtimeError }"
        >
          {{ runtimeMessage }}
        </div>
      </div>

      <!-- Disclaimer -->
      <p class="cs__disclaimer">{{ t('tools.cueSplit.disclaimer') }}</p>
    </div>

    <template #guide>
      <div class="cs__guide">
        <template v-for="(section, idx) in toolGuide" :key="idx">
          <h3>{{ section.heading }}</h3>
          <p>{{ section.body }}</p>
        </template>
      </div>
    </template>
  </ToolPageLayout>
</template>

<script setup>
import { ref, computed, reactive, onUnmounted } from 'vue'
import { useHead } from '@unhead/vue'
import { Music2, FileText, AlertTriangle, CheckCircle } from 'lucide-vue-next'
import ToolPageLayout from '../../../components/tools/ToolPageLayout.vue'
import ToolHero from '../../../components/tools/ToolHero.vue'
import { getRelatedTools } from '../../../tools/registry.js'
import { getToolContent } from '../../../tools/content/toolContentRegistry.js'
import { useI18n } from '../../../composables/useI18n.js'
import { parseCueSheet, secToHuman, secToFfmpegTime } from '../../../tools/audio/cueParser.js'
import { BrowserFfmpegRuntime } from '../../../tools/audio/runtime/browserFfmpegRuntime.js'
import { RUNTIME_STATUS } from '../../../tools/audio/runtime/AudioConverterRuntime.js'

const { t, locale } = useI18n()
const SITE_URL = ''

useHead({
  title: computed(
    () => getToolContent('cue-splitter', locale.value)?.metaTitle || 'CUE Splitter | OFPlayer',
  ),
  meta: [
    {
      name: 'description',
      content: computed(() => getToolContent('cue-splitter', locale.value)?.metaDescription || ''),
    },
    { property: 'og:url', content: `${SITE_URL}/tools/audio/cue-splitter` },
  ],
})

const toolHero = computed(() => {
  const c = getToolContent('cue-splitter', locale.value)
  return { title: c?.h1 || 'CUE Splitter', description: c?.intro || '' }
})
const toolGuide = computed(() => getToolContent('cue-splitter', locale.value)?.guideSections || [])
const faq = computed(() => getToolContent('cue-splitter', locale.value)?.faq || [])
const relatedTools = computed(() =>
  getRelatedTools(['audio-converter', 'audio-metadata-viewer', 'filename-normalizer']),
)

// ── State ─────────────────────────────────────────────────────────────────────
const cueFile = ref(null)
const audioFile = ref(null)
const sheet = ref(null)
const parseError = ref(false)
const isDraggingCue = ref(false)
const isDraggingAudio = ref(false)
const cueInput = ref(null)
const audioInput = ref(null)
const outputFormat = ref('flac')

const isSplitting = ref(false)
const runtimeMessage = ref('')
const runtimeError = ref(false)

// Per-track state: { splitting, done, error, blob, filename }
const trackStates = ref([])
// Blobs store for downloading
const trackBlobs = []

const anyDone = computed(() => trackStates.value.some((s) => s?.done))

const sourceExt = computed(() => {
  if (!audioFile.value) return null
  return audioFile.value.name.split('.').pop().toLowerCase()
})

const formatMismatch = computed(() => {
  if (!audioFile.value || !outputFormat.value) return false
  return sourceExt.value !== outputFormat.value
})

// ── FFmpeg runtime ─────────────────────────────────────────────────────────────
const runtime = new BrowserFfmpegRuntime()

onUnmounted(() => runtime.dispose())

// ── Helpers ───────────────────────────────────────────────────────────────────
function triggerCuePicker() {
  cueInput.value?.click()
}
function triggerAudioPicker() {
  audioInput.value?.click()
}

function onCueChange(e) {
  const f = e.target.files?.[0]
  if (f) loadCue(f)
}
function onAudioChange(e) {
  const f = e.target.files?.[0]
  if (f) audioFile.value = f
}
function onDropCue(e) {
  isDraggingCue.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) loadCue(f)
}
function onDropAudio(e) {
  isDraggingAudio.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) audioFile.value = f
}

async function loadCue(f) {
  cueFile.value = f
  parseError.value = false
  sheet.value = null
  trackStates.value = []

  try {
    const text = await f.text()
    const parsed = parseCueSheet(text)
    if (parsed.tracks.length === 0) throw new Error('No tracks found')
    sheet.value = parsed
    trackStates.value = parsed.tracks.map(() => ({ splitting: false, done: false, error: false }))
  } catch {
    parseError.value = true
  }
}

async function splitAll() {
  if (!audioFile.value || !sheet.value || isSplitting.value) return

  isSplitting.value = true
  runtimeError.value = false
  runtimeMessage.value = t('tools.cueSplit.loadingRuntime')

  try {
    await runtime.load((p) => {
      runtimeMessage.value = p.message || ''
    })
  } catch {
    runtimeMessage.value = t('tools.cueSplit.runtimeError')
    runtimeError.value = true
    isSplitting.value = false
    return
  }

  runtimeMessage.value = ''
  const tracks = sheet.value.tracks

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i]
    const nextTrack = tracks[i + 1]

    const startSec = track.startSec
    const durationSec = nextTrack ? nextTrack.startSec - startSec : null

    trackStates.value[i] = { splitting: true, done: false, error: false }

    try {
      const { blob, filename } = await runtime.splitTrack(
        audioFile.value,
        startSec,
        durationSec,
        outputFormat.value,
      )
      // Build a meaningful filename
      const trackNum = String(track.number).padStart(2, '0')
      const safeTitle = (track.title || `Track ${trackNum}`).replace(/[^\w\s-]/g, '').trim()
      const ext = outputFormat.value
      const outName = `${trackNum}. ${safeTitle}.${ext}`

      trackBlobs[i] = { blob, filename: outName }
      trackStates.value[i] = { splitting: false, done: true, error: false }
    } catch {
      trackStates.value[i] = { splitting: false, done: false, error: true }
    }
  }

  isSplitting.value = false
}

function downloadTrack(idx) {
  const entry = trackBlobs[idx]
  if (!entry) return
  const url = URL.createObjectURL(entry.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = entry.filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

function downloadAllDone() {
  trackStates.value.forEach((s, i) => {
    if (s?.done) downloadTrack(i)
  })
}

function resetAll() {
  cueFile.value = null
  audioFile.value = null
  sheet.value = null
  parseError.value = false
  trackStates.value = []
  trackBlobs.length = 0
  runtimeMessage.value = ''
  runtimeError.value = false
  if (cueInput.value) cueInput.value.value = ''
  if (audioInput.value) audioInput.value.value = ''
}
</script>

<style scoped>
.cs__work {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cs__drop-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 540px) {
  .cs__drop-row {
    grid-template-columns: 1fr;
  }
}

.cs__drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 120px;
  border: 2px dashed var(--of-neutral-200);
  border-radius: 10px;
  cursor: pointer;
  padding: 20px 16px;
  text-align: center;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.cs__drop-zone:hover,
.cs__drop-zone--over {
  border-color: var(--of-player-accent);
  background: var(--of-player-soft);
}
.cs__drop-zone--loaded {
  border-style: solid;
  border-color: var(--of-player-accent);
  background: var(--of-player-soft);
}
.cs__drop-icon {
  color: var(--of-text-tertiary);
}
.cs__drop-label {
  font-size: 0.875rem;
  color: var(--of-text-secondary);
}
.cs__drop-label--loaded {
  color: var(--of-player-accent);
  font-weight: 500;
  word-break: break-all;
}
.cs__file-input {
  display: none;
}

.cs__error {
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

.cs__warn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--of-warning-soft);
  border: 1px solid var(--of-warning-border);
  border-radius: 8px;
  color: var(--of-warning-active);
  font-size: 0.875rem;
}

.cs__sheet {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cs__album-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.cs__album-title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--of-text-primary);
}
.cs__album-performer {
  font-size: 0.875rem;
  color: var(--of-text-secondary);
}
.cs__track-count {
  font-size: 0.78rem;
  color: var(--of-text-tertiary);
  margin-left: auto;
}

.cs__format-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cs__format-label {
  font-size: 0.875rem;
  color: var(--of-text-secondary);
  white-space: nowrap;
}
.cs__select {
  padding: 6px 10px;
  border: 1px solid var(--of-neutral-200);
  border-radius: 6px;
  background: var(--of-surface);
  font-size: 0.875rem;
  color: var(--of-text-primary);
  cursor: pointer;
}
.cs__select:disabled {
  opacity: 0.5;
  cursor: default;
}

.cs__track-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--of-neutral-100);
  border-radius: 10px;
  overflow: hidden;
}
.cs__track {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--of-neutral-100);
  background: var(--of-surface);
  transition: background 0.12s;
}
.cs__track:last-child {
  border-bottom: none;
}
.cs__track--done {
  background: var(--of-success-soft);
}
.cs__track--error {
  background: var(--of-danger-soft);
}

.cs__track-num {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--of-text-tertiary);
  font-variant-numeric: tabular-nums;
  min-width: 24px;
}
.cs__track-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}
.cs__track-title {
  font-size: 0.875rem;
  color: var(--of-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cs__track-time {
  font-size: 0.75rem;
  color: var(--of-text-tertiary);
  font-variant-numeric: tabular-nums;
}

.cs__track-status {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.cs__track-status--done {
  color: var(--of-success);
}
.cs__track-status--error {
  color: var(--of-danger);
}
.cs__track-status--splitting {
  color: var(--of-player-accent);
}

.cs__dl-btn {
  padding: 3px 10px;
  border: 1px solid var(--of-success-border);
  border-radius: 4px;
  background: transparent;
  font-size: 0.78rem;
  color: var(--of-success);
  cursor: pointer;
}
.cs__dl-btn:hover {
  background: var(--of-success-soft);
}

.cs__spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--of-neutral-200);
  border-top-color: var(--of-player-accent);
  border-radius: 50%;
  animation: cs-spin 0.7s linear infinite;
}
.cs__spinner--sm {
  width: 12px;
  height: 12px;
  border-width: 2px;
}
@keyframes cs-spin {
  to {
    transform: rotate(360deg);
  }
}

.cs__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.cs__btn {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition:
    opacity 0.15s,
    background 0.15s;
}
.cs__btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.cs__btn--primary {
  background: var(--of-player-accent);
  color: #fff;
  border: none;
}
.cs__btn--primary:not(:disabled):hover {
  opacity: 0.85;
}
.cs__btn--secondary {
  background: transparent;
  border: 1px solid var(--of-player-accent);
  color: var(--of-player-accent);
}
.cs__btn--secondary:hover {
  background: var(--of-player-soft);
}
.cs__btn--ghost {
  background: transparent;
  border: 1px solid var(--of-neutral-200);
  color: var(--of-text-secondary);
}
.cs__btn--ghost:hover {
  border-color: var(--of-neutral-300);
}

.cs__runtime-msg {
  font-size: 0.83rem;
  color: var(--of-text-secondary);
  padding: 8px 12px;
  background: var(--of-surface-raised);
  border-radius: 6px;
}
.cs__runtime-msg--error {
  color: var(--of-danger);
  background: var(--of-danger-soft);
}

.cs__disclaimer {
  font-size: 0.78rem;
  color: var(--of-text-tertiary);
  line-height: 1.5;
  margin: 0;
}

.cs__guide h3 {
  margin: 0 0 4px;
  font-size: 0.95rem;
}
.cs__guide p {
  margin: 0 0 16px;
  font-size: 0.875rem;
  color: var(--of-text-secondary);
  line-height: 1.6;
}
</style>
