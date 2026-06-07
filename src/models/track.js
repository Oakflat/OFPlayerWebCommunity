const SUPPORTED_AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'])

// CN: 精确 MIME 类型白名单，避免 audio/x-arbitrary 等宽泛 MIME 绕过校验
// EN: Precise MIME type whitelist, avoiding broad MIME like audio/x-arbitrary bypassing validation
const SUPPORTED_AUDIO_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/flac',
  'audio/x-flac',
  'audio/aac',
  'audio/x-aac',
])
export const CURRENT_TRACK_METADATA_VERSION = 2
const REVOKABLE_SOURCE_KINDS = new Set(['object-url', 'external-object-url'])

function createTrackId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `track-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export { SUPPORTED_AUDIO_EXTENSIONS }

export function sanitizeTrackTitle(fileName = '') {
  const title = String(fileName)
    .replace(/\.[^.]+$/, '')
    .trim()
  return title || 'Untitled'
}

function normalizeText(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed || fallback
}

function normalizeOptionalNumber(value, fallback = 0) {
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

function normalizePositiveInteger(value, fallback = 0) {
  return Number.isInteger(value) && value > 0 ? value : fallback
}

function normalizeOrder(value, fallback = 0) {
  return Number.isInteger(value) && value >= 0 ? value : fallback
}

function normalizeBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeSourceText(value, fallback = '') {
  return normalizeText(value, fallback)
}

function normalizeTrackSource(value = {}, fallback = {}) {
  const source = value && typeof value === 'object' ? value : {}
  const url = normalizeSourceText(source.url ?? fallback.url)
  const kind = normalizeSourceText(source.kind, url ? 'object-url' : 'unavailable')

  return {
    kind,
    url,
    provider: normalizeSourceText(source.provider ?? fallback.provider),
    connectionId: normalizeSourceText(source.connectionId ?? fallback.connectionId),
    remoteId: normalizeSourceText(source.remoteId ?? fallback.remoteId),
    remoteKey: normalizeSourceText(source.remoteKey ?? fallback.remoteKey),
    path: normalizeSourceText(source.path ?? fallback.path),
    originPath: normalizeSourceText(source.originPath ?? fallback.originPath),
    contentType: normalizeSourceText(source.contentType ?? fallback.contentType),
    etag: normalizeSourceText(source.etag ?? fallback.etag),
    persistUrl: normalizeBoolean(source.persistUrl ?? fallback.persistUrl, false),
  }
}

function createPersistableTrackSource(source = {}) {
  const normalized = normalizeTrackSource(source)
  const shouldPersistUrl =
    normalized.persistUrl ||
    normalized.kind === 'external-url' ||
    normalized.kind === 'webdav-public'

  return {
    kind: normalized.kind,
    url: shouldPersistUrl ? normalized.url : '',
    provider: normalized.provider,
    connectionId: normalized.connectionId,
    remoteId: normalized.remoteId,
    remoteKey: normalized.remoteKey,
    path: normalized.path,
    originPath: normalized.originPath,
    contentType: normalized.contentType,
    etag: normalized.etag,
    persistUrl: shouldPersistUrl,
  }
}

function resolveFormat(fileName, format) {
  const normalizedFormat = normalizeText(format)

  if (normalizedFormat) {
    return normalizedFormat.toUpperCase()
  }

  const extension = String(fileName ?? '')
    .split('.')
    .pop()
    ?.trim()
    .toUpperCase()

  return extension || ''
}

export function createDisplayTitle({ title, artist, fileName } = {}) {
  const safeTitle = normalizeText(title, sanitizeTrackTitle(fileName))
  const safeArtist = normalizeText(artist)

  return safeArtist ? `${safeTitle} - ${safeArtist}` : safeTitle
}

export function isSupportedAudioFile(file) {
  if (!file) {
    return false
  }

  const extension = String(file.name ?? '')
    .split('.')
    .pop()
    ?.toLowerCase()

  const mimeOk = SUPPORTED_AUDIO_MIME_TYPES.has(String(file.type ?? '').toLowerCase())
  const extOk = SUPPORTED_AUDIO_EXTENSIONS.has(extension)

  // CN: 两者满足其一即可，但 MIME 使用精确白名单而非宽泛 startsWith('audio/')
  // EN: Either one is sufficient, but MIME uses precise whitelist rather than broad startsWith('audio/')
  return mimeOk || extOk
}

export function createTrackModel(file, overrides = {}) {
  const sourceUrl =
    overrides.source?.url ?? (typeof URL !== 'undefined' && file ? URL.createObjectURL(file) : '')
  const source = normalizeTrackSource(overrides.source, {
    kind: sourceUrl ? 'object-url' : 'unavailable',
    url: sourceUrl,
  })
  const fileName = overrides.fileName ?? file?.name ?? ''
  const fileSize = Number.isFinite(overrides.fileSize)
    ? overrides.fileSize
    : Number.isFinite(overrides.size)
      ? overrides.size
      : Number.isFinite(file?.size)
        ? file.size
        : 0
  const title = normalizeText(overrides.title, sanitizeTrackTitle(fileName))
  const artist = normalizeText(overrides.artist)

  return {
    id: overrides.id ?? createTrackId(),
    libraryId: normalizeText(overrides.libraryId),
    libraryOrder: normalizeOrder(overrides.libraryOrder),
    isFavorite: normalizeBoolean(overrides.isFavorite),
    title,
    artist,
    albumArtist: normalizeText(overrides.albumArtist),
    album: normalizeText(overrides.album),
    genre: normalizeText(overrides.genre),
    year: normalizePositiveInteger(overrides.year),
    trackNumber: normalizePositiveInteger(overrides.trackNumber),
    trackTotal: normalizePositiveInteger(overrides.trackTotal),
    discNumber: normalizePositiveInteger(overrides.discNumber),
    discTotal: normalizePositiveInteger(overrides.discTotal),
    composer: normalizeText(overrides.composer),
    lyricist: normalizeText(overrides.lyricist),
    comment: normalizeText(overrides.comment),
    displayTitle:
      normalizeText(overrides.displayTitle) ||
      createDisplayTitle({
        title,
        artist,
        fileName,
      }),
    fileName,
    fileSize,
    size: fileSize,
    duration: Number.isFinite(overrides.duration) ? overrides.duration : 0,
    format: resolveFormat(fileName, overrides.format),
    bitrate: normalizeOptionalNumber(overrides.bitrate),
    sampleRate: normalizeOptionalNumber(overrides.sampleRate),
    bitDepth: normalizeOptionalNumber(overrides.bitDepth),
    artwork: normalizeText(overrides.artwork),
    mimeType: overrides.mimeType ?? file?.type ?? '',
    importedAt: overrides.importedAt ?? new Date().toISOString(),
    metadataVersion: normalizePositiveInteger(overrides.metadataVersion),
    source,
    file: file ?? null,
  }
}

export function createPersistedTrackModel(track, options = {}) {
  const candidateBlob = options.assetBlob ?? track?.file ?? null
  const assetBlob =
    candidateBlob instanceof Blob
      ? candidateBlob.slice(0, candidateBlob.size, candidateBlob.type)
      : null
  const fileName = track?.fileName ?? options.fileName ?? ''
  const fileSize = Number.isFinite(track?.fileSize)
    ? track.fileSize
    : Number.isFinite(track?.size)
      ? track.size
      : Number.isFinite(options.fileSize)
        ? options.fileSize
        : Number.isFinite(options.size)
          ? options.size
          : 0
  const title = normalizeText(track?.title, sanitizeTrackTitle(fileName))
  const artist = normalizeText(track?.artist)

  return {
    id: track?.id ?? options.id ?? createTrackId(),
    libraryId: normalizeText(track?.libraryId ?? options.libraryId),
    libraryOrder: normalizeOrder(track?.libraryOrder ?? options.libraryOrder),
    isFavorite: normalizeBoolean(track?.isFavorite ?? options.isFavorite),
    title,
    artist,
    albumArtist: normalizeText(track?.albumArtist ?? options.albumArtist),
    album: normalizeText(track?.album ?? options.album),
    genre: normalizeText(track?.genre ?? options.genre),
    year: normalizePositiveInteger(track?.year ?? options.year),
    trackNumber: normalizePositiveInteger(track?.trackNumber ?? options.trackNumber),
    trackTotal: normalizePositiveInteger(track?.trackTotal ?? options.trackTotal),
    discNumber: normalizePositiveInteger(track?.discNumber ?? options.discNumber),
    discTotal: normalizePositiveInteger(track?.discTotal ?? options.discTotal),
    composer: normalizeText(track?.composer ?? options.composer),
    lyricist: normalizeText(track?.lyricist ?? options.lyricist),
    comment: normalizeText(track?.comment ?? options.comment),
    displayTitle:
      normalizeText(track?.displayTitle) ||
      createDisplayTitle({
        title,
        artist,
        fileName,
      }),
    fileName,
    fileSize,
    size: fileSize,
    duration: Number.isFinite(track?.duration)
      ? track.duration
      : Number.isFinite(options.duration)
        ? options.duration
        : 0,
    format: resolveFormat(fileName, track?.format ?? options.format),
    bitrate: normalizeOptionalNumber(track?.bitrate ?? options.bitrate),
    sampleRate: normalizeOptionalNumber(track?.sampleRate ?? options.sampleRate),
    bitDepth: normalizeOptionalNumber(track?.bitDepth ?? options.bitDepth),
    // CN: 封面存储在单独的 IDB 封面存储中 — 永远不要内联持久化
    // CN: 在曲目记录中，避免每次启动时加载大型 base64 字符串。
    // EN: Artwork is stored in a separate IDB artworks store — never persist inline
    // EN: in the track record to avoid loading large base64 strings on every startup.
    artwork: '',
    mimeType: track?.mimeType ?? options.mimeType ?? '',
    importedAt: track?.importedAt ?? options.importedAt ?? new Date().toISOString(),
    metadataVersion: normalizePositiveInteger(track?.metadataVersion ?? options.metadataVersion),
    source: createPersistableTrackSource(track?.source ?? options.source),
    assetBlob,
  }
}

export function createRuntimeTrackFromPersistedTrack(record, options = {}) {
  // CN: 在非加载路径（例如更新操作）中传递 { createObjectUrl: false }
  // CN: 以避免泄漏永远不会分配给内存中曲目的 Blob URL。
  // EN: Pass { createObjectUrl: false } in non-load paths (e.g. update operations)
  // EN: to avoid leaking Blob URLs that will never be assigned to an in-memory track.
  const shouldCreateObjectUrl = options.createObjectUrl !== false
  const sourceUrl =
    shouldCreateObjectUrl && typeof URL !== 'undefined' && record?.assetBlob instanceof Blob
      ? URL.createObjectURL(record.assetBlob)
      : ''
  const persistedSource = createPersistableTrackSource(record?.source)

  return createTrackModel(null, {
    id: record?.id,
    libraryId: record?.libraryId,
    libraryOrder: record?.libraryOrder,
    isFavorite: record?.isFavorite,
    title: record?.title,
    artist: record?.artist,
    albumArtist: record?.albumArtist,
    album: record?.album,
    genre: record?.genre,
    year: record?.year,
    trackNumber: record?.trackNumber,
    trackTotal: record?.trackTotal,
    discNumber: record?.discNumber,
    discTotal: record?.discTotal,
    composer: record?.composer,
    lyricist: record?.lyricist,
    comment: record?.comment,
    displayTitle: record?.displayTitle,
    fileName: record?.fileName,
    fileSize: record?.fileSize ?? record?.size,
    size: record?.fileSize ?? record?.size,
    duration: record?.duration,
    format: record?.format,
    bitrate: record?.bitrate,
    sampleRate: record?.sampleRate,
    bitDepth: record?.bitDepth,
    artwork: record?.artwork,
    mimeType: record?.mimeType,
    importedAt: record?.importedAt,
    metadataVersion: record?.metadataVersion,
    source: {
      ...persistedSource,
      kind: sourceUrl ? 'object-url' : persistedSource.kind,
      url: sourceUrl || persistedSource.url,
    },
  })
}

export function createPersistableTrackMetadata(track) {
  const record = createPersistedTrackModel(track, {
    assetBlob: null,
  })

  return {
    id: record.id,
    libraryId: record.libraryId,
    libraryOrder: record.libraryOrder,
    isFavorite: record.isFavorite,
    title: record.title,
    artist: record.artist,
    albumArtist: record.albumArtist,
    album: record.album,
    genre: record.genre,
    year: record.year,
    trackNumber: record.trackNumber,
    trackTotal: record.trackTotal,
    discNumber: record.discNumber,
    discTotal: record.discTotal,
    composer: record.composer,
    lyricist: record.lyricist,
    comment: record.comment,
    displayTitle: record.displayTitle,
    fileName: record.fileName,
    fileSize: record.fileSize,
    size: record.size,
    duration: record.duration,
    format: record.format,
    bitrate: record.bitrate,
    sampleRate: record.sampleRate,
    bitDepth: record.bitDepth,
    artwork: record.artwork,
    mimeType: record.mimeType,
    importedAt: record.importedAt,
    metadataVersion: record.metadataVersion,
    source: record.source,
  }
}

export function isPlayableTrack(track) {
  return typeof track?.source?.url === 'string' && track.source.url.length > 0
}

// ---------------------------------------------------------------------------
// CN: sanitizeTrackPatch — 由所有数据服务实现共享。
// CN: 仅允许属于持久化曲目记录的字段；运行时字段（源 URL、文件、assetBlob）
// CN: 被有意排除，以便元数据更新（例如 { duration }）永远不会静默擦除这些值。
//
// EN: sanitizeTrackPatch — shared by all data service implementations.
// EN: Only allow fields that belong to a persisted track record; runtime-only
// EN: fields (source URL, file, assetBlob) are intentionally excluded so that a
// EN: metadata update (e.g. { duration }) can never silently wipe those values.
// ---------------------------------------------------------------------------
export function sanitizeTrackPatch(patch = {}) {
  const nextPatch = {}

  if (typeof patch.libraryId === 'string') nextPatch.libraryId = patch.libraryId
  if (Number.isInteger(patch.libraryOrder) && patch.libraryOrder >= 0)
    nextPatch.libraryOrder = patch.libraryOrder
  if (typeof patch.isFavorite === 'boolean') nextPatch.isFavorite = patch.isFavorite
  if (typeof patch.title === 'string') nextPatch.title = patch.title
  if (typeof patch.artist === 'string') nextPatch.artist = patch.artist
  if (typeof patch.albumArtist === 'string') nextPatch.albumArtist = patch.albumArtist
  if (typeof patch.album === 'string') nextPatch.album = patch.album
  if (typeof patch.genre === 'string') nextPatch.genre = patch.genre
  if (Number.isInteger(patch.year)) nextPatch.year = patch.year
  if (Number.isInteger(patch.trackNumber)) nextPatch.trackNumber = patch.trackNumber
  if (Number.isInteger(patch.trackTotal)) nextPatch.trackTotal = patch.trackTotal
  if (Number.isInteger(patch.discNumber)) nextPatch.discNumber = patch.discNumber
  if (Number.isInteger(patch.discTotal)) nextPatch.discTotal = patch.discTotal
  if (typeof patch.composer === 'string') nextPatch.composer = patch.composer
  if (typeof patch.lyricist === 'string') nextPatch.lyricist = patch.lyricist
  if (typeof patch.comment === 'string') nextPatch.comment = patch.comment
  if (typeof patch.displayTitle === 'string') nextPatch.displayTitle = patch.displayTitle
  if (typeof patch.fileName === 'string') nextPatch.fileName = patch.fileName

  if (Number.isFinite(patch.fileSize)) {
    nextPatch.fileSize = patch.fileSize
    nextPatch.size = patch.fileSize
  }

  if (Number.isFinite(patch.size)) {
    nextPatch.fileSize = patch.size
    nextPatch.size = patch.size
  }

  if (Number.isFinite(patch.duration)) nextPatch.duration = patch.duration
  if (typeof patch.format === 'string') nextPatch.format = patch.format
  if (Number.isFinite(patch.bitrate)) nextPatch.bitrate = patch.bitrate
  if (Number.isFinite(patch.sampleRate)) nextPatch.sampleRate = patch.sampleRate
  if (Number.isFinite(patch.bitDepth)) nextPatch.bitDepth = patch.bitDepth
  if (typeof patch.artwork === 'string') nextPatch.artwork = patch.artwork
  if (typeof patch.mimeType === 'string') nextPatch.mimeType = patch.mimeType
  if (typeof patch.importedAt === 'string') nextPatch.importedAt = patch.importedAt
  if (Number.isInteger(patch.metadataVersion)) nextPatch.metadataVersion = patch.metadataVersion
  if (patch.source && typeof patch.source === 'object') nextPatch.source = patch.source

  return nextPatch
}

export function updateTrackModel(track, patch = {}) {
  const shouldRebuildDisplayTitle =
    !Object.prototype.hasOwnProperty.call(patch, 'displayTitle') &&
    (Object.prototype.hasOwnProperty.call(patch, 'title') ||
      Object.prototype.hasOwnProperty.call(patch, 'artist'))
  const nextTrack = {
    ...track,
    ...patch,
    source: patch.source
      ? {
          ...(track?.source ?? {}),
          ...patch.source,
        }
      : track?.source,
  }

  const nextFileSize = Number.isFinite(patch.fileSize)
    ? patch.fileSize
    : Number.isFinite(patch.size)
      ? patch.size
      : Number.isFinite(track?.fileSize)
        ? track.fileSize
        : Number.isFinite(track?.size)
          ? track.size
          : 0

  nextTrack.fileSize = nextFileSize
  nextTrack.size = nextFileSize
  nextTrack.libraryOrder = normalizeOrder(nextTrack.libraryOrder)
  nextTrack.isFavorite = normalizeBoolean(nextTrack.isFavorite)

  if (shouldRebuildDisplayTitle || !normalizeText(nextTrack.displayTitle)) {
    nextTrack.displayTitle = createDisplayTitle(nextTrack)
  }

  return nextTrack
}

export function revokeTrackResource(track) {
  const sourceUrl = track?.source?.url

  if (
    !REVOKABLE_SOURCE_KINDS.has(track?.source?.kind) ||
    typeof sourceUrl !== 'string' ||
    sourceUrl.length === 0 ||
    typeof URL === 'undefined'
  ) {
    return
  }

  try {
    URL.revokeObjectURL(sourceUrl)
  } catch {
    // CN: 忽略已撤销对象 URL 的清理失败。
    // EN: Ignore cleanup failures from already-revoked object URLs.
  }
}
