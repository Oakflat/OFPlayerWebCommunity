/**
 * CN: OFPlayer Tools — 频谱分析器
 *
 * CN: 使用 Web Audio API + Cooley-Tukey FFT 的浏览器原生音频频谱分析。
 * CN: 无需 WASM。
 *
 * EN: OFPlayer Tools — Spectrum Analyzer
 *
 * EN: Browser-native audio spectrum analysis using Web Audio API + Cooley-Tukey FFT.
 * EN: No WASM required.
 */

const FFT_SIZE = 8192
const MAX_CHUNKS = 64

/**
 * CN: 分析音频文件的频谱。
 * CN: 返回最大保持频谱（整个文件中每个频率箱的峰值幅度）。
 *
 * CN: @param {File} file
 * CN: @param {{ onProgress?: (pct: number) => void }} opts
 * CN: @returns {Promise<{ maxDb: Float32Array, sampleRate: number, duration: number, fftSize: number, freqResolution: number }>}
 *
 * EN: Analyze the spectrum of an audio file.
 * EN: Returns max-hold spectrum (peak amplitude per frequency bin across the entire file).
 *
 * EN: @param {File} file
 * EN: @param {{ onProgress?: (pct: number) => void }} opts
 * EN: @returns {Promise<{ maxDb: Float32Array, sampleRate: number, duration: number, fftSize: number, freqResolution: number }>}
 */
export async function analyzeSpectrum(file, { onProgress } = {}) {
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

  // CN: 混音为单声道
  // EN: Mix down to mono
  const monoData = new Float32Array(length)
  for (let c = 0; c < numberOfChannels; c++) {
    const ch = audioBuffer.getChannelData(c)
    for (let i = 0; i < length; i++) {
      monoData[i] += ch[i] / numberOfChannels
    }
  }
  onProgress?.(40)

  const N = FFT_SIZE
  const halfN = N >> 1
  const maxDb = new Float32Array(halfN).fill(-144)

  // CN: Hann 窗系数
  // EN: Hann window coefficients
  const hann = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)))
  }

  const hopSize = halfN
  const totalChunks = Math.max(1, Math.floor((length - N) / hopSize))
  const step = Math.max(1, Math.floor(totalChunks / MAX_CHUNKS))
  const effectiveChunks = Math.ceil(totalChunks / step)

  const re = new Float32Array(N)
  const im = new Float32Array(N)

  let done = 0
  for (let chunk = 0; chunk * hopSize + N <= length; chunk += step) {
    const offset = chunk * hopSize

    for (let i = 0; i < N; i++) {
      re[i] = monoData[offset + i] * hann[i]
      im[i] = 0
    }

    _fft(re, im)

    for (let i = 0; i < halfN; i++) {
      const mag = Math.sqrt(re[i] * re[i] + im[i] * im[i]) / halfN
      const db = mag > 1e-10 ? 20 * Math.log10(mag) : -144
      if (db > maxDb[i]) maxDb[i] = db
    }

    done++
    onProgress?.(40 + Math.round((done / effectiveChunks) * 55))

    // CN: 每 8 个块让出一次以保持 UI 响应
    // EN: Yield every 8 chunks to keep UI responsive
    if (done % 8 === 0) {
      await new Promise((r) => setTimeout(r, 0))
    }
  }

  onProgress?.(100)

  return {
    maxDb,
    sampleRate,
    duration,
    fftSize: N,
    freqResolution: sampleRate / N,
  }
}

/**
 * CN: 检测可能指示伪无损音频的高频截止。
 *
 * CN: @param {Float32Array} maxDb   频率箱幅度（dB）
 * CN: @param {number} sampleRate
 * CN: @returns {{ cutoffHz: number | null, verdict: 'genuine'|'likely_genuine'|'suspicious'|'lossy', highestActiveHz: number }}
 *
 * EN: Detect potential high-frequency cutoff indicating pseudo-lossless audio.
 *
 * EN: @param {Float32Array} maxDb   Frequency bin amplitudes in dB
 * EN: @param {number} sampleRate
 * EN: @returns {{ cutoffHz: number | null, verdict: 'genuine'|'likely_genuine'|'suspicious'|'lossy', highestActiveHz: number }}
 */
export function detectCutoff(maxDb, sampleRate) {
  const halfN = maxDb.length
  const freqPerBin = sampleRate / (halfN * 2)

  const FLOOR_DB = -80
  let highestActiveBin = 0
  for (let i = halfN - 1; i >= 0; i--) {
    if (maxDb[i] > FLOOR_DB) {
      highestActiveBin = i
      break
    }
  }

  const highestActiveHz = highestActiveBin * freqPerBin
  const nyquist = sampleRate / 2
  const cutoffRatio = highestActiveHz / nyquist

  let verdict, cutoffHz

  if (cutoffRatio > 0.97) {
    verdict = 'genuine'
    cutoffHz = null
  } else if (highestActiveHz < 16500) {
    verdict = 'lossy'
    cutoffHz = Math.round(highestActiveHz)
  } else if (highestActiveHz < 20000) {
    verdict = 'suspicious'
    cutoffHz = Math.round(highestActiveHz)
  } else {
    verdict = 'likely_genuine'
    cutoffHz = null
  }

  return { cutoffHz, verdict, highestActiveHz: Math.round(highestActiveHz) }
}

/**
 * CN: 将频率频谱渲染到 canvas 元素上。
 *
 * CN: @param {HTMLCanvasElement} canvas
 * CN: @param {Float32Array} maxDb
 * CN: @param {number} sampleRate
 * CN: @param {{ minDb?: number, maxDb?: number, cutoffHz?: number | null }} opts
 *
 * EN: Render the frequency spectrum onto a canvas element.
 *
 * EN: @param {HTMLCanvasElement} canvas
 * EN: @param {Float32Array} maxDb
 * EN: @param {number} sampleRate
 * EN: @param {{ minDb?: number, maxDb?: number, cutoffHz?: number | null }} opts
 */
export function renderSpectrum(
  canvas,
  maxDb,
  sampleRate,
  { minDb = -100, maxDb: maxDbVal = 0, cutoffHz = null } = {},
) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  const dpr = window.devicePixelRatio || 1
  const style = getComputedStyle(canvas)

  // CN: 使用 CSS 变量作为颜色 - 回退到中性默认值
  // EN: Use CSS variables for colors - fall back to neutral defaults
  const bgColor = style.getPropertyValue('--of-surface').trim() || '#ffffff'
  const gridColor = style.getPropertyValue('--of-neutral-200').trim() || '#e5e7eb'
  const textColor = style.getPropertyValue('--of-text-secondary').trim() || '#6b7280'
  const fillColor = style.getPropertyValue('--of-player-accent').trim() || '#3b82f6'
  const strokeColor = style.getPropertyValue('--of-player-accent').trim() || '#2563eb'
  const cutoffColor = style.getPropertyValue('--of-danger').trim() || '#ef4444'

  ctx.clearRect(0, 0, W, H)

  // CN: 背景
  // EN: Background
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, W, H)

  const freqPerBin = sampleRate / (maxDb.length * 2)
  const nyquist = sampleRate / 2

  // CN: 对数频率映射：20 Hz – Nyquist
  // EN: Log-scale frequency mapping: 20 Hz – Nyquist
  const MIN_FREQ = 20
  const MAX_FREQ = nyquist
  const logMin = Math.log10(MIN_FREQ)
  const logMax = Math.log10(MAX_FREQ)

  function freqToX(hz) {
    const clamped = Math.max(MIN_FREQ, Math.min(MAX_FREQ, hz))
    return ((Math.log10(clamped) - logMin) / (logMax - logMin)) * W
  }

  function dbToY(db) {
    const clamped = Math.max(minDb, Math.min(maxDbVal, db))
    return H - ((clamped - minDb) / (maxDbVal - minDb)) * H
  }

  // CN: 绘制网格线
  // EN: Draw grid lines
  const FREQ_MARKERS = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].filter(
    (f) => f <= MAX_FREQ,
  )
  ctx.strokeStyle = gridColor
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])

  for (const f of FREQ_MARKERS) {
    const x = Math.round(freqToX(f)) + 0.5
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }

  // CN: 水平 dB 网格
  // EN: Horizontal dB grid
  for (let db = minDb; db <= maxDbVal; db += 20) {
    const y = Math.round(dbToY(db)) + 0.5
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }

  ctx.setLineDash([])

  // CN: 绘制频谱填充
  // EN: Draw spectrum fill
  ctx.beginPath()
  ctx.moveTo(0, H)

  let firstPoint = true
  for (let i = 1; i < maxDb.length; i++) {
    const hz = i * freqPerBin
    if (hz < MIN_FREQ || hz > MAX_FREQ) continue
    const x = freqToX(hz)
    const y = dbToY(maxDb[i])
    if (firstPoint) {
      ctx.moveTo(x, H)
      ctx.lineTo(x, y)
      firstPoint = false
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.lineTo(W, H)
  ctx.closePath()

  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, fillColor.replace(')', ', 0.5)').replace('rgb', 'rgba'))
  grad.addColorStop(1, fillColor.replace(')', ', 0.05)').replace('rgb', 'rgba'))
  ctx.fillStyle = fillColor + '33'
  ctx.fill()

  // CN: 绘制频谱描边
  // EN: Draw spectrum stroke
  ctx.beginPath()
  firstPoint = true
  for (let i = 1; i < maxDb.length; i++) {
    const hz = i * freqPerBin
    if (hz < MIN_FREQ || hz > MAX_FREQ) continue
    const x = freqToX(hz)
    const y = dbToY(maxDb[i])
    if (firstPoint) {
      ctx.moveTo(x, y)
      firstPoint = false
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 1.5
  ctx.stroke()

  // CN: 截止标记
  // EN: Cutoff marker
  if (cutoffHz && cutoffHz > MIN_FREQ) {
    const cx = freqToX(cutoffHz)
    ctx.beginPath()
    ctx.setLineDash([4, 4])
    ctx.moveTo(cx, 0)
    ctx.lineTo(cx, H)
    ctx.strokeStyle = cutoffColor
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.setLineDash([])
  }

  // CN: 频率标签
  // EN: Frequency labels
  const LABEL_FREQS = [100, 1000, 5000, 10000, 20000].filter((f) => f <= MAX_FREQ)
  ctx.fillStyle = textColor
  ctx.font = `${11 * dpr}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  for (const f of LABEL_FREQS) {
    const x = freqToX(f)
    const label = f >= 1000 ? `${f / 1000}k` : String(f)
    ctx.fillText(label, x, H - 4 * dpr)
  }
}

// ── CN: 内部 FFT ─── EN: Internal FFT ──────────────────────────────────────────

/**
 * CN: Cooley-Tukey 基数-2 DIT FFT，原地操作。
 * CN: re 和 im 必须是长度为 N（2 的幂）的 Float32Array。
 *
 * EN: Cooley-Tukey radix-2 DIT FFT, in-place.
 * EN: re and im must be Float32Arrays of length N (power of 2).
 */
function _fft(re, im) {
  const n = re.length

  // CN: 位反转排列
  // EN: Bit-reversal permutation
  let j = 0
  for (let i = 1; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      let t = re[i]
      re[i] = re[j]
      re[j] = t
      t = im[i]
      im[i] = im[j]
      im[j] = t
    }
  }

  // CN: 蝶形级
  // EN: Butterfly stages
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    const wRe = Math.cos(ang)
    const wIm = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let curRe = 1
      let curIm = 0
      const half = len >> 1
      for (let k = 0; k < half; k++) {
        const uRe = re[i + k]
        const uIm = im[i + k]
        const vRe = re[i + k + half] * curRe - im[i + k + half] * curIm
        const vIm = re[i + k + half] * curIm + im[i + k + half] * curRe
        re[i + k] = uRe + vRe
        im[i + k] = uIm + vIm
        re[i + k + half] = uRe - vRe
        im[i + k + half] = uIm - vIm
        const nr = curRe * wRe - curIm * wIm
        curIm = curRe * wIm + curIm * wRe
        curRe = nr
      }
    }
  }
}
