<template>
  <section class="tool-faq">
    <h2 class="tool-faq__title">{{ t('tools.faq.title') }}</h2>
    <dl class="tool-faq__list">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="tool-faq__item"
        :class="{ 'tool-faq__item--open': openIndex === index }"
      >
        <dt class="tool-faq__question" @click="toggle(index)">
          <span>{{ item.question }}</span>
          <span class="tool-faq__icon" aria-hidden="true">
            <span class="tool-faq__icon-bar tool-faq__icon-bar--h" />
            <span
              class="tool-faq__icon-bar tool-faq__icon-bar--v"
              :class="{ 'tool-faq__icon-bar--collapsed': openIndex !== index }"
            />
          </span>
        </dt>
        <dd class="tool-faq__answer-wrapper">
          <div class="tool-faq__answer" :class="{ 'tool-faq__answer--open': openIndex === index }">
            <div class="tool-faq__answer-inner">{{ item.answer }}</div>
          </div>
        </dd>
      </div>
    </dl>

    <!-- JSON-LD 结构化数据 -->
    <component :is="'script'" type="application/ld+json">{{ faqJsonLd }}</component>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  toolId: {
    type: String,
    default: '',
  },
})

const openIndex = ref(0)

function toggle(index) {
  openIndex.value = openIndex.value === index ? -1 : index
}

const faqJsonLd = computed(() => {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: props.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
  return JSON.stringify(data)
})
</script>

<style scoped>
.tool-faq {
  border-top: 1px solid var(--of-border);
  padding-top: var(--space-8);
}

.tool-faq__title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: 0 0 var(--space-6);
}

.tool-faq__list {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.tool-faq__item {
  border: 1px solid var(--of-border);
  border-radius: var(--of-radius-md, 8px);
  overflow: hidden;
  background: var(--of-surface);
  transition: border-color var(--transition-fast);
}

.tool-faq__item--open {
  border-color: var(--of-brand-border);
}

.tool-faq__question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  cursor: pointer;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--of-ink);
  user-select: none;
  gap: var(--space-4);
  transition: background var(--transition-fast);
}

.tool-faq__question:hover {
  background: var(--of-bg-soft);
}

.tool-faq__icon {
  position: relative;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: var(--of-brand);
}

.tool-faq__icon-bar {
  position: absolute;
  background: currentColor;
  border-radius: 1px;
  transition:
    transform var(--transition-fast),
    opacity var(--transition-fast);
}

.tool-faq__icon-bar--h {
  top: 50%;
  left: 2px;
  right: 2px;
  height: 2px;
  transform: translateY(-50%);
}

.tool-faq__icon-bar--v {
  top: 2px;
  bottom: 2px;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
}

.tool-faq__icon-bar--collapsed {
  transform: translateX(-50%) rotate(0deg);
}

.tool-faq__icon-bar--v:not(.tool-faq__icon-bar--collapsed) {
  transform: translateX(-50%) rotate(90deg);
  opacity: 0;
}

.tool-faq__answer-wrapper {
  margin: 0;
}

.tool-faq__answer {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition:
    max-height var(--transition-slow),
    opacity var(--transition-normal);
  border-top: 1px solid transparent;
}

.tool-faq__answer--open {
  max-height: 500px;
  opacity: 1;
  border-top-color: var(--of-divider);
}

.tool-faq__answer-inner {
  padding: var(--space-3) var(--space-5) var(--space-4);
  font-size: var(--font-size-base);
  color: var(--of-ink-soft);
  line-height: var(--line-height-relaxed);
}
</style>
