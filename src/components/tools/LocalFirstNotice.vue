<template>
  <div class="local-first-notice">
    <Lock class="local-first-notice__icon" :size="16" aria-hidden="true" />
    <div class="local-first-notice__content">
      <span class="local-first-notice__label">{{ label }}</span>
      <span class="local-first-notice__detail">{{ detail }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Lock } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  /**
   * local_text   - 纯文本处理（歌词）
   * local_file   - 本地文件读取（元数据）
   * local_wasm   - 本地 WebAssembly 处理（音频转码）
   * server_side  - 不允许在第一阶段使用
   */
  mode: {
    type: String,
    default: 'local_text',
    validator: (v) => ['local_text', 'local_file', 'local_wasm'].includes(v),
  },
})

const label = computed(() => {
  const labels = {
    local_text: t('tools.localFirst.localTextLabel'),
    local_file: t('tools.localFirst.localFileLabel'),
    local_wasm: t('tools.localFirst.localWasmLabel'),
  }
  return labels[props.mode] ?? labels.local_text
})

const detail = computed(() => {
  const details = {
    local_text: t('tools.localFirst.localTextDetail'),
    local_file: t('tools.localFirst.localFileDetail'),
    local_wasm: t('tools.localFirst.localWasmDetail'),
  }
  return details[props.mode] ?? details.local_text
})
</script>

<style scoped>
.local-first-notice {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--of-success-soft);
  border: 1px solid var(--of-success-border);
  border-radius: var(--of-radius-md, 8px);
  font-size: var(--font-size-sm);
}

.local-first-notice__icon {
  flex-shrink: 0;
  color: var(--of-success-active);
}

.local-first-notice__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.local-first-notice__label {
  font-weight: var(--font-weight-medium);
  color: var(--of-success-active);
}

.local-first-notice__detail {
  color: var(--of-ink-muted);
}
</style>
