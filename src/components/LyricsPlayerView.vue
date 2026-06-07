<script setup>
/**
 * LyricsPlayerView — 沉浸式歌词渲染组件（自研）
 *
 * 数据格式（LyricLine[]）:
 *   { words: [{word, startTime, endTime}], startTime, endTime,
 *     translatedLyric, romanLyric, isBG, isDuet }
 *   时间单位：整数毫秒
 *
 * 事件：
 *   line-click → { startTime: number }  (毫秒)
 */
import { ref, computed, watch, nextTick, onBeforeUnmount, onMounted } from 'vue'

const props = defineProps({
  lyricLines: {
    type: Array,
    default: () => [],
  },
  currentTime: { type: Number, default: 0 },
  playing: { type: Boolean, default: false },
  alignPosition: { type: Number, default: 0.4 },
  enableBlur: { type: Boolean, default: true },
})

const emit = defineEmits(['line-click'])

const containerRef = ref(null)
const lineRefs = ref([])

function setLineRef(el, idx) {
  if (el) lineRefs.value[idx] = el
}

// ── 活跃行 ────────────────────────────────────────────
const activeIndex = computed(() => {
  const lines = props.lyricLines
  if (!lines.length) return -1
  const t = props.currentTime
  let idx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startTime <= t) idx = i
    else break
  }
  return idx
})

// ── 平滑滚动（rAF lerp，可覆盖，不抢占） ─────────────
let rafId = null
let scrollGoal = 0

// ── 用户手动滚动检测 ───────────────────────────────────
// 用户主动滚动时暂停自动跟随 RESUME_DELAY ms，超时后恢复
const RESUME_DELAY = 2000
let userScrolling = false
let resumeTimer = null

function markUserScrolling() {
  userScrolling = true
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  clearTimeout(resumeTimer)
  resumeTimer = setTimeout(() => {
    userScrolling = false
  }, RESUME_DELAY)
}

function onContainerWheel() {
  markUserScrolling()
}
function onContainerTouchMove() {
  markUserScrolling()
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function runScroll() {
  const el = containerRef.value
  if (!el) {
    rafId = null
    return
  }
  const diff = scrollGoal - el.scrollTop
  if (Math.abs(diff) < 0.8) {
    el.scrollTop = scrollGoal
    rafId = null
    return
  }
  el.scrollTop = lerp(el.scrollTop, scrollGoal, 0.1)
  rafId = requestAnimationFrame(runScroll)
}

function scrollToGoal(target) {
  scrollGoal = Math.max(0, target)
  if (!rafId) rafId = requestAnimationFrame(runScroll)
}

watch(
  activeIndex,
  async (idx) => {
    if (idx < 0 || !containerRef.value) return
    if (userScrolling) return
    await nextTick()
    const container = containerRef.value
    const el = lineRefs.value[idx]
    if (!el) return
    // 双语行整体更高（含译文副行），将锡点迟到主文本区域而非几何中心
    const activeLine = props.lyricLines[idx]
    const isBilingual = Boolean(activeLine?.translatedLyric || activeLine?.romanLyric)
    const lineAnchor = isBilingual ? el.offsetHeight * 0.32 : el.offsetHeight / 2
    const target = el.offsetTop - container.clientHeight * props.alignPosition + lineAnchor
    scrollToGoal(target)
  },
  { flush: 'post' },
)

onMounted(() => {
  const el = containerRef.value
  if (!el) return
  el.addEventListener('wheel', onContainerWheel, { passive: true })
  el.addEventListener('touchmove', onContainerTouchMove, { passive: true })
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  clearTimeout(resumeTimer)
  const el = containerRef.value
  if (!el) return
  el.removeEventListener('wheel', onContainerWheel)
  el.removeEventListener('touchmove', onContainerTouchMove)
})

// ── hover 聚焦（只点亮被悬停的那一行） ───────────────
const hoveredIdx = ref(-1)

function onLineEnter(idx) {
  hoveredIdx.value = idx
}
function onLineLeave() {
  hoveredIdx.value = -1
}

// ── 行距离辅助 ────────────────────────────────────────
function dist(idx) {
  if (activeIndex.value < 0) return 99
  return idx - activeIndex.value
}

function handleLineClick(line) {
  emit('line-click', { startTime: line.startTime })
}
</script>

<template>
  <div
    ref="containerRef"
    class="lp-root"
    :class="{ 'lp--blur': enableBlur, 'lp--has-hover': hoveredIdx >= 0, 'lp--playing': playing }"
  >
    <div class="lp-pad lp-pad--top" aria-hidden="true" />

    <div
      v-for="(line, idx) in lyricLines"
      :key="idx"
      :ref="(el) => setLineRef(el, idx)"
      class="lp-line"
      :class="{
        'is-active': dist(idx) === 0,
        'is-near-1': Math.abs(dist(idx)) === 1,
        'is-near-2': Math.abs(dist(idx)) === 2,
        'is-past': dist(idx) < 0,
        'is-future': dist(idx) > 0,
        'is-bg': line.isBG,
        'is-duet': line.isDuet,
        'is-bilingual': Boolean(line.translatedLyric || line.romanLyric),
        'is-hovered': hoveredIdx === idx,
      }"
      @click="handleLineClick(line)"
      @mouseenter="onLineEnter(idx)"
      @mouseleave="onLineLeave()"
    >
      <p class="lp-text" :class="{ 'lp-text--bg': line.isBG }">
        <span v-for="(word, wIdx) in line.words" :key="wIdx" class="lp-word">{{ word.word }}</span>
      </p>
      <p v-if="line.translatedLyric" class="lp-sub lp-sub--translation">
        <span
          v-for="(item, itemIndex) in line.translatedLyric.split('\n')"
          :key="`translation-${itemIndex}`"
          >{{ item }}</span
        >
      </p>
      <p v-if="line.romanLyric" class="lp-sub lp-sub--roman">
        <span
          v-for="(item, itemIndex) in line.romanLyric.split('\n')"
          :key="`roman-${itemIndex}`"
          >{{ item }}</span
        >
      </p>
    </div>

    <div class="lp-pad lp-pad--bottom" aria-hidden="true" />
  </div>
</template>

<style scoped>
/* ── 容器 ─────────────────────────────────────────────── */
.lp-root {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  user-select: none;
  -webkit-user-select: none;
}
.lp-root::-webkit-scrollbar {
  display: none;
}

.lp-pad--top {
  height: 38%;
}
.lp-pad--bottom {
  height: 62%;
}

/* ── 行基础 ───────────────────────────────────────────── */
.lp-line {
  padding: 0.72rem 2rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transform: translate3d(0, 0, 0) scale(0.985);
  transform-origin: left center;
  will-change: opacity, filter, transform;

  transition:
    opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);

  opacity: 0.14;
}

/* ── 播放深度层级（无 hover 干扰时） ─────────────────── */
.lp-line.is-past {
  opacity: 0.24;
  transform: translate3d(-0.2rem, 0, 0) scale(0.97);
}
.lp-line.is-near-2 {
  opacity: 0.38;
  transform: translate3d(-0.06rem, 0, 0) scale(0.98);
}
.lp-line.is-near-1 {
  opacity: 0.6;
  transform: translate3d(0.1rem, 0, 0) scale(0.992);
}
.lp-line.is-active {
  opacity: 1;
  transform: translate3d(0.3rem, 0, 0) scale(1);
}

.lp-line.is-bg.is-active {
  opacity: 0.72;
}

/* 双语活跃行加大内边距 */
.lp-line.is-active.is-bilingual {
  padding-block: 0.88rem 0.98rem;
}

/* 对唱行右对齐 */
.lp-line.is-duet {
  text-align: right;
  transform-origin: right center;
}

/* ── 模糊（enableBlur） ───────────────────────────────── */
.lp--blur .lp-line {
  filter: blur(6px);
}
.lp--blur .lp-line.is-past {
  filter: blur(5px);
}
.lp--blur .lp-line.is-near-2 {
  filter: blur(3.5px);
}
.lp--blur .lp-line.is-near-1 {
  filter: blur(1px);
}
.lp--blur .lp-line.is-active {
  filter: none;
}

/* ── hover 聚焦模式 ───────────────────────────────────── */
/*
  当容器进入 hover 模式（lp--has-hover）时：
  - 所有行压暗
  - 只有 is-hovered 那一行恢复亮度
  这样鼠标停在哪行，哪行就独自亮起，其余全部退后。
  不使用 translateX，避免 transform 改变 bounding box 后
  鼠标漂移出元素触发 mouseleave 的抖动问题。
*/
.lp--has-hover .lp-line {
  opacity: 0.12 !important;
  filter: blur(4px) !important;
}

.lp--has-hover .lp-line.is-hovered {
  opacity: 0.92 !important;
  filter: none !important;
}

/* ── 文字 ─────────────────────────────────────────────── */
.lp-text {
  margin: 0;
  font-size: clamp(1.7rem, 2.8vw, 2.25rem);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.008em;
  color: rgba(255, 255, 255, 0.9);
  text-wrap: balance;
  transition:
    color 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    text-shadow 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.lp-line.is-bilingual .lp-text {
  line-height: 1.18;
}

.lp-text--bg {
  font-size: clamp(1.15rem, 1.9vw, 1.5rem);
  font-weight: 600;
  letter-spacing: 0.015em;
}

.lp-word {
  display: inline;
}

/* 已过去行的文字略微偏暗，配合 opacity 形成过去感 */
.lp-line.is-past .lp-text {
  color: rgba(255, 255, 255, 0.78);
}

/* 活跃行字影 */
.lp-line.is-active .lp-text {
  color: rgba(255, 255, 255, 0.98);
  text-shadow: 0 0 36px rgba(255, 255, 255, 0.14);
}

/* ── 播放中呼吸动画 ───────────────────────────────────── */
.lp--playing .lp-line.is-active .lp-text,
.lp--playing .lp-line.is-active .lp-sub {
  animation: lp-active-breathe 1.8s ease-in-out infinite alternate;
}

@keyframes lp-active-breathe {
  from {
    text-shadow: 0 0 28px rgba(255, 255, 255, 0.1);
  }
  to {
    text-shadow: 0 0 44px rgba(255, 255, 255, 0.18);
  }
}

/* ── 辅助文字（翻译 / 罗马音） ───────────────────────── */
.lp-sub {
  display: grid;
  gap: 0.1rem;
  margin: 0.42rem 0 0;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.4);
  opacity: 0.58;
  transform: translateY(-0.08rem);
  transition:
    color 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.lp-sub--translation {
  font-size: clamp(0.875rem, 1.4vw, 1.05rem);
  font-weight: 400;
}

.lp-sub--roman {
  font-size: clamp(0.8rem, 1.2vw, 0.95rem);
  font-weight: 300;
  font-style: italic;
}

.lp-line.is-active .lp-sub {
  opacity: 0.86;
  transform: translateY(0);
  filter: none;
  color: rgba(255, 255, 255, 0.74);
}

.lp-line.is-active .lp-sub--translation {
  font-size: clamp(1rem, 1.52vw, 1.25rem);
  font-weight: 520;
}

.lp-line.is-near-1 .lp-sub {
  opacity: 0.42;
  filter: blur(0.2px);
}

.lp-line.is-near-2 .lp-sub,
.lp-line.is-past .lp-sub,
.lp-line.is-future .lp-sub {
  opacity: 0.24;
  filter: blur(1.2px);
}
</style>
