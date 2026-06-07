/**
 * CN: OFPlayer Tools — CUE Sheet 解析器
 *
 * CN: 将 CUE sheet 文本解析为结构化的曲目列表。
 * CN: CUE 时间格式：MM:SS:FF（FF = 帧，每秒 75 帧）
 *
 * EN: OFPlayer Tools — CUE Sheet Parser
 *
 * EN: Parses CUE sheet text into a structured track list.
 * EN: CUE time format: MM:SS:FF  (FF = frames, 75 frames per second)
 */

/**
 * CN: @typedef {{ number: number, title: string|null, performer: string|null, startSec: number }} CueTrack
 * CN: @typedef {{ title: string|null, performer: string|null, audioFile: string|null, tracks: CueTrack[] }} CueSheet
 *
 * EN: @typedef {{ number: number, title: string|null, performer: string|null, startSec: number }} CueTrack
 * EN: @typedef {{ title: string|null, performer: string|null, audioFile: string|null, tracks: CueTrack[] }} CueSheet
 */

/**
 * CN: 解析 CUE sheet 文本。
 * CN: @param {string} text
 * CN: @returns {CueSheet}
 *
 * EN: Parse a CUE sheet text.
 * EN: @param {string} text
 * EN: @returns {CueSheet}
 */
export function parseCueSheet(text) {
  const lines = text.split(/\r?\n/)
  /** CN: @type {CueSheet} */
  /** EN: @type {CueSheet} */
  const sheet = { title: null, performer: null, audioFile: null, tracks: [] }
  let currentTrack = null

  for (const line of lines) {
    const t = line.trim()

    const fileMatch = t.match(/^FILE\s+"([^"]+)"\s+\w+$/i)
    if (fileMatch) {
      sheet.audioFile = fileMatch[1]
      continue
    }

    const trackMatch = t.match(/^TRACK\s+(\d+)\s+AUDIO$/i)
    if (trackMatch) {
      if (currentTrack) sheet.tracks.push(currentTrack)
      currentTrack = {
        number: parseInt(trackMatch[1], 10),
        title: null,
        performer: null,
        startSec: 0,
      }
      continue
    }

    const titleMatch = t.match(/^TITLE\s+"([^"]*)"$/i)
    if (titleMatch) {
      if (currentTrack) currentTrack.title = titleMatch[1]
      else sheet.title = titleMatch[1]
      continue
    }

    const perfMatch = t.match(/^PERFORMER\s+"([^"]*)"$/i)
    if (perfMatch) {
      if (currentTrack) currentTrack.performer = perfMatch[1]
      else sheet.performer = perfMatch[1]
      continue
    }

    // CN: INDEX 01 mm:ss:ff
    // EN: INDEX 01 mm:ss:ff
    const indexMatch = t.match(/^INDEX\s+01\s+(\d{2}):(\d{2}):(\d{2})$/i)
    if (indexMatch && currentTrack) {
      const mm = parseInt(indexMatch[1], 10)
      const ss = parseInt(indexMatch[2], 10)
      const ff = parseInt(indexMatch[3], 10)
      currentTrack.startSec = mm * 60 + ss + ff / 75
    }
  }

  if (currentTrack) sheet.tracks.push(currentTrack)

  return sheet
}

/**
 * CN: 将秒数格式化为 MM:SS。
 * CN: @param {number} sec
 * CN: @returns {string}
 *
 * EN: Format seconds to MM:SS.
 * EN: @param {number} sec
 * EN: @returns {string}
 */
export function secToHuman(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * CN: 将秒数格式化为 FFmpeg 时间戳字符串 HH:MM:SS.mmm
 * CN: @param {number} sec
 * CN: @returns {string}
 *
 * EN: Format seconds to FFmpeg timestamp string HH:MM:SS.mmm
 * EN: @param {number} sec
 * EN: @returns {string}
 */
export function secToFfmpegTime(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = (sec % 60).toFixed(3)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(6, '0')}`
}
