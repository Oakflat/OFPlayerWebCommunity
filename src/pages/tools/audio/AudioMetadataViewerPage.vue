<template>
  <ToolPageLayout
    tool-id="audio-metadata-viewer"
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
      class="amv__drop"
      :class="{ 'amv__drop--over': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="triggerPicker"
    >
      <Music2 :size="40" class="amv__drop-icon" aria-hidden="true" />
      <p class="amv__drop-label">{{ t('tools.audioMeta.dropLabel') }}</p>
      <p class="amv__drop-sub">{{ t('tools.audioMeta.dropSub') }}</p>
      <p class="amv__drop-hint">{{ t('tools.audioMeta.dropHint') }}</p>
      <input
        ref="fileInput"
        type="file"
        accept="audio/*,.flac,.ogg,.opus,.wma,.m4a,.aac"
        class="amv__file-input"
        @change="onFileChange"
      />
    </div>

    <!-- Result area -->
    <div v-else class="amv__result">
      <!-- File bar -->
      <div class="amv__file-bar">
        <div class="amv__file-bar-info">
          <Music2 :size="16" aria-hidden="true" />
          <span class="amv__file-name">{{ file.name }}</span>
          <span class="amv__file-size">{{ formatBytes(file.size) }}</span>
        </div>
        <div class="amv__file-bar-actions">
          <button v-if="meta && !parsing" class="amv__action-btn" type="button" @click="copyJson">
            {{ copied ? t('tools.audioMeta.copiedJson') : t('tools.audioMeta.copyJson') }}
          </button>
          <button
            v-if="meta && !parsing"
            class="amv__action-btn"
            type="button"
            @click="downloadJson"
          >
            {{ t('tools.audioMeta.downloadJson') }}
          </button>
          <button class="amv__action-btn" type="button" @click="reset">
            {{ t('tools.audioMeta.changeFile') }}
          </button>
        </div>
      </div>

      <!-- Parsing state -->
      <div v-if="parsing" class="amv__parsing">
        <span class="amv__parsing-spinner" aria-hidden="true" />
        {{ t('tools.audioMeta.parsing') }}
      </div>

      <!-- Error state -->
      <div v-else-if="parseError" class="amv__error">
        <AlertTriangle :size="18" aria-hidden="true" />
        <div>
          <p class="amv__error-title">{{ t('tools.audioMeta.errorTitle') }}</p>
          <p class="amv__error-body">{{ t('tools.audioMeta.errorBody') }}</p>
        </div>
      </div>

      <!-- Metadata display -->
      <div v-else-if="meta" class="amv__sections">
        <!-- Artwork -->
        <section v-if="artworkUrl" class="amv__section amv__section--artwork">
          <h2 class="amv__section-title">{{ t('tools.audioMeta.sectionArtwork') }}</h2>
          <img :src="artworkUrl" class="amv__artwork" :alt="t('tools.audioMeta.sectionArtwork')" />
        </section>

        <!-- Basic info -->
        <section class="amv__section">
          <h2 class="amv__section-title">{{ t('tools.audioMeta.sectionBasic') }}</h2>
          <dl class="amv__fields">
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldTitle') }}</dt>
              <dd>{{ meta.common?.title || notSet }}</dd>
            </div>
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldArtist') }}</dt>
              <dd>{{ joinArr(meta.common?.artist) || notSet }}</dd>
            </div>
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldAlbumArtist') }}</dt>
              <dd>{{ joinArr(meta.common?.albumartist) || notSet }}</dd>
            </div>
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldAlbum') }}</dt>
              <dd>{{ meta.common?.album || notSet }}</dd>
            </div>
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldYear') }}</dt>
              <dd>{{ meta.common?.year || notSet }}</dd>
            </div>
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldTrack') }}</dt>
              <dd>{{ trackDisc(meta.common?.track) }}</dd>
            </div>
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldDisc') }}</dt>
              <dd>{{ trackDisc(meta.common?.disk) }}</dd>
            </div>
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldGenre') }}</dt>
              <dd>{{ joinArr(meta.common?.genre) || notSet }}</dd>
            </div>
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldComposer') }}</dt>
              <dd>{{ joinArr(meta.common?.composer) || notSet }}</dd>
            </div>
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldComment') }}</dt>
              <dd>{{ joinArr(meta.common?.comment) || notSet }}</dd>
            </div>
          </dl>
        </section>

        <!-- Format info -->
        <section class="amv__section">
          <h2 class="amv__section-title">{{ t('tools.audioMeta.sectionFormat') }}</h2>
          <dl class="amv__fields">
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldCodec') }}</dt>
              <dd>{{ meta.format?.codec || notSet }}</dd>
            </div>
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldContainer') }}</dt>
              <dd>{{ meta.format?.container || notSet }}</dd>
            </div>
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldDuration') }}</dt>
              <dd>{{ formatDuration(meta.format?.duration) }}</dd>
            </div>
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldBitrate') }}</dt>
              <dd>{{ formatBitrate(meta.format?.bitrate) }}</dd>
            </div>
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldSampleRate') }}</dt>
              <dd>{{ formatSampleRate(meta.format?.sampleRate) }}</dd>
            </div>
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldBitDepth') }}</dt>
              <dd>
                {{ meta.format?.bitsPerSample ? `${meta.format.bitsPerSample}-bit` : notSet }}
              </dd>
            </div>
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldChannels') }}</dt>
              <dd>{{ formatChannels(meta.format?.numberOfChannels) }}</dd>
            </div>
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldFileSize') }}</dt>
              <dd>{{ formatBytes(file.size) }}</dd>
            </div>
            <div class="amv__field">
              <dt>{{ t('tools.audioMeta.fieldFileName') }}</dt>
              <dd>{{ file.name }}</dd>
            </div>
          </dl>
        </section>

        <!-- All tags (native) -->
        <section v-if="nativeTags.length > 0" class="amv__section">
          <h2 class="amv__section-title">{{ t('tools.audioMeta.sectionTags') }}</h2>
          <dl class="amv__fields amv__fields--tags">
            <div v-for="tag in nativeTags" :key="tag.id" class="amv__field">
              <dt class="amv__tag-id">{{ tag.id }}</dt>
              <dd class="amv__tag-val">{{ String(tag.value) }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>

    <!-- Guide slot -->
    <template #guide>
      <div class="amv__guide">
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
import { ref, computed, onUnmounted } from 'vue'
import { useHead } from '@unhead/vue'
import { Music2, AlertTriangle } from 'lucide-vue-next'
import ToolPageLayout from '../../../components/tools/ToolPageLayout.vue'
import ToolHero from '../../../components/tools/ToolHero.vue'
import { getRelatedTools } from '../../../tools/registry.js'
import { getToolContent } from '../../../tools/content/toolContentRegistry.js'
import { useI18n } from '../../../composables/useI18n.js'

const { t, locale } = useI18n()

const SITE_URL = ''

useHead({
  title: computed(
    () =>
      getToolContent('audio-metadata-viewer', locale.value)?.metaTitle ||
      'Audio Metadata Viewer | OFPlayer',
  ),
  meta: [
    {
      name: 'description',
      content: computed(
        () => getToolContent('audio-metadata-viewer', locale.value)?.metaDescription || '',
      ),
    },
    { property: 'og:url', content: `${SITE_URL}/tools/audio/audio-metadata-viewer` },
  ],
})

// ── Content ───────────────────────────────────────────────────────────────────
const toolHero = computed(() => {
  const c = getToolContent('audio-metadata-viewer', locale.value)
  return { title: c?.h1 || 'Audio Metadata Viewer', description: c?.intro || '' }
})
const toolGuide = computed(
  () => getToolContent('audio-metadata-viewer', locale.value)?.guideSections || [],
)
const faq = computed(() => getToolContent('audio-metadata-viewer', locale.value)?.faq || [])
const relatedTools = computed(() => getRelatedTools(['filename-normalizer', 'lrc-offset']))

// ── State ─────────────────────────────────────────────────────────────────────
const file = ref(null)
const meta = ref(null)
const parseError = ref(false)
const parsing = ref(false)
const isDragging = ref(false)
const copied = ref(false)
const artworkUrl = ref(null)
const fileInput = ref(null)

const notSet = computed(() => t('tools.audioMeta.notSet'))

// ── Helpers ───────────────────────────────────────────────────────────────────
function joinArr(val) {
  if (!val) return ''
  if (Array.isArray(val)) return val.filter(Boolean).join(', ')
  return String(val)
}

function trackDisc(obj) {
  if (!obj) return notSet.value
  const { no, of } = obj
  if (!no) return notSet.value
  return of ? `${no} / ${of}` : String(no)
}

function formatDuration(secs) {
  if (!secs) return notSet.value
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatBitrate(bps) {
  if (!bps) return notSet.value
  return `${Math.round(bps / 1000)} kbps`
}

function formatSampleRate(hz) {
  if (!hz) return notSet.value
  return `${(hz / 1000).toFixed(hz % 1000 === 0 ? 0 : 1)} kHz`
}

function formatBytes(bytes) {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

function formatChannels(n) {
  if (!n) return notSet.value
  if (n === 1) return t('tools.audioMeta.channelsMono')
  if (n === 2) return t('tools.audioMeta.channelsStereo')
  return t('tools.audioMeta.channelsN').replace('{n}', n)
}

const nativeTags = computed(() => {
  if (!meta.value?.native) return []
  const entries = []
  for (const tags of Object.values(meta.value.native)) {
    for (const tag of tags) {
      if (typeof tag.value !== 'object' || tag.value === null) {
        entries.push(tag)
      }
    }
  }
  return entries
})

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
  meta.value = null
  parseError.value = false
  parsing.value = true

  // Revoke previous artwork
  if (artworkUrl.value) {
    URL.revokeObjectURL(artworkUrl.value)
    artworkUrl.value = null
  }

  try {
    const { parseBlob } = await import('music-metadata')
    const result = await parseBlob(f, { duration: true, skipCovers: false })
    meta.value = result

    // Extract artwork
    const pic = result.common?.picture?.[0]
    if (pic) {
      const blob = new Blob([pic.data], { type: pic.format })
      artworkUrl.value = URL.createObjectURL(blob)
    }
  } catch {
    parseError.value = true
  } finally {
    parsing.value = false
  }
}

function reset() {
  file.value = null
  meta.value = null
  parseError.value = false
  if (artworkUrl.value) {
    URL.revokeObjectURL(artworkUrl.value)
    artworkUrl.value = null
  }
  if (fileInput.value) fileInput.value.value = ''
}

// ── Export ────────────────────────────────────────────────────────────────────
function buildExportObj() {
  if (!meta.value) return {}
  const { common, format, native } = meta.value
  const nativeFlat = {}
  if (native) {
    for (const [type, tags] of Object.entries(native)) {
      nativeFlat[type] = tags.filter((t) => typeof t.value !== 'object' || t.value === null)
    }
  }
  return {
    file: file.value?.name,
    common,
    format: { ...format, trackInfo: undefined },
    native: nativeFlat,
  }
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(buildExportObj(), null, 2))
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    /* clipboard unavailable */
  }
}

function downloadJson() {
  const json = JSON.stringify(buildExportObj(), null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${file.value?.name || 'metadata'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

onUnmounted(() => {
  if (artworkUrl.value) URL.revokeObjectURL(artworkUrl.value)
})
</script>

<style scoped>
.amv__drop {
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
.amv__drop:hover,
.amv__drop--over {
  border-color: var(--of-brand);
  background: var(--of-brand-soft);
}
.amv__drop-icon {
  color: var(--of-ink-muted);
  margin-bottom: var(--space-2);
}
.amv__drop-label {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: 0;
}
.amv__drop-sub {
  font-size: var(--font-size-sm);
  color: var(--of-ink-muted);
  margin: 0;
}
.amv__drop-hint {
  font-size: var(--font-size-xs);
  color: var(--of-ink-subtle);
  margin: 0;
}
.amv__file-input {
  display: none;
}

.amv__result {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.amv__file-bar {
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
.amv__file-bar-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--of-ink-muted);
  min-width: 0;
}
.amv__file-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--of-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}
.amv__file-size {
  font-size: var(--font-size-xs);
  color: var(--of-ink-subtle);
  flex-shrink: 0;
}
.amv__file-bar-actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.amv__action-btn {
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
.amv__action-btn:hover {
  color: var(--of-ink);
  border-color: var(--of-brand);
  background: var(--of-brand-soft);
}

.amv__parsing {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  color: var(--of-ink-muted);
  font-size: var(--font-size-sm);
}
.amv__parsing-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--of-border);
  border-top-color: var(--of-brand);
  border-radius: 50%;
  animation: amv-spin var(--duration-lg, 0.7s) linear infinite;
  flex-shrink: 0;
}
@keyframes amv-spin {
  to {
    transform: rotate(360deg);
  }
}

.amv__error {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--of-radius-md, 8px);
  background: var(--of-tool-notice-error-bg);
  border: 1px solid var(--of-tool-notice-error-border);
  color: var(--of-tool-notice-error-text);
}
.amv__error-title {
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--space-1);
}
.amv__error-body {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--of-ink-muted);
}

.amv__sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.amv__section {
}
.amv__section-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink-muted);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  margin: 0 0 var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--of-border);
}

.amv__artwork {
  max-width: 200px;
  max-height: 200px;
  border-radius: var(--of-radius-md, 8px);
  display: block;
  border: 1px solid var(--of-border);
}

.amv__fields {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-1) var(--space-6);
}
.amv__fields--tags {
  grid-template-columns: 1fr;
}
.amv__field {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--of-border-subtle, rgba(0, 0, 0, 0.05));
  align-items: baseline;
}
.amv__field dt {
  font-size: var(--font-size-xs);
  color: var(--of-ink-muted);
  font-weight: var(--font-weight-medium);
}
.amv__field dd {
  font-size: var(--font-size-sm);
  color: var(--of-ink);
  margin: 0;
  word-break: break-word;
}
.amv__tag-id {
  font-family: monospace;
  font-size: var(--font-size-xs);
}
.amv__tag-val {
  font-size: var(--font-size-xs);
  color: var(--of-ink-muted);
}

.amv__guide {
}
.amv__guide h2 {
  font-size: var(--font-size-lg);
  margin: 0 0 var(--space-3);
}
.amv__guide h3 {
  font-size: var(--font-size-md);
  margin: var(--space-5) 0 var(--space-2);
}
.amv__guide p {
  color: var(--of-ink-muted);
  line-height: 1.7;
  margin: 0 0 var(--space-3);
}
</style>
