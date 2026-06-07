/**
 * CN: useLyrics — 歌词加载，输出 LyricLine[] 格式
 *
 * CN: 加载优先级：
 * CN:   1. localStorage 手动歌词（importLrcText 保存的）
 * CN:   2. 嵌入元数据（SYLT / USLT）
 * CN:   3. 无歌词
 *
 * CN: 缓存策略：
 * CN:   - embeddedCache: trackId → { lyricLines } | 'none'
 * CN:     'none' 表示已检查过无嵌入歌词，避免重复 parseBlob
 *
 * EN: useLyrics — lyrics loading, outputs LyricLine[] format
 *
 * EN: Loading priority:
 * EN:   1. localStorage manual lyrics (saved by importLrcText)
 * EN:   2. Embedded metadata (SYLT / USLT)
 * EN:   3. No lyrics
 *
 * EN: Cache strategy:
 * EN:   - embeddedCache: trackId → { lyricLines } | 'none'
 * EN:     'none' means confirmed no embedded lyrics, avoiding repeated parseBlob
 */

import { ref, shallowRef, computed, watch } from 'vue'
import { parseBlob } from 'music-metadata'
import { parseLrc } from '../utils/lrcParser'
import {
  saveLyrics,
  loadSavedLyrics,
  deleteSavedLyrics,
  hasSavedLyrics,
} from '../services/lyricsStorage'

/**
 * CN: @typedef {{ words: {word:string,startTime:number,endTime:number}[], startTime:number, endTime:number, translatedLyric:string, romanLyric:string, isBG:boolean, isDuet:boolean }} LyricLine
 *
 * EN: @typedef {{ words: {word:string,startTime:number,endTime:number}[], startTime:number, endTime:number, translatedLyric:string, romanLyric:string, isBG:boolean, isDuet:boolean }} LyricLine
 */

/** CN: 嵌入歌词缓存：trackId → { lyricLines: LyricLine[] } | 'none' */
/** EN: Embedded lyrics cache: trackId → { lyricLines: LyricLine[] } | 'none' */
const embeddedCache = new Map()
const MAX_CACHE = 50

/**
 * CN: 将内部 { time(s), text }[] 转换为 LyricLine[]（时间单位 ms，整数）
 *
 * EN: Convert internal { time(s), text }[] to LyricLine[] (time unit ms, integer)
 */
function toLyricLines(parsed) {
  const timed = parsed.filter((l) => l.time >= 0)

  if (timed.length > 0) {
    return timed.map((line, i, arr) => {
      const startMs = Math.round(line.time * 1000)
      const endMs = arr[i + 1] ? Math.round(arr[i + 1].time * 1000) : startMs + 6000
      return {
        words: [{ word: line.text, startTime: startMs, endTime: endMs }],
        startTime: startMs,
        endTime: endMs,
        translatedLyric: '',
        romanLyric: '',
        isBG: false,
        isDuet: false,
      }
    })
  }

  // CN: 纯文本（无时间戳）：均匀分布，每行 5 秒间隔
  // EN: Plain text (no timestamps): evenly distributed, 5-second interval per line
  return parsed.map((line, i) => {
    const startMs = i * 5000
    const endMs = (i + 1) * 5000
    return {
      words: [{ word: line.text, startTime: startMs, endTime: endMs }],
      startTime: startMs,
      endTime: endMs,
      translatedLyric: '',
      romanLyric: '',
      isBG: false,
      isDuet: false,
    }
  })
}

/** CN: 解析 LRC 文本为歌词行 */
/** EN: Parse LRC text into lyrics lines */
function parseLrcToLines(text) {
  if (!text || typeof text !== 'string') return []
  const parsed = parseLrc(text.trim())
  return parsed.length > 0 ? toLyricLines(parsed) : []
}

/**
 * CN: 从 music-metadata common 对象中提取歌词
 *
 * EN: Extract lyrics from music-metadata common object
 */
function extractFromMetadata(common) {
  const sylt = common?.synchronisedlyrics
  if (Array.isArray(sylt) && sylt.length > 0) {
    const first = sylt[0]
    if (Array.isArray(first?.synchronisedText) && first.synchronisedText.length > 0) {
      const raw = first.synchronisedText
        .filter((e) => typeof e.text === 'string' && e.text.trim())
        .map((e) => ({ time: e.timestamp / 1000, text: e.text.trim() }))
        .sort((a, b) => a.time - b.time)
      if (raw.length > 0) return toLyricLines(raw)
    }
  }

  const uslt = common?.lyrics
  if (Array.isArray(uslt) && uslt.length > 0) {
    const text = uslt[0]?.text ?? uslt[0]
    if (typeof text === 'string' && text.trim()) {
      const lines = parseLrcToLines(text)
      if (lines.length > 0) return lines
    }
  }

  return null
}

/**
 * CN: 从 File/Blob 异步提取嵌入歌词
 *
 * EN: Extract embedded lyrics from File/Blob asynchronously
 */
async function extractEmbedded(file) {
  try {
    const metadata = await parseBlob(file, { duration: false, skipCovers: true })
    return extractFromMetadata(metadata?.common)
  } catch {
    return null
  }
}

function pruneCache() {
  if (embeddedCache.size > MAX_CACHE) {
    const keys = [...embeddedCache.keys()].slice(0, Math.floor(MAX_CACHE / 2))
    keys.forEach((k) => embeddedCache.delete(k))
  }
}

/**
 * CN: useLyrics composable
 *
 * EN: useLyrics composable
 */
export function useLyrics({ currentTrack }) {
  const lyricLines = shallowRef([])
  const isLoading = ref(false)
  const hasManualLyrics = ref(false)
  const hasLyrics = computed(() => lyricLines.value.length > 0)

  let loadGeneration = 0 // CN/EN: loadLyrics race protection generation

  /**
   * CN: 根据 trackId 决定最终歌词：localStorage > embedded > 无
   *
   * EN: Determine final lyrics by trackId: localStorage > embedded > none
   */
  async function loadLyrics(track) {
    const gen = ++loadGeneration

    // CN: 立即清空旧歌词，防止残留
    // EN: Immediately clear old lyrics to prevent residual
    lyricLines.value = []
    hasManualLyrics.value = false

    if (!track?.id) {
      isLoading.value = false
      return
    }

    const trackId = track.id

    // --- CN: 1. localStorage 手动歌词（同步，无异步延迟） ---
    // --- EN: 1. localStorage manual lyrics (synchronous, no async delay) ---
    const savedText = loadSavedLyrics(trackId)
    if (savedText) {
      const lines = parseLrcToLines(savedText)
      if (lines.length > 0) {
        lyricLines.value = lines
        hasManualLyrics.value = true
        isLoading.value = false
        return
      }
    }

    // --- CN: 2. 嵌入歌词（可能需要异步解析） ---
    // --- EN: 2. Embedded lyrics (may need async parsing) ---

    // CN: 2a. 缓存命中
    // EN: 2a. Cache hit
    if (embeddedCache.has(trackId)) {
      const cached = embeddedCache.get(trackId)
      if (cached !== 'none') {
        lyricLines.value = cached.lyricLines
      }
      // CN: 'none' 意味着已确认无嵌入歌词
      // EN: 'none' means confirmed no embedded lyrics
      isLoading.value = false
      return
    }

    // CN: 2b. 需要异步解析
    // EN: 2b. Needs async parsing
    const file = track.file instanceof Blob ? track.file : null
    if (!file) {
      embeddedCache.set(trackId, 'none')
      pruneCache()
      isLoading.value = false
      return
    }

    isLoading.value = true
    const embedded = await extractEmbedded(file)

    // CN: 竞态检查：如果在异步期间曲目已切换，丢弃结果
    // EN: Race condition check: if track changed during async, discard result
    if (gen !== loadGeneration) return

    if (embedded && embedded.length > 0) {
      embeddedCache.set(trackId, { lyricLines: embedded })
      lyricLines.value = embedded
    } else {
      embeddedCache.set(trackId, 'none')
    }

    pruneCache()
    isLoading.value = false
  }

  /**
   * CN: 手动导入 LRC 文本：保存到 localStorage 并立即生效
   *
   * EN: Manually import LRC text: save to localStorage and take effect immediately
   */
  function importLrcText(lrcText) {
    const track = currentTrack?.value
    if (!track?.id || typeof lrcText !== 'string') return

    const trimmed = lrcText.trim()
    if (!trimmed) return

    const lines = parseLrcToLines(trimmed)
    if (lines.length === 0) return

    saveLyrics(track.id, trimmed)
    lyricLines.value = lines
    hasManualLyrics.value = true
  }

  /**
   * CN: 清除手动歌词 → 回退到嵌入歌词（若有）
   *
   * EN: Clear manual lyrics → fall back to embedded lyrics (if any)
   */
  function clearManualLyrics() {
    const track = currentTrack?.value
    if (!track?.id) return

    deleteSavedLyrics(track.id)
    hasManualLyrics.value = false

    // CN: 回退
    // EN: Fall back
    const cached = embeddedCache.get(track.id)
    if (cached && cached !== 'none') {
      lyricLines.value = cached.lyricLines
    } else {
      lyricLines.value = []
    }
  }

  // CN: 唯一的 watch：曲目变化触发加载
  // EN: The only watch: track change triggers loading
  watch(
    () => currentTrack?.value,
    (track) => loadLyrics(track),
    { immediate: true },
  )

  return {
    lyricLines,
    hasLyrics,
    hasManualLyrics,
    isLoading,
    importLrcText,
    clearManualLyrics,
  }
}
