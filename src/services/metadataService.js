import {
  CURRENT_TRACK_METADATA_VERSION,
  createDisplayTitle,
  sanitizeTrackTitle,
} from '../models/track'

// CN: music-metadata 仅在导入文件时需要。通过本地相对模块保持延迟加载，
// CN: 以便 Vite 仍能正确重写生产构建的 chunk URL。
// EN: music-metadata is only needed when importing files. Keep it lazy-loaded
// EN: through a local relative module so Vite can still rewrite the chunk URL
// EN: correctly for production builds.
let _mm = null
async function getMusicMetadata() {
  if (!_mm) {
    const runtime = await import('./musicMetadataRuntime.js')
    _mm = runtime.getMusicMetadataApi()
  }
  return _mm
}

const DEFAULT_MAX_META_ITEMS = 3

function normalizeText(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed || fallback
}

function normalizeOptionalNumber(value) {
  return Number.isFinite(value) && value > 0 ? value : 0
}

function normalizePositiveInteger(value) {
  return Number.isInteger(value) && value > 0 ? value : 0
}

function flattenValues(values) {
  return values.flatMap((value) => (Array.isArray(value) ? value : [value]))
}

function joinUniqueTextValues(values, separator = ', ') {
  const items = flattenValues(values)
    .map((value) => normalizeText(value))
    .filter(Boolean)

  return [...new Set(items)].join(separator)
}

function firstNonEmptyText(...values) {
  return (
    flattenValues(values)
      .map((value) => normalizeText(value))
      .find(Boolean) ?? ''
  )
}

function getFileExtension(fileName = '') {
  const extension = String(fileName).split('.').pop()?.trim().toUpperCase()
  return extension || ''
}

function resolveFormat(file, metadata) {
  const fromName = getFileExtension(file?.name)

  if (fromName) {
    return fromName
  }

  const mimeSubtype = String(file?.type ?? '')
    .split('/')
    .pop()
    ?.trim()
    .toUpperCase()

  if (mimeSubtype) {
    return mimeSubtype
  }

  const container = normalizeText(metadata?.format?.container)

  if (container) {
    return container.split('/')[0]?.trim().toUpperCase() ?? ''
  }

  return ''
}

function resolveTitle(common = {}, fileName = '') {
  return firstNonEmptyText(common.title, common.work, common.subtitle, sanitizeTrackTitle(fileName))
}

function resolveArtist(common = {}) {
  return firstNonEmptyText(
    joinUniqueTextValues([common.artists]),
    common.artist,
    common.albumartist,
    joinUniqueTextValues([common.albumartists]),
    common.originalartist,
  )
}

function resolveAlbumArtist(common = {}) {
  return firstNonEmptyText(joinUniqueTextValues([common.albumartists]), common.albumartist)
}

function resolveAlbum(common = {}) {
  return firstNonEmptyText(common.album, common.originalalbum)
}

function resolveGenre(common = {}) {
  return joinUniqueTextValues([common.genre])
}

function resolveComposer(common = {}) {
  return firstNonEmptyText(
    joinUniqueTextValues([common.composer]),
    joinUniqueTextValues([common.writer]),
  )
}

function resolveLyricist(common = {}) {
  return firstNonEmptyText(
    joinUniqueTextValues([common.lyricist]),
    joinUniqueTextValues([common.writer]),
  )
}

function resolveComment(common = {}) {
  const comments = Array.isArray(common.comment) ? common.comment.map((value) => value?.text) : []
  return joinUniqueTextValues(comments, '\n')
}

function extractYear(value) {
  if (Number.isFinite(value) && value > 0) {
    return Math.trunc(value)
  }

  const text = normalizeText(value)

  if (!text) {
    return 0
  }

  const match = text.match(/\b(19|20)\d{2}\b/)
  return match ? Number(match[0]) : 0
}

function resolveYear(common = {}) {
  return (
    extractYear(common.year) ||
    extractYear(common.date) ||
    extractYear(common.releasedate) ||
    extractYear(common.originalyear) ||
    extractYear(common.originaldate)
  )
}

function resolveSequence(value = {}) {
  return {
    number: normalizePositiveInteger(value?.no),
    total: normalizePositiveInteger(value?.of),
  }
}

function resolveBlobName(file) {
  return normalizeText(file?.name)
}

async function parseAudioMetadata(file) {
  const { parseBlob, parseBuffer } = await getMusicMetadata()
  const options = {
    duration: true,
    skipCovers: false,
  }

  try {
    return await parseBlob(file, options)
  } catch {
    const buffer = new Uint8Array(await file.arrayBuffer())

    return parseBuffer(
      buffer,
      {
        mimeType: file?.type,
        path: resolveBlobName(file),
        size: file?.size,
      },
      options,
    )
  }
}

async function createResolvedMetadata(file, metadata) {
  const common = metadata?.common ?? {}
  const title = resolveTitle(common, resolveBlobName(file))
  const artist = resolveArtist(common)
  const track = resolveSequence(common.track)
  const disc = resolveSequence(common.disk)

  return {
    title,
    artist,
    albumArtist: resolveAlbumArtist(common),
    album: resolveAlbum(common),
    genre: resolveGenre(common),
    year: resolveYear(common),
    trackNumber: track.number,
    trackTotal: track.total,
    discNumber: disc.number,
    discTotal: disc.total,
    composer: resolveComposer(common),
    lyricist: resolveLyricist(common),
    comment: resolveComment(common),
    duration: normalizeOptionalNumber(metadata?.format?.duration),
    fileSize: Number.isFinite(file?.size) ? file.size : 0,
    format: resolveFormat(file, metadata),
    bitrate: normalizeOptionalNumber(metadata?.format?.bitrate),
    sampleRate: normalizeOptionalNumber(metadata?.format?.sampleRate),
    bitDepth: normalizeOptionalNumber(metadata?.format?.bitsPerSample),
    artwork: await extractArtwork(common.picture),
    displayTitle: createDisplayTitle({
      title,
      artist,
      fileName: resolveBlobName(file),
    }),
    metadataVersion: CURRENT_TRACK_METADATA_VERSION,
  }
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return ''
  }

  const totalSeconds = Math.floor(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainder = totalSeconds % 60

  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

function formatFileSize(bytes, locale) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return ''
  }

  const mb = bytes / (1024 * 1024)
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: mb >= 10 ? 0 : 1,
  })

  return `${formatter.format(mb)} MB`
}

function formatBitrate(bitrate, locale) {
  if (!Number.isFinite(bitrate) || bitrate <= 0) {
    return ''
  }

  const kbps = bitrate / 1000
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: kbps >= 100 ? 0 : 1,
  })

  return `${formatter.format(kbps)} kbps`
}

function formatSampleRate(sampleRate, locale) {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    return ''
  }

  const khz = sampleRate / 1000
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: Number.isInteger(khz) ? 0 : 1,
  })

  return `${formatter.format(khz)} kHz`
}

function formatBitDepthAndSampleRate(bitDepth, sampleRate, locale) {
  const parts = []

  if (Number.isFinite(bitDepth) && bitDepth > 0) {
    parts.push(`${bitDepth}-bit`)
  }

  const sampleRateLabel = formatSampleRate(sampleRate, locale)

  if (sampleRateLabel) {
    parts.push(sampleRateLabel)
  }

  return parts.join(' ')
}

function formatTechnicalSummary(track, locale) {
  const parts = []
  const bitrate = formatBitrate(track?.bitrate, locale)
  const fidelity = formatBitDepthAndSampleRate(track?.bitDepth, track?.sampleRate, locale)

  if (bitrate) {
    parts.push(bitrate)
  }

  if (fidelity) {
    parts.push(fidelity)
  }

  return parts.join(' / ')
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '')
    }

    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read artwork blob.'))
    }

    reader.readAsDataURL(blob)
  })
}

async function extractArtwork(pictures = []) {
  const { selectCover } = await getMusicMetadata()
  const cover =
    (Array.isArray(pictures) && pictures.length > 0 ? selectCover(pictures) : null) ??
    (Array.isArray(pictures) ? pictures[0] : null)

  if (!cover?.data) {
    return ''
  }

  try {
    const blob = new Blob([cover.data], {
      type: normalizeText(cover.format, 'image/jpeg'),
    })

    return await blobToDataUrl(blob)
  } catch {
    return ''
  }
}

function createFallbackMetadata(file) {
  const fileName = resolveBlobName(file)
  const title = sanitizeTrackTitle(fileName)
  const artist = ''

  return {
    title,
    artist,
    albumArtist: '',
    album: '',
    genre: '',
    year: 0,
    trackNumber: 0,
    trackTotal: 0,
    discNumber: 0,
    discTotal: 0,
    composer: '',
    lyricist: '',
    comment: '',
    duration: 0,
    fileSize: Number.isFinite(file?.size) ? file.size : 0,
    format: resolveFormat(file, null),
    bitrate: 0,
    sampleRate: 0,
    bitDepth: 0,
    artwork: '',
    displayTitle: createDisplayTitle({
      title,
      artist,
      fileName,
    }),
    metadataVersion: 0,
  }
}

export async function normalizeFileMetadata(file) {
  if (!(file instanceof Blob)) {
    return createFallbackMetadata(file)
  }

  try {
    const metadata = await parseAudioMetadata(file)
    return await createResolvedMetadata(file, metadata)
  } catch {
    return createFallbackMetadata(file)
  }
}

export function createTrackMetaItems(
  track,
  {
    locale = 'en',
    showTechnicalMetadata = true,
    includeFormat = true,
    includeDuration = true,
    maxItems = DEFAULT_MAX_META_ITEMS,
  } = {},
) {
  const items = []
  const format = normalizeText(track?.format).toUpperCase()

  // CN: 1. 格式优先
  // EN: 1. Format first
  if (includeFormat && format) {
    items.push(format)
  }

  // CN: 2. 码率/采样率
  // EN: 2. Bitrate/sample rate
  if (showTechnicalMetadata) {
    const bitrate = formatBitrate(track?.bitrate, locale)
    if (bitrate) {
      items.push(bitrate)
    }

    const fidelity = formatBitDepthAndSampleRate(track?.bitDepth, track?.sampleRate, locale)
    if (fidelity) {
      items.push(fidelity)
    }
  }

  // CN: 3. 时长
  // EN: 3. Duration
  if (includeDuration) {
    const duration = formatTime(track?.duration)
    if (duration) {
      items.push(duration)
    }
  }

  // CN: 4. 文件大小
  // EN: 4. File size
  if (showTechnicalMetadata && items.length < maxItems) {
    const fileSize = formatFileSize(track?.fileSize ?? track?.size, locale)
    if (fileSize) {
      items.push(fileSize)
    }
  }

  return items.slice(0, Math.max(1, maxItems))
}

export function createMetadataService() {
  return {
    parseFile: normalizeFileMetadata,
    createTrackMetaItems,
  }
}
