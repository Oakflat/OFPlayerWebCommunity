<template>
  <section class="related-tools">
    <h3 class="related-tools__title">{{ t('tools.related.title') }}</h3>
    <div class="related-tools__list">
      <RouterLink
        v-for="tool in tools"
        :key="tool.id"
        :to="tool.route"
        class="related-tools__item"
        :class="{ 'related-tools__item--disabled': tool.status !== 'available' }"
      >
        <span class="related-tools__item-title">{{
          locale === 'zh-CN'
            ? tool.shortTitleCn || tool.titleCn || tool.shortTitle || tool.title
            : tool.shortTitle || tool.title
        }}</span>
        <span v-if="tool.status === 'available'" class="related-tools__item-arrow">→</span>
        <span v-else class="related-tools__item-soon">{{ t('tools.related.soon') }}</span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from '../../composables/useI18n.js'

const { t, locale } = useI18n()

defineProps({
  tools: {
    type: Array,
    required: true,
    // Array of ToolDefinition
  },
})
</script>

<style scoped>
.related-tools {
  border-top: 1px solid var(--of-border);
  padding-top: var(--space-6);
}

.related-tools__title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink-muted);
  margin: 0 0 var(--space-4);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  font-size: var(--font-size-xs);
}

.related-tools__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.related-tools__item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--of-border);
  border-radius: var(--of-radius-md, 8px);
  background: var(--of-surface);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--of-ink);
  text-decoration: none;
  transition:
    border-color var(--transition-fast),
    color var(--transition-fast);
}

.related-tools__item:not(.related-tools__item--disabled):hover {
  border-color: var(--of-brand-border);
  color: var(--of-brand);
}

.related-tools__item--disabled {
  opacity: 0.55;
  pointer-events: none;
}

.related-tools__item-arrow {
  color: var(--of-brand);
  font-size: var(--font-size-base);
}

.related-tools__item-soon {
  font-size: var(--font-size-xs);
  color: var(--of-ink-subtle);
  background: var(--of-bg-soft);
  padding: 1px 5px;
  border-radius: 4px;
}
</style>
