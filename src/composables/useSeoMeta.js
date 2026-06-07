import { useHead } from '@unhead/vue'
import { computed } from 'vue'

export function useSeoMeta(options = {}) {
  const {
    title,
    description,
    keywords,
    canonical,
    ogImage = '/og-image.png',
    ogType = 'website',
    ogLocale = 'zh_CN',
    twitterCard = 'summary_large_image',
  } = options

  const head = {
    title: computed(() => title || 'OFPlayer — 本地音乐播放器 | 自托管网页音乐播放器客户端'),
    meta: [
      {
        name: 'description',
        content: computed(
          () =>
            description ||
            'OFPlayer 是一个本地优先的网页音乐播放器，支持自托管部署。导入本地音频文件即可播放，支持 FLAC、MP3 等格式。无需账号，隐私优先，提供桌面级播放体验。',
        ),
      },
      {
        name: 'keywords',
        content: computed(
          () =>
            keywords ||
            'OFPlayer, ofplayer, 本地播放器, 本地音乐播放器, 自托管播放器, 播放器客户端, 网页音乐播放器, web music player, local music player, self-hosted music player, music player client, 音乐播放器, 免费音乐播放器, 无损音乐播放器, FLAC player, MP3 player, lossless audio player, 开源播放器, 桌面音乐播放器, 浏览器播放器, 隐私音乐播放器',
        ),
      },
      {
        name: 'robots',
        content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      },
      // Open Graph
      {
        property: 'og:type',
        content: ogType,
      },
      {
        property: 'og:site_name',
        content: 'OFPlayer',
      },
      {
        property: 'og:title',
        content: computed(() => title || 'OFPlayer — 本地音乐播放器 | 自托管网页音乐播放器客户端'),
      },
      {
        property: 'og:description',
        content: computed(
          () =>
            description ||
            'OFPlayer 是一个本地优先的网页音乐播放器，支持自托管部署。导入本地音频文件即可播放，支持 FLAC、MP3 等格式。无需账号，隐私优先。',
        ),
      },
      {
        property: 'og:url',
        content: computed(() => canonical || '/'),
      },
      {
        property: 'og:image',
        content: ogImage,
      },
      {
        property: 'og:image:width',
        content: '1200',
      },
      {
        property: 'og:image:height',
        content: '630',
      },
      {
        property: 'og:image:alt',
        content: 'OFPlayer - 本地音乐播放器界面预览',
      },
      {
        property: 'og:locale',
        content: ogLocale,
      },
      {
        property: 'og:locale:alternate',
        content: 'en_US',
      },
      // Twitter Card
      {
        name: 'twitter:card',
        content: twitterCard,
      },
      {
        name: 'twitter:title',
        content: computed(() => title || 'OFPlayer — 本地音乐播放器 | 自托管网页音乐播放器客户端'),
      },
      {
        name: 'twitter:description',
        content: computed(
          () =>
            description ||
            'OFPlayer 是一个本地优先的网页音乐播放器，支持自托管部署。导入本地音频文件即可播放。',
        ),
      },
      {
        name: 'twitter:image',
        content: ogImage,
      },
      {
        name: 'twitter:image:alt',
        content: 'OFPlayer - 本地音乐播放器界面预览',
      },
    ],
    link: [
      {
        rel: 'canonical',
        href: computed(() => canonical || '/'),
      },
    ],
  }

  return useHead(head)
}

export function usePageSeoMeta(pageMeta = {}) {
  const { title, description, keywords, canonical, ogImage } = pageMeta

  const fullTitle = title
    ? `${title} | OFPlayer`
    : 'OFPlayer — 本地音乐播放器 | 自托管网页音乐播放器客户端'

  const fullDescription =
    description ||
    'OFPlayer 是一个本地优先的网页音乐播放器，支持自托管部署。导入本地音频文件即可播放，支持 FLAC、MP3 等格式。无需账号，隐私优先，提供桌面级播放体验。'

  const fullKeywords = keywords
    ? `${keywords}, OFPlayer, ofplayer, 本地播放器, 本地音乐播放器, 自托管播放器, 播放器客户端`
    : 'OFPlayer, ofplayer, 本地播放器, 本地音乐播放器, 自托管播放器, 播放器客户端, 网页音乐播放器, web music player, local music player, self-hosted music player, music player client, 音乐播放器, 免费音乐播放器, 无损音乐播放器, FLAC player, MP3 player, lossless audio player, 开源播放器, 桌面音乐播放器, 浏览器播放器, 隐私音乐播放器'

  const fullCanonical = canonical || '/'

  return useSeoMeta({
    title: fullTitle,
    description: fullDescription,
    keywords: fullKeywords,
    canonical: fullCanonical,
    ogImage: ogImage || '/og-image.png',
  })
}
