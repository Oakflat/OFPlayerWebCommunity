/**
 * CN: lyricsStorage — 手动歌词的本地持久化
 *
 * CN: 用 localStorage 按 trackId 存储 LRC 文本。
 * CN: key 格式：ofplayer:lyrics:<trackId>
 *
 * EN: lyricsStorage — local persistence for manual lyrics
 *
 * EN: Stores LRC text by trackId using localStorage.
 * EN: Key format: ofplayer:lyrics:<trackId>
 */

const PREFIX = 'ofplayer:lyrics:'

// CN: LRC 文本上限：512 KB。正常 LRC 文件通常 < 50 KB；512 KB 已极度宽松，
// CN: 但可防止嵌入超长歌词的恶意音频文件耗尽 localStorage 配额。
// EN: LRC text limit: 512 KB. Normal LRC files are typically < 50 KB; 512 KB is extremely generous,
// EN: but prevents malicious audio files with embedded ultra-long lyrics from exhausting localStorage quota.
const MAX_LRC_LENGTH = 512 * 1024

/**
 * CN: 保存 LRC 文本到 localStorage
 * CN: @param {string} trackId
 * CN: @param {string} lrcText
 *
 * EN: Save LRC text to localStorage
 * EN: @param {string} trackId
 * EN: @param {string} lrcText
 */
export function saveLyrics(trackId, lrcText) {
  if (lrcText.length > MAX_LRC_LENGTH) {
    return
  }

  try {
    localStorage.setItem(PREFIX + trackId, lrcText)
  } catch {
    // CN: 存储配额已满，静默失败
    // EN: Storage quota exceeded, fail silently
  }
}

/**
 * CN: 读取保存的 LRC 文本；不存在则返回 null
 * CN: @param {string} trackId
 * CN: @returns {string | null}
 *
 * EN: Read saved LRC text; returns null if not exists
 * EN: @param {string} trackId
 * EN: @returns {string | null}
 */
export function loadSavedLyrics(trackId) {
  try {
    return localStorage.getItem(PREFIX + trackId)
  } catch {
    return null
  }
}

/**
 * CN: 删除保存的歌词
 * CN: @param {string} trackId
 *
 * EN: Delete saved lyrics
 * EN: @param {string} trackId
 */
export function deleteSavedLyrics(trackId) {
  try {
    localStorage.removeItem(PREFIX + trackId)
  } catch {
    // CN: 忽略
    // EN: ignore
  }
}

/**
 * CN: 检查是否存在手动保存的歌词
 * CN: @param {string} trackId
 * CN: @returns {boolean}
 *
 * EN: Check if manually saved lyrics exist
 * EN: @param {string} trackId
 * EN: @returns {boolean}
 */
export function hasSavedLyrics(trackId) {
  try {
    return localStorage.getItem(PREFIX + trackId) !== null
  } catch {
    return false
  }
}
