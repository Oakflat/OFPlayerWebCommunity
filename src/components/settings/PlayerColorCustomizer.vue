<script setup>
import { computed, ref } from 'vue'
import { Check, ChevronDown, Palette, RotateCcw } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n'
import { deriveColorScheme } from '../../composables/usePlayerColor'

const props = defineProps({
  mode: {
    type: String,
    default: 'preset',
  },
  preset: {
    type: String,
    default: 'blue',
  },
  customColors: {
    type: Object,
    default: () => ({ accent: '#0EA5E9' }),
  },
  colorGateState: {
    type: String,
    default: 'enabled',
  },
})

const emit = defineEmits(['set-mode', 'set-preset', 'set-custom-colors'])

const { t } = useI18n()
const showAdvanced = ref(false)

const modeOptions = computed(() => [
  { value: 'preset', label: t('settings.playerColor.modePreset') },
  { value: 'custom', label: t('settings.playerColor.modeCustom') },
])

const presetOptions = computed(() => [
  { value: 'blue', color: '#0EA5E9', label: t('settings.playerColor.blue') },
  { value: 'orange', color: '#F97316', label: t('settings.playerColor.orange') },
  { value: 'green', color: '#10B981', label: t('settings.playerColor.green') },
  { value: 'rose', color: '#F43F5E', label: t('settings.playerColor.rose') },
  { value: 'violet', color: '#8B5CF6', label: t('settings.playerColor.violet') },
  { value: 'amber', color: '#F59E0B', label: t('settings.playerColor.amber') },
  { value: 'teal', color: '#14B8A6', label: t('settings.playerColor.teal') },
  { value: 'slate', color: '#475569', label: t('settings.playerColor.slate') },
])

const accentColor = computed(() => props.customColors?.accent ?? '#0EA5E9')

const derivedScheme = computed(() => deriveColorScheme(accentColor.value))

function handleModeChange(mode) {
  emit('set-mode', mode)
}

function handlePresetSelect(preset) {
  emit('set-preset', preset)
}

function handleAccentInput(event) {
  const value = event.target.value
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    emit('set-custom-colors', { accent: value })
  }
}

function handleAccentPicker(event) {
  emit('set-custom-colors', { accent: event.target.value })
}

function resetAccent() {
  emit('set-custom-colors', { accent: '#0EA5E9' })
}
</script>

<template>
  <div class="pcc">
    <div class="pcc-modes">
      <button
        v-for="option in modeOptions"
        :key="option.value"
        class="pcc-mode-btn"
        :class="{ 'is-active': option.value === mode }"
        type="button"
        @click="handleModeChange(option.value)"
      >
        <span>{{ option.label }}</span>
      </button>
    </div>

    <div v-if="mode === 'preset'" class="pcc-presets">
      <button
        v-for="option in presetOptions"
        :key="option.value"
        class="pcc-swatch"
        :class="{ 'is-active': option.value === preset }"
        type="button"
        :title="option.label"
        @click="handlePresetSelect(option.value)"
      >
        <span class="pcc-swatch-dot" :style="{ background: option.color }"></span>
        <Check v-if="option.value === preset" class="pcc-swatch-check" />
      </button>
    </div>

    <div v-else-if="mode === 'custom'" class="pcc-custom">
      <div class="pcc-custom-row">
        <label class="pcc-label">{{ t('settings.playerColor.accentLabel') }}</label>
        <div class="pcc-picker-group">
          <input
            type="color"
            class="pcc-color-input"
            :value="accentColor"
            @input="handleAccentPicker"
          />
          <input
            type="text"
            class="pcc-hex-input"
            :value="accentColor"
            maxlength="7"
            spellcheck="false"
            @change="handleAccentInput"
          />
          <button
            class="pcc-reset-btn"
            type="button"
            :title="t('settings.playerColor.reset')"
            @click="resetAccent"
          >
            <RotateCcw />
          </button>
        </div>
      </div>

      <div class="pcc-preview">
        <div class="pcc-preview-bar" :style="{ background: derivedScheme.accent }"></div>
        <div class="pcc-preview-row">
          <span class="pcc-preview-chip" :style="{ background: derivedScheme.accent }">{{
            t('settings.playerColor.previewPlay')
          }}</span>
          <span
            class="pcc-preview-chip pcc-preview-chip--soft"
            :style="{
              background: derivedScheme.accentSoft,
              color: derivedScheme.accent,
              borderColor: derivedScheme.accentBorder,
            }"
            >{{ t('settings.playerColor.previewCurrent') }}</span
          >
        </div>
      </div>

      <button class="pcc-advanced-toggle" type="button" @click="showAdvanced = !showAdvanced">
        <span>{{ t('settings.playerColor.advancedOptions') }}</span>
        <ChevronDown :class="{ 'is-rotated': showAdvanced }" />
      </button>

      <Transition name="pcc-collapse">
        <div v-if="showAdvanced" class="pcc-advanced">
          <p class="pcc-advanced-hint">{{ t('settings.playerColor.advancedHint') }}</p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.pcc {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.pcc-modes {
  display: flex;
  gap: var(--space-2);
}

.pcc-mode-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  border: 1px solid var(--of-border);
  background: var(--of-surface);
  color: var(--of-ink-soft);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pcc-mode-btn:hover {
  border-color: var(--of-ink-subtle);
  color: var(--of-ink);
}

.pcc-mode-btn.is-active {
  border-color: var(--of-brand);
  background: var(--of-brand-soft);
  color: var(--of-brand);
}

.pcc-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-top: var(--space-1);
}

.pcc-swatch {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pcc-swatch:hover {
  transform: scale(1.1);
}

.pcc-swatch.is-active {
  border-color: var(--of-brand);
  box-shadow: 0 0 0 2px var(--of-brand-soft);
}

.pcc-swatch-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pcc-swatch-check {
  position: absolute;
  width: 16px;
  height: 16px;
  color: white;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.pcc-custom {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.pcc-custom-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.pcc-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--of-ink-soft);
}

.pcc-picker-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.pcc-color-input {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  padding: 0;
  background: none;
}

.pcc-color-input::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.pcc-color-input::-webkit-color-swatch {
  border: 1px solid var(--of-border);
  border-radius: var(--radius-sm);
}

.pcc-hex-input {
  flex: 1;
  height: 40px;
  padding: 0 var(--space-3);
  border: 1px solid var(--of-border);
  border-radius: var(--radius-md);
  background: var(--of-surface);
  color: var(--of-ink);
  font-family: var(--font-family-mono, monospace);
  font-size: var(--font-size-sm);
}

.pcc-hex-input:focus {
  outline: none;
  border-color: var(--of-brand);
  box-shadow: 0 0 0 2px var(--of-brand-soft);
}

.pcc-reset-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--of-border);
  border-radius: var(--radius-md);
  background: var(--of-surface);
  color: var(--of-ink-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pcc-reset-btn:hover {
  border-color: var(--of-ink-subtle);
  color: var(--of-ink-soft);
}

.pcc-reset-btn svg {
  width: 16px;
  height: 16px;
}

.pcc-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--of-border);
  border-radius: var(--radius-md);
  background: var(--of-bg-soft);
}

.pcc-preview-bar {
  height: 4px;
  border-radius: 2px;
  transition: background var(--transition-fast);
}

.pcc-preview-row {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.pcc-preview-chip {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: white;
  transition: all var(--transition-fast);
}

.pcc-preview-chip--soft {
  border: 1px solid;
}

.pcc-advanced-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-2) 0;
  border: none;
  background: none;
  color: var(--of-ink-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.pcc-advanced-toggle:hover {
  color: var(--of-ink-soft);
}

.pcc-advanced-toggle svg {
  width: 14px;
  height: 14px;
  transition: transform var(--transition-fast);
}

.pcc-advanced-toggle svg.is-rotated {
  transform: rotate(180deg);
}

.pcc-advanced {
  padding: var(--space-2) 0;
}

.pcc-advanced-hint {
  font-size: var(--font-size-xs);
  color: var(--of-ink-subtle);
  line-height: var(--line-height-relaxed);
}

.pcc-collapse-enter-active,
.pcc-collapse-leave-active {
  transition: all var(--transition-fast);
  overflow: hidden;
}

.pcc-collapse-enter-from,
.pcc-collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

.pcc-collapse-enter-to,
.pcc-collapse-leave-from {
  opacity: 1;
  max-height: 200px;
}
</style>
