/**
 * OFPlayer Tools — 音频转码 Runtime 类型定义
 *
 * Runtime 接口规范（供未来实现参考）：
 *
 * interface AudioConverterRuntime {
 *   ready: boolean
 *   status: string
 *   load(onProgress?: (p: AudioConvertProgress) => void): Promise<void>
 *   convert(input: AudioInput, options: ConvertOptions, onProgress?: (p: AudioConvertProgress) => void): Promise<AudioOutput>
 *   dispose(): void
 * }
 *
 * interface AudioInput {
 *   file: File
 * }
 *
 * interface ConvertOptions {
 *   targetFormat: 'mp3' | 'flac' | 'ogg' | 'wav' | 'm4a' | 'opus'
 *   quality?: 'low' | 'medium' | 'high' | 'lossless'
 * }
 *
 * interface AudioOutput {
 *   blob: Blob
 *   filename: string
 *   format: string
 *   fileSizeBytes: number
 * }
 *
 * interface AudioConvertProgress {
 *   phase: 'idle' | 'loading_core' | 'ready' | 'converting' | 'done' | 'error'
 *   progress: number
 *   message: string
 * }
 */

export const RUNTIME_STATUS = /** @type {const} */ ({
  NOT_LOADED: 'not_loaded',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
})

export const QUALITY_PRESETS = /** @type {const} */ ({
  low: { bitrate: 128, label: 'Low (128 kbps)' },
  medium: { bitrate: 192, label: 'Medium (192 kbps)' },
  high: { bitrate: 320, label: 'High (320 kbps)' },
  lossless: { bitrate: null, label: 'Encoder default (no bitrate cap)' },
})

export const SUPPORTED_OUTPUT_FORMATS = ['mp3', 'flac', 'ogg', 'wav', 'm4a', 'opus']

export const FORMAT_DISPLAY_NAMES = {
  mp3: 'MP3',
  flac: 'FLAC',
  ogg: 'OGG Vorbis',
  wav: 'WAV',
  m4a: 'M4A (AAC)',
  opus: 'Opus',
}

export const INPUT_ACCEPT = 'audio/*,.flac,.ogg,.opus,.wma,.m4a,.aac,.wav,.mp3'
