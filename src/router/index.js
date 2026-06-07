import { createRouter, createWebHistory } from 'vue-router'

const COMMUNITY_META = {
  title: 'OFPlayer Community',
  description: 'OFPlayer Community is a local-first web music player and music toolkit.',
  keywords: 'OFPlayer, community music player, local-first music player, music toolkit',
  canonical: '',
  robots: 'noindex, nofollow',
  lang: 'en',
}

function seoMeta(overrides = {}) {
  return {
    ...COMMUNITY_META,
    ...overrides,
  }
}

const routes = [
  {
    path: '/',
    redirect: '/app',
  },
  {
    path: '/product',
    redirect: '/app',
  },
  {
    path: '/app',
    component: () => import('../pages/PlayerPage.vue'),
    meta: seoMeta({
      title: 'OFPlayer Community Web Player',
      description: 'Open the local-first OFPlayer web player.',
    }),
  },
  {
    path: '/self-hosted-music-player',
    redirect: '/docs',
  },
  {
    path: '/local-music-player',
    redirect: '/app',
  },
  {
    path: '/navidrome-client',
    redirect: '/tutorials',
  },
  {
    path: '/why-ofplayer',
    redirect: '/docs',
  },
  {
    path: '/download',
    redirect: '/app',
  },
  {
    path: '/privacy',
    redirect: '/docs',
  },
  {
    path: '/refund',
    redirect: '/docs',
  },
  {
    path: '/terms',
    redirect: '/docs',
  },
  {
    path: '/docs/:slug?',
    component: () => import('../pages/DocsPage.vue'),
    meta: seoMeta({
      title: 'OFPlayer Community Docs',
      description: 'OFPlayer Community usage and development documentation.',
    }),
  },
  {
    path: '/tutorials/:slug?',
    component: () => import('../pages/TutorialsPage.vue'),
    meta: seoMeta({
      title: 'OFPlayer Community Tutorials',
      description: 'Community tutorials for local and self-hosted music workflows.',
    }),
  },
  {
    path: '/tools',
    component: () => import('../pages/tools/ToolsIndexPage.vue'),
    meta: seoMeta({
      title: 'OFPlayer Community Music Toolkit',
      description: 'Local-first music tools that run in the browser.',
    }),
  },
  {
    path: '/tools/lyrics/lrc-offset',
    component: () => import('../pages/tools/lyrics/LrcOffsetPage.vue'),
    meta: seoMeta(),
  },
  {
    path: '/tools/lyrics/lrc-validator',
    component: () => import('../pages/tools/lyrics/LrcValidatorPage.vue'),
    meta: seoMeta(),
  },
  {
    path: '/tools/lyrics/lrc-to-srt',
    component: () => import('../pages/tools/lyrics/LrcToSrtPage.vue'),
    meta: seoMeta(),
  },
  {
    path: '/tools/lyrics/srt-to-lrc',
    component: () => import('../pages/tools/lyrics/SrtToLrcPage.vue'),
    meta: seoMeta(),
  },
  {
    path: '/tools/audio/audio-metadata-viewer',
    component: () => import('../pages/tools/audio/AudioMetadataViewerPage.vue'),
    meta: seoMeta(),
  },
  {
    path: '/tools/audio/audio-converter',
    component: () => import('../pages/tools/audio/AudioConverterPage.vue'),
    meta: seoMeta(),
  },
  {
    path: '/tools/audio/spectrum-viewer',
    component: () => import('../pages/tools/audio/SpectrumViewerPage.vue'),
    meta: seoMeta(),
  },
  {
    path: '/tools/audio/lossless-detector',
    component: () => import('../pages/tools/audio/LosslessDetectorPage.vue'),
    meta: seoMeta(),
  },
  {
    path: '/tools/audio/loudness-scanner',
    component: () => import('../pages/tools/audio/LoudnessScannerPage.vue'),
    meta: seoMeta(),
  },
  {
    path: '/tools/audio/cue-splitter',
    component: () => import('../pages/tools/audio/CueSplitterPage.vue'),
    meta: seoMeta(),
  },
  {
    path: '/tools/library/filename-normalizer',
    component: () => import('../pages/tools/library/FilenameNormalizerPage.vue'),
    meta: seoMeta(),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

function setMeta(name, content) {
  if (!content) return
  const el = document.querySelector(`meta[name="${name}"]`)
  if (el) {
    el.setAttribute('content', content)
    return
  }
  const next = document.createElement('meta')
  next.setAttribute('name', name)
  next.setAttribute('content', content)
  document.head.appendChild(next)
}

function setCanonical(href) {
  const current = document.querySelector('link[rel="canonical"]')
  if (!href) {
    current?.remove()
    return
  }
  const link = current ?? document.createElement('link')
  link.rel = 'canonical'
  link.setAttribute('href', href)
  if (!current) document.head.appendChild(link)
}

router.afterEach((to) => {
  const meta = {
    ...COMMUNITY_META,
    ...(to.meta ?? {}),
  }

  document.title = meta.title
  setMeta('description', meta.description)
  setMeta('keywords', meta.keywords)
  setMeta('robots', meta.robots)
  setCanonical(meta.canonical)
  document.documentElement.lang = meta.lang
})
