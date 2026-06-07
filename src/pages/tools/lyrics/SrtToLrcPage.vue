<template>
  <ConverterPageShell :config="pageConfig" :converter="runConvert" :related-tools="relatedTools">
    <template #guide>
      <div class="srt-to-lrc__guide">
        <template v-for="(section, idx) in toolGuide" :key="section.heading">
          <h2 v-if="idx === 0">{{ section.heading }}</h2>
          <h3 v-else>{{ section.heading }}</h3>
          <p>{{ section.body }}</p>
        </template>
      </div>
    </template>
  </ConverterPageShell>
</template>

<script setup>
import { computed } from 'vue'
import { useHead } from '@unhead/vue'
import ConverterPageShell from './ConverterPageShell.vue'
import { srtToLrc } from '../../../tools/lyrics/convert/srtToLrc.js'
import { getRelatedTools } from '../../../tools/registry.js'
import { getToolContent } from '../../../tools/content/toolContentRegistry.js'
import { useI18n } from '../../../composables/useI18n.js'

const { locale } = useI18n()

const SITE_URL = ''

useHead({
  title: computed(
    () =>
      getToolContent('srt-to-lrc', locale.value)?.metaTitle ||
      'SRT to LRC Converter — Convert Subtitles to Lyrics | OFPlayer',
  ),
  meta: [
    {
      name: 'description',
      content: computed(
        () =>
          getToolContent('srt-to-lrc', locale.value)?.metaDescription ||
          'Convert SRT subtitle files to LRC lyrics format for music players like OFPlayer, Navidrome, and Jellyfin.',
      ),
    },
    { property: 'og:url', content: `${SITE_URL}/tools/lyrics/srt-to-lrc` },
  ],
})

const relatedTools = computed(() => getRelatedTools(['lrc-to-srt', 'lrc-offset', 'lrc-validator']))

const toolGuide = computed(() => {
  const content = getToolContent('srt-to-lrc', locale.value)
  return content?.guideSections || []
})

function runConvert(input) {
  const { lrc, errors } = srtToLrc(input)
  return { result: lrc, errors }
}

const pageConfig = computed(() => {
  const content = getToolContent('srt-to-lrc', locale.value)
  return {
    toolId: 'srt-to-lrc',
    title: content?.h1 || 'SRT to LRC Converter',
    description:
      content?.intro ||
      'Convert SRT subtitle files to LRC lyrics format for music players. Works locally in your browser — no upload required.',
    inputLabel: content?.inputLabel || 'SRT Subtitles',
    outputLabel: content?.outputLabel || 'LRC Lyrics',
    outputExtension: 'lrc',
    inputPlaceholder:
      '1\n00:00:12,340 --> 00:00:15,600\nFirst line of lyrics\n\n2\n00:00:15,600 --> 00:00:20,000\nSecond line of lyrics',
    exampleInput: `1
00:00:12,340 --> 00:00:15,600
This is the first line

2
00:00:15,600 --> 00:00:20,000
This is the second line

3
00:00:20,000 --> 00:00:25,800
And the third line

4
00:00:25,800 --> 00:00:30,000
Last line of the song`,
    faq: content?.faq || [],
  }
})
</script>

<style scoped>
.srt-to-lrc__guide h2 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: 0 0 var(--space-4);
}

.srt-to-lrc__guide h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: var(--space-5) 0 var(--space-2);
}

.srt-to-lrc__guide p {
  font-size: var(--font-size-base);
  color: var(--of-ink-soft);
  line-height: var(--line-height-relaxed);
  margin: 0 0 var(--space-3);
}
</style>
