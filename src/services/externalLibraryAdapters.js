import {
  EXTERNAL_LIBRARY_PROVIDERS,
  createExternalLibraryConnectionModel,
} from '../models/externalLibrary'
import {
  CURRENT_TRACK_METADATA_VERSION,
  SUPPORTED_AUDIO_EXTENSIONS,
  createDisplayTitle,
  sanitizeTrackTitle,
} from '../models/track'

const SUBSONIC_API_VERSION = '1.16.1'
const SUBSONIC_CLIENT_NAME = 'OFPlayer'
const WEBDAV_PROPFIND_BODY = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:displayname />
    <d:getcontentlength />
    <d:getcontenttype />
    <d:getetag />
    <d:getlastmodified />
    <d:resourcetype />
  </d:prop>
</d:propfind>`

function normalizeEndpoint(endpoint) {
  const value = String(endpoint ?? '').trim()

  if (!value) {
    throw new Error('External library endpoint is required.')
  }

  return value.endsWith('/') ? value : `${value}/`
}

function toArray(value) {
  if (!value) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

function basenameFromPath(path = '') {
  const normalized = String(path).replace(/\\/g, '/')
  const basename = normalized.split('/').filter(Boolean).pop() ?? ''

  try {
    return decodeURIComponent(basename)
  } catch {
    return basename
  }
}

function extensionFromName(fileName = '') {
  return String(fileName).split('.').pop()?.toLowerCase() ?? ''
}

function isAudioResource({ fileName = '', contentType = '' } = {}) {
  return (
    String(contentType).startsWith('audio/') ||
    SUPPORTED_AUDIO_EXTENSIONS.has(extensionFromName(fileName))
  )
}

function textToHex(value = '') {
  return Array.from(new TextEncoder().encode(String(value)))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function createBasicAuthHeader(auth = {}) {
  const username = String(auth.username ?? '')
  const password = String(auth.password ?? '')

  if (!username && !password) {
    return null
  }

  const rawCredentials = `${username}:${password}`

  try {
    return `Basic ${btoa(unescape(encodeURIComponent(rawCredentials)))}`
  } catch {
    return `Basic ${btoa(rawCredentials)}`
  }
}

function createWebDavHeaders(connection, extra = {}) {
  const headers = {
    ...extra,
  }
  const authorization = createBasicAuthHeader(connection.auth)

  if (authorization) {
    headers.Authorization = authorization
  }

  return headers
}

function resolveWebDavRootUrl(connection) {
  const endpoint = normalizeEndpoint(connection.endpoint)
  const rootPath = String(connection.rootPath ?? '')
    .trim()
    .replace(/^\/+/, '')
  const resolved = new URL(rootPath, endpoint).href

  // Guard against rootPath being an absolute URL that escapes the endpoint
  // (e.g. rootPath = "https://evil.example.com/") — new URL() would silently
  // ignore the base in that case and send requests to the attacker's server.
  if (!resolved.startsWith(endpoint)) {
    throw new Error('WebDAV rootPath escapes the configured endpoint boundary.')
  }

  return resolved
}

function firstElementByLocalName(node, localName) {
  return (
    Array.from(node?.getElementsByTagName?.('*') ?? []).find(
      (item) => item.localName === localName,
    ) ?? null
  )
}

function textByLocalName(node, localName) {
  return firstElementByLocalName(node, localName)?.textContent?.trim() ?? ''
}

function isCollectionResponse(responseNode) {
  return Array.from(responseNode?.getElementsByTagName?.('*') ?? []).some(
    (item) => item.localName === 'collection',
  )
}

function parseWebDavMultiStatus(xmlText, baseUrl) {
  if (typeof DOMParser === 'undefined') {
    throw new Error('WebDAV XML parsing requires a browser DOM runtime.')
  }

  const document = new DOMParser().parseFromString(xmlText, 'application/xml')
  const responses = Array.from(document.getElementsByTagName('*')).filter(
    (item) => item.localName === 'response',
  )

  return responses.map((response) => {
    const href = textByLocalName(response, 'href')
    const url = new URL(href || '.', baseUrl).href
    const fileName = textByLocalName(response, 'displayname') || basenameFromPath(url)
    const size = Number.parseInt(textByLocalName(response, 'getcontentlength'), 10)

    return {
      url,
      fileName,
      contentType: textByLocalName(response, 'getcontenttype'),
      etag: textByLocalName(response, 'getetag'),
      modifiedAt: textByLocalName(response, 'getlastmodified'),
      size: Number.isFinite(size) ? size : 0,
      isCollection: isCollectionResponse(response),
    }
  })
}

async function webDavPropfind(connection, url, { depth = '1', signal } = {}) {
  const response = await fetch(url, {
    method: 'PROPFIND',
    headers: createWebDavHeaders(connection, {
      Depth: depth,
      'Content-Type': 'application/xml; charset=utf-8',
    }),
    body: WEBDAV_PROPFIND_BODY,
    signal,
  })

  if (!response.ok) {
    throw new Error(`WebDAV request failed with HTTP ${response.status}.`)
  }

  return parseWebDavMultiStatus(await response.text(), url)
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob as data URL.'))
    reader.readAsDataURL(blob)
  })
}

function createWebDavAdapter(connectionInput) {
  const connection = createExternalLibraryConnectionModel(connectionInput)

  async function testConnection(options = {}) {
    await webDavPropfind(connection, resolveWebDavRootUrl(connection), {
      depth: '0',
      signal: options.signal,
    })

    return true
  }

  async function listLibraries() {
    return [
      {
        id: connection.rootPath || '/',
        name: connection.name,
        rootPath: connection.rootPath,
      },
    ]
  }

  async function listTracks(options = {}) {
    const limit =
      Number.isInteger(options.limit) && options.limit > 0
        ? options.limit
        : connection.sync.maxTracks
    const rootUrl = resolveWebDavRootUrl(connection)
    const queue = [rootUrl]
    const seen = new Set()
    const tracks = []

    while (queue.length > 0 && tracks.length < limit) {
      const currentUrl = queue.shift()

      if (!currentUrl || seen.has(currentUrl)) {
        continue
      }

      seen.add(currentUrl)
      const entries = await webDavPropfind(connection, currentUrl, {
        depth: '1',
        signal: options.signal,
      })

      entries.forEach((entry) => {
        if (entry.url === currentUrl) {
          return
        }

        if (entry.isCollection) {
          queue.push(entry.url)
          return
        }

        if (!isAudioResource(entry)) {
          return
        }

        tracks.push({
          remoteId: entry.url,
          title: sanitizeTrackTitle(entry.fileName),
          fileName: entry.fileName,
          fileSize: entry.size,
          size: entry.size,
          format: extensionFromName(entry.fileName),
          mimeType: entry.contentType,
          importedAt: entry.modifiedAt || undefined,
          source: {
            kind: 'webdav',
            provider: EXTERNAL_LIBRARY_PROVIDERS.WEBDAV,
            remoteId: entry.url,
            path: entry.url,
            originPath: entry.url,
            contentType: entry.contentType,
            etag: entry.etag,
            persistUrl: false,
          },
        })
      })
    }

    return tracks.slice(0, limit)
  }

  async function resolvePlaybackSource(track, options = {}) {
    const sourceUrl = track?.source?.path || track?.source?.url

    if (!sourceUrl) {
      throw new Error('WebDAV track is missing its source URL.')
    }

    const authorization = createBasicAuthHeader(connection.auth)

    if (!authorization) {
      return {
        kind: 'external-url',
        url: sourceUrl,
        provider: EXTERNAL_LIBRARY_PROVIDERS.WEBDAV,
        connectionId: connection.id,
        remoteId: track?.source?.remoteId ?? sourceUrl,
        path: sourceUrl,
        originPath: sourceUrl,
        persistUrl: true,
      }
    }

    const response = await fetch(sourceUrl, {
      headers: createWebDavHeaders(connection),
      signal: options.signal,
    })

    if (!response.ok) {
      throw new Error(`Unable to fetch WebDAV track with HTTP ${response.status}.`)
    }

    const blob = await response.blob()

    return {
      kind: 'external-object-url',
      url: URL.createObjectURL(blob),
      provider: EXTERNAL_LIBRARY_PROVIDERS.WEBDAV,
      connectionId: connection.id,
      remoteId: track?.source?.remoteId ?? sourceUrl,
      path: sourceUrl,
      originPath: sourceUrl,
      contentType: blob.type,
      persistUrl: false,
    }
  }

  async function fetchRemoteBlob(track, options = {}) {
    const sourceUrl = track?.source?.path || track?.source?.url

    if (!sourceUrl) {
      throw new Error('WebDAV track is missing its source URL.')
    }

    const response = await fetch(sourceUrl, {
      headers: createWebDavHeaders(connection),
      signal: options.signal,
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch WebDAV file: HTTP ${response.status}.`)
    }

    const blob = await response.blob()
    const fileName = track?.fileName || basenameFromPath(sourceUrl)
    return new File([blob], fileName, { type: blob.type || 'audio/mpeg' })
  }

  return {
    provider: EXTERNAL_LIBRARY_PROVIDERS.WEBDAV,
    capabilities: {
      canListTracks: true,
      canStream: true,
      canFetchMetadata: true,
      requiresBridge: false,
    },
    testConnection,
    listLibraries,
    listTracks,
    resolvePlaybackSource,
    fetchRemoteBlob,
  }
}

function createSubsonicAdapter(connectionInput) {
  const connection = createExternalLibraryConnectionModel(connectionInput)
  const endpoint = normalizeEndpoint(connection.endpoint)

  function createAuthParams() {
    const params = {
      u: connection.auth.username,
      v: SUBSONIC_API_VERSION,
      c: SUBSONIC_CLIENT_NAME,
      f: 'json',
    }

    if (connection.auth.token && connection.auth.salt) {
      params.t = connection.auth.token
      params.s = connection.auth.salt
      return params
    }

    if (connection.auth.password) {
      params.p = `enc:${textToHex(connection.auth.password)}`
    }

    return params
  }

  function buildApiUrl(method, params = {}) {
    const url = new URL(`rest/${method}.view`, endpoint)
    const query = new URLSearchParams({
      ...createAuthParams(),
      ...params,
    })

    url.search = query.toString()
    return url.href
  }

  async function request(method, params = {}, options = {}) {
    const response = await fetch(buildApiUrl(method, params), {
      signal: options.signal,
    })

    if (!response.ok) {
      throw new Error(`Subsonic request failed with HTTP ${response.status}.`)
    }

    const payload = await response.json()
    const body = payload?.['subsonic-response'] ?? payload?.subsonicResponse ?? payload

    if (body?.status === 'failed') {
      const message = body?.error?.message ?? 'Subsonic request failed.'
      throw new Error(message)
    }

    return body
  }

  async function testConnection(options = {}) {
    await request('ping', {}, options)
    return true
  }

  async function listLibraries(options = {}) {
    const body = await request('getMusicFolders', {}, options)
    const folders = toArray(body?.musicFolders?.musicFolder)

    if (folders.length === 0) {
      return [
        {
          id: connection.rootPath || 'default',
          name: connection.name,
        },
      ]
    }

    return folders.map((folder) => ({
      id: String(folder.id ?? ''),
      name: folder.name || connection.name,
    }))
  }

  async function listTracks(options = {}) {
    const maxTracks =
      Number.isInteger(options.limit) && options.limit > 0
        ? options.limit
        : connection.sync.maxTracks
    const maxAlbums =
      Number.isInteger(options.maxAlbums) && options.maxAlbums > 0
        ? options.maxAlbums
        : connection.sync.maxAlbums
    const albumPageSize = Math.min(100, maxAlbums)
    const albums = []
    const tracks = []
    let offset = 0

    while (albums.length < maxAlbums) {
      const body = await request(
        'getAlbumList2',
        {
          type: 'alphabeticalByName',
          size: String(albumPageSize),
          offset: String(offset),
          ...(connection.rootPath ? { musicFolderId: connection.rootPath } : {}),
        },
        options,
      )
      const page = toArray(body?.albumList2?.album)

      if (page.length === 0) {
        break
      }

      albums.push(...page)
      offset += page.length

      if (page.length < albumPageSize) {
        break
      }
    }

    for (const album of albums.slice(0, maxAlbums)) {
      if (tracks.length >= maxTracks) {
        break
      }

      const body = await request('getAlbum', { id: album.id }, options)
      const songs = toArray(body?.album?.song)

      songs.forEach((song) => {
        if (tracks.length >= maxTracks) {
          return
        }

        const fileName =
          basenameFromPath(song.path) || `${song.title ?? song.id}.${song.suffix ?? 'audio'}`

        tracks.push({
          remoteId: String(song.id ?? ''),
          title: song.title || sanitizeTrackTitle(fileName),
          artist: song.artist ?? '',
          albumArtist: album.artist ?? '',
          album: song.album ?? album.name ?? '',
          genre: song.genre ?? '',
          year: Number.isInteger(song.year) ? song.year : Number.parseInt(song.year, 10) || 0,
          trackNumber: Number.isInteger(song.track)
            ? song.track
            : Number.parseInt(song.track, 10) || 0,
          discNumber: Number.isInteger(song.discNumber)
            ? song.discNumber
            : Number.parseInt(song.discNumber, 10) || 0,
          fileName,
          fileSize: Number.isFinite(song.size) ? song.size : Number.parseInt(song.size, 10) || 0,
          size: Number.isFinite(song.size) ? song.size : Number.parseInt(song.size, 10) || 0,
          duration: Number.isFinite(song.duration)
            ? song.duration
            : Number.parseFloat(song.duration) || 0,
          format: song.suffix ?? extensionFromName(fileName),
          bitrate: Number.isFinite(song.bitRate)
            ? song.bitRate
            : Number.parseInt(song.bitRate, 10) || 0,
          mimeType: song.contentType ?? '',
          source: {
            kind: 'subsonic',
            provider: EXTERNAL_LIBRARY_PROVIDERS.SUBSONIC,
            remoteId: String(song.id ?? ''),
            path: song.path ?? '',
            originPath: song.path ?? '',
            contentType: song.contentType ?? '',
            persistUrl: false,
          },
        })
      })
    }

    return tracks
  }

  async function resolvePlaybackSource(track) {
    const remoteId = track?.source?.remoteId ?? track?.remoteId

    if (!remoteId) {
      throw new Error('Subsonic track is missing its remote id.')
    }

    return {
      kind: 'external-url',
      url: buildApiUrl('stream', { id: remoteId }),
      provider: EXTERNAL_LIBRARY_PROVIDERS.SUBSONIC,
      connectionId: connection.id,
      remoteId,
      path: track?.source?.path ?? '',
      originPath: track?.source?.originPath ?? track?.source?.path ?? '',
      contentType: track?.source?.contentType ?? '',
      persistUrl: false,
    }
  }

  async function fetchMetadata(track, options = {}) {
    const remoteId = track?.source?.remoteId ?? track?.remoteId

    if (!remoteId) {
      return null
    }

    const body = await request('getSong', { id: remoteId }, options)
    const song = body?.song

    if (!song) {
      return null
    }

    const fileName =
      basenameFromPath(song.path) || `${song.title ?? song.id}.${song.suffix ?? 'audio'}`
    const title = song.title || sanitizeTrackTitle(fileName)
    const artist = song.artist ?? ''

    let artwork = track?.artwork ?? ''

    if (song.coverArt && !artwork) {
      try {
        const artResponse = await fetch(
          buildApiUrl('getCoverArt', { id: song.coverArt, size: '500' }),
          {
            signal: options.signal,
          },
        )

        if (artResponse.ok) {
          const artBlob = await artResponse.blob()
          artwork = await blobToDataUrl(artBlob)
        }
      } catch {
        // Artwork fetch is non-fatal
      }
    }

    return {
      title,
      artist,
      albumArtist: song.albumArtist ?? '',
      album: song.album ?? '',
      genre: song.genre ?? '',
      year: Number.isInteger(song.year) ? song.year : Number.parseInt(song.year, 10) || 0,
      trackNumber: Number.isInteger(song.track) ? song.track : Number.parseInt(song.track, 10) || 0,
      trackTotal: 0,
      discNumber: Number.isInteger(song.discNumber)
        ? song.discNumber
        : Number.parseInt(song.discNumber, 10) || 0,
      discTotal: 0,
      duration: Number.isFinite(song.duration)
        ? song.duration
        : Number.parseFloat(song.duration) || 0,
      bitrate: Number.isFinite(song.bitRate)
        ? song.bitRate
        : Number.parseInt(song.bitRate, 10) || 0,
      format: (song.suffix ?? extensionFromName(fileName)).toUpperCase(),
      mimeType: song.contentType ?? '',
      artwork,
      displayTitle: createDisplayTitle({ title, artist, fileName }),
      metadataVersion: CURRENT_TRACK_METADATA_VERSION,
    }
  }

  return {
    provider: EXTERNAL_LIBRARY_PROVIDERS.SUBSONIC,
    capabilities: {
      canListTracks: true,
      canStream: true,
      canFetchMetadata: true,
      requiresBridge: false,
    },
    testConnection,
    listLibraries,
    listTracks,
    resolvePlaybackSource,
    fetchMetadata,
  }
}

function createFtpAdapter() {
  const unsupportedMessage =
    'FTP is not available from the browser runtime. Use the desktop bridge or a WebDAV/Subsonic gateway for this provider.'

  async function unsupported() {
    throw new Error(unsupportedMessage)
  }

  return {
    provider: EXTERNAL_LIBRARY_PROVIDERS.FTP,
    capabilities: {
      canListTracks: false,
      canStream: false,
      requiresBridge: true,
    },
    testConnection: unsupported,
    listLibraries: unsupported,
    listTracks: unsupported,
    resolvePlaybackSource: unsupported,
  }
}

export function createExternalLibraryAdapter(connection) {
  const normalizedConnection = createExternalLibraryConnectionModel(connection)

  switch (normalizedConnection.provider) {
    case EXTERNAL_LIBRARY_PROVIDERS.SUBSONIC:
      return createSubsonicAdapter(normalizedConnection)
    case EXTERNAL_LIBRARY_PROVIDERS.FTP:
      return createFtpAdapter(normalizedConnection)
    case EXTERNAL_LIBRARY_PROVIDERS.WEBDAV:
    default:
      return createWebDavAdapter(normalizedConnection)
  }
}
