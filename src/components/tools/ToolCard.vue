<template>
  <RouterLink
    v-if="tool.status === 'available'"
    :to="tool.route"
    class="tool-card tool-card--available"
  >
    <div class="tool-card__header">
      <span class="tool-card__category">{{ categoryLabel }}</span>
      <span v-if="tool.localFirst" class="tool-card__local-badge">{{ t('tools.card.local') }}</span>
    </div>
    <h3 class="tool-card__title">{{ toolTitle }}</h3>
    <p class="tool-card__description">{{ toolDescription }}</p>
    <div class="tool-card__footer">
      <span class="tool-card__cta">{{ t('tools.card.openTool') }}</span>
    </div>
  </RouterLink>

  <div v-else class="tool-card tool-card--coming-soon">
    <div class="tool-card__header">
      <span class="tool-card__category">{{ categoryLabel }}</span>
      <span class="tool-card__status-badge">{{ t('tools.card.comingSoon') }}</span>
    </div>
    <h3 class="tool-card__title">{{ toolTitle }}</h3>
    <p class="tool-card__description">{{ toolDescription }}</p>
    <div class="tool-card__footer">
      <span class="tool-card__coming-soon-note">{{ t('tools.card.inDevelopment') }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { TOOL_CATEGORIES } from '../../tools/categories.js'
import { useI18n } from '../../composables/useI18n.js'

const { t, locale } = useI18n()

const props = defineProps({
  tool: {
    type: Object,
    required: true,
  },
})

const isZh = computed(() => locale.value === 'zh-CN')

const categoryLabel = computed(() => {
  const cat = TOOL_CATEGORIES[props.tool.category]
  if (!cat) return props.tool.category
  return isZh.value ? cat.labelCn || cat.label : cat.label
})

const toolTitle = computed(() => {
  if (isZh.value)
    return (
      props.tool.shortTitleCn || props.tool.titleCn || props.tool.shortTitle || props.tool.title
    )
  return props.tool.shortTitle || props.tool.title
})

const toolDescription = computed(() => {
  return isZh.value ? props.tool.descriptionCn || props.tool.description : props.tool.description
})
</script>

<style scoped>
.tool-card {
  display: flex;
  flex-direction: column;
  padding: var(--space-5);
  border-radius: var(--of-radius-lg, 12px);
  border: 1px solid var(--of-border);
  background: var(--of-surface);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
  text-decoration: none;
  color: inherit;
  min-height: 160px;
}

.tool-card--available {
  cursor: pointer;
}

.tool-card--available:hover {
  border-color: var(--of-brand-border);
  box-shadow: 0 4px 16px var(--of-brand-soft);
  transform: translateY(-1px);
}

.tool-card--coming-soon {
  opacity: 0.65;
  cursor: default;
  background: var(--of-bg-soft);
}

.tool-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
  gap: var(--space-2);
}

.tool-card__category {
  font-size: var(--font-size-xs);
  color: var(--of-ink-muted);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}

.tool-card__local-badge {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--of-radius-full, 100px);
  background: var(--of-success-soft);
  color: var(--of-success-active);
  border: 1px solid var(--of-success-border);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.tool-card__status-badge {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--of-radius-full, 100px);
  background: var(--of-bg-soft);
  color: var(--of-ink-subtle);
  border: 1px solid var(--of-border);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.tool-card__title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: 0 0 var(--space-2);
  line-height: var(--line-height-tight);
}

.tool-card__description {
  font-size: var(--font-size-sm);
  color: var(--of-ink-muted);
  margin: 0;
  line-height: var(--line-height-relaxed);
  flex: 1;
}

.tool-card__footer {
  margin-top: var(--space-4);
  display: flex;
  align-items: center;
}

.tool-card__cta {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--of-brand);
  transition: color var(--transition-fast);
}

.tool-card--available:hover .tool-card__cta {
  color: var(--of-brand-hover);
}

.tool-card__coming-soon-note {
  font-size: var(--font-size-xs);
  color: var(--of-ink-subtle);
  font-style: italic;
}
</style>
