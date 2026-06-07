<script setup>
import { ref, watch } from 'vue'
import { X, Download } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
  confirmLabel: {
    type: String,
    default: 'Confirm',
  },
  cancelLabel: {
    type: String,
    default: 'Cancel',
  },
  inputLabel: {
    type: String,
    default: '',
  },
  inputValue: {
    type: String,
    default: '',
  },
  isDanger: {
    type: Boolean,
    default: false,
  },
  showInput: {
    type: Boolean,
    default: false,
  },
  hint: {
    type: String,
    default: '',
  },
  hintLinkLabel: {
    type: String,
    default: '',
  },
  hintRoute: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'confirm'])

const localInputValue = ref(props.inputValue)

watch(
  () => props.inputValue,
  (newValue) => {
    localInputValue.value = newValue
  },
)

function handleConfirm() {
  emit('confirm', localInputValue.value)
  emit('close')
}

function handleCancel() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="isOpen" class="dialog-backdrop" @click.self="handleCancel">
        <div
          class="dialog-modal"
          role="dialog"
          :aria-labelledby="title ? 'dialog-title' : undefined"
        >
          <header v-if="title" class="dialog-header">
            <h2 id="dialog-title" class="dialog-title">{{ title }}</h2>
            <button
              type="button"
              class="dialog-close"
              :aria-label="'Close dialog'"
              @click="handleCancel"
            >
              <X aria-hidden="true" />
            </button>
          </header>

          <div class="dialog-body">
            <p v-if="message" class="dialog-message">{{ message }}</p>

            <label v-if="showInput" class="dialog-input-wrap">
              <span v-if="inputLabel" class="dialog-input-label">{{ inputLabel }}</span>
              <input
                v-model="localInputValue"
                type="text"
                class="dialog-input"
                @keydown.enter="handleConfirm"
              />
            </label>
          </div>

          <div v-if="hint" class="dialog-hint">
            <Download class="dialog-hint-icon" aria-hidden="true" />
            <span>{{ hint }}</span>
            <RouterLink
              v-if="hintRoute"
              class="dialog-hint-link"
              :to="hintRoute"
              @click="handleCancel"
              >{{ hintLinkLabel }}</RouterLink
            >
          </div>

          <footer class="dialog-footer">
            <button type="button" class="dialog-button dialog-button-cancel" @click="handleCancel">
              {{ cancelLabel }}
            </button>
            <button
              type="button"
              class="dialog-button dialog-button-confirm"
              :class="{ 'is-danger': isDanger }"
              @click="handleConfirm"
            >
              {{ confirmLabel }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: var(--space-6);
  background: rgba(22, 28, 38, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.dialog-modal {
  width: min(420px, calc(100vw - 48px));
  padding: var(--space-6);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--line);
  background: var(--surface-elevated);
  box-shadow: 0 24px 56px -18px rgba(26, 31, 46, 0.28);
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.dialog-title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--ink);
  line-height: var(--line-height-tight);
}

.dialog-close {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--surface-variant);
  color: var(--ink-soft);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.dialog-close:hover {
  border-color: var(--line-strong);
  background: var(--surface-elevated);
  color: var(--ink);
}

.dialog-close svg {
  width: 16px;
  height: 16px;
}

.dialog-body {
  margin-bottom: var(--space-5);
}

.dialog-message {
  margin: 0 0 var(--space-4);
  font-size: var(--font-size-base);
  color: var(--ink-muted);
  line-height: var(--line-height-relaxed);
}

.dialog-message:last-child {
  margin-bottom: 0;
}

.dialog-input-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.dialog-input-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--ink-soft);
}

.dialog-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface-variant);
  font-size: var(--font-size-base);
  color: var(--ink);
  transition: all var(--transition-fast);
}

.dialog-input:focus {
  outline: none;
  border-color: var(--line-strong);
  background: var(--surface-elevated);
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
}

.dialog-button {
  padding: 0.625rem 1.25rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.dialog-button-cancel {
  background: var(--surface-variant);
  color: var(--ink);
}

.dialog-button-cancel:hover {
  border-color: var(--line-strong);
  background: var(--surface-elevated);
}

.dialog-button-confirm {
  background: linear-gradient(180deg, var(--of-ink-soft), var(--ink));
  border-color: var(--ink);
  color: var(--of-btn-primary-text);
}

.dialog-button-confirm:hover {
  box-shadow: 0 2px 8px rgba(26, 31, 46, 0.2);
}

.dialog-button-confirm.is-danger {
  background: linear-gradient(180deg, var(--of-danger-hover), var(--of-danger-active));
  border-color: var(--of-danger-active);
}

.dialog-button-confirm.is-danger:hover {
  box-shadow: 0 2px 8px var(--of-danger-soft);
}

.dialog-enter-active,
.dialog-leave-active {
  transition: all var(--transition-normal);
}

.dialog-enter-active .dialog-modal,
.dialog-leave-active .dialog-modal {
  transition: all var(--transition-normal);
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-modal,
.dialog-leave-to .dialog-modal {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

/* 夜间模式 */
[data-effective-color-scheme='dark'] .dialog-modal {
  background: linear-gradient(180deg, rgba(28, 32, 40, 0.98), rgba(22, 26, 34, 0.97));
  box-shadow:
    0 24px 56px -18px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

[data-effective-color-scheme='dark'] .dialog-button-confirm:not(.is-danger) {
  background: linear-gradient(180deg, var(--of-ink-soft), var(--ink));
  border-color: rgba(255, 255, 255, 0.15);
  color: var(--of-btn-primary-text);
}

.dialog-hint {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  margin-top: calc(var(--space-5) * -0.5);
  margin-bottom: var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--surface-variant);
  border: 1px solid var(--line);
  font-size: var(--font-size-xs);
  color: var(--ink-muted);
  line-height: var(--line-height-relaxed);
}

.dialog-hint-icon {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  margin-top: 0.15em;
  color: var(--ink-subtle);
}

.dialog-hint-link {
  flex-shrink: 0;
  color: var(--ink-soft);
  font-weight: var(--font-weight-medium);
  text-decoration: underline;
  text-underline-offset: 2px;
  white-space: nowrap;
  transition: color var(--transition-fast);
}

.dialog-hint-link:hover {
  color: var(--ink);
}
</style>
