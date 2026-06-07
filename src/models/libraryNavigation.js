import {
  parseCollectionRef,
  SMART_VIEW_KEYS,
  createPlaylistCollectionRef,
  createViewCollectionRef,
} from './collection'
import { SYSTEM_PLAYLIST_KEYS } from './playlist'
import { groupTracksByAlbum, groupTracksByArtist } from '../services/albumViewService'

function uniqueTrackIds(trackIds = []) {
  return [...new Set((trackIds ?? []).filter(Boolean))]
}

function resolveTracks(trackIds, trackMap) {
  return uniqueTrackIds(trackIds)
    .map((trackId) => trackMap.get(trackId))
    .filter(Boolean)
}

function sortByOrder(items = []) {
  return [...items].sort((left, right) => {
    const orderDiff = (left?.order ?? 0) - (right?.order ?? 0)

    if (orderDiff !== 0) {
      return orderDiff
    }

    return String(left?.createdAt ?? left?.id ?? '').localeCompare(
      String(right?.createdAt ?? right?.id ?? ''),
    )
  })
}

function sortTracksByLibraryOrder(tracks = []) {
  return [...tracks].sort((left, right) => {
    const orderDiff = (left?.libraryOrder ?? 0) - (right?.libraryOrder ?? 0)

    if (orderDiff !== 0) {
      return orderDiff
    }

    return String(left?.importedAt ?? left?.id ?? '').localeCompare(
      String(right?.importedAt ?? right?.id ?? ''),
    )
  })
}

function getPlaylistLabel(playlist, t) {
  if (playlist?.systemKey === SYSTEM_PLAYLIST_KEYS.ALL_TRACKS) {
    return t('sidebar.playlists.allTracks')
  }

  return playlist?.name || t('sidebar.playlistSection')
}

function getPlaylistMeta(playlist, t) {
  if (playlist?.systemKey === SYSTEM_PLAYLIST_KEYS.ALL_TRACKS) {
    return t('sidebar.playlists.allTracksMeta')
  }

  return t('sidebar.switcher.playlistMeta')
}

function getPlaylistEmpty(playlist, t) {
  if (playlist?.systemKey === SYSTEM_PLAYLIST_KEYS.ALL_TRACKS) {
    return t('sidebar.playlists.allTracksEmpty')
  }

  return t('sidebar.playlists.allTracksEmpty')
}

function createPlaylistCollectionItem(playlist, playlistTracks, t) {
  return {
    id: playlist.id,
    key: createPlaylistCollectionRef(playlist.id),
    kind: 'playlist',
    playlistKind: playlist.kind,
    systemKey: playlist.systemKey,
    label: getPlaylistLabel(playlist, t),
    meta: getPlaylistMeta(playlist, t),
    empty: getPlaylistEmpty(playlist, t),
    count: playlistTracks.length,
    tracks: playlistTracks,
    canRename: playlist.kind !== 'system',
    canDelete: playlist.kind !== 'system',
    canReorder: playlist.kind !== 'system',
  }
}

const SMART_COLLECTION_DEFINITIONS = Object.freeze([
  {
    key: SMART_VIEW_KEYS.RECENT_IMPORTS,
    labelKey: 'sidebar.smartCollections.recentImports',
    metaKey: 'sidebar.smartCollections.recentImportsMeta',
    emptyKey: 'sidebar.smartCollections.recentImportsEmpty',
    resolveTrackIds: ({ libraryTracks }) =>
      [...libraryTracks]
        .sort((left, right) => String(right.importedAt).localeCompare(String(left.importedAt)))
        .map((track) => track.id),
  },
  {
    key: SMART_VIEW_KEYS.RECENTLY_PLAYED,
    labelKey: 'sidebar.smartCollections.recentlyPlayed',
    metaKey: 'sidebar.smartCollections.recentlyPlayedMeta',
    emptyKey: 'sidebar.smartCollections.recentlyPlayedEmpty',
    resolveTrackIds: ({ libraryTrackIdSet, recentHistory }) =>
      recentHistory
        .map((entry) => entry.trackId)
        .filter((trackId) => libraryTrackIdSet.has(trackId)),
  },
  {
    key: SMART_VIEW_KEYS.FAVORITES,
    labelKey: 'sidebar.smartCollections.favorites',
    metaKey: 'sidebar.smartCollections.favoritesMeta',
    emptyKey: 'sidebar.smartCollections.favoritesEmpty',
    resolveTrackIds: ({ libraryTracks }) =>
      sortTracksByLibraryOrder(libraryTracks.filter((track) => track.isFavorite)).map(
        (track) => track.id,
      ),
  },
  {
    key: SMART_VIEW_KEYS.CURRENT_QUEUE,
    labelKey: 'sidebar.smartCollections.currentQueue',
    metaKey: 'sidebar.smartCollections.currentQueueMeta',
    emptyKey: 'sidebar.smartCollections.currentQueueEmpty',
    resolveTrackIds: ({ libraryTrackIdSet, queueTrackIds }) =>
      queueTrackIds.filter((trackId) => libraryTrackIdSet.has(trackId)),
  },
  {
    key: SMART_VIEW_KEYS.ALBUMS,
    labelKey: 'sidebar.smartCollections.albums',
    metaKey: 'sidebar.smartCollections.albumsMeta',
    emptyKey: 'sidebar.smartCollections.albumsEmpty',
    resolveTrackIds: ({ libraryTracks }) => libraryTracks.map((track) => track.id),
    isBrowserView: true,
    browserKind: 'albums',
  },
  {
    key: SMART_VIEW_KEYS.ARTISTS,
    labelKey: 'sidebar.smartCollections.artists',
    metaKey: 'sidebar.smartCollections.artistsMeta',
    emptyKey: 'sidebar.smartCollections.artistsEmpty',
    resolveTrackIds: ({ libraryTracks }) => libraryTracks.map((track) => track.id),
    isBrowserView: true,
    browserKind: 'artists',
  },
])

function createSmartCollectionItem(definition, context, t) {
  const tracks = resolveTracks(definition.resolveTrackIds(context), context.trackMap)
  let groups = []

  if (definition.isBrowserView && definition.browserKind === 'albums') {
    groups = groupTracksByAlbum(tracks)
  } else if (definition.isBrowserView && definition.browserKind === 'artists') {
    groups = groupTracksByArtist(tracks)
  }

  const item = {
    id: definition.key,
    key: createViewCollectionRef(definition.key),
    kind: 'view',
    label: t(definition.labelKey),
    meta: t(definition.metaKey),
    empty: t(definition.emptyKey),
    count: definition.isBrowserView ? groups.length : tracks.length,
    tracks,
    canRename: false,
    canDelete: false,
    canReorder: false,
    isBrowserView: definition.isBrowserView ?? false,
    browserKind: definition.browserKind ?? null,
  }

  if (definition.isBrowserView) {
    item.groups = groups
  }

  return item
}

export function buildLibraryNavigation({
  libraries = [],
  playlists = [],
  tracks = [],
  playlistTrackRelations = [],
  activeLibrary,
  activeCollection,
  recentHistory = [],
  queueTrackIds = [],
  t,
}) {
  const sortedLibraries = sortByOrder(libraries)
  const resolvedLibrary =
    sortedLibraries.find((library) => library.id === activeLibrary) ?? sortedLibraries[0] ?? null
  const trackMap = new Map((tracks ?? []).map((track) => [track.id, track]))
  const activeLibraryTracks = resolvedLibrary
    ? sortTracksByLibraryOrder(tracks.filter((track) => track.libraryId === resolvedLibrary.id))
    : []
  const activeLibraryTrackIds = new Set(activeLibraryTracks.map((track) => track.id))
  const relationsByPlaylistId = new Map()

  ;(playlistTrackRelations ?? []).forEach((relation) => {
    const relations = relationsByPlaylistId.get(relation.playlistId) ?? []
    relations.push(relation)
    relationsByPlaylistId.set(relation.playlistId, relations)
  })

  const libraryItems = sortedLibraries.map((library) => ({
    id: library.id,
    key: library.id,
    label:
      library.name ||
      (library.isDefault ? t('sidebar.libraries.local') : t('sidebar.librarySection')),
    meta: library.isDefault ? t('sidebar.libraries.localMeta') : t('sidebar.switcher.libraryMeta'),
    count: tracks.filter((track) => track.libraryId === library.id).length,
    isDefault: library.isDefault,
    isExternal: library.source?.kind === 'external',
    canDelete: !library.isDefault,
    canRename: true,
  }))

  const libraryPlaylists = resolvedLibrary
    ? sortByOrder(playlists.filter((playlist) => playlist.libraryId === resolvedLibrary.id))
    : []
  const playlistItems = libraryPlaylists.map((playlist) => {
    const playlistTrackIds =
      playlist.systemKey === SYSTEM_PLAYLIST_KEYS.ALL_TRACKS
        ? activeLibraryTracks.map((track) => track.id)
        : (relationsByPlaylistId.get(playlist.id) ?? [])
            .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
            .map((relation) => relation.trackId)

    return createPlaylistCollectionItem(playlist, resolveTracks(playlistTrackIds, trackMap), t)
  })

  const smartCollectionContext = {
    libraryTracks: activeLibraryTracks,
    libraryTrackIdSet: activeLibraryTrackIds,
    recentHistory,
    queueTrackIds,
    trackMap,
  }
  const smartCollections = SMART_COLLECTION_DEFINITIONS.map((definition) =>
    createSmartCollectionItem(definition, smartCollectionContext, t),
  )

  const collectionMap = new Map(
    [...playlistItems, ...smartCollections].map((collection) => [collection.key, collection]),
  )
  const parsedCollection = parseCollectionRef(activeCollection)
  const defaultCollectionKey =
    playlistItems.find((playlist) => playlist.systemKey === SYSTEM_PLAYLIST_KEYS.ALL_TRACKS)?.key ??
    playlistItems[0]?.key ??
    smartCollections[0]?.key ??
    null
  const resolvedCollection =
    (parsedCollection.type ? collectionMap.get(activeCollection) : null) ??
    (defaultCollectionKey ? collectionMap.get(defaultCollectionKey) : null) ??
    null

  return {
    activeLibrary: resolvedLibrary?.id ?? null,
    activeLibraryItem:
      libraryItems.find((library) => library.id === resolvedLibrary?.id) ?? libraryItems[0] ?? null,
    activeCollection: resolvedCollection,
    libraries: libraryItems,
    playlists: playlistItems,
    smartCollections,
  }
}
