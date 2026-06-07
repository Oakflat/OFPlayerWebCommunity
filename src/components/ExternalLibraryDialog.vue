<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Check, Globe, HardDriveDownload, Lock, Server, X } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'
import { EXTERNAL_LIBRARY_PROVIDERS } from '../models/externalLibrary'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  isConnecting: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'connect'])

const { t } = useI18n()
const passwordInputType = ref('password')
const form = reactive(createDefaultForm())

const providerOptions = computed(() => [
  {
    value: EXTERNAL_LIBRARY_PROVIDERS.WEBDAV,
    label: t('externalLibrary.providers.webdav'),
    description: t('externalLibrary.providers.webdavCopy'),
    icon: Globe,
    disabled: false,
  },
  {
    value: EXTERNAL_LIBRARY_PROVIDERS.SUBSONIC,
    label: t('externalLibrary.providers.subsonic'),
    description: t('externalLibrary.providers.subsonicCopy'),
    icon: Server,
    disabled: false,
  },
  {
    value: EXTERNAL_LIBRARY_PROVIDERS.FTP,
    label: t('externalLibrary.providers.ftp'),
    description: t('externalLibrary.providers.ftpCopy'),
    icon: HardDriveDownload,
    disabled: true,
  },
])

const canSubmit = computed(
  () =>
    !props.isConnecting &&
    Boolean(form.endpoint.trim()) &&
    Boolean(form.name.trim()) &&
    form.provider !== EXTERNAL_LIBRARY_PROVIDERS.FTP,
)

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      Object.assign(form, createDefaultForm())
      passwordInputType.value = 'password'

      if (typeof document !== 'undefined') {
        document.body.classList.add('has-modal-open')
      }
    } else if (typeof document !== 'undefined') {
      document.body.classList.remove('has-modal-open')
    }
  },
)

function createDefaultForm() {
  return {
    provider: EXTERNAL_LIBRARY_PROVIDERS.WEBDAV,
    name: 'Remote Library',
    endpoint: '',
    rootPath: '',
    username: '',
    password: '',
  }
}

function selectProvider(provider) {
  if (props.isConnecting || provider === EXTERNAL_LIBRARY_PROVIDERS.FTP) {
    return
  }

  form.provider = provider

  if (provider === EXTERNAL_LIBRARY_PROVIDERS.SUBSONIC && form.name === 'Remote Library') {
    form.name = 'Navidrome'
  } else if (provider === EXTERNAL_LIBRARY_PROVIDERS.WEBDAV && form.name === 'Navidrome') {
    form.name = 'WebDAV'
  }
}

function togglePasswordVisibility() {
  passwordInputType.value = passwordInputType.value === 'password' ? 'text' : 'password'
}

function submit() {
  if (!canSubmit.value) {
    return
  }

  emit('connect', {
    provider: form.provider,
    name: form.name.trim(),
    endpoint: form.endpoint.trim(),
    rootPath: form.rootPath.trim(),
    auth: {
      username: form.username.trim(),
      password: form.password,
    },
    sync: {},
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="isOpen" class="external-dialog-backdrop" @click.self="emit('close')">
        <section
          class="external-dialog"
          role="dialog"
          aria-modal="true"
          :aria-label="t('externalLibrary.title')"
        >
          <header class="external-dialog-head">
            <div>
              <p class="eyebrow">{{ t('externalLibrary.eyebrow') }}</p>
              <h2>{{ t('externalLibrary.title') }}</h2>
            </div>
            <button
              type="button"
              class="external-dialog-close"
              :aria-label="t('externalLibrary.title')"
              @click="emit('close')"
            >
              <X aria-hidden="true" />
            </button>
          </header>

          <form class="external-dialog-form" @submit.prevent="submit">
            <div class="external-provider-grid" :aria-label="t('externalLibrary.providerLabel')">
              <button
                v-for="provider in providerOptions"
                :key="provider.value"
                class="external-provider-option"
                :class="{
                  'is-active': form.provider === provider.value,
                  'is-disabled': provider.disabled,
                }"
                type="button"
                :disabled="provider.disabled"
                @click="selectProvider(provider.value)"
              >
                <component :is="provider.icon" class="external-provider-icon" aria-hidden="true" />
                <strong>{{ provider.label }}</strong>
                <span>{{ provider.description }}</span>
                <Check
                  v-if="form.provider === provider.value"
                  class="external-provider-check"
                  aria-hidden="true"
                />
              </button>
            </div>

            <label class="external-field">
              <span>{{ t('externalLibrary.fields.name') }}</span>
              <input v-model="form.name" type="text" autocomplete="off" />
            </label>

            <label class="external-field">
              <span>{{ t('externalLibrary.fields.endpoint') }}</span>
              <input
                v-model="form.endpoint"
                type="url"
                inputmode="url"
                placeholder="https://music.example.com/"
              />
            </label>

            <label class="external-field">
              <span>{{ t('externalLibrary.fields.rootPath') }}</span>
              <input
                v-model="form.rootPath"
                type="text"
                autocomplete="off"
                :placeholder="
                  form.provider === EXTERNAL_LIBRARY_PROVIDERS.SUBSONIC ? 'musicFolderId' : '/Music'
                "
              />
            </label>

            <div class="external-field-row">
              <label class="external-field">
                <span>{{ t('externalLibrary.fields.username') }}</span>
                <input v-model="form.username" type="text" autocomplete="username" />
              </label>

              <label class="external-field">
                <span>{{ t('externalLibrary.fields.password') }}</span>
                <span class="external-password-wrap">
                  <input
                    v-model="form.password"
                    :type="passwordInputType"
                    autocomplete="current-password"
                  />
                  <button
                    type="button"
                    :aria-label="t('externalLibrary.fields.togglePassword')"
                    @click="togglePasswordVisibility"
                  >
                    <Lock aria-hidden="true" />
                  </button>
                </span>
              </label>
            </div>

            <p v-if="error" class="external-dialog-error">{{ error }}</p>

            <footer class="external-dialog-actions">
              <button type="button" class="external-dialog-button" @click="emit('close')">
                {{ t('sidebar.dialogs.cancel') }}
              </button>
              <button
                type="submit"
                class="external-dialog-button external-dialog-button--primary"
                :disabled="!canSubmit"
              >
                {{ isConnecting ? t('externalLibrary.connecting') : t('externalLibrary.connect') }}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.external-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  padding: var(--space-6);
  background: rgba(22, 28, 38, 0.2);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}

.external-dialog {
  width: min(620px, calc(100vw - 48px));
  max-height: min(760px, calc(100vh - 48px));
  overflow: auto;
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-2xl);
  background: var(--surface-elevated);
  box-shadow: 0 24px 56px -18px rgba(26, 31, 46, 0.28);
}

.external-dialog-head,
.external-dialog-actions,
.external-field-row {
  display: flex;
  gap: var(--space-4);
}

.external-dialog-head {
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.external-dialog-head h2 {
  margin: 0;
  color: var(--ink);
  font-size: var(--font-size-xl);
  line-height: var(--line-height-tight);
}

.external-dialog-close,
.external-password-wrap button {
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid var(--line);
  background: var(--surface-variant);
  color: var(--ink-soft);
  cursor: pointer;
}

.external-dialog-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.external-dialog-close svg,
.external-password-wrap svg {
  width: 16px;
  height: 16px;
}

.external-dialog-form {
  display: grid;
  gap: var(--space-4);
}

.external-provider-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.external-provider-option {
  position: relative;
  display: grid;
  gap: var(--space-2);
  min-height: 124px;
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-variant);
  color: var(--ink);
  text-align: left;
  cursor: pointer;
}

.external-provider-option.is-active {
  border-color: var(--line-strong);
  background: var(--surface-elevated);
}

.external-provider-option.is-disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.external-provider-icon {
  width: 18px;
  height: 18px;
  color: var(--primary);
}

.external-provider-option strong,
.external-field span {
  color: var(--ink);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.external-provider-option span {
  color: var(--ink-muted);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-relaxed);
}

.external-provider-check {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  width: 16px;
  height: 16px;
  color: var(--primary);
}

.external-field {
  display: grid;
  flex: 1 1 0;
  gap: var(--space-2);
}

.external-field input {
  width: 100%;
  min-width: 0;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface-variant);
  color: var(--ink);
}

.external-field input:focus {
  outline: none;
  border-color: var(--line-strong);
  background: var(--surface-elevated);
}

.external-password-wrap {
  display: grid;
  grid-template-columns: 1fr 36px;
}

.external-password-wrap input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.external-password-wrap button {
  border-left: 0;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.external-dialog-error {
  margin: 0;
  padding: var(--space-3);
  border: 1px solid var(--of-danger-border);
  border-radius: var(--radius-md);
  background: var(--of-danger-soft);
  color: var(--of-danger);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
}

.external-dialog-actions {
  justify-content: flex-end;
  margin-top: var(--space-2);
}

.external-dialog-button {
  padding: 0.625rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--surface-variant);
  color: var(--ink);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.external-dialog-button--primary {
  border-color: var(--button-primary-border);
  background: var(--button-primary-bg);
  color: var(--button-primary-ink);
}

.external-dialog-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 680px) {
  .external-provider-grid,
  .external-field-row {
    grid-template-columns: 1fr;
    display: grid;
  }
}
</style>
