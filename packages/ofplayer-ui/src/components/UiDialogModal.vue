<script setup>
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

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
  closeLabel: {
    type: String,
    default: 'Close dialog',
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
})

const emit = defineEmits(['close', 'confirm'])

const localInputValue = ref(props.inputValue)

watch(
  () => props.inputValue,
  (nextValue) => {
    localInputValue.value = nextValue
  },
)

function handleConfirm() {
  emit('confirm', localInputValue.value)
  emit('close')
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="of-ui-dialog">
      <div v-if="isOpen" class="of-ui-dialog-backdrop" @click.self="handleClose">
        <div class="of-ui-dialog-modal" role="dialog" :aria-labelledby="title ? 'of-ui-dialog-title' : undefined">
          <header v-if="title" class="of-ui-dialog-header">
            <h2 id="of-ui-dialog-title" class="of-ui-dialog-title">{{ title }}</h2>
            <button
              type="button"
              class="of-ui-dialog-close"
              :aria-label="closeLabel"
              @click="handleClose"
            >
              <X aria-hidden="true" />
            </button>
          </header>

          <div class="of-ui-dialog-body">
            <p v-if="message" class="of-ui-dialog-message">{{ message }}</p>

            <label v-if="showInput" class="of-ui-dialog-input-wrap">
              <span v-if="inputLabel" class="of-ui-dialog-input-label">{{ inputLabel }}</span>
              <input
                v-model="localInputValue"
                type="text"
                class="of-ui-dialog-input"
                @keydown.enter="handleConfirm"
              />
            </label>
          </div>

          <footer class="of-ui-dialog-footer">
            <button type="button" class="of-ui-dialog-button of-ui-dialog-button-cancel" @click="handleClose">
              {{ cancelLabel }}
            </button>
            <button
              type="button"
              class="of-ui-dialog-button of-ui-dialog-button-confirm"
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
.of-ui-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: var(--of-ui-space-6);
  background: rgba(22, 28, 38, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.of-ui-dialog-modal {
  width: min(420px, calc(100vw - 48px));
  padding: var(--of-ui-space-6);
  border-radius: var(--of-ui-radius-xl);
  border: 1px solid var(--of-ui-line);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 253, 0.96));
  box-shadow: 0 24px 56px -18px rgba(26, 31, 46, 0.28);
}

.of-ui-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--of-ui-space-4);
  margin-bottom: var(--of-ui-space-5);
}

.of-ui-dialog-title {
  margin: 0;
  font-size: var(--of-ui-font-size-xl);
  font-weight: 600;
  line-height: 1.15;
  color: var(--of-ui-ink);
}

.of-ui-dialog-close {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--of-ui-line);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.82);
  color: var(--of-ui-ink-soft);
  cursor: pointer;
  transition: all var(--of-ui-transition-fast);
}

.of-ui-dialog-close:hover {
  border-color: var(--of-ui-line-strong);
  background: rgba(255, 255, 255, 0.96);
  color: var(--of-ui-ink);
}

.of-ui-dialog-close svg {
  width: 16px;
  height: 16px;
}

.of-ui-dialog-body {
  margin-bottom: var(--of-ui-space-5);
}

.of-ui-dialog-message {
  margin: 0 0 var(--of-ui-space-4);
  font-size: var(--of-ui-font-size-base);
  line-height: 1.6;
  color: var(--of-ui-ink-muted);
}

.of-ui-dialog-message:last-child {
  margin-bottom: 0;
}

.of-ui-dialog-input-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--of-ui-space-2);
}

.of-ui-dialog-input-label {
  font-size: var(--of-ui-font-size-sm);
  font-weight: 500;
  color: var(--of-ui-ink-soft);
}

.of-ui-dialog-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--of-ui-line);
  border-radius: var(--of-ui-radius-md);
  background: rgba(255, 255, 255, 0.88);
  font-size: var(--of-ui-font-size-base);
  color: var(--of-ui-ink);
  transition: all var(--of-ui-transition-fast);
}

.of-ui-dialog-input:focus {
  outline: none;
  border-color: var(--of-ui-line-strong);
  background: rgba(255, 255, 255, 0.98);
}

.of-ui-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--of-ui-space-3);
}

.of-ui-dialog-button {
  padding: 0.625rem 1.25rem;
  border: 1px solid var(--of-ui-line);
  border-radius: var(--of-ui-radius-full);
  font-size: var(--of-ui-font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--of-ui-transition-fast);
}

.of-ui-dialog-button-cancel {
  background: rgba(248, 250, 252, 0.82);
  color: var(--of-ui-ink);
}

.of-ui-dialog-button-cancel:hover {
  border-color: var(--of-ui-line-strong);
  background: rgba(255, 255, 255, 0.96);
}

.of-ui-dialog-button-confirm {
  border-color: var(--of-ui-ink);
  background: linear-gradient(180deg, #242d3b, var(--of-ui-ink));
  color: #ffffff;
}

.of-ui-dialog-button-confirm:hover {
  box-shadow: 0 2px 8px rgba(26, 31, 46, 0.2);
}

.of-ui-dialog-button-confirm.is-danger {
  background: linear-gradient(180deg, #b83232, #9a2828);
  border-color: #9a2828;
}

.of-ui-dialog-enter-active,
.of-ui-dialog-leave-active {
  transition: all var(--of-ui-transition-normal);
}

.of-ui-dialog-enter-active .of-ui-dialog-modal,
.of-ui-dialog-leave-active .of-ui-dialog-modal {
  transition: all var(--of-ui-transition-normal);
}

.of-ui-dialog-enter-from,
.of-ui-dialog-leave-to {
  opacity: 0;
}

.of-ui-dialog-enter-from .of-ui-dialog-modal,
.of-ui-dialog-leave-to .of-ui-dialog-modal {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
</style>
