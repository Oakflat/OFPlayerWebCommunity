/**
 * CN: OFPlayer Tools — LRC 核心解析库
 *
 * CN: 与 src/utils/lrcParser.js 不同，此版本面向工具场景：
 * CN: - 保留 metadata 行
 * CN: - 返回完整的行号和原始内容
 * CN: - 支持 validate / format / offset
 * CN: - 纯函数，不依赖 DOM
 *
 * EN: OFPlayer Tools — LRC Core Parser Library
 *
 * EN: Unlike src/utils/lrcParser.js, this version is designed for tool scenarios:
 * EN: - Preserves metadata lines
 * EN: - Returns complete line numbers and raw content
 * EN: - Supports validate / format / offset
 * EN: - Pure functions, no DOM dependency
 */

// ── CN: 时间戳解析 ─── EN: Timestamp parsing ──────────────────────────────────

/**
 * CN: 将时间戳字符串解析为毫秒
 * CN: 支持: mm:ss.xx  mm:ss.xxx  mm:ss:xx
 * CN: @param {string} tag
 * CN: @returns {number} 毫秒数，-1 表示解析失败
 *
 * EN: Parse timestamp string to milliseconds
 * EN: Supports: mm:ss.xx  mm:ss.xxx  mm:ss:xx
 * EN: @param {string} tag
 * EN: @returns {number} milliseconds, -1 indicates parse failure
 */
export function parseTimestampMs(tag) {
  // CN: mm:ss.xx 或 mm:ss.xxx
  // EN: mm:ss.xx or mm:ss.xxx
  let m = tag.match(/^(\d{1,3}):(\d{2})\.(\d{1,3})$/)
  if (m) {
    const ms = m[3].padEnd(3, '0').slice(0, 3)
    const totalMs = parseInt(m[1], 10) * 60000 + parseInt(m[2], 10) * 1000 + parseInt(ms, 10)
    return totalMs
  }

  // CN: mm:ss:xx (兼容旧软件)
  // EN: mm:ss:xx (compatible with legacy software)
  m = tag.match(/^(\d{1,3}):(\d{2}):(\d{1,3})$/)
  if (m) {
    const cs = m[3].padEnd(2, '0').slice(0, 2)
    return parseInt(m[1], 10) * 60000 + parseInt(m[2], 10) * 1000 + parseInt(cs, 10) * 10
  }

  // CN: mm:ss (无毫秒)
  // EN: mm:ss (no milliseconds)
  m = tag.match(/^(\d{1,3}):(\d{2})$/)
  if (m) {
    return parseInt(m[1], 10) * 60000 + parseInt(m[2], 10) * 1000
  }

  return -1
}

/**
 * CN: 将毫秒格式化为 LRC 时间戳字符串
 * CN: @param {number} ms
 * CN: @param {2|3} [digits=2] 毫秒位数
 * CN: @returns {string} 例如 "01:23.45" 或 "01:23.456"
 *
 * EN: Format milliseconds to LRC timestamp string
 * EN: @param {number} ms
 * EN: @param {2|3} [digits=2] millisecond digits
 * EN: @returns {string} e.g. "01:23.45" or "01:23.456"
 */
export function formatTimestampMs(ms, digits = 2) {
  const safems = Math.max(0, Math.round(ms))
  const totalSec = Math.floor(safems / 1000)
  const mm = Math.floor(totalSec / 60)
  const ss = totalSec % 60
  const msRaw = safems % 1000
  const msStr =
    digits === 3 ? String(msRaw).padStart(3, '0') : String(Math.floor(msRaw / 10)).padStart(2, '0')
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${msStr}`
}

// ── CN: Metadata 识别 ─── EN: Metadata identification ──────────────────────────

const METADATA_KEYS = /^(ti|ar|al|by|offset|re|ve|length)\s*:/i

/**
 * CN: 判断标签内容是否为 metadata
 * CN: @param {string} tagContent
 * CN: @returns {boolean}
 *
 * EN: Check if tag content is metadata
 * EN: @param {string} tagContent
 * EN: @returns {boolean}
 */
function isMetadataTag(tagContent) {
  return METADATA_KEYS.test(tagContent)
}

/**
 * CN: 解析 metadata 标签，返回 { key, value }
 * CN: @param {string} tagContent
 * CN: @returns {{ key: string, value: string } | null}
 *
 * EN: Parse metadata tag, returns { key, value }
 * EN: @param {string} tagContent
 * EN: @returns {{ key: string, value: string } | null}
 */
function parseMetadataTag(tagContent) {
  const m = tagContent.match(/^([a-z]+)\s*:\s*(.*)/i)
  if (!m) return null
  return { key: m[1].toLowerCase(), value: m[2].trim() }
}

// ── CN: 主解析函数 ─── EN: Main parse function ─────────────────────────────────

/**
 * CN: 解析 LRC 文本，返回完整解析结果
 *
 * CN: @param {string} input
 * CN: @returns {{
 * CN:   lines: LrcLine[],
 * CN:   metadata: Record<string, string>,
 * CN:   metadataLines: LrcMetadataLine[],
 * CN:   issues: LrcValidationIssue[]
 * CN: }}
 *
 * CN: LrcLine: { raw, timeMs, text, lineNumber }
 * CN: LrcMetadataLine: { raw, key, value, lineNumber }
 * CN: LrcValidationIssue: { type, severity, lineNumber, message }
 *
 * EN: Parse LRC text, return complete parse result
 *
 * EN: @param {string} input
 * EN: @returns {{
 * EN:   lines: LrcLine[],
 * EN:   metadata: Record<string, string>,
 * EN:   metadataLines: LrcMetadataLine[],
 * EN:   issues: LrcValidationIssue[]
 * EN: }}
 *
 * EN: LrcLine: { raw, timeMs, text, lineNumber }
 * EN: LrcMetadataLine: { raw, key, value, lineNumber }
 * EN: LrcValidationIssue: { type, severity, lineNumber, message }
 */
export function parseLrc(input) {
  const result = {
    lines: [],
    metadata: {},
    metadataLines: [],
    issues: [],
  }

  if (!input || typeof input !== 'string') return result

  const rawLines = input.split(/\r?\n/)

  for (let lineNumber = 1; lineNumber <= rawLines.length; lineNumber++) {
    const raw = rawLines[lineNumber - 1]
    const line = raw.trim()

    if (!line) continue

    // CN: 提取所有 [...] 标签
    // EN: Extract all [...] tags
    const tags = []
    let rest = line
    const tagRegex = /^\[([^\]]*)\]/

    let tagMatch
    while ((tagMatch = rest.match(tagRegex))) {
      tags.push(tagMatch[1])
      rest = rest.slice(tagMatch[0].length)
    }

    const textContent = rest.trim()

    if (tags.length === 0) {
      // CN: 无标签：纯文本行（无时间戳歌词）
      // EN: No tags: plain text line (untimed lyrics)
      result.lines.push({ raw, timeMs: null, text: line, lineNumber })
      result.issues.push({
        type: 'missing_timestamp',
        severity: 'warning',
        lineNumber,
        message: `Line ${lineNumber}: No timestamp tag found. This line will not sync.`,
      })
      continue
    }

    // CN: 判断是否为 metadata
    // EN: Check if it's metadata
    if (isMetadataTag(tags[0])) {
      const meta = parseMetadataTag(tags[0])
      if (meta) {
        result.metadata[meta.key] = meta.value
        result.metadataLines.push({ raw, key: meta.key, value: meta.value, lineNumber })
      } else {
        result.issues.push({
          type: 'metadata_format',
          severity: 'info',
          lineNumber,
          message: `Line ${lineNumber}: Unrecognized metadata tag: [${tags[0]}]`,
        })
      }
      continue
    }

    // CN: 解析时间戳标签
    // EN: Parse timestamp tags
    const timestamps = []
    for (const tag of tags) {
      const ms = parseTimestampMs(tag)
      if (ms >= 0) {
        timestamps.push(ms)
      } else {
        // CN: 非时间戳、非 metadata 的未知标签
        // EN: Unknown tag (not timestamp, not metadata)
        result.issues.push({
          type: 'invalid_timestamp',
          severity: 'error',
          lineNumber,
          message: `Line ${lineNumber}: Invalid timestamp format: [${tag}]`,
        })
      }
    }

    if (timestamps.length === 0) {
      result.lines.push({ raw, timeMs: null, text: textContent || line, lineNumber })
      continue
    }

    // CN: 空文本行
    // EN: Empty text line
    if (!textContent) {
      result.issues.push({
        type: 'empty_text',
        severity: 'info',
        lineNumber,
        message: `Line ${lineNumber}: Timestamp with empty text.`,
      })
    }

    // CN: 一行多时间戳（重复副歌）
    // EN: Multiple timestamps per line (repeated chorus)
    for (const ms of timestamps) {
      result.lines.push({ raw, timeMs: ms, text: textContent, lineNumber })
    }
  }

  // CN: 检查时间顺序和重复时间戳
  // EN: Check time order and duplicate timestamps
  const timedLines = result.lines.filter((l) => l.timeMs !== null)
  const seenMs = new Map()

  for (let i = 0; i < timedLines.length; i++) {
    const { timeMs, lineNumber } = timedLines[i]

    if (seenMs.has(timeMs)) {
      result.issues.push({
        type: 'duplicate_timestamp',
        severity: 'warning',
        lineNumber,
        message: `Line ${lineNumber}: Duplicate timestamp [${formatTimestampMs(timeMs)}] already seen at line ${seenMs.get(timeMs)}.`,
      })
    } else {
      seenMs.set(timeMs, lineNumber)
    }

    if (i > 0 && timedLines[i - 1].timeMs > timeMs) {
      result.issues.push({
        type: 'time_order',
        severity: 'warning',
        lineNumber,
        message: `Line ${lineNumber}: Timestamps are not in order ([${formatTimestampMs(timedLines[i - 1].timeMs)}] > [${formatTimestampMs(timeMs)}]).`,
      })
    }
  }

  return result
}

// ── CN: 格式化函数 ─── EN: Format functions ────────────────────────────────────

/**
 * CN: 将 LrcLine 数组格式化回 LRC 文本
 * CN: @param {LrcLine[]} lines
 * CN: @param {{ millisecondDigits?: 2|3 }} [options]
 * CN: @returns {string}
 *
 * EN: Format LrcLine array back to LRC text
 * EN: @param {LrcLine[]} lines
 * EN: @param {{ millisecondDigits?: 2|3 }} [options]
 * EN: @returns {string}
 */
export function formatLrc(lines, options = {}) {
  const { millisecondDigits = 2 } = options

  return lines
    .map((line) => {
      if (line.timeMs === null) return line.text
      const tag = formatTimestampMs(line.timeMs, millisecondDigits)
      return `[${tag}]${line.text}`
    })
    .join('\n')
}

// ── CN: 偏移函数 ─── EN: Offset functions ──────────────────────────────────────

/**
 * CN: 对 LRC 文本的所有时间戳进行整体偏移
 * CN: @param {string} input LRC 文本
 * CN: @param {number} offsetMs 偏移毫秒数（正数=延后，负数=提前）
 * CN: @param {{ millisecondDigits?: 2|3 }} [options]
 * CN: @returns {string} 偏移后的 LRC 文本
 *
 * EN: Offset all timestamps in LRC text
 * EN: @param {string} input LRC text
 * EN: @param {number} offsetMs offset milliseconds (positive=delay, negative=advance)
 * EN: @param {{ millisecondDigits?: 2|3 }} [options]
 * EN: @returns {string} offset LRC text
 */
export function offsetLrc(input, offsetMs, options = {}) {
  const { millisecondDigits = 2 } = options

  if (!input || typeof input !== 'string') return ''
  if (!offsetMs) return input

  const rawLines = input.split(/\r?\n/)
  const result = []

  for (const raw of rawLines) {
    const line = raw.trim()

    // CN: 空行保留
    // EN: Preserve empty lines
    if (!line) {
      result.push(raw)
      continue
    }

    // CN: 提取所有 [...] 前缀标签
    // EN: Extract all [...] prefix tags
    const tags = []
    let rest = line
    const tagRegex = /^\[([^\]]*)\]/

    let tagMatch
    while ((tagMatch = rest.match(tagRegex))) {
      tags.push(tagMatch[1])
      rest = rest.slice(tagMatch[0].length)
    }

    if (tags.length === 0) {
      result.push(raw)
      continue
    }

    // CN: metadata 行：特殊处理 [offset:]
    // EN: Metadata line: special handling for [offset:]
    if (isMetadataTag(tags[0])) {
      result.push(raw)
      continue
    }

    // CN: 对时间戳标签进行偏移
    // EN: Offset timestamp tags
    const newTags = []
    for (const tag of tags) {
      const ms = parseTimestampMs(tag)
      if (ms >= 0) {
        const newMs = Math.max(0, ms + offsetMs)
        newTags.push(`[${formatTimestampMs(newMs, millisecondDigits)}]`)
      } else {
        // CN: 非时间戳，原样保留
        // EN: Not a timestamp, preserve as-is
        newTags.push(`[${tag}]`)
      }
    }

    result.push(newTags.join('') + rest)
  }

  return result.join('\n')
}

// ── CN: 验证函数 ─── EN: Validation functions ──────────────────────────────────

/**
 * CN: 验证 LRC 文本，返回问题列表
 * CN: @param {string} input
 * CN: @returns {LrcValidationIssue[]}
 *
 * EN: Validate LRC text, return issues list
 * EN: @param {string} input
 * EN: @returns {LrcValidationIssue[]}
 */
export function validateLrc(input) {
  const { issues } = parseLrc(input)
  return issues
}
