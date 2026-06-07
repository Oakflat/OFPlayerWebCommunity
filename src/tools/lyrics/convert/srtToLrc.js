/**
 * CN: OFPlayer Tools — SRT 转 LRC
 *
 * CN: 取每条字幕的 start time 作为 LRC 时间戳。
 * CN: 多行字幕默认合并为空格。
 *
 * EN: OFPlayer Tools — SRT to LRC
 *
 * EN: Takes each subtitle's start time as the LRC timestamp.
 * EN: Multi-line subtitles default to merging with space.
 */

import { formatTimestampMs } from '../lrc/lrcCore.js'

/**
 * CN: 将 SRT 时间戳字符串解析为毫秒
 * CN: 格式: HH:MM:SS,mmm 或 HH:MM:SS.mmm
 * CN: @param {string} timeStr
 * CN: @returns {number} 毫秒数，-1 表示解析失败
 *
 * EN: Parse SRT timestamp string to milliseconds
 * EN: Format: HH:MM:SS,mmm or HH:MM:SS.mmm
 * EN: @param {string} timeStr
 * EN: @returns {number} milliseconds, -1 indicates parse failure
 */
function srtTimeToMs(timeStr) {
  const m = timeStr.trim().match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/)
  if (!m) return -1
  return (
    parseInt(m[1], 10) * 3600000 +
    parseInt(m[2], 10) * 60000 +
    parseInt(m[3], 10) * 1000 +
    parseInt(m[4], 10)
  )
}

/**
 * CN: 将 SRT 文本转换为 LRC 文本
 *
 * CN: @param {string} srtInput
 * CN: @param {{
 * CN:   joinMultiLine?: 'space' | 'newline',
 * CN:   millisecondDigits?: 2 | 3,
 * CN: }} [options]
 * CN: @returns {{ lrc: string, errors: string[] }}
 *
 * EN: Convert SRT text to LRC text
 *
 * EN: @param {string} srtInput
 * EN: @param {{
 * EN:   joinMultiLine?: 'space' | 'newline',
 * EN:   millisecondDigits?: 2 | 3,
 * EN: }} [options]
 * EN: @returns {{ lrc: string, errors: string[] }}
 */
export function srtToLrc(srtInput, options = {}) {
  const { joinMultiLine = 'space', millisecondDigits = 2 } = options

  const errors = []

  if (!srtInput || typeof srtInput !== 'string') {
    errors.push('Input is empty or not a string.')
    return { lrc: '', errors }
  }

  // CN: SRT 块以空行分隔
  // EN: SRT blocks are separated by empty lines
  const blocks = srtInput.trim().split(/\n\s*\n/)

  const lrcLines = []

  for (const block of blocks) {
    const blockLines = block.trim().split(/\r?\n/)
    if (blockLines.length < 2) continue

    // CN: 跳过序号行（纯数字）
    // EN: Skip sequence number line (pure digits)
    let startIdx = 0
    if (/^\d+$/.test(blockLines[0].trim())) {
      startIdx = 1
    }

    if (startIdx >= blockLines.length) continue

    // CN: 时间戳行
    // EN: Timestamp line
    const timeLine = blockLines[startIdx]
    const timeMatch = timeLine.match(
      /^(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/,
    )

    if (!timeMatch) {
      errors.push(`Could not parse SRT timestamp: "${timeLine}"`)
      continue
    }

    const startMs = srtTimeToMs(timeMatch[1])
    if (startMs < 0) {
      errors.push(`Invalid SRT timestamp: "${timeMatch[1]}"`)
      continue
    }

    // CN: 字幕文本行
    // EN: Subtitle text lines
    const textLines = blockLines.slice(startIdx + 1).filter((l) => l.trim())
    if (textLines.length === 0) continue

    const sep = joinMultiLine === 'newline' ? '\n' : ' '
    const text = textLines.map((l) => l.trim()).join(sep)

    const timestamp = formatTimestampMs(startMs, millisecondDigits)
    lrcLines.push({ timeMs: startMs, line: `[${timestamp}]${text}` })
  }

  if (lrcLines.length === 0) {
    errors.push('No valid subtitle blocks found in SRT input.')
    return { lrc: '', errors }
  }

  // CN: 按时间排序
  // EN: Sort by time
  lrcLines.sort((a, b) => a.timeMs - b.timeMs)

  return {
    lrc: lrcLines.map((l) => l.line).join('\n'),
    errors,
  }
}
