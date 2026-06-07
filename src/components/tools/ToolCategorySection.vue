<template>
  <section class="tool-cat-section">
    <div class="tool-cat-section__header">
      <h2 class="tool-cat-section__title">{{ categoryLabel }}</h2>
      <p v-if="categoryDescription" class="tool-cat-section__description">
        {{ categoryDescription }}
      </p>
    </div>
    <div class="tool-cat-section__grid">
      <ToolCard v-for="tool in tools" :key="tool.id" :tool="tool" />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import ToolCard from './ToolCard.vue'
import { useI18n } from '../../composables/useI18n.js'

const { locale } = useI18n()

const props = defineProps({
  category: {
    type: Object,
    required: true,
  },
  tools: {
    type: Array,
    required: true,
  },
})

const isZh = computed(() => locale.value === 'zh-CN')

const categoryLabel = computed(() => {
  return isZh.value ? props.category.labelCn || props.category.label : props.category.label
})

const categoryDescription = computed(() => {
  const desc = isZh.value
    ? props.category.descriptionCn || props.category.description
    : props.category.description
  return desc
})
</script>

<style scoped>
.tool-cat-section {
  margin-bottom: var(--space-10);
}

.tool-cat-section__header {
  margin-bottom: var(--space-5);
}

.tool-cat-section__title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: 0 0 var(--space-2);
}

.tool-cat-section__description {
  font-size: var(--font-size-sm);
  color: var(--of-ink-muted);
  margin: 0;
}

.tool-cat-section__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-4);
}

@media (max-width: 600px) {
  .tool-cat-section__grid {
    grid-template-columns: 1fr;
  }
}
</style>
