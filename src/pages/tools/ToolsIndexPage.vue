<template>
  <div class="tools-index" data-page-context="tools">
    <ToolsNavbar />

    <!-- Hero -->
    <section class="tools-index__hero">
      <div class="tools-index__hero-inner">
        <p class="tools-index__hero-eyebrow">{{ t('tools.index.heroEyebrow') }}</p>
        <h1 class="tools-index__hero-title">{{ t('tools.index.heroTitle') }}</h1>
        <p class="tools-index__hero-subtitle">
          {{ t('tools.index.heroSubtitle') }}
        </p>
        <div class="tools-index__hero-badges">
          <span class="tools-index__badge"
            ><Lock :size="13" aria-hidden="true" />{{ t('tools.index.badgeLocalFirst') }}</span
          >
          <span class="tools-index__badge"
            ><Zap :size="13" aria-hidden="true" />{{ t('tools.index.badgeNoUpload') }}</span
          >
          <span class="tools-index__badge"
            ><Sparkles :size="13" aria-hidden="true" />{{ t('tools.index.badgeFree') }}</span
          >
        </div>
      </div>
    </section>

    <!-- Tools grid -->
    <main class="tools-index__main">
      <div class="tools-index__main-inner">
        <!-- Category sections -->
        <ToolCategorySection
          v-for="cat in categoriesWithTools"
          :key="cat.id"
          :category="cat"
          :tools="cat.tools"
        />

        <!-- Search intent coverage -->
        <section class="tools-index__workflows" aria-labelledby="tools-workflows-title">
          <div class="tools-index__workflows-header">
            <h2 id="tools-workflows-title" class="tools-index__workflows-title">
              {{ workflowContent.title }}
            </h2>
            <p class="tools-index__workflows-copy">
              {{ workflowContent.copy }}
            </p>
          </div>
          <div class="tools-index__workflow-grid">
            <article
              v-for="workflow in workflowContent.items"
              :key="workflow.title"
              class="tools-index__workflow"
            >
              <h3 class="tools-index__workflow-title">{{ workflow.title }}</h3>
              <p class="tools-index__workflow-body">{{ workflow.body }}</p>
              <RouterLink :to="workflow.href" class="tools-index__workflow-link">
                {{ workflow.link }}
              </RouterLink>
            </article>
          </div>
        </section>

        <!-- Why local-first -->
        <section class="tools-index__why">
          <h2 class="tools-index__why-title">{{ t('tools.index.whyTitle') }}</h2>
          <div class="tools-index__why-grid">
            <div class="tools-index__why-item">
              <Lock class="tools-index__why-icon" :size="24" aria-hidden="true" />
              <h3>{{ t('tools.index.whyPrivateTitle') }}</h3>
              <p>{{ t('tools.index.whyPrivateBody') }}</p>
            </div>
            <div class="tools-index__why-item">
              <Zap class="tools-index__why-icon" :size="24" aria-hidden="true" />
              <h3>{{ t('tools.index.whyFastTitle') }}</h3>
              <p>{{ t('tools.index.whyFastBody') }}</p>
            </div>
            <div class="tools-index__why-item">
              <Globe class="tools-index__why-icon" :size="24" aria-hidden="true" />
              <h3>{{ t('tools.index.whyOfflineTitle') }}</h3>
              <p>{{ t('tools.index.whyOfflineBody') }}</p>
            </div>
          </div>
        </section>

        <!-- OFPlayer CTA -->
        <section class="tools-index__cta">
          <div class="tools-index__cta-content">
            <h2 class="tools-index__cta-title">{{ t('tools.index.ctaTitle') }}</h2>
            <p class="tools-index__cta-body">
              {{ t('tools.index.ctaBody') }}
            </p>
            <div class="tools-index__cta-actions">
              <RouterLink to="/app" class="tools-index__cta-btn tools-index__cta-btn--primary">
                {{ t('tools.index.ctaTryBtn') }}
              </RouterLink>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="tools-index__footer">
      <div class="tools-index__footer-inner">
        <p class="tools-index__footer-copy">
          &copy; {{ currentYear }} OFPlayer Community.
        </p>
        <nav class="tools-index__footer-nav">
          <RouterLink to="/app" class="tools-index__footer-link">{{
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
import { useHead } from '@unhead/vue'
import { Lock, Zap, Globe, Sparkles } from 'lucide-vue-next'
import ToolCategorySection from '../../components/tools/ToolCategorySection.vue'
import ToolsNavbar from '../../components/tools/ToolsNavbar.vue'
import { toolRegistry } from '../../tools/registry.js'
import { TOOL_CATEGORIES, CATEGORY_ORDER } from '../../tools/categories.js'
import { useI18n } from '../../composables/useI18n.js'

const { t, locale } = useI18n()

const SITE_URL = ''

const _metaTitleEn = 'OFPlayer Music Toolkit — Local-first Tools for Your Music Library'
const _metaTitleZh = 'OFPlayer 音乐工具箱 — 本地优先的音乐曲库工具'
const _metaDescEn =
  'Free browser-based tools for LRC lyrics, audio metadata, and music library management. Works with Navidrome, Jellyfin, WebDAV, and local files. All processing is local — no upload required.'
const _metaDescZh =
  '免费浏览器工具，用于处理 LRC 歌词、音频元数据和音乐曲库管理。支持 Navidrome、Jellyfin、WebDAV 和本地文件。所有处理在本地进行，无需上传。'

useHead({
  title: computed(() => (locale.value === 'zh-CN' ? _metaTitleZh : _metaTitleEn)),
  meta: [
    {
      name: 'description',
      content: computed(() => (locale.value === 'zh-CN' ? _metaDescZh : _metaDescEn)),
    },
    {
      name: 'keywords',
      content:
        'lrc tools, lyrics tools, music toolkit, audio tools, navidrome tools, jellyfin tools, local music tools, ofplayer toolkit',
    },
    {
      property: 'og:title',
      content: computed(() =>
        locale.value === 'zh-CN' ? 'OFPlayer 音乐工具箱' : 'OFPlayer Music Toolkit',
      ),
    },
    {
      property: 'og:description',
      content: computed(() => (locale.value === 'zh-CN' ? _metaDescZh : _metaDescEn)),
    },
    { property: 'og:url', content: `${SITE_URL}/tools` },
    {
      name: 'twitter:title',
      content: computed(() =>
        locale.value === 'zh-CN' ? 'OFPlayer 音乐工具箱' : 'OFPlayer Music Toolkit',
      ),
    },
    {
      name: 'twitter:description',
      content: computed(() => (locale.value === 'zh-CN' ? _metaDescZh : _metaDescEn)),
    },
  ],
  link: [{ rel: 'canonical', href: `${SITE_URL}/tools` }],
})

const currentYear = computed(() => new Date().getFullYear())

const categoriesWithTools = computed(() => {
  return CATEGORY_ORDER.map((catId) => {
    const tools = toolRegistry.filter((tool) => tool.category === catId)
    if (tools.length === 0) return null
    return {
      ...TOOL_CATEGORIES[catId],
      tools,
    }
  }).filter(Boolean)
})

const workflowContent = computed(() => {
  if (locale.value === 'zh-CN') {
    return {
      title: '按音乐曲库问题查找工具',
      copy: '这些入口覆盖更具体的搜索意图：歌词不同步、LRC 格式错误、音频标签查看、音频格式转换和曲库文件名整理。',
      items: [
        {
          title: '歌词提前、延后或整体不同步',
          body: '批量偏移 LRC 时间戳，修复 Navidrome、Jellyfin、OFPlayer 或移动播放器中的歌词错位。',
          href: '/tools/lyrics/lrc-offset',
          link: '打开 LRC 时间偏移工具',
        },
        {
          title: '歌词不显示或 LRC 格式错误',
          body: '检查时间戳格式、重复行、缺失时间戳和元数据标签，先修好再导入音乐库。',
          href: '/tools/lyrics/lrc-validator',
          link: '检查 LRC 格式',
        },
        {
          title: 'MP3 / FLAC 标签和封面不确定',
          body: '在浏览器本地读取音频元数据，查看标题、艺术家、专辑、码率、采样率和内嵌封面。',
          href: '/tools/audio/audio-metadata-viewer',
          link: '查看音频元数据',
        },
        {
          title: '需要本地转换 MP3、FLAC、WAV 或 M4A',
          body: '用 WebAssembly 在浏览器内转换音频格式，文件不上传，适合兼容性和轻量分享场景。',
          href: '/tools/audio/audio-converter',
          link: '转换音频格式',
        },
        {
          title: '音乐文件名混乱、专辑排序错误',
          body: '根据内嵌标签预览并生成统一文件名，让本地曲库和自托管目录更容易维护。',
          href: '/tools/library/filename-normalizer',
          link: '整理音乐文件名',
        },
      ],
    }
  }

  return {
    title: 'Find a tool by music library problem',
    copy: 'These workflows cover common search intents: out-of-sync lyrics, LRC format errors, audio tag inspection, audio conversion, and music library filename cleanup.',
    items: [
      {
        title: 'Lyrics are early, late, or out of sync',
        body: 'Shift every LRC timestamp to fix lyrics in Navidrome, Jellyfin, OFPlayer, or mobile music players.',
        href: '/tools/lyrics/lrc-offset',
        link: 'Open LRC Offset Tool',
      },
      {
        title: 'Lyrics do not show or LRC has errors',
        body: 'Check timestamp syntax, duplicate lines, missing timestamps, and metadata tags before importing lyrics into your music library.',
        href: '/tools/lyrics/lrc-validator',
        link: 'Validate LRC Format',
      },
      {
        title: 'MP3 / FLAC tags or cover art look wrong',
        body: 'Read audio metadata locally: title, artist, album, bitrate, sample rate, embedded artwork, and raw tags.',
        href: '/tools/audio/audio-metadata-viewer',
        link: 'View Audio Metadata',
      },
      {
        title: 'Convert MP3, FLAC, WAV, M4A, Opus, or OGG',
        body: 'Convert audio formats in the browser with WebAssembly. No upload required, useful for compatibility and lightweight sharing.',
        href: '/tools/audio/audio-converter',
        link: 'Convert Audio Format',
      },
      {
        title: 'Music filenames are messy or albums sort badly',
        body: 'Generate consistent filenames from embedded tags so local folders and self-hosted music servers stay easier to maintain.',
        href: '/tools/library/filename-normalizer',
        link: 'Normalize Music Filenames',
      },
    ],
  }
})
</script>

<style scoped>
.tools-index {
  min-height: 100vh;
  background: var(--of-bg);
  color: var(--of-ink);
  font-family: var(--font-family);
}

/* ── Hero ── */
.tools-index__hero {
  padding: var(--space-10) 0;
  border-bottom: 1px solid var(--of-border);
  background: var(--of-surface);
}

.tools-index__hero-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.tools-index__hero-eyebrow {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--of-brand);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  margin: 0 0 var(--space-3);
}

.tools-index__hero-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: var(--font-weight-bold);
  color: var(--of-ink);
  margin: 0 0 var(--space-4);
  line-height: var(--line-height-tight);
}

.tools-index__hero-subtitle {
  font-size: var(--font-size-lg);
  color: var(--of-ink-soft);
  margin: 0 0 var(--space-6);
  max-width: 600px;
  line-height: var(--line-height-relaxed);
}

.tools-index__hero-badges {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.tools-index__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border-radius: 100px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  background: var(--of-bg-soft);
  border: 1px solid var(--of-border);
  color: var(--of-ink-soft);
}

/* ── Main ── */
.tools-index__main {
  padding: var(--space-10) 0;
}

.tools-index__main-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

/* ── Workflows ── */
.tools-index__workflows {
  margin-bottom: var(--space-10);
  border-top: 1px solid var(--of-border);
  padding-top: var(--space-8);
}

.tools-index__workflows-header {
  max-width: 720px;
  margin-bottom: var(--space-6);
}

.tools-index__workflows-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: 0 0 var(--space-2);
}

.tools-index__workflows-copy {
  font-size: var(--font-size-sm);
  color: var(--of-ink-muted);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.tools-index__workflow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-4);
}

.tools-index__workflow {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  border: 1px solid var(--of-border);
  border-radius: var(--of-radius-md, 8px);
  background: var(--of-surface);
  padding: var(--space-4);
}

.tools-index__workflow-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  line-height: var(--line-height-tight);
  margin: 0;
}

.tools-index__workflow-body {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--of-ink-muted);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.tools-index__workflow-link {
  align-self: flex-start;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--of-brand);
  text-decoration: none;
}

.tools-index__workflow-link:hover {
  color: var(--of-brand-hover);
  text-decoration: underline;
}

/* ── Why local-first ── */
.tools-index__why {
  margin-bottom: var(--space-10);
  border-top: 1px solid var(--of-border);
  padding-top: var(--space-8);
}

.tools-index__why-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: 0 0 var(--space-6);
}

.tools-index__why-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-6);
}

.tools-index__why-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.tools-index__why-icon {
  color: var(--of-brand);
  flex-shrink: 0;
}

.tools-index__why-item h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: 0;
}

.tools-index__why-item p {
  font-size: var(--font-size-sm);
  color: var(--of-ink-muted);
  margin: 0;
  line-height: var(--line-height-relaxed);
}

/* ── CTA ── */
.tools-index__cta {
  background: linear-gradient(135deg, var(--of-brand-soft) 0%, var(--of-surface) 100%);
  border: 1px solid var(--of-border);
  border-radius: var(--of-radius-xl, 16px);
  padding: var(--space-8) var(--space-8);
  margin-bottom: var(--space-10);
}

.tools-index__cta-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--of-ink);
  margin: 0 0 var(--space-3);
}

.tools-index__cta-body {
  font-size: var(--font-size-md);
  color: var(--of-ink-soft);
  margin: 0 0 var(--space-6);
  max-width: 520px;
  line-height: var(--line-height-relaxed);
}

.tools-index__cta-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.tools-index__cta-btn {
  display: inline-flex;
  align-items: center;
  padding: var(--space-3) var(--space-5);
  border-radius: var(--of-radius-md, 10px);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.tools-index__cta-btn--primary {
  background: var(--of-brand);
  color: var(--of-brand-contrast, #fff);
}

.tools-index__cta-btn--primary:hover {
  background: var(--of-brand-hover);
}

/* ── Footer ── */
.tools-index__footer {
  border-top: 1px solid var(--of-border);
  background: var(--of-surface);
}

.tools-index__footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.tools-index__footer-copy {
  font-size: var(--font-size-xs);
  color: var(--of-ink-muted);
  margin: 0;
}

.tools-index__footer-nav {
  display: flex;
  gap: var(--space-4);
}

.tools-index__footer-link {
  font-size: var(--font-size-xs);
  color: var(--of-ink-muted);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.tools-index__footer-link:hover {
  color: var(--of-brand);
}

@media (max-width: 768px) {
  .tools-index__hero-inner,
  .tools-index__main-inner,
  .tools-index__footer-inner {
    padding: 0 var(--space-4);
  }

  .tools-index__hero {
    padding: var(--space-8) 0;
  }

  .tools-index__cta {
    padding: var(--space-6) var(--space-4);
  }
}
</style>
