export const tutorialCategories = [
  {
    key: 'setup',
    label: '搭建',
    description: '从 OpenList、Navidrome 等方案开始，把自己的音乐库跑起来。',
  },
  {
    key: 'connect',
    label: '连接',
    description: '把已经搭好的音乐库接入 OFPlayer。',
  },
  {
    key: 'troubleshooting',
    label: '排查',
    description: '连接、路径、认证和性能问题的处理方法。',
  },
  {
    key: 'migration',
    label: '迁移参考',
    description: '给存量环境保留的核对与迁移资料。',
  },
]

export const tutorialOrder = [
  'openlist-setup-guide',
  'ofplayer-webdav-connection-guide',
  'navidrome-setup-guide',
  'webdav-troubleshooting',
  'alist-webdav-music-server-setup',
]

const tutorials = {
  'openlist-setup-guide': {
    slug: 'openlist-setup-guide',
    sourceSlug: '02-openlist-setup-guide',
    title: 'OpenList 搭建教程',
    description: '当前推荐的 WebDAV 文件管理方案，适合新部署自建音乐库。',
    category: 'setup',
    path: '/tutorials/02-openlist-setup-guide.md',
    readTime: '12 min',
    badge: '推荐',
    keywords: ['OpenList 搭建教程', 'WebDAV 音乐库', '自建音乐库', 'OFPlayer 教程'],
    seoTitle: 'OpenList 搭建教程 — 用 WebDAV 管理你的音乐库 | OFPlayer',
    seoDescription:
      '从安装、Docker 部署、WebDAV 配置到音乐目录组织，带你用 OpenList 搭建适合 OFPlayer 的自建音乐库。',
    relatedSlugs: ['ofplayer-webdav-connection-guide', 'webdav-troubleshooting'],
  },
  'ofplayer-webdav-connection-guide': {
    slug: 'ofplayer-webdav-connection-guide',
    sourceSlug: '03-ofplayer-webdav-connection-guide',
    title: 'OFPlayer 连接 WebDAV 音乐库',
    description: '把 OpenList、AList 存量环境或其他 WebDAV 服务接入 OFPlayer。',
    category: 'connect',
    path: '/tutorials/03-ofplayer-webdav-connection-guide.md',
    readTime: '13 min',
    badge: '必读',
    keywords: ['OFPlayer WebDAV', 'WebDAV 音乐播放器', '连接远程音乐库', 'Subsonic Navidrome'],
    seoTitle: 'OFPlayer 连接 WebDAV 音乐库完整指南',
    seoDescription:
      '了解如何在 OFPlayer 中连接 WebDAV 或 Subsonic/Navidrome 音乐库，包含地址、根路径、认证和同步说明。',
    relatedSlugs: ['openlist-setup-guide', 'navidrome-setup-guide', 'webdav-troubleshooting'],
  },
  'navidrome-setup-guide': {
    slug: 'navidrome-setup-guide',
    sourceSlug: '04-navidrome-setup-guide',
    title: 'Navidrome 私人音乐服务搭建',
    description: '用 Navidrome 搭一个兼容 Subsonic API 的私人音乐服务器。',
    category: 'setup',
    path: '/tutorials/04-navidrome-setup-guide.md',
    readTime: '12 min',
    badge: '进阶',
    keywords: ['Navidrome 搭建教程', 'Subsonic 客户端', '私人音乐服务器', '自托管音乐'],
    seoTitle: 'Navidrome 搭建教程 — 私人音乐服务器与 OFPlayer 连接指南',
    seoDescription:
      '通过 Docker 或二进制部署 Navidrome，配置音乐目录、多用户和 Subsonic API，并在 OFPlayer 中连接。',
    relatedSlugs: ['ofplayer-webdav-connection-guide', 'openlist-setup-guide'],
  },
  'webdav-troubleshooting': {
    slug: 'webdav-troubleshooting',
    sourceSlug: '05-webdav-troubleshooting',
    title: 'WebDAV 音乐库排查指南',
    description: '从连接失败、认证、路径到播放卡顿，按顺序定位问题。',
    category: 'troubleshooting',
    path: '/tutorials/05-webdav-troubleshooting.md',
    readTime: '15 min',
    badge: '排查',
    keywords: ['WebDAV 排查', 'OFPlayer 连接失败', 'WebDAV 401', 'WebDAV 404', '音乐库同步问题'],
    seoTitle: 'WebDAV 音乐库常见问题排查指南 | OFPlayer',
    seoDescription:
      'WebDAV 连不上、路径错误、认证失败或播放卡顿时，按这份 OFPlayer 音乐库排查清单逐项处理。',
    relatedSlugs: ['ofplayer-webdav-connection-guide', 'openlist-setup-guide'],
  },
  'alist-webdav-music-server-setup': {
    slug: 'alist-webdav-music-server-setup',
    sourceSlug: '01-alist-webdav-music-server-setup',
    title: 'AList WebDAV 存量用户参考',
    description: '给已经部署 AList 的用户核对配置，也可作为迁移前参考。',
    category: 'migration',
    path: '/tutorials/01-alist-webdav-music-server-setup.md',
    readTime: '14 min',
    badge: '存量',
    keywords: ['AList WebDAV', 'AList 音乐库', 'AList 迁移 OpenList', 'WebDAV 音乐服务'],
    seoTitle: 'AList WebDAV 音乐库搭建参考 — 存量用户配置核对',
    seoDescription:
      '已经使用 AList 的用户可用这篇核对 WebDAV 地址、挂载路径、Docker 配置和 OFPlayer 连接前准备。',
    relatedSlugs: ['openlist-setup-guide', 'ofplayer-webdav-connection-guide'],
  },
}

export const tutorialList = tutorialOrder.map((slug) => ({
  ...tutorials[slug],
  href: `/tutorials/${slug}`,
}))

export function normalizeTutorialSlug(value = '') {
  return decodeURIComponent(String(value || ''))
    .replace(/^\/?tutorials\//, '')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .replace(/\.md$/i, '')
}

const tutorialAliasMap = new Map()

for (const tutorial of tutorialList) {
  tutorialAliasMap.set(tutorial.slug, tutorial.slug)
  tutorialAliasMap.set(tutorial.sourceSlug, tutorial.slug)
  tutorialAliasMap.set(`${tutorial.sourceSlug}.md`, tutorial.slug)
  tutorialAliasMap.set(`${tutorial.slug}.md`, tutorial.slug)
}

tutorialAliasMap.set('README', '')
tutorialAliasMap.set('README.md', '')

export function getTutorial(slug) {
  const normalized = normalizeTutorialSlug(slug)
  const canonicalSlug = tutorialAliasMap.get(normalized) ?? normalized
  return canonicalSlug
    ? tutorialList.find((tutorial) => tutorial.slug === canonicalSlug) || null
    : null
}

export function getTutorialCategory(categoryKey) {
  return tutorialCategories.find((category) => category.key === categoryKey) || null
}

export function tutorialRouteForMarkdownHref(href) {
  const cleanHref = String(href || '')
  const [pathPart, hashPart] = cleanHref.split('#')
  const normalized = normalizeTutorialSlug(pathPart)
  const canonicalSlug = tutorialAliasMap.get(normalized)

  if (canonicalSlug === '') return `/tutorials${hashPart ? `#${hashPart}` : ''}`
  if (!canonicalSlug) return cleanHref

  return `/tutorials/${canonicalSlug}${hashPart ? `#${hashPart}` : ''}`
}
