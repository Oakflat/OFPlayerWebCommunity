<script setup>
/**
 * LyricsPanel — 歌词显示面板
 *
 * 性能策略：
 * - 全量渲染（普通歌曲 < 200 行），无需虚拟滚动
 * - 激活行变化时用 scrollIntoView({ behavior: 'smooth', block: 'center' })
 * - watch flush: 'post' 确保在 DOM 更新后再滚动
 * - 文字高亮纯 CSS transition，不依赖 JS 动画
 */
import { ref, watch } from 'vue'

const props = defineProps({
  lines: {
    type: Array,
    default: () => [],
  },
  activeIndex: {
    type: Number,
    default: -1,
  },
  hasTimestamps: {
    type: Boolean,
    default: false,
  },
  hasLyrics: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['seek'])

/** 歌词容器 ref */
const containerRef = ref(null)

/** 每一行 DOM ref，通过 key 索引 */
const lineRefs = ref([])

function setLineRef(el, index) {
  if (el) lineRefs.value[index] = el
}

// 激活行变化时平滑滚动到中心
watch(
  () => props.activeIndex,
  (idx) => {
    if (idx < 0) return
    const el = lineRefs.value[idx]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  },
  { flush: 'post' },
)

function handleLineClick(line) {
  if (props.hasTimestamps && line.time >= 0) {
    emit('seek', line.time)
  }
}
</script>

<template>
  <div ref="containerRef" class="lyrics-panel">
    <!-- 加载中 -->
    <div v-if="isLoading" class="lyrics-state">
      <div class="lyrics-loading-dots"><span></span><span></span><span></span></div>
    </div>

    <!-- 无歌词 -->
    <div v-else-if="!hasLyrics" class="lyrics-state lyrics-state--empty">
      <p class="lyrics-empty-text">暂无歌词</p>
    </div>

    <!-- 歌词列表 -->
    <ol v-else class="lyrics-list" role="list">
      <li
        v-for="(line, index) in lines"
        :key="index"
        :ref="(el) => setLineRef(el, index)"
        class="lyrics-line"
        :class="{
          'is-active': index === activeIndex,
          'is-past': hasTimestamps && index < activeIndex,
          'is-clickable': hasTimestamps && line.time >= 0,
        }"
        @click="handleLineClick(line)"
      >
        <span class="lyrics-line-text">{{ line.text }}</span>
      </li>
    </ol>

    <!-- 顶部 / 底部淡出遮罩 -->
    <div class="lyrics-fade lyrics-fade--top" aria-hidden="true"></div>
    <div class="lyrics-fade lyrics-fade--bottom" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
/* ========================================
   歌词面板容器
   ======================================== */
.lyrics-panel {
  position: relative;
  flex: 1;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  /* 隐藏滚动条，保持视觉干净 */
  scrollbar-width: none;
  -ms-overflow-style: none;
  /* 平滑滚动降级（某些场景 scrollIntoView 不支持 smooth 时兜底） */
  scroll-behavior: smooth;
}

.lyrics-panel::-webkit-scrollbar {
  display: none;
}

/* ========================================
   状态视图（加载中 / 无歌词）
   ======================================== */
.lyrics-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.lyrics-empty-text {
  margin: 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.2);
  letter-spacing: 0.04em;
}

/* 三点加载动画 */
.lyrics-loading-dots {
  display: flex;
  gap: 6px;
  align-items: center;
}

.lyrics-loading-dots span {
  display: block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  animation: dot-pulse 1.2s ease-in-out infinite;
}

.lyrics-loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.lyrics-loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dot-pulse {
  0%,
  80%,
  100% {
    transform: scale(0.7);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ========================================
   歌词列表
   ======================================== */
.lyrics-list {
  list-style: none;
  margin: 0;
  padding: 45% 0 50%; /* 顶部留白让第一行从中心开始，底部让最后一行能居中 */
}

/* ========================================
   歌词行
   ======================================== */
.lyrics-line {
  padding: 0.45rem 1.25rem;
  cursor: default;
  user-select: none;
}

.lyrics-line.is-clickable {
  cursor: pointer;
}

.lyrics-line-text {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0.01em;
  color: rgba(255, 255, 255, 0.2);
  transition:
    color 0.35s cubic-bezier(0.2, 0, 0, 1),
    font-size 0.35s cubic-bezier(0.2, 0, 0, 1),
    opacity 0.35s cubic-bezier(0.2, 0, 0, 1);
}

/* 当前激活行 */
.lyrics-line.is-active .lyrics-line-text {
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.35rem;
}

/* 已播放行 */
.lyrics-line.is-past .lyrics-line-text {
  color: rgba(255, 255, 255, 0.35);
}

/* 未播放行（非激活、非已过）hover */
.lyrics-line.is-clickable:hover .lyrics-line-text {
  color: rgba(255, 255, 255, 0.55);
}

/* ========================================
   顶部 / 底部渐隐遮罩
   ======================================== */
.lyrics-fade {
  position: sticky;
  left: 0;
  right: 0;
  height: 80px;
  pointer-events: none;
  z-index: 2;
}

.lyrics-fade--top {
  top: 0;
  background: linear-gradient(to bottom, var(--lyrics-bg, rgba(0, 0, 0, 0.5)) 0%, transparent 100%);
  margin-bottom: -80px; /* 不占用滚动空间 */
}

.lyrics-fade--bottom {
  bottom: 0;
  background: linear-gradient(to top, var(--lyrics-bg, rgba(0, 0, 0, 0.5)) 0%, transparent 100%);
  margin-top: -80px;
}

/* ========================================
   减少动画偏好
   ======================================== */
@media (prefers-reduced-motion: reduce) {
  .lyrics-line-text {
    transition: color 0s;
  }
  .lyrics-panel {
    scroll-behavior: auto;
  }
}
</style>
