<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Menu,
  Moon,
  Search,
  Server,
  Sun,
  X,
} from 'lucide-vue-next'
import MdRenderer from '../components/MdRenderer.vue'
import { useSitePrefs } from '../composables/useSitePrefs.js'
import {
  getTutorial,
  getTutorialCategory,
  normalizeTutorialSlug,
  tutorialCategories,
  tutorialList,
  tutorialRouteForMarkdownHref,
} from '../content/tutorials.js'

const route = useRoute()
const { isDark, toggleDark } = useSitePrefs()

const pageRef = ref(null)
const sidebarOpen = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')
const markdownContent = ref('')
const isLoading = ref(false)

const hasSlug = computed(() => Boolean(route.params.slug))
const currentSlug = computed(() => normalizeTutorialSlug(route.params.slug || ''))
const currentTutorial = computed(() => (hasSlug.value ? getTutorial(currentSlug.value) : null))
const isNotFound = computed(() => hasSlug.value && !currentTutorial.value)

const currentIndex = computed(() => {
  if (!currentTutorial.value) return -1
  return tutorialList.findIndex((tutorial) => tutorial.slug === currentTutorial.value.slug)
})

const prevTutorial = computed(() => {
  const index = currentIndex.value
  return index > 0 ? tutorialList[index - 1] : null
})

const nextTutorial = computed(() => {
  const index = currentIndex.value
  return index >= 0 && index < tutorialList.length - 1 ? tutorialList[index + 1] : null
})

const filteredTutorials = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return tutorialList

  return tutorialList.filter((tutorial) => {
    const category = getTutorialCategory(tutorial.category)
    return [
      tutorial.title,
      tutorial.description,
      tutorial.badge,
      category?.label,
      ...(tutorial.keywords || []),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  })
})

const groupedTutorials = computed(() =>
  tutorialCategories
    .map((category) => ({
      ...category,
      tutorials: filteredTutorials.value.filter((tutorial) => tutorial.category === category.key),
    }))
    .filter((category) => category.tutorials.length),
)

const renderedMarkdown = computed(() => rewriteTutorialLinks(markdownContent.value))

function categoryIcon(categoryKey) {
  if (categoryKey === 'troubleshooting') return AlertTriangle
  if (categoryKey === 'setup') return Server
  return BookOpen
}

function categoryLabel(categoryKey) {
  return getTutorialCategory(categoryKey)?.label || '教程'
}

function rewriteTutorialLinks(content) {
  return String(content || '').replace(
    /\]\((\.\/)?([^)\s]+\.md)(#[^)]+)?\)/g,
    (match, prefix, href, hash = '') => {
      const nextHref = tutorialRouteForMarkdownHref(`${href}${hash}`)
      return nextHref === `${href}${hash}` ? match : `](${nextHref})`
    },
  )
}

async function loadTutorial() {
  sidebarOpen.value = false

  if (!hasSlug.value || !currentTutorial.value) {
    markdownContent.value = ''
    isLoading.value = false
    return
  }

  isLoading.value = true
  markdownContent.value = ''

  try {
    const response = await fetch(currentTutorial.value.path)
    if (!response.ok) {
      markdownContent.value = '# 教程未找到\n\n这篇教程暂时无法打开，请返回教程目录选择其他文章。'
      return
    }

    markdownContent.value = await response.text()
  } catch {
    markdownContent.value = '# 加载失败\n\n教程内容加载失败，请稍后重试。'
  } finally {
    isLoading.value = false
  }
}

function resetSearch() {
  searchQuery.value = ''
  searchOpen.value = false
}

onMounted(loadTutorial)

watch(
  () => route.params.slug,
  () => {
    loadTutorial()
    pageRef.value?.scrollTo({ top: 0, behavior: 'auto' })
  },
)
</script>

<template>
  <div
    ref="pageRef"
    class="tutorials-page"
    :class="{ 'docs-dark': isDark, 'tutorials-dark': isDark }"
  >
    <nav class="tutorials-nav">
      <div class="tutorials-nav__inner">
        <div class="tutorials-nav__left">
          <button
            class="tutorials-nav__hamburger"
            type="button"
            aria-label="打开教程导航"
            @click="sidebarOpen = !sidebarOpen"
          >
            <component :is="sidebarOpen ? X : Menu" :size="18" />
          </button>
          <RouterLink class="tutorials-nav__brand" to="/">OFPLAYER</RouterLink>
          <span class="tutorials-nav__badge">教程</span>
        </div>

        <div class="tutorials-nav__right">
          <button
            class="tutorials-nav__icon"
            type="button"
            :aria-label="searchOpen ? '关闭搜索' : '搜索教程'"
            @click="searchOpen = !searchOpen"
          >
            <component :is="searchOpen ? X : Search" :size="16" />
          </button>
          <button
            class="tutorials-nav__icon"
            type="button"
            :aria-label="isDark ? '切换亮色模式' : '切换暗色模式'"
            @click="toggleDark"
          >
            <component :is="isDark ? Sun : Moon" :size="16" />
          </button>
          <RouterLink class="tutorials-nav__back" to="/">
            <ArrowLeft :size="14" />
            <span>返回主页</span>
          </RouterLink>
        </div>
      </div>

      <div class="tutorials-search" :class="{ 'is-open': searchOpen }">
        <div class="tutorials-search__inner">
          <Search :size="15" class="tutorials-search__icon" />
          <input
            v-model="searchQuery"
            class="tutorials-search__input"
            type="search"
            placeholder="搜索 OpenList、WebDAV、Navidrome..."
            @keydown.escape="resetSearch"
          />
        </div>
      </div>
    </nav>

    <div class="tutorials-layout">
      <aside class="tutorials-sidebar" :class="{ 'is-open': sidebarOpen }">
        <div class="tutorials-sidebar__scroll">
          <RouterLink
            class="tutorials-sidebar__home"
            to="/tutorials"
            :class="{ 'is-active': !hasSlug }"
          >
            <BookOpen :size="14" />
            <span>全部教程</span>
          </RouterLink>

          <section
            v-for="group in groupedTutorials"
            :key="group.key"
            class="tutorials-sidebar__group"
          >
            <div class="tutorials-sidebar__group-title">
              <component :is="categoryIcon(group.key)" :size="13" />
              <span>{{ group.label }}</span>
            </div>
            <RouterLink
              v-for="tutorial in group.tutorials"
              :key="tutorial.slug"
              class="tutorials-sidebar__link"
              :class="{ 'is-active': currentTutorial?.slug === tutorial.slug }"
              :to="tutorial.href"
            >
              {{ tutorial.title }}
            </RouterLink>
          </section>

          <p v-if="!groupedTutorials.length" class="tutorials-sidebar__empty">没有匹配的教程。</p>
        </div>
      </aside>

      <div v-if="sidebarOpen" class="tutorials-sidebar__overlay" @click="sidebarOpen = false" />

      <main class="tutorials-main">
        <section v-if="!hasSlug" class="tutorials-index">
          <p class="tutorials-index__eyebrow">OFPlayer Tutorials</p>
          <h1>把自己的音乐库跑起来。</h1>
          <p class="tutorials-index__intro">
            从 OpenList、Navidrome 到 OFPlayer
            连接与排查，教程会保持面向实际部署，不把你带进没必要的复杂度。
          </p>

          <div class="tutorials-index__grid">
            <RouterLink
              v-for="tutorial in filteredTutorials"
              :key="tutorial.slug"
              class="tutorial-card"
              :to="tutorial.href"
            >
              <span class="tutorial-card__meta"
                >{{ categoryLabel(tutorial.category) }} · {{ tutorial.readTime }}</span
              >
              <strong>{{ tutorial.title }}</strong>
              <span>{{ tutorial.description }}</span>
              <span class="tutorial-card__cta">
                阅读教程
                <ChevronRight :size="15" />
              </span>
            </RouterLink>
          </div>
        </section>

        <section v-else-if="isNotFound" class="tutorials-state">
          <p class="tutorials-index__eyebrow">Not Found</p>
          <h1>教程未找到。</h1>
          <p>这篇教程可能已经移动。回到教程目录重新选择一篇文章。</p>
          <RouterLink class="tutorials-state__button" to="/tutorials">返回教程目录</RouterLink>
        </section>

        <section v-else class="tutorials-article">
          <div v-if="isLoading" class="tutorials-loading">
            <span class="tutorials-loading__ring" />
          </div>

          <template v-else>
            <div class="tutorials-breadcrumb">
              <RouterLink to="/tutorials">教程</RouterLink>
              <span>/</span>
              <span>{{ categoryLabel(currentTutorial.category) }}</span>
            </div>

            <header class="tutorials-article__header">
              <div class="tutorials-article__meta">
                <span>{{ currentTutorial.badge }}</span>
                <span>{{ currentTutorial.readTime }}</span>
              </div>
              <h1>{{ currentTutorial.title }}</h1>
              <p>{{ currentTutorial.description }}</p>
            </header>

            <MdRenderer :content="renderedMarkdown" :dark="isDark" />

            <footer class="tutorials-pagination">
              <RouterLink
                v-if="prevTutorial"
                class="tutorials-pagination__link tutorials-pagination__link--prev"
                :to="prevTutorial.href"
              >
                <ChevronLeft :size="16" />
                <span>
                  <small>上一篇</small>
                  {{ prevTutorial.title }}
                </span>
              </RouterLink>
              <div v-else />

              <RouterLink
                v-if="nextTutorial"
                class="tutorials-pagination__link tutorials-pagination__link--next"
                :to="nextTutorial.href"
              >
                <span>
                  <small>下一篇</small>
                  {{ nextTutorial.title }}
                </span>
                <ChevronRight :size="16" />
              </RouterLink>
              <div v-else />
            </footer>
          </template>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.tutorials-page {
  --dp-bg: var(--of-bg);
  --dp-sidebar-bg: var(--of-surface);
  --dp-nav-bg: var(--of-surface-glass);
  --dp-surface: var(--of-surface);
  --dp-border: var(--of-divider);
  --dp-text: var(--of-ink);
  --dp-text-2: var(--of-ink-muted);
  --dp-text-3: var(--of-ink-subtle);
  --dp-accent: var(--of-warm);
  --dp-accent-2: var(--of-warm-soft);
  --dp-hover: var(--of-state-layer-hover, var(--of-bg-soft));
  --dp-active-text: var(--of-warm);
  --dp-surface-raised: var(--of-surface-raised);
  --dp-inline-code: var(--of-surface-sunken);
  --dp-inline-code-text: var(--of-warm-active);

  min-height: 100vh;
  height: 100vh;
  overflow-y: auto;
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
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: var(--of-scrollbar-hover) transparent;
}

.tutorials-nav {
  position: sticky;
  top: 0;
  z-index: 200;
  background: var(--dp-nav-bg);
  border-bottom: 1px solid var(--dp-border);
  backdrop-filter: blur(28px) saturate(1.8);
  -webkit-backdrop-filter: blur(28px) saturate(1.8);
}

.tutorials-nav__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1280px;
  height: 54px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.tutorials-nav__left,
.tutorials-nav__right {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.tutorials-nav__hamburger,
.tutorials-nav__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--dp-border);
  border-radius: 8px;
  background: transparent;
  color: var(--dp-text-2);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}

.tutorials-nav__hamburger {
  display: none;
}

.tutorials-nav__hamburger:hover,
.tutorials-nav__icon:hover {
  background: var(--dp-hover);
  color: var(--dp-text);
  border-color: var(--of-border);
}

.tutorials-nav__brand {
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--dp-text-2);
  text-decoration: none;
}

.tutorials-nav__brand:hover {
  color: var(--dp-text);
}

.tutorials-nav__badge {
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.5rem;
  border-radius: 6px;
  background: var(--dp-accent-2);
  color: var(--dp-accent);
  font-size: 0.72rem;
  font-weight: 650;
}

.tutorials-nav__back {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.42rem 0.72rem;
  border: 1px solid var(--dp-border);
  border-radius: 8px;
  color: var(--dp-text-2);
  font-size: 0.84rem;
  font-weight: 520;
  text-decoration: none;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}

.tutorials-nav__back:hover {
  background: var(--dp-hover);
  color: var(--dp-text);
  border-color: var(--of-border);
}

.tutorials-search {
  overflow: hidden;
  max-height: 0;
  border-top: 0 solid var(--dp-border);
  transition:
    max-height 0.2s ease,
    border-top-width 0.2s ease;
}

.tutorials-search.is-open {
  max-height: 56px;
  border-top-width: 1px;
}

.tutorials-search__inner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0.65rem 1.5rem;
}

.tutorials-search__icon {
  color: var(--dp-text-3);
}

.tutorials-search__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--dp-text);
  font: inherit;
  font-size: 0.9rem;
}

.tutorials-search__input::placeholder {
  color: var(--dp-text-3);
}

.tutorials-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  max-width: 1280px;
  min-height: calc(100vh - 54px);
  margin: 0 auto;
}

.tutorials-sidebar {
  position: sticky;
  top: 54px;
  height: calc(100vh - 54px);
  border-right: 1px solid var(--dp-border);
  background: var(--dp-sidebar-bg);
  overflow: hidden;
}

.tutorials-sidebar__scroll {
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem 1rem 2rem;
  scrollbar-width: thin;
  scrollbar-color: var(--of-scrollbar-hover) transparent;
}

.tutorials-sidebar__home,
.tutorials-sidebar__link {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 34px;
  padding: 0.42rem 0.65rem;
  border-radius: 8px;
  color: var(--dp-text-2);
  text-decoration: none;
  font-size: 0.86rem;
  font-weight: 500;
  transition:
    background 0.15s,
    color 0.15s;
}

.tutorials-sidebar__home {
  margin-bottom: 1.25rem;
}

.tutorials-sidebar__link {
  align-items: flex-start;
  line-height: 1.35;
}

.tutorials-sidebar__home:hover,
.tutorials-sidebar__link:hover {
  background: var(--dp-hover);
  color: var(--dp-text);
}

.tutorials-sidebar__home.is-active,
.tutorials-sidebar__link.is-active {
  background: var(--dp-accent-2);
  color: var(--dp-active-text);
}

.tutorials-sidebar__group {
  margin-bottom: 1.45rem;
}

.tutorials-sidebar__group-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 0.4rem;
  padding: 0 0.45rem;
  color: var(--dp-text-3);
  font-size: 0.74rem;
  font-weight: 700;
}

.tutorials-sidebar__empty {
  margin: 0;
  padding: 0.5rem 0.65rem;
  color: var(--dp-text-3);
  font-size: 0.84rem;
}

.tutorials-main {
  min-width: 0;
  padding-bottom: 5rem;
}

.tutorials-index,
.tutorials-state {
  max-width: 1020px;
  padding: 6.5rem 3rem 4rem;
}

.tutorials-index__eyebrow {
  margin: 0 0 0.95rem;
  color: var(--dp-accent);
  font-size: 0.84rem;
  font-weight: 760;
}

.tutorials-index h1,
.tutorials-state h1 {
  max-width: 760px;
  margin: 0;
  color: var(--dp-text);
  font-size: 3.15rem;
  line-height: 1.05;
  font-weight: 850;
}

.tutorials-index__intro,
.tutorials-state p {
  max-width: 640px;
  margin: 1.25rem 0 0;
  color: var(--dp-text-2);
  font-size: 1.05rem;
  line-height: 1.75;
}

.tutorials-index__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 3rem;
}

.tutorial-card {
  display: flex;
  flex-direction: column;
  min-height: 210px;
  padding: 1.35rem;
  border: 1px solid var(--dp-border);
  border-radius: 8px;
  background: var(--dp-surface);
  color: var(--dp-text);
  text-decoration: none;
  box-shadow: var(--of-shadow-sm);
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.tutorial-card:hover {
  transform: translateY(-2px);
  border-color: var(--of-warm-border);
  box-shadow: var(--of-shadow-md);
}

.tutorial-card__meta {
  margin-bottom: 0.85rem;
  color: var(--dp-accent);
  font-size: 0.78rem;
  font-weight: 700;
}

.tutorial-card strong {
  color: var(--dp-text);
  font-size: 1.22rem;
  line-height: 1.35;
}

.tutorial-card > span:not(.tutorial-card__meta):not(.tutorial-card__cta) {
  margin-top: 0.7rem;
  color: var(--dp-text-2);
  line-height: 1.65;
}

.tutorial-card__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: auto;
  padding-top: 1rem;
  color: var(--dp-text);
  font-size: 0.86rem;
  font-weight: 650;
}

.tutorials-state__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 1.6rem;
  padding: 0.7rem 1rem;
  border-radius: 8px;
  background: var(--dp-text);
  color: var(--dp-bg);
  text-decoration: none;
  font-weight: 680;
}

.tutorials-article {
  padding-bottom: 2rem;
}

.tutorials-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 3rem 0;
  color: var(--dp-text-3);
  font-size: 0.82rem;
}

.tutorials-breadcrumb a {
  color: var(--dp-text-2);
  text-decoration: none;
}

.tutorials-breadcrumb a:hover {
  color: var(--dp-text);
}

.tutorials-article__header {
  padding: 1rem 3rem 1.8rem;
  border-bottom: 1px solid var(--dp-border);
}

.tutorials-article__meta {
  display: flex;
  gap: 0.55rem;
  margin-bottom: 0.75rem;
}

.tutorials-article__meta span {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 0.55rem;
  border-radius: 6px;
  background: var(--dp-accent-2);
  color: var(--dp-accent);
  font-size: 0.75rem;
  font-weight: 700;
}

.tutorials-article__header h1 {
  max-width: 780px;
  margin: 0;
  color: var(--dp-text);
  font-size: 2.35rem;
  line-height: 1.18;
  font-weight: 850;
}

.tutorials-article__header p {
  max-width: 720px;
  margin: 0.9rem 0 0;
  color: var(--dp-text-2);
  font-size: 1rem;
  line-height: 1.7;
}

.tutorials-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 42vh;
}

.tutorials-loading__ring {
  width: 28px;
  height: 28px;
  border: 3px solid var(--dp-border);
  border-top-color: var(--dp-accent);
  border-radius: 50%;
  animation: tutorials-spin 0.75s linear infinite;
}

@keyframes tutorials-spin {
  to {
    transform: rotate(360deg);
  }
}

.tutorials-pagination {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 3rem;
  padding: 2.5rem 3rem 0;
  border-top: 1px solid var(--dp-border);
}

.tutorials-pagination__link {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem;
  border: 1px solid var(--dp-border);
  border-radius: 8px;
  background: var(--dp-surface);
  color: var(--dp-text);
  text-decoration: none;
  transition:
    background 0.15s,
    border-color 0.15s,
    transform 0.15s;
}

.tutorials-pagination__link:hover {
  transform: translateY(-1px);
  background: var(--dp-accent-2);
  border-color: var(--of-warm-border);
}

.tutorials-pagination__link span {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.tutorials-pagination__link small {
  color: var(--dp-text-3);
  font-size: 0.72rem;
  font-weight: 700;
}

.tutorials-pagination__link--next {
  justify-content: flex-end;
  text-align: right;
}

@media (max-width: 980px) {
  .tutorials-nav__hamburger {
    display: inline-flex;
  }

  .tutorials-layout {
    grid-template-columns: 1fr;
  }

  .tutorials-sidebar {
    position: fixed;
    top: 54px;
    left: 0;
    z-index: 160;
    width: 286px;
    transform: translateX(-100%);
    transition: transform 0.24s ease;
    box-shadow: var(--of-shadow-lg);
  }

  .tutorials-sidebar.is-open {
    transform: translateX(0);
  }

  .tutorials-sidebar__overlay {
    position: fixed;
    inset: 54px 0 0;
    z-index: 150;
    background: var(--of-dialog-overlay);
  }

  .tutorials-index,
  .tutorials-state {
    padding-inline: 1.5rem;
  }

  .tutorials-breadcrumb,
  .tutorials-article__header,
  .tutorials-pagination {
    padding-inline: 1.5rem;
  }
}

@media (max-width: 720px) {
  .tutorials-index,
  .tutorials-state {
    padding-top: 4.4rem;
  }

  .tutorials-index h1,
  .tutorials-state h1 {
    font-size: 2.2rem;
  }

  .tutorials-index__grid {
    grid-template-columns: 1fr;
  }

  .tutorials-article__header h1 {
    font-size: 1.75rem;
  }

  .tutorials-pagination {
    grid-template-columns: 1fr;
  }

  .tutorials-pagination__link--next {
    justify-content: flex-start;
    text-align: left;
  }
}

@media (max-width: 560px) {
  .tutorials-nav__inner {
    padding-inline: 1rem;
  }

  .tutorials-nav__back span {
    display: none;
  }

  .tutorials-nav__badge {
    display: none;
  }
}
</style>
