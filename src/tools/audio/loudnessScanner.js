/**
 * CN: OFPlayer Tools — 响度扫描器
 *
 * CN: 使用 Web Audio API 的简化综合响度测量。
 * CN: 在 400ms 窗口中测量基于 RMS 的响度（无门限和有门限）。
 * CN: 提供真峰值和 ReplayGain 建议。
 *
 * CN: 注意：这是简化近似；未应用完整的 EBU R128 K 加权。
 *
 * EN: OFPlayer Tools — Loudness Scanner
 *
 * EN: Simplified integrated loudness measurement using Web Audio API.
 * EN: Measures RMS-based loudness in 400ms windows (ungated and gated).
 * EN: Provides true peak and a ReplayGain suggestion.
 *
 * EN: Note: This is a simplified approximation; full EBU R128 K-weighting is not applied.
 */

const WINDOW_MS = 400
const OVERLAP = 0.75 // 75% overlap

/**
 * CN: 扫描音频文件的响度。
 *
 * CN: @param {File} file
 * CN: @param {{ onProgress?: (pct: number) => void }} opts
 * CN: @returns {Promise<LoudnessResult>}
 *
 * CN: @typedef {{ integratedLufs: number, truePeakDbfs: number, dynamicRange: number, replayGainDb: number, duration: number, sampleRate: number }} LoudnessResult
 *
 * EN: Scan the loudness of an audio file.
 *
 * EN: @param {File} file
 * EN: @param {{ onProgress?: (pct: number) => void }} opts
 * EN: @returns {Promise<LoudnessResult>}
 *
 * EN: @typedef {{ integratedLufs: number, truePeakDbfs: number, dynamicRange: number, replayGainDb: number, duration: number, sampleRate: number }} LoudnessResult
 */
export async function scanLoudness(file, { onProgress } = {}) {
  onProgress?.(0)

  const arrayBuffer = await file.arrayBuffer()
  onProgress?.(10)

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  let audioBuffer
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
  } finally {
    await audioCtx.close()
  }
  onProgress?.(30)

  const { sampleRate, duration, numberOfChannels, length } = audioBuffer

  // CN: 将所有声道混音为单声道以进行响度测量
  // EN: Mix all channels down to mono for loudness measurement
  const monoData = new Float32Array(length)
  for (let c = 0; c < numberOfChannels; c++) {
    const ch = audioBuffer.getChannelData(c)
    for (let i = 0; i < length; i++) {
      monoData[i] += ch[i] / numberOfChannels
    }
  }

  // CN: 真峰值：在所有声道中找到最大绝对采样值
  // EN: True peak: find maximum absolute sample value across all channels
  let truePeak = 0
  for (let c = 0; c < numberOfChannels; c++) {
    const ch = audioBuffer.getChannelData(c)
    for (let i = 0; i < length; i++) {
      const abs = Math.abs(ch[i])
      if (abs > truePeak) truePeak = abs
    }
  }
  const truePeakDbfs = truePeak > 0 ? 20 * Math.log10(truePeak) : -Infinity

  onProgress?.(40)

  // CN: 400ms 窗口的 RMS 响度
  // EN: RMS loudness over 400ms windows
  const windowSamples = Math.floor((WINDOW_MS / 1000) * sampleRate)
  const hopSamples = Math.floor(windowSamples * (1 - OVERLAP))
  const totalWindows = Math.max(1, Math.floor((length - windowSamples) / hopSamples))

  const windowLoudness = [] // dB values per window

  for (let w = 0; w < totalWindows; w++) {
    const offset = w * hopSamples
    let sumSq = 0
    for (let i = 0; i < windowSamples; i++) {
      const s = monoData[offset + i]
      sumSq += s * s
    }
    const rms = Math.sqrt(sumSq / windowSamples)
    const db = rms > 1e-10 ? 20 * Math.log10(rms) : -144
    windowLoudness.push(db)

    if (w % 100 === 0) {
      onProgress?.(40 + Math.round((w / totalWindows) * 50))
      await new Promise((r) => setTimeout(r, 0))
    }
  }

  // CN: 门限综合响度：排除低于绝对门限（-70 LUFS 等效）的窗口
  // EN: Gated integrated loudness: exclude windows below absolute gate (-70 LUFS equiv)
  const ABSOLUTE_GATE = -70
  const gatedWindows = windowLoudness.filter((db) => db > ABSOLUTE_GATE)

  let integratedLufs
  if (gatedWindows.length === 0) {
    integratedLufs = -Infinity
  } else {
    // CN: 门限窗口的功率平均
    // EN: Power average of gated windows
    const avgPower =
      gatedWindows.reduce((sum, db) => sum + Math.pow(10, db / 10), 0) / gatedWindows.length
    integratedLufs = 10 * Math.log10(avgPower)
  }

  // CN: 动态范围：最响和最安静的非静音窗口之间的差异（第 10–90 百分位数）
  // EN: Dynamic range: difference between loudest and softest non-silent windows (10th–90th percentile)
  const sorted = [...windowLoudness].filter((db) => db > ABSOLUTE_GATE).sort((a, b) => a - b)
  let dynamicRange = 0
  if (sorted.length >= 2) {
    const p10 = sorted[Math.floor(sorted.length * 0.1)]
    const p90 = sorted[Math.floor(sorted.length * 0.9)]
    dynamicRange = Math.round(p90 - p10)
  }

  // CN: ReplayGain 建议：目标是 -18 LUFS（ReplayGain 2.0 使用 -14 LUFS，经典版使用 -18 LUFS）
  // EN: ReplayGain suggestion: target is -18 LUFS (ReplayGain 2.0 uses -14 LUFS, classic uses -18 LUFS)
  const TARGET_LUFS = -14
  const replayGainDb = isFinite(integratedLufs)
    ? Math.round((TARGET_LUFS - integratedLufs) * 10) / 10
    : 0

  onProgress?.(100)

  return {
    integratedLufs: isFinite(integratedLufs) ? Math.round(integratedLufs * 10) / 10 : null,
    truePeakDbfs: isFinite(truePeakDbfs) ? Math.round(truePeakDbfs * 10) / 10 : null,
    dynamicRange,
    replayGainDb,
    duration,
    sampleRate,
  }
}
