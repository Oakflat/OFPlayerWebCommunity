<template>
  <ToolPageLayout
    :tool-id="config.toolId"
    processing-mode="local_text"
    :faq="config.faq"
    :related-tools="relatedTools"
  >
    <template #hero>
      <ToolHero
        :title="config.title"
        :description="config.description"
        category="lyrics"
        :category-label="t('tools.lyricsCategory')"
        :local-first="true"
      />
    </template>

    <!-- ── Tool interactive area ── -->
    <div class="converter">
      <div class="converter__columns">
        <!-- Input -->
        <div class="converter__column">
          <div class="converter__col-header">
            <label class="converter__label" :for="`${config.toolId}-input`">
              {{ config.inputLabel }}
            </label>
            <div class="converter__col-actions">
              <button class="converter__action-btn" type="button" @click="loadExample">
                {{ t('tools.converter.example') }}
              </button>
              <button class="converter__action-btn" type="button" @click="clearAll">
                {{ t('tools.converter.clear') }}
              </button>
            </div>
          </div>
          <textarea
            :id="`${config.toolId}-input`"
            v-model="inputText"
            class="converter__textarea"
            :placeholder="config.inputPlaceholder"
            spellcheck="false"
          />
        </div>

        <!-- Arrow -->
        <div class="converter__arrow" aria-hidden="true">→</div>

        <!-- Output -->
        <div class="converter__column">
          <div class="converter__col-header">
            <label class="converter__label">{{ config.outputLabel }}</label>
            <div class="converter__col-actions">
              <button
                class="converter__action-btn converter__action-btn--primary"
                :disabled="!outputText"
                type="button"
                @click="copyOutput"
              >
                {{ copied ? t('tools.converter.copied') : t('tools.converter.copy') }}
              </button>
              <button
                class="converter__action-btn converter__action-btn--primary"
                :disabled="!outputText"
                type="button"
                @click="downloadOutput"
              >
                {{ t('tools.converter.download') }}
              </button>
            </div>
          </div>
          <textarea
            class="converter__textarea converter__textarea--output"
            :value="outputText"
            readonly
            :placeholder="outputText ? '' : t('tools.converter.resultPlaceholder')"
            spellcheck="false"
          />
        </div>
      </div>

      <!-- Options -->
      <div v-if="config.showOptions" class="converter__options">
        <slot name="options" />
      </div>

      <!-- Convert button -->
      <div class="converter__actions">
        <button
          class="converter__convert-btn"
          type="button"
          :disabled="!inputText.trim()"
          @click="convert"
        >
          {{ t('tools.converter.convert') }}
        </button>
      </div>

      <!-- Errors -->
      <div v-if="errors.length > 0" class="converter__errors">
        <p class="converter__errors-title">{{ t('tools.converter.notesTitle') }}</p>
        <ul class="converter__errors-list">
          <li v-for="(err, i) in errors" :key="i" class="converter__error-item">{{ err }}</li>
        </ul>
      </div>
    </div>

    <template #guide>
      <slot name="guide" />
    </template>
  </ToolPageLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import ToolPageLayout from '../../../components/tools/ToolPageLayout.vue'
import ToolHero from '../../../components/tools/ToolHero.vue'
import { useI18n } from '../../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  config: {
    type: Object,
    required: true,
    // { toolId, title, description, inputLabel, outputLabel, inputPlaceholder, exampleInput, faq, showOptions? }
  },
  converter: {
    type: Function,
    required: true,
    // (inputText, options) => { result, errors }
  },
  relatedTools: {
    type: Array,
    default: () => [],
  },
  converterOptions: {
    type: Object,
    default: () => ({}),
  },
})

const inputText = ref('')
const outputText = ref('')
const errors = ref([])
const copied = ref(false)

function loadExample() {
  inputText.value = props.config.exampleInput || ''
  outputText.value = ''
  errors.value = []
}

function clearAll() {
  inputText.value = ''
  outputText.value = ''
  errors.value = []
}

function convert() {
  errors.value = []
  outputText.value = ''

  if (!inputText.value.trim()) return

  try {
    const { result, errors: convErrors } = props.converter(inputText.value, props.converterOptions)
    outputText.value = result || ''
    errors.value = convErrors || []
  } catch (err) {
    errors.value = ['Conversion failed: ' + (err?.message || 'Unknown error')]
  }
}

async function copyOutput() {
  if (!outputText.value) return
  try {
    await navigator.clipboard.writeText(outputText.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = outputText.value
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

function downloadOutput() {
  if (!outputText.value) return
  const ext = props.config.outputExtension || 'txt'
  const blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `result.${ext}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.converter {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.converter__columns {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--space-4);
  align-items: start;
}

.converter__column {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.converter__col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.converter__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--of-ink-soft);
}

.converter__col-actions {
  display: flex;
  gap: var(--space-2);
}

.converter__action-btn {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--of-radius-sm, 6px);
  border: 1px solid var(--of-border);
  background: var(--of-surface);
  color: var(--of-ink-muted);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    color var(--transition-fast),
    background var(--transition-fast);
  white-space: nowrap;
}

.converter__action-btn:hover:not(:disabled) {
  border-color: var(--of-brand-border);
  color: var(--of-brand);
}

.converter__action-btn--primary {
  background: var(--of-brand-soft);
  color: var(--of-brand);
  border-color: var(--of-brand-border);
}

.converter__action-btn--primary:hover:not(:disabled) {
  background: var(--of-brand);
  color: var(--of-brand-contrast, #fff);
}

.converter__action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.converter__textarea {
  width: 100%;
  min-height: 240px;
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

.converter__textarea:focus {
  border-color: var(--of-brand-border);
}

.converter__textarea--output {
  background: var(--of-bg-soft);
  color: var(--of-ink);
  cursor: default;
}

.converter__arrow {
  font-size: var(--font-size-2xl);
  color: var(--of-ink-subtle);
  padding-top: 34px;
  flex-shrink: 0;
  align-self: start;
}

.converter__actions {
  display: flex;
  justify-content: center;
}

.converter__convert-btn {
  padding: var(--space-2) var(--space-8);
  background: var(--of-brand);
  color: var(--of-brand-contrast, #fff);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  border: none;
  border-radius: var(--of-radius-md, 8px);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.converter__convert-btn:hover:not(:disabled) {
  background: var(--of-brand-hover);
}

.converter__convert-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.converter__errors {
  padding: var(--space-4);
  background: var(--of-tool-notice-warning-bg);
  border: 1px solid var(--of-tool-notice-warning-border);
  border-radius: var(--of-radius-md, 8px);
}

.converter__errors-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--of-tool-notice-warning-text);
  margin: 0 0 var(--space-2);
}

.converter__errors-list {
  margin: 0;
  padding: 0 0 0 var(--space-4);
}

.converter__error-item {
  font-size: var(--font-size-xs);
  color: var(--of-ink-soft);
  font-family: var(--font-family-mono);
  margin-bottom: var(--space-1);
}

@media (max-width: 680px) {
  .converter__columns {
    grid-template-columns: 1fr;
  }

  .converter__arrow {
    display: none;
  }
}
</style>
