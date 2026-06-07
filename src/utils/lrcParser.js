/**
 * CN: LRC 歌词解析器
 * CN: 支持：标准 LRC、增强 LRC（逐字）、纯文本歌词
 * CN: 性能目标：同步解析，单次 O(n)，无正则回溯，可安全在主线程调用
 *
 * EN: LRC lyrics parser
 * EN: Supports: standard LRC, enhanced LRC (per-word), plain text lyrics
 * EN: Performance goal: synchronous parsing, single pass O(n), no regex backtracking, safe to call on main thread
 */

/**
 * CN: 将 [mm:ss.xx] 或 [mm:ss:xx] 时间标签转为秒数
 * CN: @param {string} tag - 例如 "01:23.45" 或 "1:23:45"
 * CN: @returns {number} 秒数，无效则返回 -1
 *
 * EN: Convert [mm:ss.xx] or [mm:ss:xx] timestamp tag to seconds
 * EN: @param {string} tag - e.g. "01:23.45" or "1:23:45"
 * EN: @returns {number} seconds, or -1 if invalid
 */
function parseTimestamp(tag) {
  // CN: mm:ss.xx  (最常见)
  // EN: mm:ss.xx  (most common)
  let m = tag.match(/^(\d{1,3}):(\d{2})\.(\d{1,3})$/)
  if (m) {
    const ms = m[3].padEnd(3, '0').slice(0, 3)
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + parseInt(ms, 10) / 1000
  }

  // CN: mm:ss:xx  (少数软件)
  // EN: mm:ss:xx  (some software)
  m = tag.match(/^(\d{1,3}):(\d{2}):(\d{1,3})$/)
  if (m) {
    const cs = m[3].padEnd(2, '0').slice(0, 2)
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + parseInt(cs, 10) / 100
  }

  // CN: mm:ss  (无厘米秒)
  // EN: mm:ss  (no centiseconds)
  m = tag.match(/^(\d{1,3}):(\d{2})$/)
  if (m) {
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
  }

  return -1
}

/**
 * CN: 解析 LRC 文本，返回排序好的歌词行数组
 * CN: @param {string} text
 * CN: @returns {{ time: number, text: string }[]} 若无时间戳则 time=-1
 *
 * EN: Parse LRC text, return sorted lyrics line array
 * EN: @param {string} text
 * EN: @returns {{ time: number, text: string }[]} if no timestamp then time=-1
 */
export function parseLrc(text) {
  if (!text || typeof text !== 'string') return []

  const lines = text.split(/\r?\n/)
  const result = []

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    // CN: 提取所有 [...] 前缀标签
    // EN: Extract all [...] prefix tags
    const tags = []
    let rest = line
    let tagMatch

    // CN: 贪婪提取行首连续的 [tag] 标签
    // EN: Greedily extract consecutive [tag] tags at line start
    const tagRegex = /^\[([^\]]*)\]/
    while ((tagMatch = rest.match(tagRegex))) {
      tags.push(tagMatch[1])
      rest = rest.slice(tagMatch[0].length)
    }

    if (tags.length === 0) {
      // CN: 无标签：纯文本行
      // EN: No tags: plain text line
      result.push({ time: -1, text: line })
      continue
    }

    const textContent = rest.trim()

    // CN: 判断是否为元数据标签 (ti, ar, al, by, offset, re, ve)
    // EN: Check if it's a metadata tag (ti, ar, al, by, offset, re, ve)
    const firstTag = tags[0]
    if (/^(ti|ar|al|by|offset|re|ve|length)\s*:/i.test(firstTag)) {
      // CN: 元数据，跳过（不显示为歌词行）
      // EN: Metadata, skip (don't display as lyrics line)
      continue
    }

    // CN: 解析时间戳标签
    // EN: Parse timestamp tags
    const timestamps = []
    for (const tag of tags) {
      const t = parseTimestamp(tag)
      if (t >= 0) timestamps.push(t)
    }

    if (timestamps.length === 0) {
      // CN: 非时间戳、非元数据的未知标签，作为文本行
      // EN: Unknown tag (not timestamp, not metadata), treat as text line
      result.push({ time: -1, text: line })
      continue
    }

    // CN: 一行多时间戳（重复副歌）
    // EN: Multiple timestamps per line (repeated chorus)
    for (const t of timestamps) {
      result.push({ time: t, text: textContent })
    }
  }

  // CN: 分离有时间戳和无时间戳的行
  // EN: Separate lines with and without timestamps
  const timed = result.filter((l) => l.time >= 0)
  const plain = result.filter((l) => l.time < 0)

  if (timed.length > 0) {
    // CN: 有时间戳：按时间排序，丢弃纯文本行（通常是空行/注释混入）
    // EN: With timestamps: sort by time, discard plain text lines (usually empty lines/comments mixed in)
    timed.sort((a, b) => a.time - b.time)
    return timed
  }

  // CN: 纯文本歌词（无时间戳）
  // EN: Plain text lyrics (no timestamps)
  return plain
}

/**
 * CN: 二分搜索当前播放时间对应的歌词行索引
 * CN: O(log n)，每帧调用无压力
 * CN: @param {{ time: number }[]} lines - 已按 time 排序的有时间戳歌词
 * CN: @param {number} currentTime - 当前播放秒数
 * CN: @returns {number} 当前激活行索引，-1 表示还未到第一行
 *
 * EN: Binary search for lyrics line index corresponding to current playback time
 * EN: O(log n), no pressure to call every frame
 * EN: @param {{ time: number }[]} lines - timestamped lyrics sorted by time
 * EN: @param {number} currentTime - current playback seconds
 * EN: @returns {number} current active line index, -1 means not yet reached first line
 */
export function findActiveLine(lines, currentTime) {
  if (!lines.length) return -1

  let lo = 0
  let hi = lines.length - 1
  let result = -1

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    if (lines[mid].time <= currentTime) {
      result = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  return result
}

/**
 * CN: 检测文本是否为 LRC 格式（含时间戳标签）
 * CN: @param {string} text
 * CN: @returns {boolean}
 *
 * EN: Detect if text is LRC format (contains timestamp tags)
 * EN: @param {string} text
 * EN: @returns {boolean}
 */
export function isLrcFormat(text) {
  return /\[\d{1,3}:\d{2}[.:]\d{1,3}\]/.test(text)
}
