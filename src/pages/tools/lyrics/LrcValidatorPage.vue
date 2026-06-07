<template>
  <ToolPageLayout
    tool-id="lrc-validator"
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
    <div class="lrc-validator">
      <div class="lrc-validator__input-area">
        <div class="lrc-validator__field-header">
          <label class="lrc-validator__label" for="lrc-input">{{
            t('tools.lrc.pasteLabel')
          }}</label>
          <div class="lrc-validator__header-actions">
            <button class="lrc-validator__action-btn" type="button" @click="loadExample">
              {{ t('tools.lrc.loadExample') }}
            </button>
            <button class="lrc-validator__action-btn" type="button" @click="clearInput">
              {{ t('tools.converter.clear') }}
            </button>
          </div>
        </div>
        <textarea
          id="lrc-input"
          v-model="lrcInput"
          class="lrc-validator__textarea"
          placeholder="[ar:Artist Name]&#10;[ti:Song Title]&#10;[00:12.34]First line of lyrics&#10;[00:15.60]Second line..."
          spellcheck="false"
        />
        <button
          class="lrc-validator__validate-btn"
          type="button"
          :disabled="!lrcInput.trim()"
          @click="validate"
        >
          {{ t('tools.lrc.validate') }}
        </button>
      </div>

      <!-- Results -->
      <div v-if="hasValidated" class="lrc-validator__results">
        <!-- Stats -->
        <div class="lrc-validator__stats">
          <div class="lrc-validator__stat">
            <span class="lrc-validator__stat-value">{{ stats.totalLines }}</span>
            <span class="lrc-validator__stat-label">{{ t('tools.lrc.statTotalLines') }}</span>
          </div>
          <div class="lrc-validator__stat">
            <span class="lrc-validator__stat-value">{{ stats.timedLines }}</span>
            <span class="lrc-validator__stat-label">{{ t('tools.lrc.statTimedLines') }}</span>
          </div>
          <div class="lrc-validator__stat">
            <span class="lrc-validator__stat-value">{{ stats.metadataCount }}</span>
            <span class="lrc-validator__stat-label">{{ t('tools.lrc.statMetadataTags') }}</span>
          </div>
          <div class="lrc-validator__stat lrc-validator__stat--error">
            <span class="lrc-validator__stat-value">{{ stats.errorCount }}</span>
            <span class="lrc-validator__stat-label">{{ t('tools.lrc.statErrors') }}</span>
          </div>
          <div class="lrc-validator__stat lrc-validator__stat--warning">
            <span class="lrc-validator__stat-value">{{ stats.warningCount }}</span>
            <span class="lrc-validator__stat-label">{{ t('tools.lrc.statWarnings') }}</span>
          </div>
        </div>

        <!-- Overall status -->
        <div
          class="lrc-validator__status"
          :class="
            stats.errorCount === 0 && stats.warningCount === 0
              ? 'lrc-validator__status--ok'
              : stats.errorCount > 0
                ? 'lrc-validator__status--error'
                : 'lrc-validator__status--warning'
          "
        >
          <span v-if="stats.errorCount === 0 && stats.warningCount === 0">
            {{ t('tools.lrc.statusOk') }}
          </span>
          <span v-else-if="stats.errorCount > 0 && stats.warningCount > 0">
            {{
              t('tools.lrc.statusErrorsWithWarnings', {
                errors: stats.errorCount,
                warnings: stats.warningCount,
              })
            }}
          </span>
          <span v-else-if="stats.errorCount > 0">
            {{ t('tools.lrc.statusErrors', { errors: stats.errorCount }) }}
          </span>
          <span v-else>
            {{ t('tools.lrc.statusWarnings', { count: stats.warningCount }) }}
          </span>
        </div>

        <!-- Issue list -->
        <div v-if="issues.length > 0" class="lrc-validator__issue-list">
          <div v-if="errorIssues.length > 0" class="lrc-validator__issue-group">
            <h3 class="lrc-validator__issue-group-title lrc-validator__issue-group-title--error">
              {{ t('tools.lrc.errorsGroup', { count: errorIssues.length }) }}
            </h3>
            <ul class="lrc-validator__issue-items">
              <li
                v-for="issue in errorIssues"
                :key="issue.lineNumber + issue.type"
                class="lrc-validator__issue lrc-validator__issue--error"
              >
                <span class="lrc-validator__issue-badge">{{
                  t('tools.lrc.lineN', { n: issue.lineNumber })
                }}</span>
                <span class="lrc-validator__issue-msg">{{ issue.message }}</span>
              </li>
            </ul>
          </div>

          <div v-if="warningIssues.length > 0" class="lrc-validator__issue-group">
            <h3 class="lrc-validator__issue-group-title lrc-validator__issue-group-title--warning">
              {{ t('tools.lrc.warningsGroup', { count: warningIssues.length }) }}
            </h3>
            <ul class="lrc-validator__issue-items">
              <li
                v-for="issue in warningIssues"
                :key="issue.lineNumber + issue.type"
                class="lrc-validator__issue lrc-validator__issue--warning"
              >
                <span class="lrc-validator__issue-badge">{{
                  t('tools.lrc.lineN', { n: issue.lineNumber })
                }}</span>
                <span class="lrc-validator__issue-msg">{{ issue.message }}</span>
              </li>
            </ul>
          </div>

          <div v-if="infoIssues.length > 0" class="lrc-validator__issue-group">
            <h3 class="lrc-validator__issue-group-title">
              {{ t('tools.lrc.infoGroup', { count: infoIssues.length }) }}
            </h3>
            <ul class="lrc-validator__issue-items">
              <li
                v-for="issue in infoIssues"
                :key="issue.lineNumber + issue.type"
                class="lrc-validator__issue lrc-validator__issue--info"
              >
                <span class="lrc-validator__issue-badge">{{
                  t('tools.lrc.lineN', { n: issue.lineNumber })
                }}</span>
                <span class="lrc-validator__issue-msg">{{ issue.message }}</span>
              </li>
            </ul>
          </div>

          <!-- Copy fix suggestions -->
          <div class="lrc-validator__suggestions">
            <p class="lrc-validator__suggestions-title">{{ t('tools.lrc.fixSuggestions') }}</p>
            <pre class="lrc-validator__suggestions-content">{{ fixSuggestions }}</pre>
            <button
              class="lrc-validator__action-btn lrc-validator__action-btn--primary"
              type="button"
              @click="copySuggestions"
            >
              {{
                copiedSuggestions
                  ? t('tools.lrc.copiedSuggestions')
                  : t('tools.lrc.copySuggestions')
              }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <template #guide>
      <div class="lrc-validator__guide">
        <template v-for="(section, idx) in toolGuide" :key="section.heading">
          <h2 v-if="idx === 0">{{ section.heading }}</h2>
          <h3 v-else>{{ section.heading }}</h3>
          <p>{{ section.body }}</p>
        </template>
        <pre class="lrc-validator__code">
[ar:Artist Name]
[ti:Song Title]
[al:Album Name]
[00:12.34]First lyric line
[00:15.60]Second lyric line</pre
        >
      </div>
    </template>
  </ToolPageLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useHead } from '@unhead/vue'
import ToolPageLayout from '../../../components/tools/ToolPageLayout.vue'
import ToolHero from '../../../components/tools/ToolHero.vue'
import { parseLrc } from '../../../tools/lyrics/lrc/lrcCore.js'
import { getRelatedTools } from '../../../tools/registry.js'
import { getToolContent } from '../../../tools/content/toolContentRegistry.js'
import { useI18n } from '../../../composables/useI18n.js'

const { t, locale } = useI18n()

const SITE_URL = ''

useHead({
  title: computed(
    () =>
      getToolContent('lrc-validator', locale.value)?.metaTitle ||
      'LRC Lyrics Validator — Check LRC Format Errors | OFPlayer',
  ),
  meta: [
    {
      name: 'description',
      content: computed(
        () =>
          getToolContent('lrc-validator', locale.value)?.metaDescription ||
          'Validate LRC lyrics files for format errors, invalid timestamps, and sync issues. Get actionable fix suggestions.',
      ),
    },
    { property: 'og:url', content: `${SITE_URL}/tools/lyrics/lrc-validator` },
  ],
})

// ── State ──────────────────────────────────────────────────────────────────────

const lrcInput = ref('')
const hasValidated = ref(false)
const issues = ref([])
const parseResult = ref(null)
const copiedSuggestions = ref(false)

const EXAMPLE_LRC = `[ar:Example Artist]
[ti:Example Song]
[00:12.34]This is the first line
[00:12.34]Duplicate timestamp example
[00:25.00]Out of order line
[00:20.00]This line comes after
[00:bad.format]Invalid timestamp example
Plain text line without timestamp`

// ── Computed ───────────────────────────────────────────────────────────────────

const errorIssues = computed(() => issues.value.filter((i) => i.severity === 'error'))
const warningIssues = computed(() => issues.value.filter((i) => i.severity === 'warning'))
const infoIssues = computed(() => issues.value.filter((i) => i.severity === 'info'))

const stats = computed(() => {
  if (!parseResult.value)
    return { totalLines: 0, timedLines: 0, metadataCount: 0, errorCount: 0, warningCount: 0 }
  return {
    totalLines: parseResult.value.lines.length,
    timedLines: parseResult.value.lines.filter((l) => l.timeMs !== null).length,
    metadataCount: parseResult.value.metadataLines.length,
    errorCount: errorIssues.value.length,
    warningCount: warningIssues.value.length,
  }
})

const fixSuggestions = computed(() => {
  if (!issues.value.length) return ''
  const lines = ['Fix suggestions:', '']
  for (const issue of issues.value) {
    const prefix =
      issue.severity === 'error' ? '[ERROR]' : issue.severity === 'warning' ? '[WARN]' : '[INFO]'
    lines.push(`${prefix} ${issue.message}`)
  }
  return lines.join('\n')
})

const relatedTools = computed(() => getRelatedTools(['lrc-offset', 'lrc-to-srt', 'srt-to-lrc']))

const toolHero = computed(() => {
  const content = getToolContent('lrc-validator', locale.value)
  return {
    title: content?.h1 || 'LRC Lyrics Validator',
    description: content?.intro || '',
  }
})

const toolGuide = computed(() => {
  const content = getToolContent('lrc-validator', locale.value)
  return content?.guideSections || []
})

// ── Methods ────────────────────────────────────────────────────────────────────

function loadExample() {
  lrcInput.value = EXAMPLE_LRC
  hasValidated.value = false
}

function clearInput() {
  lrcInput.value = ''
  hasValidated.value = false
  issues.value = []
  parseResult.value = null
}

function validate() {
  if (!lrcInput.value.trim()) return
  const result = parseLrc(lrcInput.value)
  parseResult.value = result
  issues.value = result.issues
  hasValidated.value = true
}

async function copySuggestions() {
  const text = fixSuggestions.value
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copiedSuggestions.value = true
    setTimeout(() => {
      copiedSuggestions.value = false
    }, 2000)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copiedSuggestions.value = true
    setTimeout(() => {
      copiedSuggestions.value = false
    }, 2000)
  }
}

// ── FAQ ────────────────────────────────────────────────────────────────────────

const faq = computed(() => {
  const content = getToolContent('lrc-validator', locale.value)
  return content?.faq || []
})
</script>

<style scoped>
.lrc-validator {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.lrc-validator__input-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.lrc-validator__field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.lrc-validator__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--of-ink-soft);
}

.lrc-validator__header-actions {
  display: flex;
  gap: var(--space-2);
}

.lrc-validator__action-btn {
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

.lrc-validator__action-btn:hover {
  border-color: var(--of-brand-border);
  color: var(--of-brand);
}

.lrc-validator__action-btn--primary {
  background: var(--of-brand-soft);
  color: var(--of-brand);
  border-color: var(--of-brand-border);
}

.lrc-validator__action-btn--primary:hover {
  background: var(--of-brand);
  color: var(--of-brand-contrast, #fff);
}

.lrc-validator__textarea {
  width: 100%;
  min-height: 200px;
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

.lrc-validator__textarea:focus {
  border-color: var(--of-brand-border);
}

.lrc-validator__validate-btn {
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

.lrc-validator__validate-btn:hover:not(:disabled) {
  background: var(--of-brand-hover);
}

.lrc-validator__validate-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Results */
.lrc-validator__results {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.lrc-validator__stats {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  padding: var(--space-4) var(--space-5);
  background: var(--of-bg-soft);
  border: 1px solid var(--of-border);
  border-radius: var(--of-radius-md, 10px);
}

.lrc-validator__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 70px;
}

.lrc-validator__stat-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--of-ink);
  line-height: 1;
}

.lrc-validator__stat--error .lrc-validator__stat-value {
  color: var(--of-danger);
}

.lrc-validator__stat--warning .lrc-validator__stat-value {
  color: var(--of-warning-active);
}

.lrc-validator__stat-label {
  font-size: var(--font-size-xs);
  color: var(--of-ink-muted);
  margin-top: var(--space-1);
  text-align: center;
}

.lrc-validator__status {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--of-radius-md, 8px);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.lrc-validator__status--ok {
  background: var(--of-success-soft);
  color: var(--of-success-active);
  border: 1px solid var(--of-success-border);
}

.lrc-validator__status--error {
  background: var(--of-danger-soft);
  color: var(--of-danger-active);
  border: 1px solid var(--of-danger-border);
}

.lrc-validator__status--warning {
  background: var(--of-warning-soft);
  color: var(--of-warning-active);
  border: 1px solid var(--of-warning-border);
}

.lrc-validator__issue-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.lrc-validator__issue-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.lrc-validator__issue-group-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  margin: 0;
  color: var(--of-ink-soft);
}

.lrc-validator__issue-group-title--error {
  color: var(--of-danger-active);
}

.lrc-validator__issue-group-title--warning {
  color: var(--of-warning-active);
}

.lrc-validator__issue-items {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.lrc-validator__issue {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--of-radius-sm, 6px);
  font-size: var(--font-size-sm);
}

.lrc-validator__issue--error {
  background: var(--of-danger-soft);
}

.lrc-validator__issue--warning {
  background: var(--of-warning-soft);
}

.lrc-validator__issue--info {
  background: var(--of-brand-soft);
}

.lrc-validator__issue-badge {
  flex-shrink: 0;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-mono);
  color: var(--of-ink-muted);
  white-space: nowrap;
}

.lrc-validator__issue-msg {
  color: var(--of-ink-soft);
  line-height: var(--line-height-relaxed);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
}

/* Suggestions */
.lrc-validator__suggestions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--of-border);
  border-radius: var(--of-radius-md, 8px);
  background: var(--of-surface);
}

.lrc-validator__suggestions-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--of-ink-muted);
  margin: 0;
}

.lrc-validator__suggestions-content {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-relaxed);
  color: var(--of-ink);
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

/* Guide */
.lrc-validator__guide h2 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: 0 0 var(--space-4);
}

.lrc-validator__guide h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: var(--space-5) 0 var(--space-2);
}

.lrc-validator__guide p {
  font-size: var(--font-size-base);
  color: var(--of-ink-soft);
  line-height: var(--line-height-relaxed);
  margin: 0 0 var(--space-3);
}

.lrc-validator__guide ul {
  padding-left: var(--space-5);
  margin: 0 0 var(--space-4);
}

.lrc-validator__guide li {
  font-size: var(--font-size-base);
  color: var(--of-ink-soft);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--space-2);
}

.lrc-validator__code {
  background: var(--of-bg-soft);
  border: 1px solid var(--of-border);
  border-radius: var(--of-radius-md, 8px);
  padding: var(--space-4);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-relaxed);
  color: var(--of-ink);
  overflow-x: auto;
  margin: 0 0 var(--space-4);
}
</style>
