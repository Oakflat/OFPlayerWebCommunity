<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import shell from 'highlight.js/lib/languages/shell'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import ini from 'highlight.js/lib/languages/ini'
import markdown from 'highlight.js/lib/languages/markdown'
import diff from 'highlight.js/lib/languages/diff'
import DOMPurify from 'dompurify'

// Register only the languages actually used in OFPlayer docs
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('shell', shell)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('ini', ini)
hljs.registerLanguage('toml', ini)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)
hljs.registerLanguage('diff', diff)

// ── DOMPurify config ──────────────────────────────
// ALLOW_DATA_ATTR: preserves data-copy-btn on code copy buttons.
// DOMPurify strips all event attributes (onclick, onerror, …) by default.
const PURIFY_CONFIG = { ALLOW_DATA_ATTR: true }

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
  toc: {
    type: Boolean,
    default: true,
  },
  dark: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['heading-click'])

// ── Markdown-it instance ──────────────────────────
const md = new MarkdownIt({
  html: true, // needed for callout HTML blocks to pass through
  linkify: true,
  typographer: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch {
        /* highlight failed, fall through to escapeHtml */
      }
    }
    return md.utils.escapeHtml(str)
  },
})

// ── Callout/admonition support ────────────────────
// Transforms "> [!NOTE]", "> [!TIP]", "> [!WARNING]", "> [!CAUTION]"
function parseCallouts(src) {
  const TYPES = { NOTE: '📝', TIP: '💡', WARNING: '⚠️', CAUTION: '🚨', IMPORTANT: '🔑' }
  const LABELS = { NOTE: '说明', TIP: '提示', WARNING: '注意', CAUTION: '警告', IMPORTANT: '重要' }
  const lines = src.split('\n')
  const out = []
  let i = 0

  while (i < lines.length) {
    const calloutMatch = lines[i].match(/^> \[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\]\s*$/)
    if (calloutMatch) {
      const type = calloutMatch[1]
      const bodyLines = []
      i++
      while (i < lines.length && /^> ?/.test(lines[i]) && !lines[i].match(/^> \[!/)) {
        bodyLines.push(lines[i].replace(/^> ?/, ''))
        i++
      }
      const bodyText = bodyLines.join('\n').trim()
      out.push(
        `<div class="md-callout md-callout--${type.toLowerCase()}">\n` +
          `<div class="md-callout-header"><span class="md-callout-icon">${TYPES[type]}</span>` +
          `<span class="md-callout-label">${LABELS[type]}</span></div>\n` +
          `<div class="md-callout-body">${md.render(bodyText)}</div>\n</div>`,
      )
    } else {
      out.push(lines[i])
      i++
    }
  }

  return out.join('\n')
}

// ── Custom fence renderer ─────────────────────────
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const lang = token.info.trim()
  const highlighted = options.highlight
    ? options.highlight(token.content, lang)
    : md.utils.escapeHtml(token.content)

  return `<div class="code-block">
    <div class="code-block-header">
      <span class="code-block-lang">${lang || 'text'}</span>
      <button class="code-block-copy" data-copy-btn aria-label="Copy code">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        <span>复制</span>
      </button>
    </div>
    <pre><code class="hljs language-${lang}">${highlighted}</code></pre>
  </div>`
}

// ── Heading renderer (with anchor links) ──────────
md.renderer.rules.heading_open = (tokens, idx) => {
  const token = tokens[idx]
  const level = token.tag
  const nextToken = tokens[idx + 1]
  const text = nextToken.children ? nextToken.children.reduce((acc, t) => acc + t.content, '') : ''
  const slug = text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
  // Prefix prevents DOM clobbering (e.g. id="submit" shadowing native properties)
  return `<${level} id="heading-${slug}" class="heading-anchor">`
}

// ── External links ────────────────────────────────
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const href = token.attrGet('href')
  if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer')
  }
  return self.renderToken(tokens, idx, options)
}

// ── Tables ────────────────────────────────────────
md.renderer.rules.table_open = () => '<div class="table-wrap"><table>'
md.renderer.rules.table_close = () => '</table></div>'

// ── Rendered content ──────────────────────────────
const renderedContent = computed(() => {
  if (!props.content) return ''
  // Pre-process callouts, then render markdown, then sanitize
  const processed = parseCallouts(props.content)
  return DOMPurify.sanitize(md.render(processed), PURIFY_CONFIG)
})

// ── TOC extraction ────────────────────────────────
const headings = computed(() => {
  if (!props.content || !props.toc) return []
  const lines = props.content.split('\n')
  const result = []
  for (const line of lines) {
    const match = line.match(/^(#{1,4})\s+(.+)/)
    if (match) {
      const level = match[1].length
      const text = match[2].trim()
      const slug = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff]+/g, '-')
        .replace(/^-+|-+$/g, '')
      result.push({ level, text, slug })
    }
  }
  return result
})

const showToc = computed(() => props.toc && headings.value.length > 2)

// ── Active TOC heading (IntersectionObserver) ─────
const activeSlug = ref('')
let observer = null

function setupObserver() {
  if (observer) observer.disconnect()

  nextTick(() => {
    const elements = document.querySelectorAll('.heading-anchor')
    if (!elements.length) return

    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length) {
          // Strip the 'heading-' prefix we inject to prevent DOM clobbering
          activeSlug.value = visible[0].target.id.replace(/^heading-/, '')
        }
      },
      {
        rootMargin: '-52px 0px -70% 0px',
        threshold: 0,
      },
    )

    elements.forEach((el) => observer.observe(el))
  })
}

// ── Article ref for event delegation ────────────
const articleRef = ref(null)

// Copy-code handler: event delegation on the article element avoids
// global window pollution and works with CSP (no unsafe-inline needed).
function handleCopyClick(event) {
  const btn = event.target.closest('[data-copy-btn]')
  if (!btn) return
  const pre = btn.closest('.code-block')?.querySelector('pre code')
  if (!pre) return
  navigator.clipboard
    .writeText(pre.textContent)
    .then(() => {
      btn.classList.add('copied')
      const span = btn.querySelector('span')
      if (span) span.textContent = '已复制'
      setTimeout(() => {
        btn.classList.remove('copied')
        if (span) span.textContent = '复制'
      }, 2000)
    })
    .catch(() => {})
}

onMounted(() => {
  setupObserver()
  articleRef.value?.addEventListener('click', handleCopyClick)
})
watch(() => props.content, setupObserver)
onBeforeUnmount(() => {
  if (observer) observer.disconnect()
  articleRef.value?.removeEventListener('click', handleCopyClick)
})

function scrollToHeading(slug) {
  // Use 'heading-' prefix that matches our DOM clobbering fix in heading_open renderer
  const el = document.getElementById('heading-' + slug)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeSlug.value = slug
    emit('heading-click', slug)
  }
}
</script>

<template>
  <div class="md-renderer" :class="{ 'has-toc': showToc, 'is-dark': dark }">
    <nav v-if="showToc" class="md-toc" aria-label="目录">
      <p class="md-toc-title">目录</p>
      <ul class="md-toc-list">
        <li v-for="h in headings" :key="h.slug" :class="`md-toc-item md-toc-level-${h.level}`">
          <a
            :href="`#heading-${h.slug}`"
            class="md-toc-link"
            :class="{ 'is-active': activeSlug === h.slug }"
            @click.prevent="scrollToHeading(h.slug)"
          >
            {{ h.text }}
          </a>
        </li>
      </ul>
    </nav>
    <article ref="articleRef" class="md-content" v-html="renderedContent" />
  </div>
</template>

<style>
/* ═══════════════════════════════════════════════════
   MARKDOWN RENDERER — OFPlayer Docs Style
   Uses CSS custom properties defined by .docs-page
   ═══════════════════════════════════════════════════ */

/* ── Layout ── */
.md-renderer {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 2.5rem;
  padding: 2rem 3rem 2rem 3rem;
  max-width: 1100px;
}

.md-renderer:not(.has-toc) {
  grid-template-columns: 1fr;
}

/* Reverse: article first, TOC second */
.md-renderer.has-toc {
  grid-template-areas: 'content toc';
}
.md-renderer .md-content {
  grid-area: content;
}
.md-renderer .md-toc {
  grid-area: toc;
}

/* ── TOC ── */
.md-toc {
  position: sticky;
  top: 72px;
  align-self: start;
  max-height: calc(100vh - 90px);
  overflow-y: auto;
  padding-left: 0.5rem;
  border-left: 1px solid var(--dp-border, rgba(0, 0, 0, 0.07));
  scrollbar-width: thin;
  scrollbar-color: var(--dp-border, rgba(0, 0, 0, 0.07)) transparent;
}

.md-toc::-webkit-scrollbar {
  width: 3px;
}
.md-toc::-webkit-scrollbar-track {
  background: transparent;
}
.md-toc::-webkit-scrollbar-thumb {
  background: var(--dp-border, rgba(0, 0, 0, 0.07));
  border-radius: 99px;
}
.md-toc::-webkit-scrollbar-thumb:hover {
  background: var(--dp-text-3, rgba(0, 0, 0, 0.32));
}

.md-toc-title {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dp-text-3, rgba(0, 0, 0, 0.32));
  margin: 0 0 0.6rem;
  padding: 0 0.5rem;
}

.md-toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.md-toc-level-1 {
  padding-left: 0;
}
.md-toc-level-2 {
  padding-left: 0.7rem;
}
.md-toc-level-3 {
  padding-left: 1.4rem;
}
.md-toc-level-4 {
  padding-left: 2.1rem;
}

.md-toc-link {
  display: block;
  padding: 0.28em 0.6em;
  font-size: 0.78rem;
  font-weight: 450;
  color: var(--dp-text-3, rgba(0, 0, 0, 0.32));
  text-decoration: none;
  border-radius: 5px;
  transition:
    color 0.13s,
    background 0.13s;
  line-height: 1.45;
}

.md-toc-link:hover {
  color: var(--dp-text, #111);
  background: var(--dp-hover, rgba(0, 0, 0, 0.035));
}

.md-toc-link.is-active {
  color: var(--dp-accent, #f97316);
  font-weight: 570;
  background: var(--dp-accent-2, rgba(249, 115, 22, 0.08));
}

/* ── CONTENT ── */
.md-content {
  min-width: 0;
  font-size: 0.96rem;
  line-height: 1.78;
  color: var(--dp-text-2, rgba(0, 0, 0, 0.78));
}

.md-content > *:first-child {
  margin-top: 0;
}

/* ── HEADINGS ── */
.md-content h1,
.md-content h2,
.md-content h3,
.md-content h4 {
  color: var(--dp-text, #111);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.3;
  margin-top: 2.2em;
  margin-bottom: 0.6em;
  scroll-margin-top: 80px;
}

.md-content h1 {
  font-size: 1.85rem;
  margin-top: 0;
}
.md-content h2 {
  font-size: 1.35rem;
  padding-bottom: 0.5em;
  border-bottom: 1px solid var(--dp-border, rgba(0, 0, 0, 0.07));
}
.md-content h3 {
  font-size: 1.1rem;
}
.md-content h4 {
  font-size: 0.95rem;
  color: var(--dp-text-2, rgba(0, 0, 0, 0.55));
}

/* ── PARAGRAPH ── */
.md-content p {
  margin: 0 0 1.2em;
}

/* ── LINKS ── */
.md-content a {
  color: var(--dp-accent, #f97316);
  text-decoration: none;
  border-bottom: 1px solid var(--dp-accent-2, rgba(249, 115, 22, 0.2));
  transition: border-color 0.13s;
}
.md-content a:hover {
  border-bottom-color: var(--dp-accent, #f97316);
}

/* ── STRONG / EM ── */
.md-content strong {
  color: var(--dp-text, #111);
  font-weight: 660;
}
.md-content em {
  font-style: italic;
}

/* ── LISTS ── */
.md-content ul,
.md-content ol {
  margin: 0 0 1.2em;
  padding-left: 1.5em;
}
.md-content li {
  margin-bottom: 0.38em;
}
.md-content li > ul,
.md-content li > ol {
  margin-top: 0.38em;
  margin-bottom: 0;
}

/* ── BLOCKQUOTE ── */
.md-content blockquote {
  margin: 1.5em 0;
  padding: 0.9em 1.2em;
  border-left: 3px solid var(--dp-accent, #f97316);
  background: var(--dp-accent-2, rgba(249, 115, 22, 0.06));
  border-radius: 0 8px 8px 0;
  color: var(--dp-text-2, rgba(0, 0, 0, 0.65));
}
.md-content blockquote p:last-child {
  margin-bottom: 0;
}

/* ── CALLOUTS ── */
.md-callout {
  margin: 1.5em 0;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid;
}
.md-callout-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6em 1em;
  font-size: 0.8rem;
  font-weight: 650;
  letter-spacing: 0.01em;
}
.md-callout-icon {
  font-size: 1em;
  line-height: 1;
}
.md-callout-body {
  padding: 0.75em 1em 0.75em 1.1em;
  font-size: 0.92em;
  line-height: 1.65;
}
.md-callout-body p:last-child {
  margin-bottom: 0;
}

/* NOTE */
.md-callout--note {
  background: var(--of-md-note-bg);
  border-color: var(--of-md-note-border);
}
.md-callout--note .md-callout-header {
  background: var(--of-md-note-bg);
  color: var(--of-md-note);
}
.docs-dark .md-callout--note .md-callout-header {
  color: var(--of-info-hover);
}

/* TIP */
.md-callout--tip {
  background: var(--of-md-tip-bg);
  border-color: var(--of-md-tip-border);
}
.md-callout--tip .md-callout-header {
  background: var(--of-md-tip-bg);
  color: var(--of-md-tip);
}
.docs-dark .md-callout--tip .md-callout-header {
  color: var(--of-success-hover);
}

/* WARNING */
.md-callout--warning {
  background: var(--of-md-warning-bg);
  border-color: var(--of-md-warning-border);
}
.md-callout--warning .md-callout-header {
  background: var(--of-md-warning-bg);
  color: var(--of-md-warning);
}
.docs-dark .md-callout--warning .md-callout-header {
  color: var(--of-warning-hover);
}

/* CAUTION */
.md-callout--caution {
  background: var(--of-md-caution-bg);
  border-color: var(--of-md-caution-border);
}
.md-callout--caution .md-callout-header {
  background: var(--of-md-caution-bg);
  color: var(--of-md-caution);
}
.docs-dark .md-callout--caution .md-callout-header {
  color: var(--of-danger-hover);
}

/* IMPORTANT */
.md-callout--important {
  background: var(--of-md-important-bg);
  border-color: var(--of-md-important-border);
}
.md-callout--important .md-callout-header {
  background: var(--of-md-important-bg);
  color: var(--of-md-important);
}
.docs-dark .md-callout--important .md-callout-header {
  color: var(--of-brand-hover);
}

/* Callout body text color inherits from page */
.md-callout-body {
  color: var(--dp-text-2, rgba(0, 0, 0, 0.7));
}

/* ── INLINE CODE ── */
.md-content code {
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 0.84em;
  padding: 0.15em 0.42em;
  background: var(--dp-inline-code, rgba(0, 0, 0, 0.05));
  border-radius: 4px;
  color: var(--dp-inline-code-text, #c7254e);
  border: 1px solid var(--dp-border, rgba(0, 0, 0, 0.06));
}

/* ── CODE BLOCK ── */
.code-block {
  margin: 1.5em 0;
  border-radius: 12px;
  overflow: hidden;
  background: #1e1e2e;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}

.code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55em 1em;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.code-block-lang {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
  font-family: 'JetBrains Mono', 'Consolas', monospace;
}

.code-block-copy {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0.28em 0.65em;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
  font-family: inherit;
}
.code-block-copy:hover {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.85);
  border-color: rgba(255, 255, 255, 0.2);
}
.code-block-copy.copied {
  color: var(--of-success);
  border-color: var(--of-success-border);
}

.code-block pre {
  margin: 0;
  padding: 1.2em 1.25em;
  overflow-x: auto;
}

.code-block code {
  font-size: 0.845rem;
  line-height: 1.65;
  background: none;
  padding: 0;
  color: #cdd6f4;
  border-radius: 0;
  border: none;
}

/* ── TABLE ── */
.table-wrap {
  margin: 1.5em 0;
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid var(--dp-border, rgba(0, 0, 0, 0.07));
}

.md-content table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.md-content thead {
  background: var(--dp-hover, rgba(0, 0, 0, 0.025));
}

.md-content th {
  text-align: left;
  padding: 0.75em 1em;
  font-weight: 650;
  font-size: 0.8rem;
  letter-spacing: 0.01em;
  color: var(--dp-text, #111);
  border-bottom: 1px solid var(--dp-border, rgba(0, 0, 0, 0.07));
}

.md-content td {
  padding: 0.65em 1em;
  border-bottom: 1px solid var(--dp-border, rgba(0, 0, 0, 0.04));
  color: var(--dp-text-2, rgba(0, 0, 0, 0.7));
}

.md-content tbody tr:last-child td {
  border-bottom: none;
}
.md-content tbody tr:hover {
  background: var(--dp-hover, rgba(0, 0, 0, 0.015));
}

/* ── HORIZONTAL RULE ── */
.md-content hr {
  margin: 2em 0;
  border: none;
  border-top: 1px solid var(--dp-border, rgba(0, 0, 0, 0.08));
}

/* ── IMAGE ── */
.md-content img {
  max-width: 100%;
  border-radius: 10px;
  margin: 1.5em 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* ═══ highlight.js ═══ */
.hljs {
  background: transparent !important;
}
.hljs-keyword {
  color: #cba6f7;
}
.hljs-string {
  color: #a6e3a1;
}
.hljs-number {
  color: #fab387;
}
.hljs-comment {
  color: #6c7086;
  font-style: italic;
}
.hljs-function,
.hljs-title {
  color: #89b4fa;
}
.hljs-params {
  color: #f5e0dc;
}
.hljs-built_in {
  color: #f38ba8;
}
.hljs-type {
  color: #f9e2af;
}
.hljs-attr {
  color: #89dceb;
}
.hljs-selector-class,
.hljs-selector-tag,
.hljs-tag,
.hljs-name {
  color: #cba6f7;
}
.hljs-attribute {
  color: #89b4fa;
}

/* ═══ Responsive ═══ */
@media (max-width: 1100px) {
  .md-renderer.has-toc {
    grid-template-columns: 1fr;
    grid-template-areas: 'content';
  }
  .md-toc {
    display: none;
  }
}

@media (max-width: 900px) {
  .md-renderer {
    padding: 1.5rem;
  }
}

@media (max-width: 600px) {
  .md-content h1 {
    font-size: 1.5rem;
  }
  .md-content h2 {
    font-size: 1.2rem;
  }
}
</style>
