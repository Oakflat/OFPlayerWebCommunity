<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ChevronDown,
  Heart,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  Pause,
  Play,
  Search,
  SkipBack,
  SkipForward,
  X,
} from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'
import { useSortOptions } from '../composables/useSortOptions'
import { createTrackMetaItems } from '../services/metadataService'
import { groupTracksByAlbum, groupTracksByArtist } from '../services/albumViewService'
import { parseCollectionRef } from '../models/collection'
import MenuDropdown from './MenuDropdown.vue'
import DialogModal from './DialogModal.vue'
import TrackPlaylistDialog from './TrackPlaylistDialog.vue'
import AlbumBrowserPanel from './AlbumBrowserPanel.vue'

const props = defineProps({
  tracks: {
    type: Array,
    default: () => [],
  },
  currentLibrary: {
    type: Object,
    default: null,
  },
  libraries: {
    type: Array,
    default: () => [],
  },
  playlists: {
    type: Array,
    default: () => [],
  },
  currentCollection: {
    type: Object,
    default: null,
  },
  currentTrackId: {
    type: String,
    default: null,
  },
  currentTrack: {
    type: Object,
    default: null,
  },
  hasAnyTracks: {
    type: Boolean,
    default: false,
  },
  isPlaying: {
    type: Boolean,
    default: false,
  },
  currentTime: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number,
    default: 0,
  },
  volume: {
    type: Number,
    default: 0.8,
  },
  searchQuery: {
    type: String,
    default: '',
  },
  sortOption: {
    type: String,
    default: 'recent',
  },
  typeFilter: {
    type: String,
    default: 'all',
  },
  showTechnicalMetadata: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits([
  'select-track',
  'toggle-playback',
  'play-previous',
  'play-next',
  'seek',
  'set-volume',
  'set-search-query',
  'set-sort-option',
  'set-type-filter',
  'add-track-to-playlist',
  'remove-track-from-playlist',
  'delete-track',
  'toggle-favorite',
  'open-immersive-player',
  'play-group',
])

const TRACK_ROW_HEIGHT_PX = 76
const VIRTUAL_LIST_OVERSCAN = 8
const VIRTUALIZATION_THRESHOLD = 90

const { locale, t } = useI18n()
const { sortOptions, applySortToTracks } = useSortOptions(t, locale)
const searchInput = ref(null)
const isSearchOpen = ref(false)
const isInspectorOpen = ref(false)
const activeToolbarMenu = ref(null)
const inspectorToggleRef = ref(null)
const inspectorPopoverStyle = ref({})
const isInspectorCompact = ref(false)

const COMPACT_INSPECTOR_ITEM_KEYS = [
  'year',
  'genre',
  'format',
  'duration',
  'bitrate',
  'sampleRate',
  'size',
  'importedAt',
  'fileName',
]

function updateInspectorPopoverPosition() {
  const btn = inspectorToggleRef.value
  if (!btn) return
  const rect = btn.getBoundingClientRect()

  const GAP = 8 // gap between card bottom and button top
  const EDGE_MARGIN = 12 // min distance from viewport top edge

  // Available space above the button (where the card floats)
  const spaceAbove = rect.top - GAP - EDGE_MARGIN
  // Honour CSS max-height but never exceed the available viewport space
  const cssMaxHeight = Math.min(window.innerHeight * 0.72, 480)
  const effectiveMaxHeight = Math.max(120, Math.min(cssMaxHeight, spaceAbove))
  isInspectorCompact.value = effectiveMaxHeight <= 430

  inspectorPopoverStyle.value = {
    position: 'fixed',
    bottom: window.innerHeight - rect.top + GAP + 'px',
    right: window.innerWidth - rect.right + 'px',
    maxHeight: effectiveMaxHeight + 'px',
    zIndex: 9999,
  }
}
const sortMenuRef = ref(null)
const filterMenuRef = ref(null)
const songListRef = ref(null)
const songListScrollTop = ref(0)
const songListViewportHeight = ref(0)
let songListMeasureFrameId = null
let songListResizeObserver = null
const openTrackMenuId = ref(null)
const trackMenuAnchorEl = ref(null)
const addToPlaylistState = ref({
  isOpen: false,
  track: null,
  libraryId: null,
  playlistId: null,
})
const dialogState = ref({
  isOpen: false,
  type: null,
  title: '',
  message: '',
  isDanger: false,
  onConfirm: () => {},
})

const progressValue = computed(() => {
  if (!Number.isFinite(props.duration) || props.duration <= 0) {
    return 0
  }

  return Math.min(props.currentTime, props.duration)
})

const durationValue = computed(() => {
  if (!Number.isFinite(props.duration) || props.duration <= 0) {
    return 1
  }

  return props.duration
})

const availableTypeFilters = computed(() => {
  const options = [{ value: 'all', label: t('player.filterAll') }]
  const seenTypes = new Set()

  props.tracks.forEach((track) => {
    const fileType = resolveTrackFormat(track)

    if (!seenTypes.has(fileType)) {
      seenTypes.add(fileType)
      options.push({
        value: fileType,
        label: fileType,
      })
    }
  })

  return options
})

const visibleTracks = computed(() => {
  const query = props.searchQuery.trim().toLowerCase()

  const filtered = props.tracks
    .map((track, index) => ({
      track,
      index,
      fileType: resolveTrackFormat(track),
    }))
    .filter(({ track, fileType }) => {
      const searchableText = [
        track.displayTitle,
        track.title,
        track.artist,
        track.albumArtist,
        track.album,
        track.genre,
        track.composer,
        track.lyricist,
        track.comment,
        track.fileName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesQuery = query.length === 0 || searchableText.includes(query)
      const matchesType = props.typeFilter === 'all' || fileType === props.typeFilter

      return matchesQuery && matchesType
    })

  return applySortToTracks(filtered, props.sortOption)
})

const isBrowserCollection = computed(() => props.currentCollection?.isBrowserView === true)

const browserTypeFilteredTracks = computed(() => {
  if (props.typeFilter === 'all') {
    return props.tracks
  }

  return props.tracks.filter((track) => resolveTrackFormat(track) === props.typeFilter)
})

function createBrowserGroups(tracks) {
  if (props.currentCollection?.browserKind === 'artists') {
    return groupTracksByArtist(tracks)
  }

  return groupTracksByAlbum(tracks)
}

const browserAllGroups = computed(() => {
  if (!isBrowserCollection.value) {
    return []
  }

  return createBrowserGroups(props.tracks)
})

const browserTypeGroups = computed(() => {
  if (!isBrowserCollection.value) {
    return []
  }

  return createBrowserGroups(browserTypeFilteredTracks.value)
})

const browserVisibleGroups = computed(() => {
  const query = props.searchQuery.trim().toLowerCase()

  if (!query) {
    return browserTypeGroups.value
  }

  return browserTypeGroups.value.filter((group) => matchesBrowserGroupSearch(group, query))
})

const visibleCountLabel = computed(() => {
  const shown = isBrowserCollection.value
    ? browserVisibleGroups.value.length
    : visibleTracks.value.length
  const total = isBrowserCollection.value ? browserAllGroups.value.length : props.tracks.length

  return t('player.visibleCount', {
    shown,
    total,
  })
})

const shouldVirtualizeTracks = computed(
  () => visibleTracks.value.length >= VIRTUALIZATION_THRESHOLD,
)

const virtualWindow = computed(() => {
  if (!shouldVirtualizeTracks.value) {
    return { offset: 0, limit: null }
  }

  const offset = Math.max(
    0,
    Math.floor(songListScrollTop.value / TRACK_ROW_HEIGHT_PX) - VIRTUAL_LIST_OVERSCAN,
  )
  const visibleRowCount =
    Math.ceil(songListViewportHeight.value / TRACK_ROW_HEIGHT_PX) + VIRTUAL_LIST_OVERSCAN * 2

  return { offset, limit: Math.max(visibleRowCount, 1) }
})

const renderedTrackEntries = computed(() => {
  const tracks = visibleTracks.value

  if (!shouldVirtualizeTracks.value) {
    return tracks.map((track, i) => ({ track, index: i }))
  }

  const { offset, limit } = virtualWindow.value
  return tracks.slice(offset, offset + limit).map((track, i) => ({ track, index: offset + i }))
})

const totalVirtualTrackHeight = computed(() => visibleTracks.value.length * TRACK_ROW_HEIGHT_PX)
const virtualTrackOffset = computed(() => virtualWindow.value.offset * TRACK_ROW_HEIGHT_PX)

const songListStyle = computed(() => ({
  '--song-row-height': `${TRACK_ROW_HEIGHT_PX}px`,
}))

const isSearchVisible = computed(() => {
  return isSearchOpen.value || props.searchQuery.trim().length > 0
})

const currentTrackMeta = computed(() => {
  const items = createTrackMetaItems(props.currentTrack, {
    locale: locale.value,
    showTechnicalMetadata: props.showTechnicalMetadata,
    includeDuration: true,
    maxItems: 3,
  })

  return items.length > 0 ? items.join(' • ') : t('track.localFile')
})

const collectionEyebrow = computed(() => props.currentLibrary?.label || t('player.library'))
const collectionTitle = computed(() => props.currentCollection?.label || t('player.importedTracks'))
const emptyCollectionCopy = computed(
  () => props.currentCollection?.empty || t('player.collectionEmpty'),
)
const headerCopyKey = computed(() => `${collectionEyebrow.value}::${collectionTitle.value}`)
const visibleCountKey = computed(() => visibleCountLabel.value)

const currentSortLabel = computed(() => {
  return (
    sortOptions.value.find((option) => option.value === props.sortOption)?.label ??
    t('player.sortRecent')
  )
})

const currentTypeFilterLabel = computed(() => {
  return (
    availableTypeFilters.value.find((option) => option.value === props.typeFilter)?.label ??
    t('player.filterAll')
  )
})

const inspectorItems = computed(() => {
  if (!props.currentTrack) {
    return []
  }

  const track = props.currentTrack
  const metadataItems = [
    {
      key: 'artist',
      label: t('player.details.artist'),
      value: track?.artist || '',
    },
    {
      key: 'albumArtist',
      label: t('player.details.albumArtist'),
      value: track?.albumArtist || '',
    },
    {
      key: 'album',
      label: t('player.details.album'),
      value: track?.album || '',
    },
    {
      key: 'genre',
      label: t('player.details.genre'),
      value: track?.genre || '',
    },
    {
      key: 'year',
      label: t('player.details.year'),
      value: formatYear(track?.year),
    },
    {
      key: 'track',
      label: t('player.details.track'),
      value: formatSequence(track?.trackNumber, track?.trackTotal),
    },
    {
      key: 'disc',
      label: t('player.details.disc'),
      value: formatSequence(track?.discNumber, track?.discTotal),
    },
    {
      key: 'composer',
      label: t('player.details.composer'),
      value: track?.composer || '',
    },
    {
      key: 'lyricist',
      label: t('player.details.lyricist'),
      value: track?.lyricist || '',
    },
    {
      key: 'comment',
      label: t('player.details.comment'),
      value: track?.comment || '',
    },
  ].filter((item) => item.value)

  const technicalItems = [
    {
      key: 'format',
      label: t('player.details.format'),
      value: resolveTrackFormat(track),
    },
    {
      key: 'bitrate',
      label: t('player.details.bitrate'),
      value: formatBitrate(track?.bitrate),
    },
    {
      key: 'sampleRate',
      label: t('player.details.sampleRate'),
      value: formatSampleRate(track?.sampleRate),
    },
    {
      key: 'bitDepth',
      label: t('player.details.bitDepth'),
      value: formatBitDepth(track?.bitDepth),
    },
    {
      key: 'duration',
      label: t('player.details.duration'),
      value: formatTime(track?.duration),
    },
    {
      key: 'size',
      label: t('player.details.size'),
      value: formatFileSize(track?.fileSize ?? track?.size),
    },
    {
      key: 'fileName',
      label: t('player.details.fileName'),
      value: track?.fileName || t('player.details.unavailable'),
    },
    {
      key: 'importedAt',
      label: t('player.details.importedAt'),
      value: formatImportedAt(track?.importedAt),
    },
  ]

  return [...metadataItems, ...technicalItems]
})

const displayedInspectorItems = computed(() => {
  if (!isInspectorCompact.value) {
    return inspectorItems.value
  }

  const compactItems = COMPACT_INSPECTOR_ITEM_KEYS.map((key) =>
    inspectorItems.value.find((item) => item.key === key),
  )
    .filter(Boolean)
    .slice(0, 4)

  return compactItems.length > 0 ? compactItems : inspectorItems.value.slice(0, 4)
})

watch(
  () => props.currentTrack?.id ?? null,
  (trackId) => {
    if (!trackId) {
      isInspectorOpen.value = false
    }
  },
)

watch(isSearchVisible, (visible) => {
  if (visible) {
    activeToolbarMenu.value = null
  }
})

watch(
  () => props.currentCollection?.key ?? null,
  () => {
    resetSongListScroll()
  },
)

watch(
  () => visibleTracks.value.length,
  () => {
    scheduleSongListMeasurement()
  },
)

watch(songListRef, (el, prevEl) => {
  if (songListResizeObserver && prevEl) {
    songListResizeObserver.unobserve(prevEl)
  }

  if (songListResizeObserver && el) {
    songListResizeObserver.observe(el)
  }

  scheduleSongListMeasurement()
})

function resolveTrackTitle(track) {
  return track?.displayTitle || track?.title || t('player.untitled')
}

function resolveTrackArtist(track) {
  return track?.artist || track?.albumArtist || t('track.unknownArtist')
}

function matchesBrowserGroupSearch(group, query) {
  const searchableText = [
    group?.albumName ?? group?.artistName,
    group?.albumArtist ?? group?.artistName,
    ...(group?.tracks ?? []).flatMap((track) => [
      resolveTrackTitle(track),
      track?.title,
      track?.artist,
      track?.albumArtist,
      track?.album,
      track?.genre,
      track?.composer,
      track?.lyricist,
      track?.comment,
      track?.fileName,
    ]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return searchableText.includes(query)
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

function resolveTrackFormat(track) {
  const format = String(track?.format ?? '')
    .trim()
    .toUpperCase()

  if (format) {
    return format
  }

  const extension = track?.fileName?.split('.').pop()?.toUpperCase()
  return extension || t('track.fileTypeFallback')
}

function createRowMeta(track) {
  const items = createTrackMetaItems(track, {
    locale: locale.value,
    showTechnicalMetadata: props.showTechnicalMetadata,
    includeFormat: false,
    includeDuration: false,
    maxItems: 3,
  })

  return items.length > 0 ? items.join(' • ') : ''
}

function focusSearchInput() {
  nextTick(() => {
    searchInput.value?.focus()
  })
}

function toggleSearch() {
  if (!isSearchVisible.value) {
    isSearchOpen.value = true
  }

  focusSearchInput()
}

function closeSearch() {
  if (props.searchQuery.trim().length > 0) {
    emit('set-search-query', '')
  }

  isSearchOpen.value = false
}

function handleSearchInput(event) {
  emit('set-search-query', event.target.value)
}

function handleSearchEscape() {
  if (props.searchQuery.trim().length > 0) {
    closeSearch()
    return
  }

  isSearchOpen.value = false
}

function isToolbarMenuOpen(menu) {
  return activeToolbarMenu.value === menu
}

function toggleToolbarMenu(menu) {
  activeToolbarMenu.value = activeToolbarMenu.value === menu ? null : menu
}

function closeToolbarMenu() {
  activeToolbarMenu.value = null
}

function selectSortOption(value) {
  emit('set-sort-option', value)
  closeToolbarMenu()
}

function selectTypeFilter(value) {
  emit('set-type-filter', value)
  closeToolbarMenu()
}

function handleDocumentPointerDown(event) {
  const target = event.target

  if (sortMenuRef.value?.contains(target) || filterMenuRef.value?.contains(target)) {
    return
  }

  closeToolbarMenu()
}

function handleDocumentKeydown(event) {
  if (event.key === 'Escape') {
    closeToolbarMenu()
  }
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }

  const totalSeconds = Math.floor(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainder = totalSeconds % 60

  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

function formatBitrate(bitrate) {
  if (!Number.isFinite(bitrate) || bitrate <= 0) {
    return t('player.details.unavailable')
  }

  return `${Math.round(bitrate / 1000)} kbps`
}

function formatSampleRate(sampleRate) {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    return t('player.details.unavailable')
  }

  const rate = sampleRate / 1000
  return `${Number.isInteger(rate) ? rate : rate.toFixed(1)} kHz`
}

function formatBitDepth(bitDepth) {
  if (!Number.isFinite(bitDepth) || bitDepth <= 0) {
    return t('player.details.unavailable')
  }

  return `${bitDepth}-bit`
}

function formatYear(year) {
  if (!Number.isInteger(year) || year <= 0) {
    return ''
  }

  return String(year)
}

function formatSequence(number, total) {
  if (!Number.isInteger(number) || number <= 0) {
    return ''
  }

  if (Number.isInteger(total) && total > 0) {
    return `${number} / ${total}`
  }

  return String(number)
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return t('player.details.unavailable')
  }

  const mb = bytes / (1024 * 1024)
  const formatter = new Intl.NumberFormat(locale.value, {
    maximumFractionDigits: mb >= 10 ? 0 : 1,
  })

  return `${formatter.format(mb)} MB`
}

function formatImportedAt(value) {
  if (!value) {
    return t('player.details.unavailable')
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return t('player.details.unavailable')
  }

  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function artworkMonogram(track) {
  const label = resolveTrackTitle(track)

  if (!label) {
    return 'OF'
  }

  return label.slice(0, 2).toUpperCase()
}

function formatTrackIndex(index) {
  return String(index + 1).padStart(2, '0')
}

function updateSongListMetrics() {
  if (!songListRef.value) {
    songListViewportHeight.value = 0
    return
  }

  songListViewportHeight.value = songListRef.value.clientHeight
  songListScrollTop.value = songListRef.value.scrollTop
}

function scheduleSongListMeasurement() {
  if (songListMeasureFrameId !== null) {
    cancelAnimationFrame(songListMeasureFrameId)
  }

  songListMeasureFrameId = requestAnimationFrame(() => {
    songListMeasureFrameId = null
    updateSongListMetrics()
  })
}

function handleSongListScroll(event) {
  songListScrollTop.value = event?.target?.scrollTop ?? 0
}

function resetSongListScroll() {
  songListScrollTop.value = 0

  if (songListRef.value) {
    songListRef.value.scrollTop = 0
  }
}

function toggleInspector() {
  if (!props.currentTrack) {
    return
  }

  isInspectorOpen.value = !isInspectorOpen.value
  if (isInspectorOpen.value) {
    updateInspectorPopoverPosition()
  }
}

// 曲目操作菜单
function toggleTrackMenu(trackId, event) {
  if (openTrackMenuId.value === trackId) {
    closeTrackMenu()
    return
  }

  openTrackMenuId.value = trackId
  trackMenuAnchorEl.value = event?.currentTarget ?? null
}

function closeTrackMenu() {
  openTrackMenuId.value = null
  trackMenuAnchorEl.value = null
}

function getTrackMenuItems(track) {
  const items = [{ key: 'add-to-playlist', label: t('sidebar.actions.addToPlaylist') }]

  // 如果当前是用户歌单，显示"从歌单移出"选项
  if (props.currentCollection && !isSystemCollection(props.currentCollection)) {
    items.push({ key: 'remove-from-playlist', label: t('sidebar.actions.removeFromPlaylist') })
  }

  items.push({ key: 'delete-from-library', label: t('sidebar.actions.deleteFromLibrary') })

  return items
}

function isSystemCollection(collection) {
  if (!collection) return false
  // 系统歌单或智能视图不可修改
  return collection.kind === 'view' || collection.systemKey != null
}

function handleTrackMenuSelect(track, action) {
  closeTrackMenu()

  if (action.key === 'add-to-playlist') {
    // 显示歌单选择器
    openAddToPlaylistDialog(track)
  } else if (action.key === 'remove-from-playlist') {
    openRemoveFromPlaylistDialog(track)
  } else if (action.key === 'delete-from-library') {
    openDeleteTrackDialog(track)
  }
}

function openAddToPlaylistDialog(track) {
  const preferredPlaylistId = resolvePreferredPlaylistId(track)

  addToPlaylistState.value = {
    isOpen: true,
    track,
    libraryId: track?.libraryId ?? props.currentLibrary?.id ?? null,
    playlistId: preferredPlaylistId,
  }
}

function resolvePreferredPlaylistId(track) {
  if (!track?.libraryId) {
    return null
  }

  if (
    props.currentCollection?.kind === 'playlist' &&
    props.currentCollection?.playlistKind === 'user' &&
    props.currentCollection?.id
  ) {
    const currentPlaylist = props.playlists.find(
      (playlist) =>
        playlist.id === props.currentCollection.id &&
        playlist.kind === 'user' &&
        playlist.libraryId === track.libraryId,
    )

    if (currentPlaylist) {
      return currentPlaylist.id
    }
  }

  return (
    sortByOrder(
      props.playlists.filter(
        (playlist) => playlist.kind === 'user' && playlist.libraryId === track.libraryId,
      ),
    )[0]?.id ?? null
  )
}

function closeAddToPlaylistDialog() {
  addToPlaylistState.value = {
    isOpen: false,
    track: null,
    libraryId: null,
    playlistId: null,
  }
}

function handleAddToPlaylistConfirm({ trackId, playlistId }) {
  emit('add-track-to-playlist', {
    trackId,
    playlistId,
  })
  closeAddToPlaylistDialog()
}

function openRemoveFromPlaylistDialog(track) {
  const parsed = parseCollectionRef(props.currentCollection.key)
  const playlistId = parsed.value

  dialogState.value = {
    isOpen: true,
    type: 'remove-from-playlist',
    title: t('sidebar.actions.removeFromPlaylist'),
    message: t('sidebar.dialogs.removeFromPlaylistConfirm'),
    isDanger: false,
    onConfirm: () => {
      emit('remove-track-from-playlist', {
        playlistId,
        trackId: track.id,
      })
    },
  }
}

function openDeleteTrackDialog(track) {
  dialogState.value = {
    isOpen: true,
    type: 'delete-track',
    title: t('sidebar.actions.deleteFromLibrary'),
    message: t('sidebar.dialogs.deleteTrackConfirm'),
    isDanger: true,
    onConfirm: () => {
      emit('delete-track', track.id)
    },
  }
}

function handleDialogConfirm() {
  dialogState.value.onConfirm()
  closeDialog()
}

function closeDialog() {
  dialogState.value.isOpen = false
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleDocumentKeydown)
  window.addEventListener('resize', updateInspectorPopoverPosition)

  songListResizeObserver = new ResizeObserver(() => {
    scheduleSongListMeasurement()
  })

  if (songListRef.value) {
    songListResizeObserver.observe(songListRef.value)
  }

  scheduleSongListMeasurement()
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeydown)
  window.removeEventListener('resize', updateInspectorPopoverPosition)

  if (songListResizeObserver) {
    songListResizeObserver.disconnect()
    songListResizeObserver = null
  }

  if (songListMeasureFrameId !== null) {
    cancelAnimationFrame(songListMeasureFrameId)
    songListMeasureFrameId = null
  }
})
</script>

<template>
  <section class="panel panel-player">
    <div class="player-main">
      <section class="player-content">
        <header class="content-header">
          <div class="content-header-main content-header-main-compact">
            <Transition name="content-copy-swap" mode="out-in" appear>
              <div :key="headerCopyKey" class="content-header-copy-block">
                <p class="eyebrow">{{ collectionEyebrow }}</p>
                <h2 class="content-title">{{ collectionTitle }}</h2>
              </div>
            </Transition>
          </div>

          <section class="library-toolbar" :aria-label="t('player.libraryTools')">
            <div class="library-toolbar-summary">
              <Transition name="content-copy-swap" mode="out-in" appear>
                <strong :key="visibleCountKey" class="library-toolbar-summary-value">{{
                  visibleCountLabel
                }}</strong>
              </Transition>
            </div>

            <div class="library-toolbar-actions" :class="{ 'is-search-open': isSearchVisible }">
              <Transition name="toolbar-selectors">
                <div v-if="!isSearchVisible" class="library-toolbar-selectors">
                  <div ref="sortMenuRef" class="library-toolbar-menu">
                    <button
                      class="library-toolbar-select library-toolbar-select-button"
                      :class="{ 'is-open': isToolbarMenuOpen('sort') }"
                      type="button"
                      :aria-label="t('player.sortBy')"
                      :aria-expanded="isToolbarMenuOpen('sort')"
                      aria-controls="library-sort-menu"
                      @click="toggleToolbarMenu('sort')"
                    >
                      <span>{{ t('player.sortBy') }}</span>
                      <strong>{{ currentSortLabel }}</strong>
                      <ChevronDown aria-hidden="true" />
                    </button>

                    <Transition name="toolbar-menu">
                      <div
                        v-if="isToolbarMenuOpen('sort')"
                        id="library-sort-menu"
                        class="library-toolbar-dropdown"
                        role="listbox"
                        :aria-label="t('player.sortBy')"
                      >
                        <button
                          v-for="option in sortOptions"
                          :key="option.value"
                          class="library-toolbar-option"
                          :class="{ 'is-active': option.value === sortOption }"
                          type="button"
                          role="option"
                          :aria-selected="option.value === sortOption"
                          @click="selectSortOption(option.value)"
                        >
                          {{ option.label }}
                        </button>
                      </div>
                    </Transition>
                  </div>

                  <div ref="filterMenuRef" class="library-toolbar-menu">
                    <button
                      class="library-toolbar-select library-toolbar-select-button"
                      :class="{ 'is-open': isToolbarMenuOpen('filter') }"
                      type="button"
                      :aria-label="t('player.filterBy')"
                      :aria-expanded="isToolbarMenuOpen('filter')"
                      aria-controls="library-filter-menu"
                      @click="toggleToolbarMenu('filter')"
                    >
                      <span>{{ t('player.filterBy') }}</span>
                      <strong>{{ currentTypeFilterLabel }}</strong>
                      <ChevronDown aria-hidden="true" />
                    </button>

                    <Transition name="toolbar-menu">
                      <div
                        v-if="isToolbarMenuOpen('filter')"
                        id="library-filter-menu"
                        class="library-toolbar-dropdown"
                        role="listbox"
                        :aria-label="t('player.filterBy')"
                      >
                        <button
                          v-for="option in availableTypeFilters"
                          :key="option.value"
                          class="library-toolbar-option"
                          :class="{ 'is-active': option.value === typeFilter }"
                          type="button"
                          role="option"
                          :aria-selected="option.value === typeFilter"
                          @click="selectTypeFilter(option.value)"
                        >
                          {{ option.label }}
                        </button>
                      </div>
                    </Transition>
                  </div>
                </div>
              </Transition>

              <Transition name="toolbar-search">
                <div
                  v-if="isSearchVisible"
                  id="library-search-popover"
                  class="library-search-inline"
                >
                  <Search class="library-search-icon" aria-hidden="true" />
                  <input
                    ref="searchInput"
                    :value="searchQuery"
                    type="search"
                    :aria-label="t('player.searchPlaceholder')"
                    :placeholder="t('player.searchPlaceholder')"
                    @input="handleSearchInput"
                    @keydown.esc.prevent="handleSearchEscape"
                  />
                  <button
                    class="library-search-clear"
                    type="button"
                    :aria-label="t('player.clearSearch')"
                    @click="closeSearch"
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>
              </Transition>

              <button
                class="library-search-toggle"
                :class="{ 'is-active': isSearchVisible }"
                type="button"
                :aria-label="t('player.searchTracks')"
                :aria-expanded="isSearchVisible"
                aria-controls="library-search-popover"
                @click="toggleSearch"
              >
                <Search aria-hidden="true" />
              </button>
            </div>
          </section>
        </header>

        <section class="track-region" :aria-label="t('player.trackList')">
          <!-- 专辑 / 艺术家浏览视图（便当盒网格）-->
          <AlbumBrowserPanel
            v-if="currentCollection?.isBrowserView"
            :browser-kind="currentCollection.browserKind"
            :groups="browserVisibleGroups"
            :current-track-id="currentTrackId"
            :is-playing="isPlaying"
            :search-query="searchQuery"
            @select-track="(track) => emit('select-track', track.id)"
            @play-group="(tracks) => emit('play-group', tracks)"
            @cover-changed="() => {}"
          />

          <!-- 普通曲目列表 -->
          <template v-else>
            <div class="track-region-head">
              <span class="track-region-head-cell track-region-head-cell--index">#</span>
              <span class="track-region-head-cell track-region-head-cell--title">{{
                t('player.trackColumn')
              }}</span>
              <span class="track-region-head-cell track-region-head-cell--duration">{{
                t('player.length')
              }}</span>
              <span class="track-region-head-cell track-region-head-cell--format">{{
                t('player.details.format')
              }}</span>
              <span
                class="track-region-head-cell track-region-head-cell--favorite"
                :aria-label="t('sidebar.actions.favorite')"
              >
                <Heart aria-hidden="true" />
              </span>
              <span class="track-region-head-cell track-region-head-cell--more"></span>
            </div>

            <div v-if="!hasAnyTracks" class="main-empty-state">
              <p>{{ t('player.noTracks') }}</p>
              <span>{{ t('player.libraryWillAppear') }}</span>
            </div>

            <div v-else-if="tracks.length === 0" class="main-empty-state">
              <p>{{ collectionTitle }}</p>
              <span>{{ emptyCollectionCopy }}</span>
            </div>

            <div v-else-if="visibleTracks.length === 0" class="main-empty-state">
              <p>{{ t('player.noMatches') }}</p>
              <span>{{ t('player.adjustTools') }}</span>
            </div>

            <div
              v-else
              ref="songListRef"
              class="song-list"
              :style="songListStyle"
              @scroll="handleSongListScroll"
            >
              <!-- Virtual mode: spacer sets total scroll height; window translates to correct position -->
              <div
                v-if="shouldVirtualizeTracks"
                class="song-list-virtual-spacer"
                :style="{ height: `${totalVirtualTrackHeight}px` }"
              >
                <div
                  class="song-list-virtual-window"
                  :style="{ transform: `translateY(${virtualTrackOffset}px)` }"
                >
                  <div
                    v-for="entry in renderedTrackEntries"
                    :key="entry.track.id"
                    class="song-row-wrap"
                  >
                    <div
                      class="song-row-shell"
                      :class="{
                        'is-active': entry.track.id === currentTrackId,
                        'is-playing': entry.track.id === currentTrackId && isPlaying,
                      }"
                    >
                      <button
                        class="song-row"
                        type="button"
                        @click="emit('select-track', entry.track.id)"
                      >
                        <span
                          class="song-row-index"
                          :data-index="formatTrackIndex(entry.index)"
                          aria-hidden="true"
                        ></span>
                        <div class="song-title">
                          <strong>{{ resolveTrackTitle(entry.track) }}</strong>
                          <span v-if="createRowMeta(entry.track)">{{
                            createRowMeta(entry.track)
                          }}</span>
                        </div>
                        <span class="song-duration">{{ formatTime(entry.track.duration) }}</span>
                        <span class="song-state">{{ resolveTrackFormat(entry.track) }}</span>
                      </button>
                      <button
                        type="button"
                        class="song-row-favorite"
                        :class="{ 'is-active': entry.track.isFavorite }"
                        :aria-label="
                          entry.track.isFavorite
                            ? t('sidebar.actions.unfavorite')
                            : t('sidebar.actions.favorite')
                        "
                        :aria-pressed="entry.track.isFavorite"
                        @click.stop="emit('toggle-favorite', entry.track.id)"
                      >
                        <Heart aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        class="song-row-more"
                        :aria-label="t('sidebar.actions.more')"
                        @click.stop="toggleTrackMenu(entry.track.id, $event)"
                      >
                        <MoreHorizontal aria-hidden="true" />
                      </button>
                    </div>
                    <MenuDropdown
                      :is-open="openTrackMenuId === entry.track.id"
                      :anchor-el="openTrackMenuId === entry.track.id ? trackMenuAnchorEl : null"
                      :items="getTrackMenuItems(entry.track)"
                      @close="closeTrackMenu"
                      @select="(action) => handleTrackMenuSelect(entry.track, action)"
                    />
                  </div>
                </div>
              </div>

              <!-- Static mode: all rows rendered with enter/leave transitions -->
              <TransitionGroup v-else name="list" tag="div" class="song-list-static">
                <div
                  v-for="entry in renderedTrackEntries"
                  :key="entry.track.id"
                  class="song-row-wrap"
                >
                  <div
                    class="song-row-shell"
                    :class="{
                      'is-active': entry.track.id === currentTrackId,
                      'is-playing': entry.track.id === currentTrackId && isPlaying,
                    }"
                  >
                    <button
                      class="song-row"
                      type="button"
                      @click="emit('select-track', entry.track.id)"
                    >
                      <span
                        class="song-row-index"
                        :data-index="formatTrackIndex(entry.index)"
                        aria-hidden="true"
                      ></span>
                      <div class="song-title">
                        <strong>{{ resolveTrackTitle(entry.track) }}</strong>
                        <span v-if="createRowMeta(entry.track)">{{
                          createRowMeta(entry.track)
                        }}</span>
                      </div>
                      <span class="song-duration">{{ formatTime(entry.track.duration) }}</span>
                      <span class="song-state">{{ resolveTrackFormat(entry.track) }}</span>
                    </button>
                    <button
                      type="button"
                      class="song-row-favorite"
                      :class="{ 'is-active': entry.track.isFavorite }"
                      :aria-label="
                        entry.track.isFavorite
                          ? t('sidebar.actions.unfavorite')
                          : t('sidebar.actions.favorite')
                      "
                      :aria-pressed="entry.track.isFavorite"
                      @click.stop="emit('toggle-favorite', entry.track.id)"
                    >
                      <Heart aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      class="song-row-more"
                      :aria-label="t('sidebar.actions.more')"
                      @click.stop="toggleTrackMenu(entry.track.id, $event)"
                    >
                      <MoreHorizontal aria-hidden="true" />
                    </button>
                  </div>
                  <MenuDropdown
                    :is-open="openTrackMenuId === entry.track.id"
                    :anchor-el="openTrackMenuId === entry.track.id ? trackMenuAnchorEl : null"
                    :items="getTrackMenuItems(entry.track)"
                    @close="closeTrackMenu"
                    @select="(action) => handleTrackMenuSelect(entry.track, action)"
                  />
                </div>
              </TransitionGroup>
            </div> </template
          ><!-- /v-else: 普通曲目列表 -->
        </section>
      </section>
    </div>

    <div class="playback-dock-wrap">
      <footer
        class="playback-dock"
        :class="{ 'has-track': !!currentTrack, 'is-playing': isPlaying }"
      >
        <div class="playback-summary">
          <button
            class="playback-artwork"
            type="button"
            :disabled="!currentTrack"
            :aria-label="t('player.immersive.open')"
            @click="emit('open-immersive-player')"
          >
            <img
              v-if="currentTrack?.artwork"
              :src="currentTrack.artwork"
              :alt="resolveTrackTitle(currentTrack)"
            />
            <span v-else>{{ artworkMonogram(currentTrack) }}</span>
          </button>

          <div v-if="currentTrack" class="playback-copy">
            <strong>{{ resolveTrackTitle(currentTrack) }}</strong>
            <span class="playback-meta">{{ currentTrackMeta }}</span>
          </div>
          <div v-else class="playback-copy is-empty">
            <strong>{{ t('player.nothingSelected') }}</strong>
            <span>{{ t('player.emptyPlaybackCopy') }}</span>
          </div>
        </div>

        <div class="playback-core">
          <div class="transport-row">
            <button
              class="transport-button transport-button-secondary transport-button-icon"
              type="button"
              :disabled="!hasAnyTracks"
              :aria-label="t('player.prev')"
              @click="emit('play-previous')"
            >
              <SkipBack aria-hidden="true" />
            </button>
            <button
              class="transport-button transport-button-primary transport-button-icon transport-button-play"
              type="button"
              :disabled="!hasAnyTracks"
              :aria-label="isPlaying ? t('player.pause') : t('player.play')"
              @click="emit('toggle-playback')"
            >
              <Pause v-if="isPlaying" aria-hidden="true" />
              <Play v-else aria-hidden="true" />
            </button>
            <button
              class="transport-button transport-button-secondary transport-button-icon"
              type="button"
              :disabled="!hasAnyTracks"
              :aria-label="t('player.next')"
              @click="emit('play-next')"
            >
              <SkipForward aria-hidden="true" />
            </button>
          </div>

          <div class="playback-progress">
            <div class="timeline-head">
              <span>{{ formatTime(currentTime) }}</span>
              <div class="timeline-head-actions">
                <span>{{ formatTime(duration) }}</span>
                <button
                  v-if="currentTrack"
                  ref="inspectorToggleRef"
                  class="progress-inspector-toggle"
                  :class="{ 'is-active': isInspectorOpen }"
                  type="button"
                  :aria-label="
                    isInspectorOpen ? t('player.details.closePanel') : t('player.details.openPanel')
                  "
                  :aria-expanded="isInspectorOpen"
                  aria-controls="track-inspector-popover"
                  @click="toggleInspector"
                >
                  <PanelRightClose v-if="isInspectorOpen" aria-hidden="true" />
                  <PanelRightOpen v-else aria-hidden="true" />
                </button>
              </div>
            </div>

            <input
              class="slider"
              type="range"
              min="0"
              :max="durationValue"
              :value="progressValue"
              step="0.1"
              :disabled="!currentTrack"
              @input="emit('seek', Number($event.target.value))"
            />
          </div>
        </div>

        <label class="playback-volume">
          <span>{{ t('player.volume') }}</span>
          <input
            class="slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="volume"
            @input="emit('set-volume', Number($event.target.value))"
          />
        </label>
      </footer>

      <Teleport to="body">
        <Transition name="inspector-popover">
          <aside
            v-if="currentTrack && isInspectorOpen"
            id="track-inspector-popover"
            class="track-inspector track-inspector-popover"
            :class="{ 'track-inspector-popover--compact': isInspectorCompact }"
            :style="inspectorPopoverStyle"
            :aria-label="t('player.details.panelTitle')"
          >
            <div class="track-inspector-scroll">
              <div class="track-inspector-head">
                <p class="eyebrow">{{ t('player.details.eyebrow') }}</p>
                <h3>{{ t('player.details.panelTitle') }}</h3>
              </div>

              <div class="track-inspector-body">
                <div class="track-inspector-artwork" aria-hidden="true">
                  <img
                    v-if="currentTrack.artwork"
                    :src="currentTrack.artwork"
                    :alt="
                      t('player.details.artworkAlt', { title: resolveTrackTitle(currentTrack) })
                    "
                  />
                  <span v-else>{{ artworkMonogram(currentTrack) }}</span>
                </div>

                <div class="track-inspector-copy">
                  <strong>{{ resolveTrackTitle(currentTrack) }}</strong>
                  <span>{{ resolveTrackArtist(currentTrack) }}</span>
                  <small v-if="currentTrack.album">{{ currentTrack.album }}</small>
                </div>

                <dl class="track-inspector-meta">
                  <div
                    v-for="item in displayedInspectorItems"
                    :key="item.key"
                    class="track-inspector-meta-item"
                  >
                    <dt>{{ item.label }}</dt>
                    <dd>{{ item.value }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </aside>
        </Transition>
      </Teleport>
    </div>

    <DialogModal
      :is-open="dialogState.isOpen"
      :title="dialogState.title"
      :message="dialogState.message"
      :is-danger="dialogState.isDanger"
      @close="closeDialog"
      @confirm="handleDialogConfirm"
    />

    <TrackPlaylistDialog
      :is-open="addToPlaylistState.isOpen"
      :track="addToPlaylistState.track"
      :libraries="libraries"
      :playlists="playlists"
      :preferred-library-id="addToPlaylistState.libraryId"
      :preferred-playlist-id="addToPlaylistState.playlistId"
      @close="closeAddToPlaylistDialog"
      @confirm="handleAddToPlaylistConfirm"
    />
  </section>
</template>

<style scoped>
.track-region-head-cell--favorite,
.track-region-head-cell--more {
  display: grid;
  place-items: center;
}

.track-region-head-cell--favorite svg {
  width: 14px;
  height: 14px;
  color: var(--ink-subtle);
}

.content-header-copy-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  min-width: 0;
}

.content-header-copy-block .eyebrow,
.content-header-copy-block .content-title {
  animation: none;
}

/* Dropdown transition */
.toolbar-menu-enter-active,
.toolbar-menu-leave-active {
  transition:
    opacity var(--duration-sm, 120ms) var(--ease-standard),
    transform var(--duration-sm, 120ms) var(--ease-standard);
}

.toolbar-menu-enter-from,
.toolbar-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
}

/* Selectors hide/show transition */
.toolbar-selectors-enter-active,
.toolbar-selectors-leave-active {
  transition:
    opacity var(--duration-md, 200ms) var(--ease-standard),
    transform var(--duration-md, 200ms) var(--ease-standard);
}

.toolbar-selectors-enter-from,
.toolbar-selectors-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

/* Search expand/collapse transition */
.toolbar-search-enter-active,
.toolbar-search-leave-active {
  transition:
    opacity var(--duration-sm, 140ms) var(--ease-standard),
    transform var(--duration-sm, 140ms) var(--ease-standard);
}

.toolbar-search-enter-from,
.toolbar-search-leave-to {
  opacity: 0;
  transform: scaleX(0.88) translateX(8px);
  transform-origin: right center;
}

.content-copy-swap-enter-active,
.content-copy-swap-leave-active {
  transition:
    opacity var(--duration-md) var(--ease-standard),
    transform var(--duration-lg) var(--ease-emphasized-decelerate),
    filter var(--duration-md) var(--ease-standard);
  will-change: opacity, transform, filter;
}

.content-copy-swap-enter-from,
.content-copy-swap-leave-to {
  opacity: 0;
  transform: translateY(8px);
  filter: blur(8px);
}

.content-copy-swap-enter-to,
.content-copy-swap-leave-from {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}

.song-row-wrap {
  position: relative;
}

.song-row-shell {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 32px 32px;
  align-items: center;
  gap: var(--space-1);
}

.song-row-favorite,
.song-row-more {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.song-row-favorite {
  opacity: 0.72;
}

.song-row-more {
  opacity: 0.46;
}

.song-row-favorite.is-active {
  color: var(--of-like-button-text-active, var(--color-favorite-active, #2d5248));
  opacity: 1;
}

.song-row-favorite.is-active svg {
  fill: currentColor;
}

.song-row-shell:hover .song-row-favorite,
.song-row-shell:hover .song-row-more,
.song-row-favorite:focus,
.song-row-more:focus {
  opacity: 1;
}

.song-row-favorite:hover,
.song-row-more:hover {
  background: var(--state-layer-hover);
}
</style>
