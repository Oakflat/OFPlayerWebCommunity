import { DEFAULT_ALL_TRACKS_PLAYLIST_ID } from './playlist'

export const SMART_VIEW_KEYS = Object.freeze({
  RECENT_IMPORTS: 'recent-imports',
  RECENTLY_PLAYED: 'all-plays',
  FAVORITES: 'all-favorites',
  CURRENT_QUEUE: 'current-queue',
  ALBUMS: 'albums',
  ARTISTS: 'artists',
})

export function createPlaylistCollectionRef(playlistId) {
  return `playlist:${playlistId}`
}

export function createViewCollectionRef(viewKey) {
  return `view:${viewKey}`
}

export function parseCollectionRef(collectionRef) {
  if (typeof collectionRef !== 'string') {
    return {
      type: null,
      value: null,
    }
  }

  const [type, ...rest] = collectionRef.split(':')
  const value = rest.join(':').trim()

  if (!value) {
    return {
      type: null,
      value: null,
    }
  }

  if (type === 'playlist') {
    return {
      type: 'playlist',
      value,
    }
  }

  if (type === 'view') {
    return {
      type: 'view',
      value,
    }
  }

  return {
    type: null,
    value: null,
  }
}

export function isPlaylistCollectionRef(collectionRef) {
  return parseCollectionRef(collectionRef).type === 'playlist'
}

export function isViewCollectionRef(collectionRef) {
  return parseCollectionRef(collectionRef).type === 'view'
}

export const DEFAULT_ACTIVE_COLLECTION_REF = createPlaylistCollectionRef(
  DEFAULT_ALL_TRACKS_PLAYLIST_ID,
)
