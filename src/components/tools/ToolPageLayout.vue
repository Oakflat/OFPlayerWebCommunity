<template>
  <div class="tool-page" data-page-context="tools">
    <ToolsNavbar />

    <main class="tool-page__main">
      <!-- Hero 区域 -->
      <slot name="hero" />

      <!-- 隐私提示 -->
      <div v-if="showPrivacyNotice" class="tool-page__notice-wrapper">
        <slot name="notice">
          <LocalFirstNotice :mode="processingMode" />
        </slot>
      </div>

      <!-- 主内容区（工具交互区）-->
      <div class="tool-page__tool-area">
        <slot />
      </div>

      <!-- 教程/指南内容 -->
      <div v-if="$slots.guide" class="tool-page__guide-area">
        <slot name="guide" />
      </div>

      <!-- 常见使用场景 -->
      <section
        v-if="useCases.length > 0"
        class="tool-page__use-cases"
        :aria-labelledby="`${toolId}-use-cases-title`"
      >
        <h2 :id="`${toolId}-use-cases-title`" class="tool-page__use-cases-title">
          {{ useCasesTitle }}
        </h2>
        <div class="tool-page__use-cases-grid">
          <article v-for="item in useCases" :key="item.title" class="tool-page__use-case">
            <h3 class="tool-page__use-case-title">{{ item.title }}</h3>
            <p class="tool-page__use-case-body">{{ item.body }}</p>
          </article>
        </div>
      </section>

      <!-- FAQ -->
      <div v-if="faq && faq.length > 0" class="tool-page__faq-area">
        <ToolFaq :items="faq" :tool-id="toolId" />
      </div>

      <!-- 相关工具 -->
      <div v-if="relatedTools && relatedTools.length > 0" class="tool-page__related-area">
        <RelatedTools :tools="relatedTools" />
      </div>

      <!-- 评论区占位 -->
      <div class="tool-page__comment-area">
        <CommentMount :page-type="pageType" :page-slug="toolId" moderation-mode="disabled" />
      </div>
    </main>

    <component :is="'script'" type="application/ld+json">{{ webAppJsonLd }}</component>

    <footer class="tool-page__footer">
      <div class="tool-page__footer-inner">
        <p class="tool-page__footer-copy">&copy; {{ currentYear }} OFPlayer Community.</p>
        <nav class="tool-page__footer-nav">
          <RouterLink to="/tools" class="tool-page__footer-link">{{
            t('tools.layout.footerAllTools')
          }}</RouterLink>
          <RouterLink to="/app" class="tool-page__footer-link">{{
            t('tools.layout.footerWebPlayer')
          }}</RouterLink>
        </nav>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import LocalFirstNotice from './LocalFirstNotice.vue'
import ToolFaq from './ToolFaq.vue'
import RelatedTools from './RelatedTools.vue'
import CommentMount from '../comments/CommentMount.vue'
import ToolsNavbar from './ToolsNavbar.vue'
import { getToolContent } from '../../tools/content/toolContentRegistry.js'
import { useI18n } from '../../composables/useI18n.js'

const { t, locale } = useI18n()

const props = defineProps({
  toolId: {
    type: String,
    required: true,
  },
  pageType: {
    type: String,
    default: 'tool',
  },
  processingMode: {
    type: String,
    default: 'local_text',
  },
  showPrivacyNotice: {
    type: Boolean,
    default: true,
  },
  faq: {
    type: Array,
    default: () => [],
  },
  relatedTools: {
    type: Array,
    default: () => [],
  },
})

const currentYear = computed(() => new Date().getFullYear())

const toolContent = computed(() => getToolContent(props.toolId, locale.value))

const useCases = computed(() => toolContent.value?.useCases || [])

const useCasesTitle = computed(() => (locale.value === 'zh-CN' ? '使用场景' : 'Common use cases'))

const webAppJsonLd = computed(() => {
  const content = toolContent.value
  if (!content) return '{}'
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: content.h1,
    url: content.url,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    description: content.metaDescription,
    isAccessibleForFree: true,
    featureList: content.featureList || [],
  }
  return JSON.stringify(data)
})
</script>

<style scoped>
.tool-page {
  min-height: 100vh;
  background: var(--of-bg);
  color: var(--of-ink);
  font-family: var(--font-family);
  display: flex;
  flex-direction: column;
}

/* ── Main ── */
.tool-page__main {
  flex: 1;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  padding: 0 var(--space-6) var(--space-10);
}

.tool-page__notice-wrapper {
  margin-top: var(--space-4);
}

.tool-page__tool-area {
  margin-top: var(--space-6);
}

.tool-page__guide-area {
  margin-top: var(--space-10);
}

.tool-page__use-cases {
  margin-top: var(--space-10);
  border-top: 1px solid var(--of-border);
  padding-top: var(--space-8);
}

.tool-page__use-cases-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: 0 0 var(--space-5);
}

.tool-page__use-cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
}

.tool-page__use-case {
  border: 1px solid var(--of-border);
  border-radius: var(--of-radius-md, 8px);
  background: var(--of-surface);
  padding: var(--space-4);
}

.tool-page__use-case-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  line-height: var(--line-height-tight);
  margin: 0 0 var(--space-2);
}

.tool-page__use-case-body {
  font-size: var(--font-size-sm);
  color: var(--of-ink-muted);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.tool-page__faq-area {
  margin-top: var(--space-10);
}

.tool-page__related-area {
  margin-top: var(--space-10);
}

.tool-page__comment-area {
  margin-top: var(--space-10);
}

/* ── Footer ── */
.tool-page__footer {
  border-top: 1px solid var(--of-border);
  background: var(--of-surface);
  margin-top: var(--space-10);
}

.tool-page__footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.tool-page__footer-copy {
  font-size: var(--font-size-xs);
  color: var(--of-ink-muted);
  margin: 0;
}

.tool-page__footer-nav {
  display: flex;
  gap: var(--space-4);
}

.tool-page__footer-link {
  font-size: var(--font-size-xs);
  color: var(--of-ink-muted);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.tool-page__footer-link:hover {
  color: var(--of-brand);
}

@media (max-width: 600px) {
  .tool-page__main {
    padding: 0 var(--space-4) var(--space-8);
  }

  .tool-page__footer-inner {
    flex-direction: column;
    align-items: flex-start;
    padding: var(--space-4);
  }
}
</style>
