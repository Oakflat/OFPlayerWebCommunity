<script setup>
import { ref, computed, watch } from 'vue'
import { ChevronLeft, ImagePlus, Play, X } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'
import { setAlbumCoverOverride } from '../services/albumViewService'

// ─── Props / Emits ───────────────────────────────────────────────────────────

const props = defineProps({
  /** 'albums' | 'artists' */
  browserKind: {
    type: String,
    default: 'albums',
  },
  /** AlbumGroup[] 或 ArtistGroup[] */
  groups: {
    type: Array,
    default: () => [],
  },
  currentTrackId: {
    type: String,
    default: null,
  },
  isPlaying: {
    type: Boolean,
    default: false,
  },
  searchQuery: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'select-track',
  'play-group', // 播放某专辑/歌手全部曲目
  'cover-changed', // { albumKey, dataUrl }
])

// ─── State ───────────────────────────────────────────────────────────────────

const { t } = useI18n()

/** 当前展开的专辑/歌手 key，null = 网格视图 */
const expandedKey = ref(null)

/** 歌手视图中展开的专辑 key */
const expandedArtistAlbumKey = ref(null)

// 拖放封面高亮
const dragOverKey = ref(null)

// ─── 过滤 ────────────────────────────────────────────────────────────────────

const filteredGroups = computed(() => {
  return props.groups
})

// ─── 封面 ────────────────────────────────────────────────────────────────────

function pickCover(group, event) {
  event?.stopPropagation()
  const input = document.createElement('input')
  input.type = 'file'
  // Precise accept list — excludes SVG to prevent XSS via embedded scripts.
  input.accept = 'image/jpeg,image/png,image/webp,image/gif'
  input.onchange = (e) => {
    const file = e.target?.files?.[0]
    if (!file || !ALLOWED_COVER_MIME_TYPES.has(file.type)) return
    readImageFile(file, group.key)
  }
  input.click()
}

function handleDragOver(key, event) {
  event.preventDefault()
  dragOverKey.value = key
}

function handleDragLeave() {
  dragOverKey.value = null
}

// Allowed cover image MIME types — SVG is intentionally excluded because
// SVG files can embed <script> elements and trigger XSS via v-html / src.
const ALLOWED_COVER_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function handleDrop(group, event) {
  event.preventDefault()
  dragOverKey.value = null
  const file = event.dataTransfer?.files?.[0]
  if (!file || !ALLOWED_COVER_MIME_TYPES.has(file.type)) return
  readImageFile(file, group.key)
}

function readImageFile(file, albumKey) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result
    if (!dataUrl) return
    setAlbumCoverOverride(albumKey, dataUrl)
    emit('cover-changed', { albumKey, dataUrl })
  }
  reader.readAsDataURL(file)
}

// ─── 导航 ────────────────────────────────────────────────────────────────────

function openGroup(group) {
  expandedKey.value = group.key
  expandedArtistAlbumKey.value = null
}

function closeGroup() {
  expandedKey.value = null
  expandedArtistAlbumKey.value = null
}

function playGroup(group) {
  const tracks = group.tracks ?? []
  if (tracks.length === 0) return
  emit('play-group', tracks)
}

function selectTrack(track) {
  emit('select-track', track)
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

// 在歌手视图中切换专辑展开
function toggleArtistAlbum(albumKey) {
  expandedArtistAlbumKey.value = expandedArtistAlbumKey.value === albumKey ? null : albumKey
}

// expandedGroup：双层始终在 DOM，直接更新缓存即可，无需等待过渡结束
const expandedGroup = ref(null)

watch(
  [expandedKey, () => props.groups],
  ([key, groups]) => {
    if (key) {
      const found = groups.find((g) => g.key === key)
      if (found) expandedGroup.value = found
    } else {
      expandedGroup.value = null
    }
  },
  { immediate: true },
)

// 切换 browserKind（专辑 ↔ 艺术家）时：重置详情状态，重新执行卡片入场动画
watch(
  () => props.browserKind,
  () => {
    expandedKey.value = null
    expandedGroup.value = null
    expandedArtistAlbumKey.value = null
  },
)
</script>

<template>
  <div class="album-browser">
    <!-- ── 详情层：始终在 DOM，expandedKey 为真时 CSS 触发滑入 ─────── -->
    <div class="ab-layer ab-layer--detail" :class="{ 'is-open': !!expandedKey }">
      <div v-if="expandedGroup" class="album-detail">
        <div class="album-detail-header">
          <button class="detail-back-btn" @click="closeGroup">
            <ChevronLeft :size="18" />
            <span>{{ browserKind === 'artists' ? expandedGroup.artistName : '全部专辑' }}</span>
          </button>

          <div class="detail-hero">
            <!-- 封面 -->
            <div
              class="detail-cover-wrap"
              :class="{ 'drag-over': dragOverKey === expandedGroup.key }"
              @dragover="handleDragOver(expandedGroup.key, $event)"
              @dragleave="handleDragLeave"
              @drop="handleDrop(expandedGroup, $event)"
            >
              <img
                v-if="expandedGroup.coverUrl ?? expandedGroup.albums?.[0]?.coverUrl"
                class="detail-cover-img"
                :src="expandedGroup.coverUrl ?? expandedGroup.albums?.[0]?.coverUrl"
                alt=""
                draggable="false"
              />
              <div v-else class="detail-cover-placeholder">
                <span>{{
                  (expandedGroup.albumName ?? expandedGroup.artistName ?? '?')
                    .slice(0, 2)
                    .toUpperCase()
                }}</span>
              </div>
              <button
                class="detail-cover-change-btn"
                title="更换封面"
                @click="pickCover(expandedGroup, $event)"
              >
                <ImagePlus :size="14" />
                <span>更换封面</span>
              </button>
            </div>

            <!-- 信息 -->
            <div class="detail-meta">
              <p class="detail-eyebrow">
                {{ browserKind === 'artists' ? '艺术家' : '专辑' }}
              </p>
              <h2 class="detail-title">
                {{ expandedGroup.albumName ?? expandedGroup.artistName }}
              </h2>
              <p v-if="expandedGroup.albumArtist" class="detail-artist">
                {{ expandedGroup.albumArtist }}
              </p>
              <p class="detail-stats">
                <span v-if="browserKind === 'artists'">
                  {{ expandedGroup.albumCount }} 张专辑 ·
                </span>
                {{ expandedGroup.trackCount }} 首曲目
                <span v-if="expandedGroup.year"> · {{ expandedGroup.year }}</span>
              </p>
              <button class="detail-play-all-btn" @click="playGroup(expandedGroup)">
                <Play :size="14" fill="currentColor" />
                <span>播放全部</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 歌手视图：按专辑分组展示 -->
        <template v-if="browserKind === 'artists' && expandedGroup.albums">
          <div v-for="album in expandedGroup.albums" :key="album.key" class="artist-album-section">
            <button class="artist-album-section-header" @click="toggleArtistAlbum(album.key)">
              <img v-if="album.coverUrl" class="artist-album-thumb" :src="album.coverUrl" alt="" />
              <div v-else class="artist-album-thumb artist-album-thumb-placeholder">
                {{ album.albumName.slice(0, 2).toUpperCase() }}
              </div>
              <div class="artist-album-info">
                <span class="artist-album-name">{{ album.albumName }}</span>
                <span class="artist-album-meta"
                  >{{ album.year ?? '' }} · {{ album.trackCount }} 首</span
                >
              </div>
              <ChevronLeft
                :size="14"
                class="artist-album-chevron"
                :class="{ 'is-open': expandedArtistAlbumKey === album.key }"
              />
            </button>

            <Transition name="track-expand">
              <div v-if="expandedArtistAlbumKey === album.key" class="detail-track-list">
                <div
                  v-for="(track, idx) in album.tracks"
                  :key="track.id"
                  class="detail-track-row"
                  :class="{ 'is-active': track.id === currentTrackId }"
                  :style="{ '--row-index': idx }"
                  @click="selectTrack(track)"
                >
                  <span class="track-row-index">{{ String(idx + 1).padStart(2, '0') }}</span>
                  <div class="track-row-info">
                    <span class="track-row-title">{{
                      track.displayTitle || track.title || track.fileName
                    }}</span>
                  </div>
                  <span class="track-row-duration">{{ formatTime(track.duration) }}</span>
                </div>
              </div>
            </Transition>
          </div>
        </template>

        <!-- 专辑视图：直接列出曲目 -->
        <template v-else-if="browserKind === 'albums'">
          <div class="detail-track-list detail-track-list--always-open">
            <div
              v-for="(track, idx) in expandedGroup.tracks"
              :key="track.id"
              class="detail-track-row"
              :class="{ 'is-active': track.id === currentTrackId }"
              :style="{ '--row-index': idx }"
              @click="selectTrack(track)"
            >
              <span class="track-row-index">{{ String(idx + 1).padStart(2, '0') }}</span>
              <div class="track-row-info">
                <span class="track-row-title">{{
                  track.displayTitle || track.title || track.fileName
                }}</span>
                <span v-if="track.artist" class="track-row-artist">{{ track.artist }}</span>
              </div>
              <span class="track-row-duration">{{ formatTime(track.duration) }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- ── 网格层：始终在 DOM，expandedKey 为真时 CSS 触发退场 ─────── -->
    <div class="ab-layer ab-layer--grid" :class="{ 'is-behind': !!expandedKey }">
      <div class="album-grid">
        <div
          v-for="(group, idx) in filteredGroups"
          :key="group.key"
          class="album-card"
          :class="{
            'drag-over': dragOverKey === group.key,
            'has-active-track': group.tracks?.some((t) => t.id === currentTrackId),
          }"
          :style="{ '--card-index': idx }"
          role="button"
          tabindex="0"
          @click="openGroup(group)"
          @keydown.enter="openGroup(group)"
          @dragover="handleDragOver(group.key, $event)"
          @dragleave="handleDragLeave"
          @drop="handleDrop(group, $event)"
        >
          <!-- 封面区 -->
          <div class="card-cover-wrap">
            <img
              v-if="group.coverUrl ?? group.albums?.[0]?.coverUrl"
              class="card-cover-img"
              :src="group.coverUrl ?? group.albums?.[0]?.coverUrl"
              alt=""
              draggable="false"
            />
            <div v-else class="card-cover-placeholder">
              <span>{{
                (group.albumName ?? group.artistName ?? '?').slice(0, 2).toUpperCase()
              }}</span>
            </div>

            <!-- 悬停操作层 -->
            <div class="card-cover-overlay">
              <button class="card-play-btn" title="播放" @click.stop="playGroup(group)">
                <Play :size="18" fill="currentColor" />
              </button>
              <button
                class="card-cover-btn"
                title="更换封面"
                @click.stop="pickCover(group, $event)"
              >
                <ImagePlus :size="14" />
              </button>
            </div>

            <!-- 拖放提示 -->
            <div v-if="dragOverKey === group.key" class="card-drop-hint">
              <ImagePlus :size="20" />
              <span>拖放到此更换封面</span>
            </div>
          </div>

          <!-- 文字信息 -->
          <div class="card-info">
            <p class="card-title">{{ group.albumName ?? group.artistName }}</p>
            <p class="card-sub">
              <span v-if="browserKind === 'albums'">
                {{ group.albumArtist }}
                <span v-if="group.year"> · {{ group.year }}</span>
              </span>
              <span v-else> {{ group.albumCount }} 张专辑 · {{ group.trackCount }} 首 </span>
            </p>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredGroups.length === 0" class="browser-empty">
          <p>
            {{ searchQuery ? '无匹配结果' : browserKind === 'albums' ? '暂无专辑' : '暂无艺术家' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ─── 根容器：锚定在 .track-region（position:relative）上，填满整个内容区 ── */
.album-browser {
  position: absolute;
  inset: 0;
  overflow: hidden;
  /* 整个面板挂载时淡入 + 上移，消除"点进去卡住"感 */
  animation: album-browser-enter 280ms cubic-bezier(0.2, 0, 0, 1) both;
}

@keyframes album-browser-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ─── 双层视图：ab-layer 始终在 DOM，CSS class 切换触发丝滑过渡 ──────────── */
/* 核心原理：两层同时存在，永远不会出现「两层都不可见」的空白帧               */
.ab-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* 网格层：默认可见（z-index 1），expandedKey 激活时向左退场 */
.ab-layer--grid {
  z-index: 1;
  transition:
    transform 300ms cubic-bezier(0.2, 0, 0, 1),
    opacity 220ms ease;
  will-change: transform, opacity;
}
.ab-layer--grid.is-behind {
  transform: translateX(-20px);
  opacity: 0;
  pointer-events: none;
}

/* 详情层：默认隐藏在右侧（z-index 2），expandedKey 激活时滑入覆盖网格 */
.ab-layer--detail {
  z-index: 2;
  transform: translateX(32px);
  opacity: 0;
  pointer-events: none;
  transition:
    transform 300ms cubic-bezier(0.2, 0, 0, 1),
    opacity 240ms ease;
  will-change: transform, opacity;
}
.ab-layer--detail.is-open {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}

/* 曲目折叠展开 */
.track-expand-enter-active,
.track-expand-leave-active {
  overflow: hidden;
}
.track-expand-enter-active {
  transition:
    max-height var(--duration-xl) var(--ease-emphasized-decelerate),
    opacity var(--duration-lg) var(--ease-standard);
}
.track-expand-leave-active {
  transition:
    max-height var(--duration-md) var(--ease-emphasized-accelerate),
    opacity var(--duration-sm) var(--ease-standard);
}
.track-expand-enter-from,
.track-expand-leave-to {
  max-height: 0;
  opacity: 0;
}
.track-expand-enter-to,
.track-expand-leave-from {
  max-height: 2000px;
  opacity: 1;
}

/* ─── 卡片网格 ───────────────────────────────────────────────────────────── */
.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 20px;
  padding: 20px 20px 32px;
  overflow-y: auto;
  align-content: start;
  height: 100%;
  scrollbar-gutter: stable;
}

.album-detail {
  scrollbar-gutter: stable;
}

@supports selector(::-webkit-scrollbar) {
  .album-grid,
  .album-detail {
    scrollbar-width: auto;
    scrollbar-color: auto;
  }

  .album-grid::-webkit-scrollbar,
  .album-detail::-webkit-scrollbar {
    width: var(--scrollbar-hit-size);
    height: var(--scrollbar-hit-size);
  }

  .album-grid::-webkit-scrollbar-track,
  .album-detail::-webkit-scrollbar-track,
  .album-grid::-webkit-scrollbar-track-piece,
  .album-detail::-webkit-scrollbar-track-piece {
    background: transparent;
    border-radius: var(--radius-full);
  }

  .album-grid::-webkit-scrollbar-thumb,
  .album-detail::-webkit-scrollbar-thumb {
    border-radius: var(--radius-full);
    background-clip: content-box;
    background-color: var(--scrollbar-thumb-idle);
    border: var(--scrollbar-thumb-idle-inset) solid transparent;
    transition:
      background-color var(--transition-fast),
      border-width var(--transition-fast);
  }

  .album-grid:hover::-webkit-scrollbar-thumb,
  .album-grid:focus-within::-webkit-scrollbar-thumb,
  .album-detail:hover::-webkit-scrollbar-thumb,
  .album-detail:focus-within::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-thumb-hover);
    border-width: var(--scrollbar-thumb-active-inset);
  }

  .album-grid::-webkit-scrollbar-thumb:hover,
  .album-grid::-webkit-scrollbar-thumb:active,
  .album-detail::-webkit-scrollbar-thumb:hover,
  .album-detail::-webkit-scrollbar-thumb:active {
    background-color: var(--scrollbar-thumb-active);
    border-width: 1px;
  }

  .album-grid::-webkit-scrollbar-button,
  .album-grid::-webkit-scrollbar-button:start:decrement,
  .album-grid::-webkit-scrollbar-button:end:increment,
  .album-grid::-webkit-scrollbar-button:single-button,
  .album-detail::-webkit-scrollbar-button,
  .album-detail::-webkit-scrollbar-button:start:decrement,
  .album-detail::-webkit-scrollbar-button:end:increment,
  .album-detail::-webkit-scrollbar-button:single-button {
    display: block;
    width: 0;
    height: 0;
    background: transparent;
  }

  .album-grid::-webkit-scrollbar-corner,
  .album-detail::-webkit-scrollbar-corner {
    background: transparent;
  }
}

@supports not selector(::-webkit-scrollbar) {
  .album-grid,
  .album-detail {
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
  }

  .album-grid:hover,
  .album-grid:focus-within,
  .album-detail:hover,
  .album-detail:focus-within {
    scrollbar-color: var(--scrollbar-thumb-hover) transparent;
  }
}

/* ── 卡片入场：挂载即播放，交错延迟，无需 Observer ── */
.album-grid .album-card {
  animation: browser-card-enter var(--duration-2xl) var(--ease-emphasized-decelerate) both;
  animation-delay: calc(var(--card-index, 0) * 22ms);
}

@keyframes browser-card-enter {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.album-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  outline: none;
  border-radius: 10px;
  transition: transform var(--transition-bounce);
}
.album-card:hover {
  transform: translateY(-3px);
}
.album-card:active {
  transform: translateY(-1px) scale(0.99);
}
.album-card:focus-visible {
  box-shadow: 0 0 0 2px var(--of-brand);
  border-radius: 10px;
}

.album-card.has-active-track .card-cover-wrap {
  box-shadow: 0 0 0 2px var(--of-brand);
}

/* 封面 */
.card-cover-wrap {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface-variant, #f2f2f5);
  box-shadow: var(--shadow-sm);
  transition:
    box-shadow var(--transition-normal),
    transform var(--transition-bounce);
}
.album-card:hover .card-cover-wrap {
  box-shadow: var(--shadow-soft);
}

.card-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform var(--duration-2xl) var(--ease-out-quart);
}
.album-card:hover .card-cover-img {
  transform: scale(1.04);
}

.card-cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    var(--surface-elevated, #e8e8ec) 0%,
    var(--surface-variant, #d4d4da) 100%
  );
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--ink-muted, #aaa);
  letter-spacing: -0.02em;
  user-select: none;
}

/* 封面悬停操作层 */
.card-cover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.36);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  opacity: 0;
  transition: opacity var(--transition-normal);
  -webkit-backdrop-filter: blur(3px);
  backdrop-filter: blur(3px);
}
.card-cover-wrap:hover .card-cover-overlay {
  opacity: 1;
}

.card-play-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  border: none;
  cursor: pointer;
  color: #111;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition:
    transform var(--transition-bounce),
    background var(--transition-fast);
  /* 从 overlay 中心缩放进入 */
  transform: scale(0.82);
}
.card-cover-wrap:hover .card-play-btn {
  transform: scale(1);
}
.card-play-btn:hover {
  transform: scale(1.1) !important;
  background: #fff;
}
.card-play-btn:active {
  transform: scale(0.95) !important;
}

.card-cover-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.78);
  border: none;
  cursor: pointer;
  color: #111;
  transition:
    transform var(--transition-bounce),
    background var(--transition-fast);
  transform: scale(0.82);
}
.card-cover-wrap:hover .card-cover-btn {
  transform: scale(1);
}
.card-cover-btn:hover {
  transform: scale(1.08) !important;
  background: #fff;
}

/* 拖放提示 */
.card-drop-hint {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(0, 122, 255, 0.16);
  border: 2px dashed rgba(0, 122, 255, 0.55);
  border-radius: 8px;
  color: var(--of-brand);
  font-size: 0.72rem;
  font-weight: 600;
  pointer-events: none;
  animation: browser-card-enter var(--duration-md) var(--ease-emphasized-decelerate) both;
}
.album-card.drag-over .card-cover-wrap {
  box-shadow: 0 0 0 2px var(--of-brand);
}

/* 文字 */
.card-info {
  padding: 0 2px;
}
.card-title {
  font-size: var(--font-size-sm, 0.84rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--ink, #111);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  transition: color var(--transition-fast);
}
.album-card:hover .card-title {
  color: var(--ink, #111);
}

.card-sub {
  font-size: var(--font-size-xs, 0.74rem);
  color: var(--ink-muted, #666);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 2px 0 0;
}

/* ─── 空状态 ─────────────────────────────────────────────────────────────── */
.browser-empty {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: var(--ink-muted, #aaa);
  font-size: var(--font-size-sm, 0.88rem);
  animation: fade-in var(--duration-xl) var(--ease-standard) both;
}

/* ─── 专辑详情视图 ───────────────────────────────────────────────────────── */
.album-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.album-detail-header {
  padding: 16px 20px 0;
  flex-shrink: 0;
}

/* 返回按钮入场 */
.detail-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm, 0.84rem);
  color: var(--of-brand);
  padding: 4px 0;
  margin-bottom: 16px;
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
  animation: slide-in-left var(--duration-xl) var(--ease-emphasized-decelerate) both;
  animation-delay: 40ms;
}
.detail-back-btn:hover {
  opacity: 0.75;
  transform: translateX(-2px);
}

/* hero 区整体入场 */
.detail-hero {
  display: flex;
  gap: 20px;
  align-items: flex-end;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line-soft, rgba(0, 0, 0, 0.06));
  margin-bottom: 4px;
  animation: slide-up-fade-soft var(--duration-2xl) var(--ease-emphasized-decelerate) both;
  animation-delay: 60ms;
}

/* 详情封面 */
.detail-cover-wrap {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface-variant, #f2f2f5);
  cursor: pointer;
  box-shadow: var(--shadow-soft);
  transition:
    box-shadow var(--transition-normal),
    transform var(--transition-bounce);
}
.detail-cover-wrap:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.18);
}

.detail-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.detail-cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    var(--surface-elevated, #e8e8ec) 0%,
    var(--surface-variant, #d4d4da) 100%
  );
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--ink-muted, #aaa);
}
.detail-cover-change-btn {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  cursor: pointer;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 600;
  opacity: 0;
  transition: opacity var(--transition-normal);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}
.detail-cover-wrap:hover .detail-cover-change-btn {
  opacity: 1;
}
.detail-cover-wrap.drag-over {
  box-shadow: 0 0 0 2px var(--of-brand);
}

/* 详情文字区：依次错落入场 */
.detail-meta {
  flex: 1;
  min-width: 0;
}
.detail-eyebrow {
  font-size: var(--font-size-xs, 0.68rem);
  font-weight: var(--font-weight-bold, 700);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wider, 0.06em);
  color: var(--ink-muted, #aaa);
  margin: 0 0 4px;
  animation: eyebrow-enter var(--duration-lg) var(--ease-emphasized-decelerate) both;
  animation-delay: 100ms;
}
.detail-title {
  font-size: var(--font-size-2xl, 1.4rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--ink, #111);
  line-height: 1.2;
  margin: 0 0 4px;
  animation: title-enter var(--duration-xl) var(--ease-emphasized-decelerate) both;
  animation-delay: 110ms;
}
.detail-artist {
  font-size: var(--font-size-base, 0.88rem);
  color: var(--of-brand);
  margin: 0 0 4px;
  cursor: pointer;
  animation: fade-in var(--duration-lg) var(--ease-standard) both;
  animation-delay: 130ms;
}
.detail-stats {
  font-size: var(--font-size-sm, 0.76rem);
  color: var(--ink-soft, #666);
  margin: 0 0 12px;
  animation: fade-in var(--duration-lg) var(--ease-standard) both;
  animation-delay: 150ms;
}

.detail-play-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: var(--radius-full, 100px);
  background: var(--of-brand);
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm, 0.82rem);
  font-weight: var(--font-weight-semibold, 600);
  transition:
    opacity var(--transition-fast),
    transform var(--transition-bounce);
  animation: scale-in-soft var(--duration-xl) var(--ease-spring) both;
  animation-delay: 180ms;
}
.detail-play-all-btn:hover {
  opacity: 0.88;
  transform: scale(1.04);
}
.detail-play-all-btn:active {
  transform: scale(0.97);
}

/* ─── 曲目列表 ───────────────────────────────────────────────────────────── */
.detail-track-list {
  padding: 0 20px 32px;
}
.detail-track-list--always-open {
  padding-top: 8px;
}

/* 曲目行：交错入场 */
.detail-track-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background var(--transition-fast),
    transform var(--transition-fast);
  animation: item-enter var(--duration-lg) var(--ease-emphasized-decelerate) both;
  animation-delay: calc(var(--row-index, 0) * 20ms + 80ms);
}
.detail-track-row:hover {
  background: var(--surface-hover, rgba(0, 0, 0, 0.04));
  transform: translateX(2px);
}
.detail-track-row:active {
  transform: translateX(1px) scale(0.99);
}
.detail-track-row.is-active {
  background: var(--primary-container, rgba(0, 122, 255, 0.08));
}
.detail-track-row.is-active .track-row-title {
  color: var(--of-brand);
}

.track-row-index {
  font-size: var(--font-size-xs, 0.72rem);
  color: var(--ink-subtle, #aaa);
  width: 22px;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  transition: color var(--transition-fast);
}
.detail-track-row.is-active .track-row-index {
  color: var(--of-brand);
}

.track-row-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.track-row-title {
  font-size: var(--font-size-base, 0.84rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--ink, #111);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color var(--transition-fast);
}
.track-row-artist {
  font-size: var(--font-size-xs, 0.72rem);
  color: var(--ink-muted, #666);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.track-row-duration {
  font-size: var(--font-size-xs, 0.72rem);
  color: var(--ink-subtle, #aaa);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

/* ─── 歌手视图：专辑折叠区 ───────────────────────────────────────────────── */
.artist-album-section {
  border-bottom: 1px solid var(--line-soft, rgba(0, 0, 0, 0.06));
}
.artist-album-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 20px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition:
    background var(--transition-fast),
    transform var(--transition-fast);
}
.artist-album-section-header:hover {
  background: var(--surface-hover, rgba(0, 0, 0, 0.03));
  transform: translateX(2px);
}

.artist-album-thumb {
  width: 44px;
  height: 44px;
  border-radius: 5px;
  object-fit: cover;
  flex-shrink: 0;
  transition: transform var(--transition-bounce);
  box-shadow: var(--shadow-sm);
}
.artist-album-section-header:hover .artist-album-thumb {
  transform: scale(1.06);
}

.artist-album-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--surface-elevated, #e8e8ec) 0%,
    var(--surface-variant, #d4d4da) 100%
  );
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--ink-muted, #aaa);
}
.artist-album-info {
  flex: 1;
  min-width: 0;
}
.artist-album-name {
  display: block;
  font-size: var(--font-size-base, 0.84rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--ink, #111);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.artist-album-meta {
  display: block;
  font-size: var(--font-size-xs, 0.72rem);
  color: var(--ink-muted, #666);
}
.artist-album-chevron {
  flex-shrink: 0;
  color: var(--ink-subtle, #aaa);
  transition: transform var(--duration-xl) var(--ease-emphasized);
  transform: rotate(-90deg);
}
.artist-album-chevron.is-open {
  transform: rotate(0deg);
  color: var(--of-brand);
}
</style>
