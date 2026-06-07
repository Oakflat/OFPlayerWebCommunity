/**
 * OFPlayer Tools — Browser FFmpeg Runtime
 *
 * ffmpeg.wasm based audio converter runtime.
 * Lazy-loaded: not imported on first paint.
 */

import {
  RUNTIME_STATUS,
  QUALITY_PRESETS,
  SUPPORTED_OUTPUT_FORMATS,
} from './AudioConverterRuntime.js'

const FORMAT_MAP = {
  mp3: { codec: 'libmp3lame', ext: 'mp3', mime: 'audio/mpeg' },
  flac: { codec: 'flac', ext: 'flac', mime: 'audio/flac' },
  wav: { codec: 'pcm_s16le', ext: 'wav', mime: 'audio/wav' },
  m4a: { codec: 'aac', ext: 'm4a', mime: 'audio/mp4' },
  opus: { codec: 'libopus', ext: 'opus', mime: 'audio/opus' },
  ogg: { codec: 'libvorbis', ext: 'ogg', mime: 'audio/ogg' },
}

const WASM_CDN_BASES = [
  'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm',
  'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm',
]

function getWasmBaseUrl() {
  if (typeof window !== 'undefined' && window.__OF_FFMPEG_WASM_BASE__) {
    return window.__OF_FFMPEG_WASM_BASE__
  }
  return WASM_CDN_BASES[0]
}

export class BrowserFfmpegRuntime {
  constructor() {
    this.ready = false
    this.status = RUNTIME_STATUS.NOT_LOADED
    this._ffmpeg = null
    this._loadPromise = null
  }

  async load(onProgress) {
    if (this.status === RUNTIME_STATUS.READY && this.ready) return
    if (this.status === RUNTIME_STATUS.LOADING && this._loadPromise) return this._loadPromise
    if (this.status === RUNTIME_STATUS.LOADING) return

    this.status = RUNTIME_STATUS.LOADING
    onProgress?.({
      phase: 'loading_core',
      progress: 0,
      message: 'Loading FFmpeg WebAssembly runtime...',
    })

    this._loadPromise = this._load(onProgress)
    try {
      await this._loadPromise
    } finally {
      this._loadPromise = null
    }
  }

  async _load(onProgress) {
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { toBlobURL } = await import('@ffmpeg/util')

      const ffmpeg = new FFmpeg()
      this._ffmpeg = ffmpeg

      const baseURL = getWasmBaseUrl()

      ffmpeg.on('progress', ({ progress }) => {
        onProgress?.({
          phase: 'converting',
          progress: Math.min(Math.round(progress * 100), 99),
          message: 'Converting...',
        })
      })

      ffmpeg.on('log', () => {})

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })

      this.ready = true
      this.status = RUNTIME_STATUS.READY
      onProgress?.({ phase: 'ready', progress: 100, message: 'Runtime ready.' })
    } catch (err) {
      this.ready = false
      this.status = RUNTIME_STATUS.ERROR
      onProgress?.({
        phase: 'error',
        progress: 0,
        message: `Failed to load runtime: ${err.message}`,
      })
      throw err
    }
  }

  async convert(input, options, onProgress) {
    if (!this.ready || !this._ffmpeg) {
      throw new Error('Runtime not loaded. Call load() first.')
    }

    const targetFormat = options.targetFormat
    if (!SUPPORTED_OUTPUT_FORMATS.includes(targetFormat)) {
      throw new Error(`Unsupported output format: ${targetFormat}`)
    }

    const formatInfo = FORMAT_MAP[targetFormat]
    if (!formatInfo) {
      throw new Error(`No codec mapping for format: ${targetFormat}`)
    }

    const { fetchFile } = await import('@ffmpeg/util')

    const inputFile = input.file
    const inputName = inputFile.name || 'input.dat'
    const outputName = `output.${formatInfo.ext}`

    onProgress?.({ phase: 'converting', progress: 0, message: 'Writing input file...' })

    await this._ffmpeg.writeFile(inputName, await fetchFile(inputFile))

    const args = ['-i', inputName]

    if (options.quality && targetFormat !== 'wav' && targetFormat !== 'flac') {
      const preset = QUALITY_PRESETS[options.quality]
      if (preset?.bitrate) {
        args.push('-b:a', `${preset.bitrate}k`)
      }
    }

    args.push('-c:a', formatInfo.codec, outputName)

    onProgress?.({ phase: 'converting', progress: 10, message: 'Converting...' })

    await this._ffmpeg.exec(args)

    onProgress?.({ phase: 'converting', progress: 90, message: 'Reading output...' })

    const data = await this._ffmpeg.readFile(outputName)
    const blob = new Blob([data.buffer], { type: formatInfo.mime })

    await this._ffmpeg.deleteFile(inputName)
    await this._ffmpeg.deleteFile(outputName)

    const baseName = inputName.replace(/\.[^.]+$/, '')
    const filename = `${baseName}.${formatInfo.ext}`

    onProgress?.({ phase: 'done', progress: 100, message: 'Conversion complete.' })

    return {
      blob,
      filename,
      format: targetFormat,
      fileSizeBytes: blob.size,
    }
  }

  /**
   * Extract a single track segment from an audio file.
   *
   * @param {File} audioFile   Source audio file
   * @param {number} startSec  Start time in seconds
   * @param {number|null} durationSec  Duration in seconds (null = to end of file)
   * @param {string} outputFormat  One of 'flac', 'mp3', 'wav', 'm4a', 'ogg', 'opus'
   * @param {(p: { phase: string, progress: number }) => void} [onProgress]
   * @returns {Promise<{ blob: Blob, filename: string }>}
   */
  async splitTrack(audioFile, startSec, durationSec, outputFormat, onProgress) {
    if (!this.ready || !this._ffmpeg) {
      throw new Error('Runtime not loaded. Call load() first.')
    }

    const formatInfo = FORMAT_MAP[outputFormat]
    if (!formatInfo) throw new Error(`Unsupported format: ${outputFormat}`)

    const { fetchFile } = await import('@ffmpeg/util')

    const inputName = audioFile.name || 'input.dat'
    const outputName = `track_out.${formatInfo.ext}`

    onProgress?.({ phase: 'writing', progress: 0 })
    await this._ffmpeg.writeFile(inputName, await fetchFile(audioFile))

    const args = ['-i', inputName, '-ss', String(startSec)]
    if (durationSec != null) args.push('-t', String(durationSec))
    args.push('-c', 'copy', outputName)

    onProgress?.({ phase: 'splitting', progress: 50 })
    await this._ffmpeg.exec(args)

    onProgress?.({ phase: 'reading', progress: 90 })
    const data = await this._ffmpeg.readFile(outputName)
    const blob = new Blob([data.buffer], { type: formatInfo.mime })

    await this._ffmpeg.deleteFile(inputName).catch(() => {})
    await this._ffmpeg.deleteFile(outputName).catch(() => {})

    onProgress?.({ phase: 'done', progress: 100 })
    return { blob, filename: outputName }
  }

  dispose() {
    if (this._ffmpeg) {
      try {
        this._ffmpeg.terminate()
      } catch {
        /* already terminated */
      }
      this._ffmpeg = null
    }
    this._loadPromise = null
    this.ready = false
    this.status = RUNTIME_STATUS.NOT_LOADED
  }
}

export function shouldPreload() {
  if (typeof navigator === 'undefined') return false

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (conn) {
    if (conn.saveData) return false
    const slowTypes = ['slow-2g', '2g']
    if (conn.effectiveType && slowTypes.includes(conn.effectiveType)) return false
  }

  return true
}

export function schedulePreload(runtime, delayMs = 2500, onProgress) {
  if (!shouldPreload()) return null

  const timer = setTimeout(() => {
    if (runtime.status === RUNTIME_STATUS.NOT_LOADED) {
      runtime.load(onProgress).catch(() => {})
    }
  }, delayMs)

  return () => clearTimeout(timer)
}
