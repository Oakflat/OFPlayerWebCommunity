<template>
  <ToolPageLayout
    tool-id="audio-converter"
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

    <!-- Drop zone -->
    <div
      v-if="!file"
      class="ac__drop"
      :class="{ 'ac__drop--over': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="triggerPicker"
    >
      <Music2 :size="40" class="ac__drop-icon" aria-hidden="true" />
      <p class="ac__drop-label">{{ t('tools.audioConv.dropLabel') }}</p>
      <p class="ac__drop-sub">{{ t('tools.audioConv.dropSub') }}</p>
      <p class="ac__drop-hint">{{ t('tools.audioConv.dropHint') }}</p>
      <input
        ref="fileInput"
        type="file"
        accept="audio/*,.flac,.ogg,.opus,.wma,.m4a,.aac,.wav,.mp3"
        class="ac__file-input"
        @change="onFileChange"
      />
    </div>

    <!-- Converter area -->
    <div v-else class="ac__work">
      <!-- File bar -->
      <div class="ac__file-bar">
        <div class="ac__file-bar-info">
          <Music2 :size="16" aria-hidden="true" />
          <span class="ac__file-name">{{ file.name }}</span>
          <span class="ac__file-size">{{ formatBytes(file.size) }}</span>
        </div>
        <button class="ac__action-btn" type="button" @click="resetFile">
          {{ t('tools.audioConv.changeFile') }}
        </button>
      </div>

      <!-- Options -->
      <div class="ac__options">
        <div class="ac__option">
          <label class="ac__option-label">{{ t('tools.audioConv.targetFormat') }}</label>
          <select v-model="targetFormat" class="ac__select" :disabled="isConverting">
            <option v-for="fmt in formatOptions" :key="fmt.value" :value="fmt.value">
              {{ fmt.label }}
            </option>
          </select>
        </div>
        <div v-show="!isLosslessTarget" class="ac__option">
          <label class="ac__option-label">{{ t('tools.audioConv.quality') }}</label>
          <select v-model="quality" class="ac__select" :disabled="isConverting">
            <option value="low">{{ t('tools.audioConv.qualityLow') }}</option>
            <option value="medium">{{ t('tools.audioConv.qualityMedium') }}</option>
            <option value="high">{{ t('tools.audioConv.qualityHigh') }}</option>
            <option value="lossless">{{ t('tools.audioConv.qualityLossless') }}</option>
          </select>
        </div>
      </div>

      <!-- Lossy warning -->
      <div v-if="showLossyWarning" class="ac__warning">
        <AlertTriangle :size="16" aria-hidden="true" />
        <span>{{ t('tools.audioConv.warningLossy') }}</span>
      </div>

      <!-- Convert button -->
      <button
        class="ac__convert-btn"
        :class="{ 'ac__convert-btn--loading': isConverting || isRuntimeLoading }"
        :disabled="isConverting || isRuntimeLoading"
        type="button"
        @click="doConvert"
      >
        <span v-if="isRuntimeLoading" class="ac__spinner" aria-hidden="true" />
        <span v-if="isRuntimeLoading">{{ t('tools.audioConv.loadingRuntime') }}</span>
        <span v-else-if="isConverting">{{ t('tools.audioConv.convertingBtn') }}</span>
        <span v-else>{{ t('tools.audioConv.convertBtn') }}</span>
      </button>

      <!-- Progress bar -->
      <div v-if="isConverting || isRuntimeLoading" class="ac__progress">
        <div class="ac__progress-bar" :style="{ width: `${progress}%` }" />
        <span class="ac__progress-text">{{ progress }}%</span>
      </div>

      <!-- Error -->
      <div v-if="error" class="ac__error">
        <AlertTriangle :size="18" aria-hidden="true" />
        <div>
          <p class="ac__error-title">{{ t('tools.audioConv.errorTitle') }}</p>
          <p class="ac__error-body">{{ error }}</p>
        </div>
      </div>

      <!-- Result -->
      <div v-if="result" class="ac__result">
        <p class="ac__result-label">{{ t('tools.audioConv.resultLabel') }}</p>
        <div class="ac__result-file">
          <Music2 :size="16" aria-hidden="true" />
          <span class="ac__result-name">{{ result.filename }}</span>
          <span class="ac__result-size">{{ formatBytes(result.fileSizeBytes) }}</span>
        </div>
        <button class="ac__download-btn" type="button" @click="downloadResult">
          <Download :size="16" aria-hidden="true" />
          {{ t('tools.audioConv.download') }}
        </button>
      </div>

      <!-- Toolkit callout -->
      <p class="ac__callout">{{ t('tools.audioConv.toolkitCallout') }}</p>
    </div>

    <!-- Guide slot -->
    <template #guide>
      <div class="ac__guide">
        <template v-for="(section, idx) in toolGuide" :key="section.heading">
          <h2 v-if="idx === 0">{{ section.heading }}</h2>
          <h3 v-else>{{ section.heading }}</h3>
          <p>{{ section.body }}</p>
        </template>
      </div>
    </template>
  </ToolPageLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useHead } from '@unhead/vue'
import { Music2, Download, AlertTriangle } from 'lucide-vue-next'
import ToolPageLayout from '../../../components/tools/ToolPageLayout.vue'
import ToolHero from '../../../components/tools/ToolHero.vue'
import { getRelatedTools } from '../../../tools/registry.js'
import { getToolContent } from '../../../tools/content/toolContentRegistry.js'
import { useI18n } from '../../../composables/useI18n.js'
import { useAudioConverter } from '../../../composables/useAudioConverter.js'
import {
  SUPPORTED_OUTPUT_FORMATS,
  FORMAT_DISPLAY_NAMES,
} from '../../../tools/audio/runtime/AudioConverterRuntime.js'

const { t, locale } = useI18n()
const {
  phase,
  progress,
  error,
  result,
  isConverting,
  isRuntimeLoading,
  initPreload,
  convert,
  downloadResult,
  dispose,
} = useAudioConverter()

const SITE_URL = ''

useHead({
  title: computed(
    () =>
      getToolContent('audio-converter', locale.value)?.metaTitle ||
      'Audio Format Converter | OFPlayer',
  ),
  meta: [
    {
      name: 'description',
      content: computed(
        () => getToolContent('audio-converter', locale.value)?.metaDescription || '',
      ),
    },
    { property: 'og:url', content: `${SITE_URL}/tools/audio/audio-converter` },
  ],
})

const toolHero = computed(() => {
  const c = getToolContent('audio-converter', locale.value)
  return { title: c?.h1 || 'Audio Format Converter', description: c?.intro || '' }
})
const toolGuide = computed(
  () => getToolContent('audio-converter', locale.value)?.guideSections || [],
)
const faq = computed(() => getToolContent('audio-converter', locale.value)?.faq || [])
const relatedTools = computed(() =>
  getRelatedTools(['audio-metadata-viewer', 'filename-normalizer']),
)

const file = ref(null)
const isDragging = ref(false)
const fileInput = ref(null)
const targetFormat = ref('mp3')
const quality = ref('medium')

const LOSSY_FORMATS = ['mp3', 'ogg', 'm4a', 'opus']
const LOSSLESS_FORMATS = ['flac', 'wav']

const isLosslessTarget = computed(() => LOSSLESS_FORMATS.includes(targetFormat.value))

const formatOptions = computed(() =>
  SUPPORTED_OUTPUT_FORMATS.map((fmt) => ({
    value: fmt,
    label: FORMAT_DISPLAY_NAMES[fmt] || fmt.toUpperCase(),
  })),
)

watch(targetFormat, (fmt) => {
  if (LOSSLESS_FORMATS.includes(fmt)) {
    quality.value = 'medium'
  }
})

const showLossyWarning = computed(() => {
  if (!file.value) return false
  const srcExt = file.value.name.split('.').pop().toLowerCase()
  if (LOSSY_FORMATS.includes(srcExt) && !LOSSY_FORMATS.includes(targetFormat.value)) return true
  return false
})

function formatBytes(bytes) {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

function triggerPicker() {
  fileInput.value?.click()
}

function onFileChange(e) {
  const f = e.target.files?.[0]
  if (f) file.value = f
}

function onDrop(e) {
  isDragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) file.value = f
}

function resetFile() {
  file.value = null
  if (fileInput.value) fileInput.value.value = ''
}

async function doConvert() {
  if (!file.value) return
  await convert(file.value, targetFormat.value, quality.value)
}

onMounted(() => {
  initPreload()
})

onUnmounted(() => {
  dispose()
})
</script>

<style scoped>
.ac__drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 220px;
  border: 2px dashed var(--of-border);
  border-radius: var(--of-radius-lg, 12px);
  background: var(--of-surface);
  cursor: pointer;
  padding: var(--space-8) var(--space-6);
  text-align: center;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast);
}
.ac__drop:hover,
.ac__drop--over {
  border-color: var(--of-brand);
  background: var(--of-brand-soft);
}
.ac__drop-icon {
  color: var(--of-ink-muted);
  margin-bottom: var(--space-2);
}
.ac__drop-label {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: 0;
}
.ac__drop-sub {
  font-size: var(--font-size-sm);
  color: var(--of-ink-muted);
  margin: 0;
}
.ac__drop-hint {
  font-size: var(--font-size-xs);
  color: var(--of-ink-subtle);
  margin: 0;
}
.ac__file-input {
  display: none;
}

.ac__work {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.ac__file-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--of-surface);
  border: 1px solid var(--of-border);
  border-radius: var(--of-radius-md, 8px);
  flex-wrap: wrap;
}
.ac__file-bar-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--of-ink-muted);
  min-width: 0;
}
.ac__file-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--of-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}
.ac__file-size {
  font-size: var(--font-size-xs);
  color: var(--of-ink-subtle);
  flex-shrink: 0;
}

.ac__action-btn {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--of-radius-sm, 6px);
  border: 1px solid var(--of-border);
  background: var(--of-surface);
  color: var(--of-ink-muted);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast);
}
.ac__action-btn:hover {
  color: var(--of-ink);
  border-color: var(--of-brand);
  background: var(--of-brand-soft);
}

.ac__options {
  display: flex;
  gap: var(--space-6);
  flex-wrap: wrap;
}
.ac__option {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.ac__option-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink-muted);
}
.ac__select {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--of-radius-sm, 6px);
  border: 1px solid var(--of-border);
  background: var(--of-surface);
  color: var(--of-ink);
  font-size: var(--font-size-sm);
  min-width: 160px;
  cursor: pointer;
}
.ac__select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ac__warning {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--of-radius-md, 8px);
  background: var(--of-tool-notice-warning-bg);
  border: 1px solid var(--of-tool-notice-warning-border);
  color: var(--of-tool-notice-warning-text);
  font-size: var(--font-size-sm);
}

.ac__convert-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--of-radius-md, 8px);
  border: none;
  background: var(--of-brand);
  color: var(--of-brand-contrast, #fff);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition:
    opacity var(--transition-fast),
    background var(--transition-fast);
  align-self: flex-start;
}
.ac__convert-btn:hover:not(:disabled) {
  background: var(--of-brand-hover);
}
.ac__convert-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ac__spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--of-brand-contrast, #fff);
  border-top-color: transparent;
  border-radius: 50%;
  animation: ac-spin var(--duration-lg, 0.7s) linear infinite;
  flex-shrink: 0;
}
@keyframes ac-spin {
  to {
    transform: rotate(360deg);
  }
}

.ac__progress {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 8px;
}
.ac__progress-bar {
  flex: 1;
  height: 100%;
  background: var(--of-brand);
  border-radius: var(--of-radius-sm, 4px);
  transition: width var(--transition-normal);
}
.ac__progress-text {
  font-size: var(--font-size-xs);
  color: var(--of-ink-muted);
  min-width: 36px;
  text-align: right;
}

.ac__error {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--of-radius-md, 8px);
  background: var(--of-tool-notice-error-bg);
  border: 1px solid var(--of-tool-notice-error-border);
  color: var(--of-tool-notice-error-text);
}
.ac__error-title {
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--space-1);
}
.ac__error-body {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--of-ink-muted);
}

.ac__result {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.ac__result-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink-muted);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  margin: 0;
}
.ac__result-file {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--of-ink-muted);
}
.ac__result-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--of-ink);
}
.ac__result-size {
  font-size: var(--font-size-xs);
  color: var(--of-ink-subtle);
}

.ac__download-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-5);
  border-radius: var(--of-radius-md, 8px);
  border: 1px solid var(--of-brand);
  background: var(--of-brand-soft);
  color: var(--of-brand);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
  align-self: flex-start;
}
.ac__download-btn:hover {
  background: var(--of-brand);
  color: var(--of-brand-contrast, #fff);
}

.ac__callout {
  font-size: var(--font-size-xs);
  color: var(--of-ink-subtle);
  margin: var(--space-2) 0 0;
  line-height: 1.6;
}

.ac__guide {
}
.ac__guide h2 {
  font-size: var(--font-size-lg);
  margin: 0 0 var(--space-3);
}
.ac__guide h3 {
  font-size: var(--font-size-md);
  margin: var(--space-5) 0 var(--space-2);
}
.ac__guide p {
  color: var(--of-ink-muted);
  line-height: 1.7;
  margin: 0 0 var(--space-3);
}
</style>
