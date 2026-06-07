<template>
  <ToolPageLayout
    tool-id="lrc-offset"
    processing-mode="local_text"
    :faq="faq"
    :related-tools="relatedTools"
  >
    <template #hero>
      <ToolHero
        :title="toolHero.title"
        :description="toolHero.description"
        category="lyrics"
        :category-label="t('tools.lyricsCategory')"
        :local-first="true"
      />
    </template>

    <!-- ── Tool interactive area ── -->
    <div class="lrc-offset">
      <div class="lrc-offset__inputs">
        <!-- LRC input -->
        <div class="lrc-offset__field">
          <div class="lrc-offset__field-header">
            <label class="lrc-offset__label" for="lrc-input">{{ t('tools.lrc.pasteLabel') }}</label>
            <div class="lrc-offset__field-actions">
              <button class="lrc-offset__action-btn" type="button" @click="loadExample">
                {{ t('tools.lrc.loadExample') }}
              </button>
              <button class="lrc-offset__action-btn" type="button" @click="clearInput">
                {{ t('tools.converter.clear') }}
              </button>
            </div>
          </div>
          <textarea
            id="lrc-input"
            v-model="lrcInput"
            class="lrc-offset__textarea"
            placeholder="[ar:Artist Name]&#10;[ti:Song Title]&#10;[00:12.34]First line of lyrics&#10;[00:15.60]Second line..."
            spellcheck="false"
          />
        </div>

        <!-- Offset controls -->
        <div class="lrc-offset__controls">
          <div class="lrc-offset__control-group">
            <label class="lrc-offset__label" for="offset-value">{{
              t('tools.lrc.offsetAmount')
            }}</label>
            <input
              id="offset-value"
              v-model.number="offsetValue"
              type="number"
              class="lrc-offset__number-input"
              step="0.1"
              placeholder="0"
            />
          </div>

          <div class="lrc-offset__control-group">
            <label class="lrc-offset__label">{{ t('tools.lrc.unit') }}</label>
            <div class="lrc-offset__radio-group">
              <label class="lrc-offset__radio">
                <input v-model="offsetUnit" type="radio" value="seconds" />
                <span>{{ t('tools.lrc.seconds') }}</span>
              </label>
              <label class="lrc-offset__radio">
                <input v-model="offsetUnit" type="radio" value="milliseconds" />
                <span>{{ t('tools.lrc.milliseconds') }}</span>
              </label>
            </div>
          </div>

          <div class="lrc-offset__control-group">
            <label class="lrc-offset__label">{{ t('tools.lrc.direction') }}</label>
            <div class="lrc-offset__radio-group">
              <label class="lrc-offset__radio">
                <input v-model="direction" type="radio" value="later" />
                <span>{{ t('tools.lrc.directionDelay') }}</span>
              </label>
              <label class="lrc-offset__radio">
                <input v-model="direction" type="radio" value="earlier" />
                <span>{{ t('tools.lrc.directionAdvance') }}</span>
              </label>
            </div>
          </div>

          <button
            class="lrc-offset__apply-btn"
            type="button"
            :disabled="!lrcInput.trim()"
            @click="applyOffset"
          >
            {{ t('tools.lrc.applyOffset') }}
          </button>
        </div>
      </div>

      <!-- Validation warnings -->
      <div v-if="validationIssues.length > 0" class="lrc-offset__issues">
        <p class="lrc-offset__issues-title">
          {{
            validationIssues.length === 1
              ? t('tools.lrc.issuesFoundInInput', { count: validationIssues.length })
              : t('tools.lrc.issuesPluralFoundInInput', { count: validationIssues.length })
          }}
        </p>
        <ul class="lrc-offset__issues-list">
          <li
            v-for="issue in validationIssues.slice(0, 5)"
            :key="issue.lineNumber + issue.type"
            class="lrc-offset__issue-item"
            :class="`lrc-offset__issue-item--${issue.severity}`"
          >
            {{ issue.message }}
          </li>
          <li v-if="validationIssues.length > 5" class="lrc-offset__issue-more">
            {{ t('tools.lrc.moreIssues', { count: validationIssues.length - 5 }) }}
          </li>
        </ul>
      </div>

      <!-- Error message -->
      <div v-if="errorMessage" class="lrc-offset__error">
        {{ errorMessage }}
      </div>

      <!-- Result -->
      <div v-if="resultLrc" class="lrc-offset__result">
        <div class="lrc-offset__result-header">
          <span class="lrc-offset__result-title">{{ t('tools.lrc.result') }}</span>
          <div class="lrc-offset__result-actions">
            <button
              class="lrc-offset__action-btn lrc-offset__action-btn--primary"
              type="button"
              @click="copyResult"
            >
              {{ copied ? t('tools.converter.copied') : t('tools.converter.copy') }}
            </button>
            <button
              class="lrc-offset__action-btn lrc-offset__action-btn--primary"
              type="button"
              @click="downloadResult"
            >
              {{ t('tools.lrc.downloadLrc') }}
            </button>
          </div>
        </div>
        <pre class="lrc-offset__result-content">{{ resultLrc }}</pre>
      </div>
    </div>

    <!-- Guide content -->
    <template #guide>
      <div class="lrc-offset__guide">
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
import { ref, computed, watch } from 'vue'
import { useHead } from '@unhead/vue'
import ToolPageLayout from '../../../components/tools/ToolPageLayout.vue'
import ToolHero from '../../../components/tools/ToolHero.vue'
import { offsetLrc, validateLrc } from '../../../tools/lyrics/lrc/lrcCore.js'
import { getRelatedTools } from '../../../tools/registry.js'
import { getToolContent } from '../../../tools/content/toolContentRegistry.js'
import { useI18n } from '../../../composables/useI18n.js'

const { t, locale } = useI18n()

const SITE_URL = ''

useHead({
  title: computed(
    () =>
      getToolContent('lrc-offset', locale.value)?.metaTitle ||
      'LRC Lyrics Offset Tool — Fix Out-of-Sync Lyrics | OFPlayer',
  ),
  meta: [
    {
      name: 'description',
      content: computed(
        () =>
          getToolContent('lrc-offset', locale.value)?.metaDescription ||
          'Shift all LRC timestamps forward or backward to fix lyrics that are out of sync. Works locally in your browser — no upload required.',
      ),
    },
    { property: 'og:url', content: `${SITE_URL}/tools/lyrics/lrc-offset` },
  ],
})

// ── State ──────────────────────────────────────────────────────────────────────

const lrcInput = ref('')
const offsetValue = ref(0)
const offsetUnit = ref('seconds')
const direction = ref('later')
const resultLrc = ref('')
const errorMessage = ref('')
const copied = ref(false)

const EXAMPLE_LRC = `[ar:Example Artist]
[ti:Example Song]
[al:Example Album]
[00:12.34]This is the first line
[00:15.60]This is the second line
[00:20.00]And the third line
[00:25.80]End of the example`

// ── Computed ───────────────────────────────────────────────────────────────────

const validationIssues = computed(() => {
  if (!lrcInput.value.trim()) return []
  return validateLrc(lrcInput.value)
})

const relatedTools = computed(() => getRelatedTools(['lrc-validator', 'lrc-to-srt']))

const toolHero = computed(() => {
  const content = getToolContent('lrc-offset', locale.value)
  return {
    title: content?.h1 || 'LRC Lyrics Offset Tool',
    description: content?.intro || '',
  }
})

const toolGuide = computed(() => {
  const content = getToolContent('lrc-offset', locale.value)
  return content?.guideSections || []
})

// ── Methods ────────────────────────────────────────────────────────────────────

function loadExample() {
  lrcInput.value = EXAMPLE_LRC
  resultLrc.value = ''
  errorMessage.value = ''
}

function clearInput() {
  lrcInput.value = ''
  resultLrc.value = ''
  errorMessage.value = ''
}

function applyOffset() {
  errorMessage.value = ''
  resultLrc.value = ''

  const input = lrcInput.value.trim()
  if (!input) {
    errorMessage.value = 'Please paste your LRC lyrics first.'
    return
  }

  const val = Number(offsetValue.value)
  if (Number.isNaN(val) || val < 0) {
    errorMessage.value = 'Please enter a valid positive offset amount.'
    return
  }

  let offsetMs = offsetUnit.value === 'seconds' ? val * 1000 : val
  if (direction.value === 'earlier') offsetMs = -offsetMs

  try {
    resultLrc.value = offsetLrc(input, offsetMs)
  } catch (err) {
    errorMessage.value = 'Could not process the LRC. Please check the input format.'
  }
}

async function copyResult() {
  if (!resultLrc.value) return
  try {
    await navigator.clipboard.writeText(resultLrc.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea')
    ta.value = resultLrc.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

function downloadResult() {
  if (!resultLrc.value) return
  const blob = new Blob([resultLrc.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'result.lrc'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── FAQ ────────────────────────────────────────────────────────────────────────

const faq = computed(() => {
  const content = getToolContent('lrc-offset', locale.value)
  return content?.faq || []
})
</script>

<style scoped>
.lrc-offset {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.lrc-offset__inputs {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.lrc-offset__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.lrc-offset__field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.lrc-offset__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--of-ink-soft);
}

.lrc-offset__field-actions {
  display: flex;
  gap: var(--space-2);
}

.lrc-offset__action-btn {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--of-radius-sm, 6px);
  border: 1px solid var(--of-border);
  background: var(--of-surface);
  color: var(--of-ink-muted);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    color var(--transition-fast);
}

.lrc-offset__action-btn:hover {
  border-color: var(--of-brand-border);
  color: var(--of-brand);
}

.lrc-offset__action-btn--primary {
  background: var(--of-brand-soft);
  color: var(--of-brand);
  border-color: var(--of-brand-border);
}

.lrc-offset__action-btn--primary:hover {
  background: var(--of-brand);
  color: var(--of-brand-contrast, #fff);
}

.lrc-offset__textarea {
  width: 100%;
  min-height: 220px;
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  color: var(--of-ink);
  background: var(--of-surface);
  border: 1px solid var(--of-border);
  border-radius: var(--of-radius-md, 8px);
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  transition: border-color var(--transition-fast);
}

.lrc-offset__textarea:focus {
  border-color: var(--of-brand-border);
}

.lrc-offset__controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--of-bg-soft);
  border: 1px solid var(--of-border);
  border-radius: var(--of-radius-md, 10px);
}

.lrc-offset__control-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.lrc-offset__number-input {
  width: 160px;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-md);
  border: 1px solid var(--of-border);
  border-radius: var(--of-radius-md, 8px);
  background: var(--of-surface);
  color: var(--of-ink);
  outline: none;
  transition: border-color var(--transition-fast);
}

.lrc-offset__number-input:focus {
  border-color: var(--of-brand-border);
}

.lrc-offset__radio-group {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.lrc-offset__radio {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--of-ink-soft);
  cursor: pointer;
}

.lrc-offset__radio input {
  accent-color: var(--of-brand);
}

.lrc-offset__apply-btn {
  align-self: flex-start;
  padding: var(--space-2) var(--space-6);
  background: var(--of-brand);
  color: var(--of-brand-contrast, #fff);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  border: none;
  border-radius: var(--of-radius-md, 8px);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.lrc-offset__apply-btn:hover:not(:disabled) {
  background: var(--of-brand-hover);
}

.lrc-offset__apply-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Issues */
.lrc-offset__issues {
  padding: var(--space-4);
  background: var(--of-warning-soft);
  border: 1px solid var(--of-warning-border);
  border-radius: var(--of-radius-md, 8px);
}

.lrc-offset__issues-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--of-warning-active);
  margin: 0 0 var(--space-2);
}

.lrc-offset__issues-list {
  margin: 0;
  padding: 0 0 0 var(--space-4);
}

.lrc-offset__issue-item {
  font-size: var(--font-size-xs);
  color: var(--of-ink-soft);
  margin-bottom: var(--space-1);
  font-family: var(--font-family-mono);
}

.lrc-offset__issue-more {
  font-size: var(--font-size-xs);
  color: var(--of-ink-muted);
  font-style: italic;
  list-style: none;
}

/* Error */
.lrc-offset__error {
  padding: var(--space-3) var(--space-4);
  background: var(--of-danger-soft);
  border: 1px solid var(--of-danger-border);
  border-radius: var(--of-radius-md, 8px);
  font-size: var(--font-size-sm);
  color: var(--of-danger-active);
}

/* Result */
.lrc-offset__result {
  border: 1px solid var(--of-border);
  border-radius: var(--of-radius-md, 10px);
  overflow: hidden;
  background: var(--of-surface);
}

.lrc-offset__result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--of-border);
  background: var(--of-bg-soft);
  gap: var(--space-2);
  flex-wrap: wrap;
}

.lrc-offset__result-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--of-ink-soft);
}

.lrc-offset__result-actions {
  display: flex;
  gap: var(--space-2);
}

.lrc-offset__result-content {
  padding: var(--space-4);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-relaxed);
  color: var(--of-ink);
  max-height: 320px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

/* Guide */
.lrc-offset__guide h2 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: 0 0 var(--space-4);
}

.lrc-offset__guide h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: var(--space-6) 0 var(--space-2);
}

.lrc-offset__guide ol {
  padding-left: var(--space-5);
  margin: 0 0 var(--space-4);
}

.lrc-offset__guide li {
  font-size: var(--font-size-base);
  color: var(--of-ink-soft);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--space-2);
}

.lrc-offset__guide p {
  font-size: var(--font-size-base);
  color: var(--of-ink-soft);
  line-height: var(--line-height-relaxed);
  margin: 0 0 var(--space-3);
}
</style>
