<template>
  <ToolPageLayout
    tool-id="filename-normalizer"
    processing-mode="local_binary"
    :faq="faq"
    :related-tools="relatedTools"
  >
    <template #hero>
      <ToolHero
        :title="toolHero.title"
        :description="toolHero.description"
        category="library"
        :category-label="t('tools.libraryCategory')"
        :local-first="true"
      />
    </template>

    <!-- Drop zone -->
    <div
      v-if="files.length === 0"
      class="fnm__drop"
      :class="{ 'fnm__drop--over': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="triggerPicker"
    >
      <FolderOpen :size="40" class="fnm__drop-icon" aria-hidden="true" />
      <p class="fnm__drop-label">{{ t('tools.filenameNorm.dropLabel') }}</p>
      <p class="fnm__drop-sub">{{ t('tools.filenameNorm.dropSub') }}</p>
      <p class="fnm__drop-hint">{{ t('tools.filenameNorm.dropHint') }}</p>
      <input
        ref="fileInput"
        type="file"
        accept="audio/*,.flac,.ogg,.opus,.wma,.m4a,.aac"
        multiple
        class="fnm__file-input"
        @change="onFileChange"
      />
    </div>

    <!-- Results area -->
    <div v-else class="fnm__workspace">
      <!-- Toolbar -->
      <div class="fnm__toolbar">
        <div class="fnm__template-wrap">
          <label class="fnm__template-label" for="fnm-template">{{
            t('tools.filenameNorm.templateLabel')
          }}</label>
          <input
            id="fnm-template"
            v-model="template"
            class="fnm__template-input"
            type="text"
            spellcheck="false"
            :placeholder="t('tools.filenameNorm.templateHint')"
          />
        </div>
        <label class="fnm__pad-label">
          <input v-model="padTrack" type="checkbox" class="fnm__pad-check" />
          {{ t('tools.filenameNorm.trackPad') }}
        </label>
        <div class="fnm__toolbar-actions">
          <button
            class="fnm__action-btn fnm__action-btn--primary"
            type="button"
            @click="downloadAll"
          >
            <Download :size="14" aria-hidden="true" />
            {{ t('tools.filenameNorm.downloadAll') }}
          </button>
          <button class="fnm__action-btn" type="button" @click="addMore">
            + {{ t('tools.filenameNorm.changeFiles') }}
          </button>
          <button class="fnm__action-btn" type="button" @click="clearAll">
            {{ t('tools.filenameNorm.clearAll') }}
          </button>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="audio/*,.flac,.ogg,.opus,.wma,.m4a,.aac"
          multiple
          class="fnm__file-input"
          @change="onAddFiles"
        />
      </div>

      <!-- Preview table -->
      <div class="fnm__table-wrap">
        <p v-if="items.length === 0" class="fnm__empty">{{ t('tools.filenameNorm.noFiles') }}</p>
        <table v-else class="fnm__table">
          <thead>
            <tr>
              <th>{{ t('tools.filenameNorm.colOriginal') }}</th>
              <th>{{ t('tools.filenameNorm.colNew') }}</th>
              <th>{{ t('tools.filenameNorm.colAction') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in items"
              :key="item.id"
              :class="{ 'fnm__row--parsing': item.parsing, 'fnm__row--error': item.error }"
            >
              <td class="fnm__col-orig">
                <span class="fnm__filename">{{ item.file.name }}</span>
                <span v-if="item.parsing" class="fnm__spinner" aria-hidden="true" />
              </td>
              <td class="fnm__col-new">
                <span v-if="item.error" class="fnm__error-cell">{{
                  t('tools.filenameNorm.errorFile')
                }}</span>
                <span v-else-if="item.parsing" class="fnm__muted">{{
                  t('tools.filenameNorm.parsing')
                }}</span>
                <span v-else class="fnm__new-name">{{ item.newName }}</span>
              </td>
              <td class="fnm__col-action">
                <button
                  v-if="!item.parsing && !item.error"
                  class="fnm__dl-btn"
                  type="button"
                  :title="t('tools.filenameNorm.downloadBtn')"
                  @click="downloadItem(item)"
                >
                  <Download :size="14" aria-hidden="true" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Guide slot -->
    <template #guide>
      <div class="fnm__guide">
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
import { ref, computed, watch, reactive } from 'vue'
import { useHead } from '@unhead/vue'
import { FolderOpen, Download } from 'lucide-vue-next'
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
      getToolContent('filename-normalizer', locale.value)?.metaTitle ||
      'Music Filename Normalizer | OFPlayer',
  ),
  meta: [
    {
      name: 'description',
      content: computed(
        () => getToolContent('filename-normalizer', locale.value)?.metaDescription || '',
      ),
    },
    { property: 'og:url', content: `${SITE_URL}/tools/library/filename-normalizer` },
  ],
})

// ── Content ───────────────────────────────────────────────────────────────────
const toolHero = computed(() => {
  const c = getToolContent('filename-normalizer', locale.value)
  return { title: c?.h1 || 'Music Filename Normalizer', description: c?.intro || '' }
})
const toolGuide = computed(
  () => getToolContent('filename-normalizer', locale.value)?.guideSections || [],
)
const faq = computed(() => getToolContent('filename-normalizer', locale.value)?.faq || [])
const relatedTools = computed(() => getRelatedTools(['audio-metadata-viewer', 'lrc-offset']))

// ── State ─────────────────────────────────────────────────────────────────────
const files = ref([]) // raw File objects
const items = ref([]) // { id, file, meta, newName, parsing, error }
const template = ref('{artist} - {title}')
const padTrack = ref(true)
const isDragging = ref(false)
const fileInput = ref(null)

let nextId = 0

// ── Template apply ────────────────────────────────────────────────────────────
function applyTemplate(meta, file) {
  const ext = file.name.slice(file.name.lastIndexOf('.')) || ''
  const c = meta?.common || {}

  function val(v, fallback = 'Unknown') {
    if (Array.isArray(v)) return v[0] || fallback
    return v || fallback
  }

  let track = c.track?.no ?? ''
  if (track && padTrack.value) track = String(track).padStart(2, '0')

  let disc = c.disk?.no ?? ''

  const map = {
    title: val(c.title),
    artist: val(c.artist),
    album: val(c.album, 'Unknown Album'),
    albumartist: val(c.albumartist, val(c.artist)),
    year: c.year ? String(c.year) : 'Unknown',
    track: track ? String(track) : '',
    disc: disc ? String(disc) : '',
    genre: val(Array.isArray(c.genre) ? c.genre[0] : c.genre, ''),
    ext: ext,
  }

  let name = template.value
  for (const [key, value] of Object.entries(map)) {
    name = name.replaceAll(`{${key}}`, value)
  }
  // Sanitize: remove or replace invalid filename characters
  // eslint-disable-next-line no-control-regex -- intentional: strip control chars from filenames
  name = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim()
  if (!name.endsWith(ext)) name += ext
  return name
}

// Recompute newName for all items when template or padTrack changes
watch([template, padTrack], () => {
  for (const item of items.value) {
    if (!item.parsing && !item.error && item.meta) {
      item.newName = applyTemplate(item.meta, item.file)
    }
  }
})

// ── File loading ──────────────────────────────────────────────────────────────
function triggerPicker() {
  fileInput.value?.click()
}
function addMore() {
  fileInput.value?.click()
}

function onDrop(e) {
  isDragging.value = false
  const dropped = Array.from(e.dataTransfer?.files || []).filter(
    (f) => f.type.startsWith('audio/') || /\.(flac|ogg|opus|wma|m4a|aac|mp3|wav)$/i.test(f.name),
  )
  addFiles(dropped)
}

function onFileChange(e) {
  const list = Array.from(e.target.files || [])
  files.value = list
  items.value = []
  addFiles(list)
  e.target.value = ''
}

function onAddFiles(e) {
  const list = Array.from(e.target.files || [])
  addFiles(list)
  e.target.value = ''
}

async function addFiles(list) {
  for (const f of list) {
    const id = ++nextId
    const item = reactive({ id, file: f, meta: null, newName: f.name, parsing: true, error: false })
    items.value.push(item)
    files.value = files.value.concat(f)

    try {
      const { parseBlob } = await import('music-metadata')
      const meta = await parseBlob(f, { duration: false, skipCovers: true })
      item.meta = meta
      item.newName = applyTemplate(meta, f)
    } catch {
      item.error = true
    } finally {
      item.parsing = false
    }
  }
}

function clearAll() {
  files.value = []
  items.value = []
}

// ── Download ──────────────────────────────────────────────────────────────────
function downloadItem(item) {
  const url = URL.createObjectURL(item.file)
  const a = document.createElement('a')
  a.href = url
  a.download = item.newName
  a.click()
  URL.revokeObjectURL(url)
}

async function downloadAll() {
  for (const item of items.value) {
    if (!item.parsing && !item.error) {
      downloadItem(item)
      await new Promise((r) => setTimeout(r, 150))
    }
  }
}
</script>

<style scoped>
.fnm__drop {
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
.fnm__drop:hover,
.fnm__drop--over {
  border-color: var(--of-brand);
  background: var(--of-brand-soft);
}
.fnm__drop-icon {
  color: var(--of-ink-muted);
  margin-bottom: var(--space-2);
}
.fnm__drop-label {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: 0;
}
.fnm__drop-sub {
  font-size: var(--font-size-sm);
  color: var(--of-ink-muted);
  margin: 0;
}
.fnm__drop-hint {
  font-size: var(--font-size-xs);
  color: var(--of-ink-subtle);
  margin: 0;
}
.fnm__file-input {
  display: none;
}

.fnm__workspace {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.fnm__toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
  padding: var(--space-3) var(--space-4);
  background: var(--of-surface);
  border: 1px solid var(--of-border);
  border-radius: var(--of-radius-md, 8px);
}

.fnm__template-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 200px;
}
.fnm__template-label {
  font-size: var(--font-size-xs);
  color: var(--of-ink-muted);
  white-space: nowrap;
  flex-shrink: 0;
}
.fnm__template-input {
  flex: 1;
  font-size: var(--font-size-sm);
  font-family: monospace;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--of-border);
  border-radius: var(--of-radius-sm, 6px);
  background: var(--of-base);
  color: var(--of-ink);
  outline: none;
  transition: border-color var(--transition-fast);
}
.fnm__template-input:focus {
  border-color: var(--of-brand);
}

.fnm__pad-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--of-ink-muted);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}
.fnm__pad-check {
  cursor: pointer;
}

.fnm__toolbar-actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.fnm__action-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
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
  white-space: nowrap;
}
.fnm__action-btn:hover {
  color: var(--of-ink);
  border-color: var(--of-brand);
  background: var(--of-brand-soft);
}
.fnm__action-btn--primary {
  background: var(--of-brand);
  color: var(--of-brand-contrast, #fff);
  border-color: var(--of-brand);
}
.fnm__action-btn--primary:hover {
  background: var(--of-brand-hover, var(--of-brand));
  filter: brightness(1.1);
}

.fnm__table-wrap {
  overflow-x: auto;
}
.fnm__empty {
  color: var(--of-ink-muted);
  font-size: var(--font-size-sm);
  text-align: center;
  padding: var(--space-6);
}

.fnm__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}
.fnm__table th {
  text-align: left;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink-muted);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--of-border);
}
.fnm__table td {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--of-border-subtle, rgba(0, 0, 0, 0.05));
  vertical-align: middle;
}
.fnm__table tr:last-child td {
  border-bottom: none;
}
.fnm__row--error td {
  opacity: 0.55;
}

.fnm__col-orig {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.fnm__filename {
  color: var(--of-ink-muted);
  word-break: break-all;
}
.fnm__new-name {
  color: var(--of-ink);
  font-weight: var(--font-weight-medium);
  word-break: break-all;
}
.fnm__muted {
  color: var(--of-ink-subtle);
  font-style: italic;
}
.fnm__error-cell {
  color: var(--of-tool-notice-error-text);
  font-size: var(--font-size-xs);
}

.fnm__spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid var(--of-border);
  border-top-color: var(--of-brand);
  border-radius: 50%;
  animation: fnm-spin var(--duration-lg, 0.7s) linear infinite;
  flex-shrink: 0;
}
@keyframes fnm-spin {
  to {
    transform: rotate(360deg);
  }
}

.fnm__col-action {
  width: 40px;
  text-align: center;
}
.fnm__dl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--of-radius-sm, 6px);
  border: 1px solid var(--of-border);
  background: var(--of-surface);
  color: var(--of-ink-muted);
  cursor: pointer;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast);
}
.fnm__dl-btn:hover {
  color: var(--of-ink);
  border-color: var(--of-brand);
  background: var(--of-brand-soft);
}

.fnm__guide {
}
.fnm__guide h2 {
  font-size: var(--font-size-lg);
  margin: 0 0 var(--space-3);
}
.fnm__guide h3 {
  font-size: var(--font-size-md);
  margin: var(--space-5) 0 var(--space-2);
}
.fnm__guide p {
  color: var(--of-ink-muted);
  line-height: 1.7;
  margin: 0 0 var(--space-3);
}
</style>
