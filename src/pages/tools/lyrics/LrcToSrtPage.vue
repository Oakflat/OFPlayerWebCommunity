<template>
  <ConverterPageShell :config="pageConfig" :converter="runConvert" :related-tools="relatedTools">
    <template #guide>
      <div class="lrc-to-srt__guide">
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
import { lrcToSrt } from '../../../tools/lyrics/convert/lrcToSrt.js'
import { getRelatedTools } from '../../../tools/registry.js'
import { getToolContent } from '../../../tools/content/toolContentRegistry.js'
import { useI18n } from '../../../composables/useI18n.js'

const { locale } = useI18n()

const SITE_URL = ''

useHead({
  title: computed(
    () =>
      getToolContent('lrc-to-srt', locale.value)?.metaTitle ||
      'LRC to SRT Converter — Convert Lyrics to Subtitles | OFPlayer',
  ),
  meta: [
    {
      name: 'description',
      content: computed(
        () =>
          getToolContent('lrc-to-srt', locale.value)?.metaDescription ||
          'Convert LRC lyrics files to SRT subtitle format for video players. Fast, local, no upload required.',
      ),
    },
    { property: 'og:url', content: `${SITE_URL}/tools/lyrics/lrc-to-srt` },
  ],
})

const relatedTools = computed(() => getRelatedTools(['srt-to-lrc', 'lrc-offset', 'lrc-validator']))

const toolGuide = computed(() => {
  const content = getToolContent('lrc-to-srt', locale.value)
  return content?.guideSections || []
})

function runConvert(input) {
  const { srt, errors } = lrcToSrt(input)
  return { result: srt, errors }
}

const pageConfig = computed(() => {
  const content = getToolContent('lrc-to-srt', locale.value)
  return {
    toolId: 'lrc-to-srt',
    title: content?.h1 || 'LRC to SRT Converter',
    description:
      content?.intro ||
      'Convert LRC lyrics to SRT subtitle format for video players. All conversion happens in your browser — no upload required.',
    inputLabel: content?.inputLabel || 'LRC Lyrics',
    outputLabel: content?.outputLabel || 'SRT Subtitles',
    outputExtension: 'srt',
    inputPlaceholder:
      '[ar:Artist Name]\n[ti:Song Title]\n[00:12.34]First line of lyrics\n[00:15.60]Second line...',
    exampleInput: `[ar:Example Artist]
[ti:Example Song]
[00:12.34]This is the first line
[00:15.60]This is the second line
[00:20.00]And the third line
[00:25.80]Last line of the song`,
    faq: content?.faq || [],
  }
})
</script>

<style scoped>
.lrc-to-srt__guide h2 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: 0 0 var(--space-4);
}

.lrc-to-srt__guide h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--of-ink);
  margin: var(--space-5) 0 var(--space-2);
}

.lrc-to-srt__guide p,
.lrc-to-srt__guide ul {
  font-size: var(--font-size-base);
  color: var(--of-ink-soft);
  line-height: var(--line-height-relaxed);
  margin: 0 0 var(--space-3);
  padding-left: var(--space-5);
}

.lrc-to-srt__guide p {
  padding-left: 0;
}

.lrc-to-srt__guide li {
  margin-bottom: var(--space-2);
}
</style>
