<script setup>
/**
 * TelemetryConsentDialog.vue
 *
 * Shown exactly once on first launch when telemetryEnabled === null.
 * Default choice is "Decline" — user must explicitly opt in.
 *
 * Emits:
 *   accept  → user clicked "Allow"
 *   decline → user clicked "No thanks" or pressed Esc
 */
import { onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from '../composables/useI18n'

const emit = defineEmits(['accept', 'decline'])

const { t } = useI18n()

function handleKeydown(e) {
  if (e.key === 'Escape') emit('decline')
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Teleport to="body">
    <div class="tc-backdrop" role="dialog" aria-modal="true" aria-labelledby="tc-title">
      <div class="tc-card">
        <div class="tc-icon" aria-hidden="true">📊</div>

        <h2 id="tc-title" class="tc-title">{{ t('telemetry.consent.title') }}</h2>

        <p class="tc-body">{{ t('telemetry.consent.body') }}</p>

        <ul class="tc-list">
          <li>{{ t('telemetry.consent.item1') }}</li>
          <li>{{ t('telemetry.consent.item2') }}</li>
          <li>{{ t('telemetry.consent.item3') }}</li>
        </ul>

        <p class="tc-note">{{ t('telemetry.consent.note') }}</p>

        <div class="tc-actions">
          <button class="tc-btn tc-btn--decline" @click="emit('decline')">
            {{ t('telemetry.consent.decline') }}
          </button>
          <button class="tc-btn tc-btn--accept" @click="emit('accept')">
            {{ t('telemetry.consent.accept') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.tc-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 1.5rem;
  pointer-events: none;
}

.tc-card {
  pointer-events: all;
  background: var(--surface, #fff);
  border: 1px solid var(--border, rgba(0, 0, 0, 0.1));
  border-radius: 14px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.14),
    0 2px 8px rgba(0, 0, 0, 0.07);
  padding: 1.25rem 1.375rem 1.125rem;
  max-width: 340px;
  width: 100%;
}

.tc-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.tc-title {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--ink);
}

.tc-body {
  font-size: 0.8125rem;
  color: var(--ink-muted, #666);
  margin: 0 0 0.625rem;
  line-height: 1.5;
}

.tc-list {
  font-size: 0.75rem;
  color: var(--ink-muted, #666);
  margin: 0 0 0.625rem;
  padding-left: 1.25rem;
  line-height: 1.6;
}

.tc-note {
  font-size: 0.6875rem;
  color: var(--ink-faint, #999);
  margin: 0 0 1rem;
  line-height: 1.4;
}

.tc-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.tc-btn {
  padding: 0.375rem 0.875rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.tc-btn--decline {
  background: transparent;
  border-color: var(--border, rgba(0, 0, 0, 0.12));
  color: var(--ink-muted, #666);
}

.tc-btn--decline:hover {
  background: var(--surface-raised, rgba(0, 0, 0, 0.04));
}

.tc-btn--accept {
  background: var(--of-btn-primary-bg, var(--accent, #4f87f7));
  color: var(--of-btn-primary-text, #fff);
  border-color: transparent;
}

.tc-btn--accept:hover {
  filter: brightness(1.06);
}

/* Dark mode */
html[data-effective-color-scheme='dark'] .tc-card {
  background: rgba(24, 26, 36, 0.97);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

html[data-effective-color-scheme='dark'] .tc-btn--decline {
  border-color: rgba(255, 255, 255, 0.14);
}
</style>
