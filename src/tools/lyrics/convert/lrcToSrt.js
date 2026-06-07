/**
 * CN: OFPlayer Tools — LRC 转 SRT
 *
 * CN: LRC 只有开始时间，无明确结束时间。
 * CN: 策略：下一行开始时间 - 1ms 作为当前行结束时间，最后一行默认持续 5 秒。
 *
 * EN: OFPlayer Tools — LRC to SRT
 *
 * EN: LRC only has start time, no explicit end time.
 * EN: Strategy: next line start time - 1ms as current line end time, last line defaults to 5 seconds.
 */

import { parseLrc, formatTimestampMs } from '../lrc/lrcCore.js'

/**
 * CN: 将毫秒转为 SRT 时间戳格式 HH:MM:SS,mmm
 * CN: @param {number} ms
 * CN: @returns {string}
 *
 * EN: Convert milliseconds to SRT timestamp format HH:MM:SS,mmm
 * EN: @param {number} ms
 * EN: @returns {string}
 */
function msToSrtTime(ms) {
  const safems = Math.max(0, Math.round(ms))
  const hh = Math.floor(safems / 3600000)
  const mm = Math.floor((safems % 3600000) / 60000)
  const ss = Math.floor((safems % 60000) / 1000)
  const msRem = safems % 1000
  return (
    [String(hh).padStart(2, '0'), String(mm).padStart(2, '0'), String(ss).padStart(2, '0')].join(
      ':',
    ) +
    ',' +
    String(msRem).padStart(3, '0')
  )
}

/**
 * CN: 将 LRC 文本转换为 SRT 字幕文本
 *
 * CN: @param {string} lrcInput
 * CN: @param {{
 * CN:   lastLineDurationMs?: number,
 * CN:   minLineDurationMs?: number,
 * CN: }} [options]
 * CN: @returns {{ srt: string, errors: string[] }}
 *
 * EN: Convert LRC text to SRT subtitle text
 *
 * EN: @param {string} lrcInput
 * EN: @param {{
 * EN:   lastLineDurationMs?: number,
 * EN:   minLineDurationMs?: number,
 * EN: }} [options]
 * EN: @returns {{ srt: string, errors: string[] }}
 */
export function lrcToSrt(lrcInput, options = {}) {
  const { lastLineDurationMs = 5000, minLineDurationMs = 500 } = options

  const errors = []

  if (!lrcInput || typeof lrcInput !== 'string') {
    errors.push('Input is empty or not a string.')
    return { srt: '', errors }
  }

  const { lines } = parseLrc(lrcInput)
  const timedLines = lines.filter((l) => l.timeMs !== null).sort((a, b) => a.timeMs - b.timeMs)

  if (timedLines.length === 0) {
    errors.push('No timestamped lines found in LRC input.')
    return { srt: '', errors }
  }

  const srtBlocks = []

  for (let i = 0; i < timedLines.length; i++) {
    const line = timedLines[i]
    const nextLine = timedLines[i + 1]

    let endMs
    if (nextLine) {
      endMs = Math.max(line.timeMs + minLineDurationMs, nextLine.timeMs - 1)
    } else {
      endMs = line.timeMs + lastLineDurationMs
    }

    const text = line.text.trim()
    if (!text) continue

    srtBlocks.push(
      `${srtBlocks.length + 1}\n` +
        `${msToSrtTime(line.timeMs)} --> ${msToSrtTime(endMs)}\n` +
        `${text}`,
    )
  }

  if (srtBlocks.length === 0) {
    errors.push('No valid subtitle blocks could be generated.')
    return { srt: '', errors }
  }

  return { srt: srtBlocks.join('\n\n'), errors }
}
