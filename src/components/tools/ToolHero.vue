<template>
  <div class="tool-hero">
    <div class="tool-hero__breadcrumb">
      <RouterLink to="/tools" class="tool-hero__breadcrumb-link">{{
        t('tools.hero.breadcrumb')
      }}</RouterLink>
      <span class="tool-hero__breadcrumb-sep">/</span>
      <span class="tool-hero__breadcrumb-cat">{{ categoryLabel }}</span>
      <span v-if="title" class="tool-hero__breadcrumb-sep">/</span>
      <span v-if="title" class="tool-hero__breadcrumb-current">{{ title }}</span>
    </div>
    <h1 class="tool-hero__title">{{ title }}</h1>
    <p v-if="description" class="tool-hero__description">{{ description }}</p>
    <div class="tool-hero__badges">
      <span v-if="localFirst" class="tool-hero__badge tool-hero__badge--local">
        <span class="tool-hero__badge-dot" />
        {{ t('tools.hero.localFirstBadge') }}
      </span>
      <span v-if="requiresWasm" class="tool-hero__badge tool-hero__badge--wasm">
        {{ t('tools.hero.wasmBadge') }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    default: '',
  },
  categoryLabel: {
    type: String,
    default: 'Tools',
  },
  localFirst: {
    type: Boolean,
    default: true,
  },
  requiresWasm: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.tool-hero {
  padding: var(--space-8) 0 var(--space-6);
  border-bottom: 1px solid var(--of-border);
}

.tool-hero__breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--of-ink-muted);
  margin-bottom: var(--space-4);
}

.tool-hero__breadcrumb-link {
  color: var(--of-brand);
  text-decoration: none;
}

.tool-hero__breadcrumb-link:hover {
  text-decoration: underline;
}

.tool-hero__breadcrumb-sep {
  color: var(--of-ink-subtle);
}

.tool-hero__breadcrumb-current {
  color: var(--of-ink-soft);
}

.tool-hero__title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--of-ink);
  margin: 0 0 var(--space-3);
  line-height: var(--line-height-tight);
}

.tool-hero__description {
  font-size: var(--font-size-lg);
  color: var(--of-ink-soft);
  margin: 0 0 var(--space-4);
  line-height: var(--line-height-relaxed);
  max-width: 640px;
}

.tool-hero__badges {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.tool-hero__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border-radius: var(--of-radius-full, 100px);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border: 1px solid transparent;
}

.tool-hero__badge--local {
  background: var(--of-success-soft);
  color: var(--of-success-active);
  border-color: var(--of-success-border);
}

.tool-hero__badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.tool-hero__badge--wasm {
  background: var(--of-brand-soft);
  color: var(--of-brand-active);
  border-color: var(--of-brand-border);
}
</style>
