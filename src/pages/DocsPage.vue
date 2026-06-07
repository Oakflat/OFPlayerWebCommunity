<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  ArrowLeft,
  Github,
  Moon,
  Sun,
  Search,
  Music2,
  Code,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
} from 'lucide-vue-next'
import MdRenderer from '../components/MdRenderer.vue'
import { useSitePrefs } from '../composables/useSitePrefs'

const route = useRoute()

// ── 暗色模式：跟随全局播放器主题 ─────────────────
const { isDark, toggleDark } = useSitePrefs()

// ── 侧边栏移动端 ──────────────────────────────────
const sidebarOpen = ref(false)
const pageRef = ref(null)

// ── 搜索 ──────────────────────────────────────────
const searchQuery = ref('')
const searchOpen = ref(false)

// ── 文档注册表 ────────────────────────────────────
const docs = {
  // 用户指南
  'guide-getting-started': {
    title: 'Getting Started',
    titleCn: '快速上手',
    description: '几分钟内开始使用 OFPlayer',
    category: 'guide',
    path: '/docs/user/getting-started.md',
  },
  'guide-import': {
    title: 'Import Music',
    titleCn: '导入音乐',
    description: '将本地音频文件添加到播放器',
    category: 'guide',
    path: '/docs/user/import-music.md',
  },
  'guide-playback': {
    title: 'Playback Controls',
    titleCn: '播放控制',
    description: '掌握所有播放功能和模式',
    category: 'guide',
    path: '/docs/user/playback.md',
  },
  'guide-libraries': {
    title: 'Libraries & Playlists',
    titleCn: '库与播放列表',
    description: '整理和管理你的音乐收藏',
    category: 'guide',
    path: '/docs/user/libraries-playlists.md',
  },
  'guide-lyrics': {
    title: 'Lyrics',
    titleCn: '歌词',
    description: '查看和管理歌词文件',
    category: 'guide',
    path: '/docs/user/lyrics.md',
  },
  'guide-themes': {
    title: 'Themes & Settings',
    titleCn: '主题与设置',
    description: '个性化你的播放器体验',
    category: 'guide',
    path: '/docs/user/themes.md',
  },
  'guide-shortcuts': {
    title: 'Keyboard Shortcuts',
    titleCn: '快捷键',
    description: '用键盘掌控一切',
    category: 'guide',
    path: '/docs/user/keyboard-shortcuts.md',
  },
  // 开发者文档
  architecture: {
    title: 'Architecture Overview',
    titleCn: '架构设计',
    description: '了解 OFPlayer 的分层架构',
    category: 'development',
    path: '/docs/02-architecture.md',
  },
  components: {
    title: 'Component Reference',
    titleCn: '组件参考',
    description: 'Vue 组件 API 文档',
    category: 'development',
    path: '/docs/03-components.md',
  },
  theming: {
    title: 'Theming System',
    titleCn: '主题系统',
    description: '自定义 OFPlayer 外观',
    category: 'customization',
    path: '/docs/08-theming.md',
  },
  'secondary-development': {
    title: 'Secondary Development',
    titleCn: '二次开发指南',
    description: '扩展 OFPlayer 的自定义功能',
    category: 'development',
    path: '/docs/09-secondary-development.md',
  },
}

const currentSlug = computed(() => route.params.slug || 'guide-getting-started')
const currentDoc = computed(() => docs[currentSlug.value] || docs['guide-getting-started'])

// 有序文档列表（用于 prev/next）
const orderedSlugs = [
  'guide-getting-started',
  'guide-import',
  'guide-playback',
  'guide-libraries',
  'guide-lyrics',
  'guide-themes',
  'guide-shortcuts',
  'architecture',
  'components',
  'theming',
  'secondary-development',
]

const currentIndex = computed(() => orderedSlugs.indexOf(currentSlug.value))
const prevDoc = computed(() => {
  const i = currentIndex.value
  if (i <= 0) return null
  const slug = orderedSlugs[i - 1]
  return { slug, ...docs[slug] }
})
const nextDoc = computed(() => {
  const i = currentIndex.value
  if (i < 0 || i >= orderedSlugs.length - 1) return null
  const slug = orderedSlugs[i + 1]
  return { slug, ...docs[slug] }
})

// ── 侧边栏分组 ────────────────────────────────────
const categories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const filter = (slug) => {
    if (!q) return true
    const d = docs[slug]
    return d.title.toLowerCase().includes(q) || d.titleCn.includes(q) || d.description.includes(q)
  }
  return [
    {
      key: 'guide',
      label: '用户指南',
      icon: 'music',
      slugs: [
        'guide-getting-started',
        'guide-import',
        'guide-playback',
        'guide-libraries',
        'guide-lyrics',
        'guide-themes',
        'guide-shortcuts',
      ].filter(filter),
    },
    {
      key: 'development',
      label: '开发者文档',
      icon: 'code',
      slugs: ['architecture', 'components', 'theming', 'secondary-development'].filter(filter),
    },
  ]
})

// ── Markdown 加载 ─────────────────────────────────
const markdownContent = ref('')
const isLoading = ref(true)

async function loadDoc(slug) {
  isLoading.value = true
  markdownContent.value = ''
  const doc = docs[slug] || docs['guide-getting-started']
  try {
    const res = await fetch(doc.path)
    if (res.ok) {
      markdownContent.value = await res.text()
    } else {
      markdownContent.value = '# 文档未找到\n\n请尝试从左侧导航栏选择其他文档。'
    }
  } catch {
    markdownContent.value = '# 加载失败\n\n无法加载文档，请稍后重试。'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDoc(currentSlug.value)
})

watch(currentSlug, (slug) => {
  loadDoc(slug)
  sidebarOpen.value = false
  if (pageRef.value) pageRef.value.scrollTo({ top: 0, behavior: 'instant' })
})
</script>

<template>
  <div ref="pageRef" class="docs-page" :class="{ 'docs-dark': isDark }">
    <!-- ── Navbar ──────────────────────────────── -->
    <nav class="docs-nav">
      <div class="docs-nav-inner">
        <!-- Left: Logo + mobile menu -->
        <div class="docs-nav-left">
          <button
            class="docs-nav-hamburger"
            aria-label="Toggle sidebar"
            @click="sidebarOpen = !sidebarOpen"
          >
            <component :is="sidebarOpen ? X : Menu" :size="18" />
          </button>
          <RouterLink class="docs-nav-brand" to="/">OFPLAYER</RouterLink>
          <span class="docs-nav-badge">Docs</span>
        </div>

        <!-- Right: actions -->
        <div class="docs-nav-right">
          <button
            class="docs-nav-icon-btn"
            :aria-label="searchOpen ? '关闭搜索' : '搜索文档'"
            @click="searchOpen = !searchOpen"
          >
            <component :is="searchOpen ? X : Search" :size="16" />
          </button>
          <button
            class="docs-nav-icon-btn"
            :aria-label="isDark ? '切换亮色模式' : '切换暗色模式'"
            @click="toggleDark"
          >
            <component :is="isDark ? Sun : Moon" :size="16" />
          </button>
          <RouterLink class="docs-nav-back" to="/">
            <ArrowLeft :size="14" />
            <span>返回主页</span>
          </RouterLink>
        </div>
      </div>

      <!-- Search bar (expandable) -->
      <div class="docs-search-bar" :class="{ 'is-open': searchOpen }">
        <div class="docs-search-inner">
          <Search :size="14" class="docs-search-icon" />
          <!-- prettier-ignore -->
          <input
            v-model="searchQuery"
            class="docs-search-input"
            placeholder="搜索文档标题..."
            @keydown.escape="searchOpen = false; searchQuery = ''"
          />
        </div>
      </div>
    </nav>

    <!-- ── Layout ─────────────────────────────── -->
    <div class="docs-layout">
      <!-- ── Sidebar ───────────────────────────── -->
      <aside class="docs-sidebar" :class="{ 'is-open': sidebarOpen }">
        <div class="docs-sidebar-scroll">
          <div v-for="cat in categories" :key="cat.key" class="docs-sidebar-section">
            <div class="docs-sidebar-group-header">
              <component :is="cat.icon === 'music' ? Music2 : Code" :size="13" />
              {{ cat.label }}
            </div>
            <ul v-if="cat.slugs.length" class="docs-sidebar-list">
              <li v-for="slug in cat.slugs" :key="slug">
                <RouterLink
                  :to="`/docs/${slug}`"
                  class="docs-sidebar-link"
                  :class="{ 'is-active': currentSlug === slug }"
                >
                  {{ docs[slug].titleCn }}
                </RouterLink>
              </li>
            </ul>
            <p v-else class="docs-sidebar-empty">无匹配结果</p>
          </div>

          <div class="docs-sidebar-footer">
            <a
              class="docs-sidebar-github"
              href="https://github.com/ofplayer/ofplayer"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github :size="13" />
              GitHub
            </a>
          </div>
        </div>
      </aside>

      <!-- Mobile overlay -->
      <div v-if="sidebarOpen" class="docs-sidebar-overlay" @click="sidebarOpen = false" />

      <!-- ── Main content ───────────────────────── -->
      <main class="docs-main">
        <!-- Loading state -->
        <div v-if="isLoading" class="docs-loading">
          <div class="docs-loading-ring" />
        </div>

        <template v-else>
          <!-- Breadcrumb -->
          <div class="docs-breadcrumb">
            <span class="docs-breadcrumb-root">
              {{ currentDoc.category === 'guide' ? '用户指南' : '开发者文档' }}
            </span>
            <span class="docs-breadcrumb-sep">/</span>
            <span class="docs-breadcrumb-current">{{ currentDoc.titleCn }}</span>
          </div>

          <!-- Document header -->
          <header class="docs-doc-header">
            <h1 class="docs-doc-title">{{ currentDoc.titleCn }}</h1>
            <p class="docs-doc-description">{{ currentDoc.description }}</p>
          </header>

          <!-- Markdown content -->
          <MdRenderer :content="markdownContent" :dark="isDark" />

          <!-- Prev / Next navigation -->
          <footer class="docs-pagination">
            <RouterLink
              v-if="prevDoc"
              :to="`/docs/${prevDoc.slug}`"
              class="docs-pagination-btn docs-pagination-btn--prev"
            >
              <ChevronLeft :size="16" />
              <span>
                <span class="docs-pagination-label">上一页</span>
                <span class="docs-pagination-title">{{ prevDoc.titleCn }}</span>
              </span>
            </RouterLink>
            <div v-else />

            <RouterLink
              v-if="nextDoc"
              :to="`/docs/${nextDoc.slug}`"
              class="docs-pagination-btn docs-pagination-btn--next"
            >
              <span>
                <span class="docs-pagination-label">下一页</span>
                <span class="docs-pagination-title">{{ nextDoc.titleCn }}</span>
              </span>
              <ChevronRight :size="16" />
            </RouterLink>
            <div v-else />
          </footer>
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════
   DOCS PAGE — Design tokens (light / dark)
   ═══════════════════════════════════════════════════ */
.docs-page {
  --dp-bg: #f8f8f9;
  --dp-sidebar-bg: #ffffff;
  --dp-nav-bg: rgba(255, 255, 255, 0.8);
  --dp-surface: #ffffff;
  --dp-border: rgba(0, 0, 0, 0.07);
  --dp-text: #111112;
  --dp-text-2: rgba(0, 0, 0, 0.52);
  --dp-text-3: rgba(0, 0, 0, 0.32);
  --dp-accent: #f97316;
  --dp-accent-2: rgba(249, 115, 22, 0.1);
  --dp-hover: rgba(0, 0, 0, 0.035);
  --dp-active-text: #f97316;
  --dp-surface-raised: #f2f2f4;

  /* Scrolling container — overrides body { overflow: hidden } */
  height: 100vh;
  overflow-y: auto;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.12) transparent;

  background: var(--dp-bg);
  color: var(--dp-text);
  font-family:
    'Inter',
    'Manrope',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI Variable',
    'PingFang SC',
    'HarmonyOS Sans SC',
    'Microsoft YaHei',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  transition:
    background 0.2s,
    color 0.2s;
}

/* Dark mode overrides */
.docs-page.docs-dark {
  --dp-bg: #111113;
  --dp-sidebar-bg: #18181c;
  --dp-nav-bg: rgba(18, 18, 20, 0.78);
  --dp-surface: #1e1e24;
  --dp-border: rgba(255, 255, 255, 0.08);
  --dp-text: rgba(255, 255, 255, 0.92);
  --dp-text-2: rgba(255, 255, 255, 0.5);
  --dp-text-3: rgba(255, 255, 255, 0.28);
  --dp-accent: #fb923c;
  --dp-accent-2: rgba(251, 146, 60, 0.12);
  --dp-hover: rgba(255, 255, 255, 0.05);
  --dp-active-text: #fb923c;
  --dp-surface-raised: #26262c;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

/* ── Main page scrollbar (webkit) ─────────────── */
.docs-page::-webkit-scrollbar {
  width: 8px;
}
.docs-page::-webkit-scrollbar-track {
  background: transparent;
}
.docs-page::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 99px;
}
.docs-page::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.22);
}
.docs-page.docs-dark::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
}
.docs-page.docs-dark::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.28);
}

/* ── Navbar ────────────────────────────────────── */
.docs-nav {
  position: sticky;
  top: 0;
  z-index: 200;
  background: var(--dp-nav-bg);
  border-bottom: 1px solid var(--dp-border);
  backdrop-filter: blur(28px) saturate(1.9);
  -webkit-backdrop-filter: blur(28px) saturate(1.9);
  transition:
    background 0.2s,
    border-color 0.2s;
}

.docs-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 52px;
}

.docs-nav-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.docs-nav-hamburger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: var(--dp-text-2);
  cursor: pointer;
  border-radius: 6px;
  transition:
    background 0.15s,
    color 0.15s;
}
.docs-nav-hamburger:hover {
  background: var(--dp-hover);
  color: var(--dp-text);
}

.docs-nav-brand {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--dp-text-2);
  text-decoration: none;
  transition: color 0.15s;
}
.docs-nav-brand:hover {
  color: var(--dp-text);
}

.docs-nav-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15em 0.55em;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--dp-accent);
  background: var(--dp-accent-2);
  border-radius: 4px;
}

.docs-nav-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.docs-nav-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--dp-border);
  border-radius: 8px;
  background: none;
  color: var(--dp-text-2);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}
.docs-nav-icon-btn:hover {
  background: var(--dp-hover);
  color: var(--dp-text);
}

.docs-nav-back {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0.35em 0.8em;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--dp-text-2);
  text-decoration: none;
  border-radius: 8px;
  border: 1px solid var(--dp-border);
  transition:
    background 0.15s,
    color 0.15s;
}
.docs-nav-back:hover {
  background: var(--dp-hover);
  color: var(--dp-text);
}

/* Search bar */
.docs-search-bar {
  overflow: hidden;
  max-height: 0;
  border-top: 0px solid var(--dp-border);
  transition:
    max-height 0.25s ease,
    border-top-width 0.25s;
}
.docs-search-bar.is-open {
  max-height: 56px;
  border-top-width: 1px;
}

.docs-search-inner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0.65rem 1.5rem;
}

.docs-search-icon {
  color: var(--dp-text-3);
  flex-shrink: 0;
}

.docs-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: none;
  font-size: 0.875rem;
  color: var(--dp-text);
  font-family: inherit;
}
.docs-search-input::placeholder {
  color: var(--dp-text-3);
}

/* ── Layout ─────────────────────────────────────── */
.docs-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  max-width: 1280px;
  margin: 0 auto;
  min-height: calc(100vh - 52px);
}

/* ── Sidebar ─────────────────────────────────────── */
.docs-sidebar {
  position: sticky;
  top: 52px;
  height: calc(100vh - 52px);
  background: var(--dp-sidebar-bg);
  border-right: 1px solid var(--dp-border);
  overflow: hidden;
  transition:
    background 0.2s,
    border-color 0.2s;
  flex-shrink: 0;
}

.docs-sidebar-scroll {
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem 1rem 2rem;
  scrollbar-width: thin;
  scrollbar-color: var(--dp-border) transparent;
}

.docs-sidebar-scroll::-webkit-scrollbar {
  width: 4px;
}
.docs-sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.docs-sidebar-scroll::-webkit-scrollbar-thumb {
  background: var(--dp-border);
  border-radius: 99px;
}
.docs-sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--dp-text-3);
}

.docs-sidebar-section {
  margin-bottom: 1.75rem;
}

.docs-sidebar-group-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dp-text-3);
  padding: 0 0.5rem;
  margin-bottom: 0.4rem;
}

.docs-sidebar-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.docs-sidebar-link {
  display: block;
  padding: 0.42em 0.75em;
  font-size: 0.845rem;
  font-weight: 450;
  color: var(--dp-text-2);
  text-decoration: none;
  border-radius: 7px;
  transition:
    color 0.13s,
    background 0.13s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.docs-sidebar-link:hover {
  color: var(--dp-text);
  background: var(--dp-hover);
}
.docs-sidebar-link.is-active {
  color: var(--dp-active-text);
  background: var(--dp-accent-2);
  font-weight: 560;
}

.docs-sidebar-empty {
  font-size: 0.78rem;
  color: var(--dp-text-3);
  padding: 0.3em 0.75em;
  margin: 0;
}

.docs-sidebar-footer {
  padding-top: 1.5rem;
  margin-top: auto;
  border-top: 1px solid var(--dp-border);
}

.docs-sidebar-github {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--dp-text-3);
  text-decoration: none;
  padding: 0.4em 0.5em;
  border-radius: 6px;
  transition:
    color 0.15s,
    background 0.15s;
}
.docs-sidebar-github:hover {
  color: var(--dp-text);
  background: var(--dp-hover);
}

/* ── Main content ─────────────────────────────────── */
.docs-main {
  min-width: 0;
  padding: 0 0 5rem;
}

/* Breadcrumb */
.docs-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 3rem 0;
  font-size: 0.78rem;
  color: var(--dp-text-3);
}
.docs-breadcrumb-sep {
  opacity: 0.5;
}
.docs-breadcrumb-current {
  color: var(--dp-text-2);
}

/* Doc header */
.docs-doc-header {
  padding: 1rem 3rem 1.75rem;
  border-bottom: 1px solid var(--dp-border);
  margin-bottom: 0;
}

.docs-doc-title {
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin: 0 0 0.6rem;
  color: var(--dp-text);
}

.docs-doc-description {
  font-size: 1rem;
  color: var(--dp-text-2);
  margin: 0;
  font-weight: 430;
  line-height: 1.6;
}

/* Loading */
.docs-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
}

.docs-loading-ring {
  width: 28px;
  height: 28px;
  border: 2.5px solid var(--dp-border);
  border-top-color: var(--dp-accent);
  border-radius: 50%;
  animation: dp-spin 0.7s linear infinite;
}

@keyframes dp-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Pagination */
.docs-pagination {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 2.5rem 3rem 0;
  border-top: 1px solid var(--dp-border);
  margin-top: 3rem;
}

.docs-pagination-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border: 1px solid var(--dp-border);
  border-radius: 12px;
  text-decoration: none;
  color: var(--dp-text);
  background: var(--dp-surface);
  transition:
    border-color 0.15s,
    background 0.15s,
    transform 0.15s;
}
.docs-pagination-btn:hover {
  border-color: var(--dp-accent);
  background: var(--dp-accent-2);
  transform: translateY(-1px);
}
.docs-pagination-btn svg {
  flex-shrink: 0;
  color: var(--dp-text-3);
}

.docs-pagination-btn--next {
  justify-content: flex-end;
  text-align: right;
}

.docs-pagination-btn span {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.docs-pagination-label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--dp-text-3);
}

.docs-pagination-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--dp-text);
}

/* ── Responsive ───────────────────────────────────── */
@media (max-width: 900px) {
  .docs-layout {
    grid-template-columns: 1fr;
  }

  .docs-nav-hamburger {
    display: inline-flex;
  }

  .docs-sidebar {
    position: fixed;
    top: 52px;
    left: 0;
    height: calc(100vh - 52px);
    width: 280px;
    z-index: 150;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.3, 0, 0, 1);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
  }
  .docs-sidebar.is-open {
    transform: translateX(0);
  }

  .docs-sidebar-overlay {
    position: fixed;
    inset: 52px 0 0 0;
    z-index: 140;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(2px);
  }

  .docs-breadcrumb,
  .docs-doc-header {
    padding-inline: 1.5rem;
  }
  .docs-pagination {
    padding-inline: 1.5rem;
  }
}

@media (max-width: 540px) {
  .docs-pagination {
    grid-template-columns: 1fr;
  }
  .docs-pagination-btn--next {
    justify-content: flex-start;
    text-align: left;
  }
  .docs-nav-back span {
    display: none;
  }
  .docs-doc-title {
    font-size: 1.4rem;
  }
}
</style>
