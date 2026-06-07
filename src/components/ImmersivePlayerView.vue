<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import {
  ChevronDown,
  FileText,
  Heart,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'
import { useLyrics } from '../composables/useLyrics'
import {
  extractDominantColors,
  generateBackgroundGradient,
  defaultColors,
} from '../utils/colorExtractor'
import LyricsPlayerView from './LyricsPlayerView.vue'

const props = defineProps({
  currentTrack: {
    type: Object,
    default: null,
  },
  isPlaying: {
    type: Boolean,
    default: false,
  },
  currentTime: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number,
    default: 0,
  },
  volume: {
    type: Number,
    default: 0.8,
  },
})

const emit = defineEmits([
  'close',
  'toggle-playback',
  'play-previous',
  'play-next',
  'seek',
  'set-volume',
  'toggle-favorite',
])

const { t } = useI18n()

// 歌词系统
const currentTrackRef = computed(() => props.currentTrack)
const {
  lyricLines,
  hasLyrics,
  hasManualLyrics,
  isLoading: lyricsLoading,
  importLrcText,
  clearManualLyrics,
} = useLyrics({
  currentTrack: currentTrackRef,
})
// 歌词播放器期望整数毫秒
const lyricCurrentTime = computed(() => Math.round(props.currentTime * 1000))

// 歌词文件输入
const lyricsFileInput = ref(null)

function openLyricsFilePicker() {
  lyricsFileInput.value?.click()
}

function onLyricsFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result
    if (typeof text === 'string') importLrcText(text)
  }
  reader.readAsText(file, 'utf-8')
  // 重置 input 以允许重复选同一文件
  event.target.value = ''
}

// 提取的颜色
const extractedColors = ref(null)
const isExtracting = ref(false)

// 进度百分比
const progressPercent = computed(() => {
  if (!Number.isFinite(props.duration) || props.duration <= 0) return 0
  return Math.min((props.currentTime / props.duration) * 100, 100)
})

// 格式化时间
function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const totalSeconds = Math.floor(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainder = totalSeconds % 60
  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

// 解析曲目标题
function resolveTrackTitle(track) {
  return track?.displayTitle || track?.title || t('player.untitled')
}

// 解析艺术家
function resolveTrackArtist(track) {
  return track?.artist || track?.albumArtist || t('track.unknownArtist')
}

// 封面首字母
function artworkMonogram(track) {
  const label = resolveTrackTitle(track)
  if (!label) return 'OF'
  return label.slice(0, 2).toUpperCase()
}

// 点击进度条跳转
function handleProgressClick(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  const percent = x / rect.width
  const newTime = percent * props.duration
  emit('seek', newTime)
}

// 关闭沉浸式视图
function handleClose() {
  emit('close')
}

// 切歌方向，用于驱动 meta 过渡动画方向
const trackDirection = ref('next')
const metaTransitionName = computed(() => `track-meta-${trackDirection.value}`)

function handlePlayNext() {
  trackDirection.value = 'next'
  emit('play-next')
}

function handlePlayPrev() {
  trackDirection.value = 'prev'
  emit('play-previous')
}

// 键盘事件
function handleKeydown(event) {
  if (event.key === 'Escape') {
    handleClose()
  } else if (event.key === ' ' && event.target.tagName !== 'BUTTON') {
    event.preventDefault()
    emit('toggle-playback')
  }
}

// 背景渐变样式
const backgroundStyle = computed(() => {
  // 如果有提取的颜色，使用它们
  if (extractedColors.value) {
    return {
      backgroundImage: generateBackgroundGradient(extractedColors.value),
    }
  }

  // 否则使用默认渐变
  return {
    backgroundImage: `linear-gradient(135deg, #14101e 0%, #0e0c17 50%, #090810 100%)`,
  }
})

// 提取专辑封面颜色
async function extractArtworkColors(artworkUrl) {
  if (!artworkUrl || isExtracting.value) return

  isExtracting.value = true
  try {
    const colors = await extractDominantColors(artworkUrl)
    extractedColors.value = colors
  } catch (err) {
    console.warn('Failed to extract colors:', err)
    extractedColors.value = defaultColors
  } finally {
    isExtracting.value = false
  }
}

// 音频规格信息
const audioSpecs = computed(() => {
  const track = props.currentTrack
  if (!track) return []

  const specs = []
  if (track.format) specs.push(track.format.toUpperCase())
  if (track.bitrate) specs.push(`${Math.round(track.bitrate / 1000)} kbps`)
  if (track.sampleRate) specs.push(`${(track.sampleRate / 1000).toFixed(1)} kHz`)
  if (track.bitDepth) specs.push(`${track.bitDepth}-bit`)

  return specs
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  // 初始提取颜色
  if (props.currentTrack?.artwork) {
    extractArtworkColors(props.currentTrack.artwork)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 监听曲目变化，重新提取颜色
watch(
  () => props.currentTrack?.artwork,
  (newArtwork) => {
    if (newArtwork) {
      extractArtworkColors(newArtwork)
    } else {
      extractedColors.value = null
    }
  },
)
</script>

<template>
  <div class="immersive-root" :style="backgroundStyle">
    <!-- 关闭按钮 -->
    <button
      class="immersive-close"
      type="button"
      :aria-label="t('player.immersive.close')"
      @click="handleClose"
    >
      <ChevronDown aria-hidden="true" />
    </button>

    <!-- 主内容区：封面 + 歌词 -->
    <main class="immersive-main" :class="{ 'has-lyrics': hasLyrics }">
      <figure class="immersive-artwork">
        <Transition name="track-art" mode="out-in">
          <div :key="currentTrack?.id ?? '_'" class="immersive-artwork-frame">
            <img
              v-if="currentTrack?.artwork"
              :src="currentTrack.artwork"
              :alt="resolveTrackTitle(currentTrack)"
              class="immersive-artwork-image"
            />
            <div v-else class="immersive-artwork-placeholder">
              <span>{{ artworkMonogram(currentTrack) }}</span>
            </div>
          </div>
        </Transition>
        <!-- 封面倒影 -->
        <div class="immersive-artwork-reflection" aria-hidden="true">
          <img
            v-if="currentTrack?.artwork"
            :src="currentTrack.artwork"
            :alt="''"
            class="immersive-artwork-image"
          />
          <div v-else class="immersive-artwork-placeholder">
            <span>{{ artworkMonogram(currentTrack) }}</span>
          </div>
        </div>
      </figure>

      <!-- 歌词面板（右侧） -->
      <LyricsPlayerView
        v-if="hasLyrics"
        class="immersive-lyrics"
        :lyric-lines="lyricLines"
        :current-time="lyricCurrentTime"
        :playing="isPlaying"
        :align-position="0.4"
        :enable-blur="true"
        @line-click="(e) => emit('seek', e.startTime / 1000)"
      />
    </main>

    <!-- 底部：元数据 + 进度 + 控件 -->
    <footer class="immersive-footer">
      <div class="immersive-footer-inner">
        <!-- 曲目信息行 -->
        <div class="immersive-meta-row">
          <Transition :name="metaTransitionName" mode="out-in">
            <div :key="currentTrack?.id ?? '_'" class="immersive-meta-main">
              <h1 class="immersive-title">{{ resolveTrackTitle(currentTrack) }}</h1>
              <p class="immersive-artist">{{ resolveTrackArtist(currentTrack) }}</p>
              <p v-if="currentTrack?.album" class="immersive-album">{{ currentTrack.album }}</p>
            </div>
          </Transition>
          <div class="immersive-meta-side">
            <div v-if="audioSpecs.length > 0" class="immersive-specs">
              <span v-for="(spec, index) in audioSpecs" :key="index" class="immersive-spec-tag">{{
                spec
              }}</span>
            </div>
            <!-- 歌词管理按钮：无歌词时显示"载入"，有手动歌词时显示"清除" -->
            <button
              v-if="hasManualLyrics"
              class="immersive-action-btn immersive-action-btn--lyrics-clear"
              type="button"
              aria-label="移除歌词"
              @click="clearManualLyrics"
            >
              <Trash2 aria-hidden="true" />
            </button>
            <button
              v-else
              class="immersive-action-btn"
              :class="{ 'is-active': hasLyrics }"
              type="button"
              :aria-label="hasLyrics ? '已有歌词（点击替换）' : '载入歌词'"
              @click="openLyricsFilePicker"
            >
              <FileText aria-hidden="true" />
            </button>
            <!-- 收藏按钮 -->
            <button
              class="immersive-action-btn"
              :class="{ 'is-active': currentTrack?.isFavorite }"
              type="button"
              :aria-label="
                currentTrack?.isFavorite
                  ? t('sidebar.actions.unfavorite')
                  : t('sidebar.actions.favorite')
              "
              @click="emit('toggle-favorite', currentTrack?.id)"
            >
              <Heart aria-hidden="true" />
            </button>
          </div>
          <!-- 隐藏的歌词文件 input -->
          <input
            ref="lyricsFileInput"
            type="file"
            accept=".lrc,.txt"
            style="display: none"
            @change="onLyricsFileChange"
          />
        </div>

        <!-- 进度条 -->
        <div class="immersive-progress-section">
          <div
            class="immersive-progress"
            role="slider"
            :aria-label="t('player.progress')"
            :aria-valuemin="0"
            :aria-valuemax="duration"
            :aria-valuenow="currentTime"
            tabindex="0"
            @click="handleProgressClick"
            @keydown.left.stop="emit('seek', Math.max(0, currentTime - 5))"
            @keydown.right.stop="emit('seek', Math.min(duration, currentTime + 5))"
          >
            <div class="immersive-progress-track">
              <div class="immersive-progress-fill" :style="{ width: `${progressPercent}%` }"></div>
            </div>
            <div class="immersive-progress-thumb" :style="{ left: `${progressPercent}%` }"></div>
          </div>
        </div>

        <!-- 控件行：音量 | 播放 | 时间 -->
        <div class="immersive-controls-row">
          <div class="immersive-volume">
            <button
              class="immersive-volume-btn"
              type="button"
              :aria-label="volume === 0 ? t('player.unmute') : t('player.mute')"
              @click="emit('set-volume', volume === 0 ? 0.8 : 0)"
            >
              <VolumeX v-if="volume === 0" aria-hidden="true" />
              <Volume2 v-else aria-hidden="true" />
            </button>
            <input
              class="immersive-volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              :value="volume"
              :aria-label="t('player.volume')"
              @input="emit('set-volume', Number($event.target.value))"
            />
          </div>

          <div class="immersive-controls">
            <button
              class="immersive-control-btn immersive-control-btn--secondary"
              type="button"
              :aria-label="t('player.prev')"
              @click="handlePlayPrev"
            >
              <SkipBack aria-hidden="true" />
            </button>
            <button
              class="immersive-control-btn immersive-control-btn--primary"
              type="button"
              :aria-label="isPlaying ? t('player.pause') : t('player.play')"
              @click="emit('toggle-playback')"
            >
              <Pause v-if="isPlaying" aria-hidden="true" />
              <Play v-else aria-hidden="true" />
            </button>
            <button
              class="immersive-control-btn immersive-control-btn--secondary"
              type="button"
              :aria-label="t('player.next')"
              @click="handlePlayNext"
            >
              <SkipForward aria-hidden="true" />
            </button>
          </div>

          <div class="immersive-time">
            <span class="immersive-time-current">{{ formatTime(currentTime) }}</span>
            <span class="immersive-time-divider">/</span>
            <span class="immersive-time-total">{{ formatTime(duration) }}</span>
          </div>
        </div>
      </div>
      <!-- /immersive-footer-inner -->
    </footer>
  </div>
</template>

<style scoped>
/* ========================================
   沉浸式播放页 - 根容器
   ======================================== */
.immersive-root {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.92);
  font-family: var(--font-family);
}

@keyframes immersive-enter {
  0% {
    opacity: 0;
    transform: scale(1.02);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes immersive-leave {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.98);
  }
}

/* ========================================
   内容交错入场动画
   ======================================== */
.immersive-enter-active .immersive-close {
  animation: fade-in-up 0.4s cubic-bezier(0.2, 0, 0, 1) 0.1s both;
}

.immersive-enter-active .immersive-artwork-frame {
  animation: scale-in 0.6s cubic-bezier(0.2, 0, 0, 1) 0.15s both;
}

.immersive-enter-active .immersive-artwork-reflection {
  animation: fade-in 0.5s cubic-bezier(0.2, 0, 0, 1) 0.3s both;
}

.immersive-enter-active .immersive-title {
  animation: fade-in-up 0.5s cubic-bezier(0.2, 0, 0, 1) 0.2s both;
}

.immersive-enter-active .immersive-artist {
  animation: fade-in-up 0.5s cubic-bezier(0.2, 0, 0, 1) 0.25s both;
}

.immersive-enter-active .immersive-album {
  animation: fade-in-up 0.5s cubic-bezier(0.2, 0, 0, 1) 0.3s both;
}

.immersive-enter-active .immersive-specs {
  animation: fade-in-up 0.5s cubic-bezier(0.2, 0, 0, 1) 0.35s both;
}

.immersive-enter-active .immersive-meta-side {
  animation: fade-in-up 0.5s cubic-bezier(0.2, 0, 0, 1) 0.4s both;
}

.immersive-enter-active .immersive-footer {
  animation: slide-up 0.5s cubic-bezier(0.2, 0, 0, 1) 0.25s both;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========================================
   沉浸式播放页 - 根容器
   ======================================== */
.immersive-root {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.92);
  font-family: var(--font-family);
}

/* ========================================
   关闭按钮
   ======================================== */
.immersive-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 10;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);
}

.immersive-close:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  transform: scale(1.05);
}

.immersive-close svg {
  width: 24px;
  height: 24px;
  stroke-width: 2;
}

/* ========================================
   主内容区
   ======================================== */
.immersive-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 3rem 0.5rem;
  min-height: 0;
  overflow: hidden;
}

/* 有歌词时：保持 flex，切换为行方向两栏 */
/* 用 flex 而非 grid，是因为 flex stretch 对绝对定位子元素的 height:100% 解析更稳定 */
.immersive-main.has-lyrics {
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
  gap: 2rem;
}

/* 有歌词时封面不拉伸——避免封面下方出现空白"黑框"区域 */
/* align-self: center 让封面在主区域中垂直居中，且仅占自身内容高度 */
/* 歌词列保持默认 align-self: stretch，撑满全高 */
.immersive-main.has-lyrics .immersive-artwork {
  align-self: center;
  flex-shrink: 0;
}

/* ========================================
   歌词面板
   ======================================== */
.immersive-lyrics {
  /* flex: 1 占满封面之外的所有剩余宽度 */
  flex: 1 1 0;
  min-width: 0;
  /* position: relative 作为歌词播放器绝对定位的包含块 */
  position: relative;
  /* 禁止文本选中，防止点击歌词跳转时出现选中框 */
  user-select: none;
  -webkit-user-select: none;
}

/* ========================================
   专辑封面
   ======================================== */
.immersive-artwork {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin: 0;
  /* 两栏时：宽度受限在 50% 内；单栏时：flex 居中，不撑满 */
  --art-size: min(clamp(200px, 24vw, 420px), 46vh);
}

.immersive-artwork-frame {
  position: relative;
  width: var(--art-size);
  height: var(--art-size);
  border-radius: 1.25rem;
  overflow: hidden;
  box-shadow:
    0 40px 80px -20px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* ========================================
   切歌过渡动画
   ======================================== */

/* 封面：淡出缩小 → 淡入放大（对称，无方向感） */
.track-art-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease,
    filter 0.18s ease;
}
.track-art-leave-to {
  opacity: 0;
  transform: scale(0.88);
  filter: blur(6px);
}
.track-art-enter-active {
  transition:
    opacity 0.36s cubic-bezier(0.2, 0, 0, 1),
    transform 0.36s cubic-bezier(0.2, 0, 0, 1);
}
.track-art-enter-from {
  opacity: 0;
  transform: scale(0.92);
}

/* 元数据：下一首——旧文字上移淡出，新文字从下淡入 */
.track-meta-next-leave-active {
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}
.track-meta-next-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.track-meta-next-enter-active {
  transition:
    opacity 0.28s cubic-bezier(0.2, 0, 0, 1) 0.03s,
    transform 0.28s cubic-bezier(0.2, 0, 0, 1) 0.03s;
}
.track-meta-next-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

/* 元数据：上一首——旧文字下移淡出，新文字从上淡入 */
.track-meta-prev-leave-active {
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}
.track-meta-prev-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.track-meta-prev-enter-active {
  transition:
    opacity 0.28s cubic-bezier(0.2, 0, 0, 1) 0.03s,
    transform 0.28s cubic-bezier(0.2, 0, 0, 1) 0.03s;
}
.track-meta-prev-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.immersive-artwork-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.immersive-artwork-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, rgba(60, 55, 75, 0.5), rgba(40, 35, 55, 0.7));
  font-size: clamp(3rem, 6vw, 5rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: rgba(255, 255, 255, 0.25);
}

/* 封面倒影 */
.immersive-artwork-reflection {
  width: var(--art-size);
  height: calc(var(--art-size) * 0.28);
  border-radius: 0 0 1.25rem 1.25rem;
  overflow: hidden;
  transform: scaleY(-1);
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.12) 0%, transparent 50%);
  -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.12) 0%, transparent 50%);
  opacity: 0.5;
  filter: blur(2px);
}

.immersive-artwork-reflection .immersive-artwork-image {
  filter: blur(4px);
}

/* ========================================
   曲目元数据行（底部）
   ======================================== */
.immersive-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  width: 100%;
}

.immersive-meta-main {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  flex: 1;
}

.immersive-meta-side {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.immersive-title {
  margin: 0;
  font-size: clamp(1.1rem, 1.6vw, 1.5rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.immersive-artist {
  margin: 0;
  font-size: clamp(0.85rem, 1.1vw, 1rem);
  font-weight: 500;
  color: rgba(255, 255, 255, 0.65);
}

.immersive-album {
  margin: 0;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.4);
}

/* 音频规格标签 */
.immersive-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.immersive-spec-tag {
  padding: 0.3rem 0.625rem;
  border-radius: 2rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.5);
}

/* 收藏按钮（心射等） */
.immersive-action-btn {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
}

.immersive-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

.immersive-action-btn.is-active {
  background: rgba(255, 80, 100, 0.15);
  border-color: rgba(255, 80, 100, 0.3);
  color: #ff6b7a;
}

.immersive-action-btn svg {
  width: 18px;
  height: 18px;
}

.immersive-action-btn.is-active svg {
  fill: currentColor;
}

/* 清除歌词按钮 — 危险色 */
.immersive-action-btn--lyrics-clear {
  border-color: rgba(255, 100, 60, 0.2);
  color: rgba(255, 120, 80, 0.7);
}

.immersive-action-btn--lyrics-clear:hover {
  background: rgba(255, 80, 40, 0.15);
  border-color: rgba(255, 80, 40, 0.35);
  color: #ff7050;
}

/* ========================================
   底部播放区 - 元数据 + 进度 + 控件
   ======================================== */
.immersive-footer {
  display: flex;
  justify-content: center;
  background: rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.immersive-footer-inner {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 2rem 1.75rem;
}

/* 进度条区域 */
.immersive-progress-section {
  width: 100%;
}

/* 时间显示 */
.immersive-time {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.immersive-time-current {
  color: rgba(255, 255, 255, 0.85);
}

.immersive-time-divider {
  color: rgba(255, 255, 255, 0.2);
}

.immersive-time-total {
  color: rgba(255, 255, 255, 0.4);
}

/* ========================================
   线性进度条
   ======================================== */
.immersive-progress {
  position: relative;
  width: 100%;
  height: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.immersive-progress-track {
  position: relative;
  width: 100%;
  height: 3px;
  border-radius: 1.5px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.immersive-progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 1.5px;
  transition: width 0.1s linear;
}

.immersive-progress:hover .immersive-progress-track {
  height: 4px;
}

.immersive-progress:hover .immersive-progress-fill {
  background: rgba(255, 255, 255, 0.7);
}

/* 播放位置指示器 */
.immersive-progress-thumb {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  transform: translate(-50%, -50%) scale(0);
  transition: transform 0.12s ease;
  pointer-events: none;
}

.immersive-progress:hover .immersive-progress-thumb {
  transform: translate(-50%, -50%) scale(1);
}

/* 控件行：音量 | 播放 | 时间 三列网格 */
.immersive-controls-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: 100%;
}

/* ========================================
   播放控件
   ======================================== */
.immersive-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.immersive-control-btn {
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.immersive-control-btn--secondary {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.55);
}

.immersive-control-btn--secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.85);
  transform: scale(1.05);
}

.immersive-control-btn--secondary:active {
  transform: scale(0.95);
}

.immersive-control-btn--secondary svg {
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

.immersive-control-btn--primary {
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.1);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  color: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 4px 20px -4px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.immersive-control-btn--primary:hover {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
  box-shadow:
    0 6px 24px -4px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.immersive-control-btn--primary:active {
  transform: scale(0.97);
}

.immersive-control-btn--primary svg {
  width: 22px;
  height: 22px;
  stroke-width: 2;
}

/* ========================================
   音量控制
   ======================================== */
.immersive-volume {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.5rem;
}

.immersive-volume-btn {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  transition: color 0.2s ease;
}

.immersive-volume-btn:hover {
  color: rgba(255, 255, 255, 0.75);
}

.immersive-volume-btn svg {
  width: 18px;
  height: 18px;
}

.immersive-volume-slider {
  width: 70px;
  height: 3px;
  appearance: none;
  border-radius: 1.5px;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
}

.immersive-volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  transition: transform 0.12s ease;
}

.immersive-volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.immersive-volume-slider::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  cursor: pointer;
}

/* ========================================
   响应式
   ======================================== */
@media (max-width: 920px) {
  .immersive-main {
    padding: 2.5rem 1.5rem 0.5rem;
    align-items: start;
  }

  .immersive-main.has-lyrics {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .immersive-artwork {
    --art-size: min(clamp(200px, 45vw, 320px), 32vh);
  }

  .immersive-artwork-frame {
    width: var(--art-size);
    height: var(--art-size);
  }

  .immersive-artwork-reflection {
    width: var(--art-size);
    height: calc(var(--art-size) * 0.25);
  }

  .immersive-footer-inner {
    padding: 0.875rem 1.5rem 1.25rem;
  }

  .immersive-volume {
    display: none;
  }

  .immersive-controls-row {
    grid-template-columns: 0 auto 1fr;
  }

  .immersive-close {
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 640px) {
  .immersive-main {
    padding: 3rem 1rem 0.5rem;
  }

  .immersive-artwork {
    --art-size: min(clamp(160px, 55vw, 240px), 28vh);
  }

  .immersive-artwork-frame {
    width: var(--art-size);
    height: var(--art-size);
  }

  .immersive-artwork-reflection {
    display: none;
  }

  .immersive-title {
    font-size: 1.1rem;
  }

  .immersive-artist {
    font-size: 0.875rem;
  }

  .immersive-footer-inner {
    padding: 0.75rem 1rem 1rem;
  }

  .immersive-meta-row {
    gap: 0.5rem;
  }

  .immersive-specs {
    display: none;
  }

  .immersive-control-btn--primary {
    width: 48px;
    height: 48px;
  }

  .immersive-control-btn--primary svg {
    width: 20px;
    height: 20px;
  }

  .immersive-control-btn--secondary {
    width: 36px;
    height: 36px;
  }

  .immersive-control-btn--secondary svg {
    width: 16px;
    height: 16px;
  }

  .immersive-time {
    font-size: 0.6875rem;
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .immersive-root {
    animation: none;
  }
  .immersive-progress-fill {
    transition: none;
  }
}
</style>

<style>
/* ========================================
   过渡动画（非 scoped，供 Transition 组件使用）
   ======================================== */
.immersive-enter-active {
  animation: immersive-enter 0.5s cubic-bezier(0.2, 0, 0, 1);
}

.immersive-leave-active {
  animation: immersive-leave 0.35s cubic-bezier(0.4, 0, 1, 1);
}

@keyframes immersive-enter {
  0% {
    opacity: 0;
    transform: scale(1.02);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes immersive-leave {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.98);
  }
}

/* 内容交错入场动画 */
.immersive-enter-active .immersive-close {
  animation: fade-in-up 0.4s cubic-bezier(0.2, 0, 0, 1) 0.1s both;
}

.immersive-enter-active .immersive-artwork-frame {
  animation: scale-in 0.6s cubic-bezier(0.2, 0, 0, 1) 0.15s both;
}

.immersive-enter-active .immersive-artwork-reflection {
  animation: fade-in 0.5s cubic-bezier(0.2, 0, 0, 1) 0.3s both;
}

.immersive-enter-active .immersive-title {
  animation: fade-in-up 0.5s cubic-bezier(0.2, 0, 0, 1) 0.2s both;
}

.immersive-enter-active .immersive-artist {
  animation: fade-in-up 0.5s cubic-bezier(0.2, 0, 0, 1) 0.25s both;
}

.immersive-enter-active .immersive-album {
  animation: fade-in-up 0.5s cubic-bezier(0.2, 0, 0, 1) 0.3s both;
}

.immersive-enter-active .immersive-specs {
  animation: fade-in-up 0.5s cubic-bezier(0.2, 0, 0, 1) 0.35s both;
}

.immersive-enter-active .immersive-meta-side {
  animation: fade-in-up 0.5s cubic-bezier(0.2, 0, 0, 1) 0.4s both;
}

.immersive-enter-active .immersive-footer {
  animation: slide-up 0.5s cubic-bezier(0.2, 0, 0, 1) 0.25s both;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .immersive-enter-active,
  .immersive-leave-active {
    animation: none;
  }

  .immersive-enter-active .immersive-close,
  .immersive-enter-active .immersive-artwork-frame,
  .immersive-enter-active .immersive-artwork-reflection,
  .immersive-enter-active .immersive-title,
  .immersive-enter-active .immersive-artist,
  .immersive-enter-active .immersive-album,
  .immersive-enter-active .immersive-specs,
  .immersive-enter-active .immersive-meta-side,
  .immersive-enter-active .immersive-footer {
    animation: none;
  }
}
</style>
