<script setup>
import {
  Plus,
  MoreHorizontal,
  Disc3,
  Disc2,
  HardDriveDownload,
  Heart,
  History,
  Library,
  ListMusic,
  Settings2,
  Users,
} from 'lucide-vue-next'
import { ref, computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import { parseCollectionRef } from '../models/collection'
import MenuDropdown from './MenuDropdown.vue'
import DialogModal from './DialogModal.vue'

const props = defineProps({
  libraries: {
    type: Array,
    default: () => [],
  },
  playlists: {
    type: Array,
    default: () => [],
  },
  smartCollections: {
    type: Array,
    default: () => [],
  },
  activeLibrary: {
    type: String,
    default: 'local',
  },
  activeCollection: {
    type: String,
    default: 'all-tracks',
  },
  multiSourceGateState: {
    type: String,
    default: 'enabled',
    validator: (v) => ['enabled', 'preview', 'soft_locked', 'hard_locked'].includes(v),
  },
})

const emit = defineEmits([
  'import-files',
  'set-active-library',
  'set-active-collection',
  'open-settings',
  'create-library',
  'rename-library',
  'delete-library',
  'create-playlist',
  'rename-playlist',
  'delete-playlist',
  'open-external-library',
  'sync-external-library',
])

const showMultiSourceNotice = computed(() => false)

const { t } = useI18n()

const libraryActionsMenuItems = computed(() => [
  { key: 'create-library', label: t('sidebar.dialogs.newLibraryTitle') },
  { key: 'connect-external-library', label: t('sidebar.connectExternalLibrary') },
])

const iconByKey = {
  'all-tracks': ListMusic,
  'recent-imports': HardDriveDownload,
  'all-plays': History,
  'all-favorites': Heart,
  'current-queue': Disc3,
  albums: Disc2,
  artists: Users,
}

// 菜单状态
const openMenuKey = ref(null)
const menuAnchorEl = ref(null)
const dialogState = ref({
  isOpen: false,
  type: null,
  title: '',
  message: '',
  inputValue: '',
  isDanger: false,
  onConfirm: () => {},
})

function resolveItemIcon(item) {
  if (item?.isExternal) {
    return Library
  }

  if (item?.isDefault) {
    return Library
  }

  const iconKey = item?.systemKey ?? item?.id ?? item?.key
  return iconByKey[iconKey] ?? ListMusic
}

function handleImport(event) {
  const files = Array.from(event.target.files ?? [])

  if (files.length > 0) {
    emit('import-files', files)
  }

  event.target.value = ''
}

// 判断是否为默认库（不可删除）
function isDefaultLibrary(item) {
  return Boolean(item?.isDefault)
}

// 判断是否为系统歌单（不可删除、不可重命名）
function isSystemCollection(item) {
  return item?.playlistKind === 'system' || Boolean(item?.systemKey)
}

// 获取库菜单项
function getLibraryMenuItems(item) {
  const items = []

  if (item?.isExternal) {
    items.push({ key: 'sync', label: t('sidebar.actions.syncLibrary') })
  }

  items.push({ key: 'rename', label: t('sidebar.actions.rename') })

  if (!isDefaultLibrary(item)) {
    items.push({ key: 'delete', label: t('sidebar.actions.deleteLibrary') })
  } else {
    items.push({ key: 'delete', label: t('sidebar.actions.deleteLibrary'), disabled: true })
  }

  return items
}

// 获取歌单菜单项
function getPlaylistMenuItems(item) {
  if (isSystemCollection(item)) {
    return [
      { key: 'rename', label: t('sidebar.actions.rename'), disabled: true },
      { key: 'delete', label: t('sidebar.actions.deletePlaylist'), disabled: true },
    ]
  }

  return [
    { key: 'rename', label: t('sidebar.actions.rename') },
    { key: 'delete', label: t('sidebar.actions.deletePlaylist') },
  ]
}

// 菜单操作
function toggleMenu(key, event) {
  if (openMenuKey.value === key) {
    closeMenu()
    return
  }

  openMenuKey.value = key
  menuAnchorEl.value = event?.currentTarget ?? null
}

function closeMenu() {
  openMenuKey.value = null
  menuAnchorEl.value = null
}

function handleLibraryActionsSelect(action) {
  closeMenu()
  if (action.key === 'create-library') {
    openCreateLibraryDialog()
  } else if (action.key === 'connect-external-library') {
    emit('open-external-library')
  }
}

function handleLibraryMenuSelect(item, action) {
  closeMenu()

  if (action.key === 'sync') {
    emit('sync-external-library', item.key)
  } else if (action.key === 'rename') {
    openRenameLibraryDialog(item)
  } else if (action.key === 'delete') {
    openDeleteLibraryDialog(item)
  }
}

function handlePlaylistMenuSelect(item, action) {
  closeMenu()

  if (action.key === 'rename') {
    openRenamePlaylistDialog(item)
  } else if (action.key === 'delete') {
    openDeletePlaylistDialog(item)
  }
}

// 对话框操作
function openCreateLibraryDialog() {
  dialogState.value = {
    isOpen: true,
    type: 'create-library',
    title: t('sidebar.dialogs.newLibraryTitle'),
    message: '',
    inputValue: '',
    inputLabel: t('sidebar.dialogs.newLibraryInput'),
    showInput: true,
    isDanger: false,
    confirmLabel: t('sidebar.dialogs.confirm'),
    cancelLabel: t('sidebar.dialogs.cancel'),
    hint: '',
    hintLinkLabel: '',
    hintRoute: '',
    onConfirm: (name) => {
      if (name.trim()) {
        emit('create-library', name.trim())
      }
    },
  }
}

function openRenameLibraryDialog(item) {
  dialogState.value = {
    isOpen: true,
    type: 'rename-library',
    title: t('sidebar.dialogs.renameLibraryTitle'),
    message: '',
    inputValue: item.label,
    inputLabel: '',
    showInput: true,
    isDanger: false,
    confirmLabel: t('sidebar.dialogs.confirm'),
    cancelLabel: t('sidebar.dialogs.cancel'),
    hint: '',
    hintLinkLabel: '',
    hintRoute: '',
    onConfirm: (name) => {
      if (name.trim()) {
        emit('rename-library', item.key, name.trim())
      }
    },
  }
}

function openDeleteLibraryDialog(item) {
  dialogState.value = {
    isOpen: true,
    type: 'delete-library',
    title: t('sidebar.actions.deleteLibrary'),
    message: t('sidebar.dialogs.deleteLibraryConfirm'),
    inputValue: '',
    showInput: false,
    isDanger: true,
    confirmLabel: t('sidebar.dialogs.confirm'),
    cancelLabel: t('sidebar.dialogs.cancel'),
    hint: '',
    hintLinkLabel: '',
    hintRoute: '',
    onConfirm: () => {
      emit('delete-library', item.key)
    },
  }
}

function openCreatePlaylistDialog() {
  dialogState.value = {
    isOpen: true,
    type: 'create-playlist',
    title: t('sidebar.dialogs.newPlaylistTitle'),
    message: '',
    inputValue: '',
    inputLabel: t('sidebar.dialogs.newPlaylistInput'),
    showInput: true,
    isDanger: false,
    confirmLabel: t('sidebar.dialogs.confirm'),
    cancelLabel: t('sidebar.dialogs.cancel'),
    hint: '',
    hintLinkLabel: '',
    hintRoute: '',
    onConfirm: (name) => {
      if (name.trim()) {
        emit('create-playlist', name.trim())
      }
    },
  }
}

function openRenamePlaylistDialog(item) {
  const parsed = parseCollectionRef(item.key)
  const playlistId = parsed.value

  dialogState.value = {
    isOpen: true,
    type: 'rename-playlist',
    title: t('sidebar.dialogs.renamePlaylistTitle'),
    message: '',
    inputValue: item.label,
    inputLabel: '',
    showInput: true,
    isDanger: false,
    confirmLabel: t('sidebar.dialogs.confirm'),
    cancelLabel: t('sidebar.dialogs.cancel'),
    hint: '',
    hintLinkLabel: '',
    hintRoute: '',
    onConfirm: (name) => {
      if (name.trim()) {
        emit('rename-playlist', playlistId, name.trim())
      }
    },
  }
}

function openDeletePlaylistDialog(item) {
  const parsed = parseCollectionRef(item.key)
  const playlistId = parsed.value

  dialogState.value = {
    isOpen: true,
    type: 'delete-playlist',
    title: t('sidebar.actions.deletePlaylist'),
    message: t('sidebar.dialogs.deletePlaylistConfirm'),
    inputValue: '',
    showInput: false,
    isDanger: true,
    confirmLabel: t('sidebar.dialogs.confirm'),
    cancelLabel: t('sidebar.dialogs.cancel'),
    hint: '',
    hintLinkLabel: '',
    hintRoute: '',
    onConfirm: () => {
      emit('delete-playlist', playlistId)
    },
  }
}

function handleDialogConfirm(value) {
  dialogState.value.onConfirm(value)
  closeDialog()
}

function closeDialog() {
  dialogState.value.isOpen = false
}
</script>

<template>
  <aside class="panel panel-sidebar">
    <div class="sidebar-nav-head">
      <p class="eyebrow">{{ t('sidebar.navigationEyebrow') }}</p>
      <h1>{{ t('sidebar.navigationTitle') }}</h1>
    </div>

    <div class="sidebar-nav-stack">
      <section
        class="sidebar-group sidebar-selector-panel"
        :aria-label="t('sidebar.librarySection')"
      >
        <div class="sidebar-group-header">
          <p class="sidebar-group-label">{{ t('sidebar.librarySection') }}</p>
          <button
            type="button"
            class="sidebar-group-action"
            :aria-label="t('sidebar.actions.libraryActions')"
            @click.stop="toggleMenu('library-actions', $event)"
          >
            <Plus aria-hidden="true" />
          </button>
          <MenuDropdown
            :is-open="openMenuKey === 'library-actions'"
            :anchor-el="openMenuKey === 'library-actions' ? menuAnchorEl : null"
            :items="libraryActionsMenuItems"
            @close="closeMenu"
            @select="handleLibraryActionsSelect"
          />
        </div>
        <TransitionGroup name="list" tag="div" class="sidebar-selector-list">
          <div
            v-for="item in libraries"
            :key="item.key"
            class="sidebar-selector-item-wrap"
            :class="{ 'is-menu-open': openMenuKey === `library-${item.key}`, 'has-menu': true }"
          >
            <button
              class="sidebar-selector-item"
              :class="{ 'is-active': item.key === activeLibrary }"
              type="button"
              :aria-pressed="item.key === activeLibrary"
              @click="emit('set-active-library', item.key)"
            >
              <component
                :is="resolveItemIcon(item)"
                class="sidebar-selector-icon"
                aria-hidden="true"
              />
              <span class="sidebar-selector-name">{{ item.label }}</span>
              <strong class="sidebar-selector-count">{{ item.count }}</strong>
            </button>
            <button
              type="button"
              class="sidebar-selector-more"
              :class="{ 'is-visible': openMenuKey === `library-${item.key}` }"
              :aria-label="t('sidebar.actions.more')"
              @click.stop="toggleMenu(`library-${item.key}`, $event)"
            >
              <MoreHorizontal aria-hidden="true" />
            </button>
            <MenuDropdown
              :is-open="openMenuKey === `library-${item.key}`"
              :anchor-el="openMenuKey === `library-${item.key}` ? menuAnchorEl : null"
              :items="getLibraryMenuItems(item)"
              @close="closeMenu"
              @select="(action) => handleLibraryMenuSelect(item, action)"
            />
          </div>
        </TransitionGroup>
        <div v-if="showMultiSourceNotice" class="sidebar-gate-notice" aria-hidden="true" />
      </section>

      <section
        class="sidebar-group sidebar-selector-panel"
        :aria-label="t('sidebar.playlistSection')"
      >
        <div class="sidebar-group-header">
          <p class="sidebar-group-label">{{ t('sidebar.playlistSection') }}</p>
          <button
            type="button"
            class="sidebar-group-action"
            :aria-label="t('sidebar.actions.newPlaylist')"
            @click="openCreatePlaylistDialog"
          >
            <Plus aria-hidden="true" />
          </button>
        </div>
        <TransitionGroup name="list" tag="div" class="sidebar-selector-list">
          <div
            v-for="item in playlists"
            :key="item.key"
            class="sidebar-selector-item-wrap"
            :class="{
              'is-menu-open': openMenuKey === `playlist-${item.key}`,
              'has-menu': !isSystemCollection(item),
            }"
          >
            <button
              class="sidebar-selector-item"
              :class="{ 'is-active': item.key === activeCollection }"
              type="button"
              :aria-pressed="item.key === activeCollection"
              @click="emit('set-active-collection', item.key)"
            >
              <component
                :is="resolveItemIcon(item)"
                class="sidebar-selector-icon"
                aria-hidden="true"
              />
              <span class="sidebar-selector-name">{{ item.label }}</span>
              <strong class="sidebar-selector-count">{{ item.count }}</strong>
            </button>
            <button
              v-if="!isSystemCollection(item)"
              type="button"
              class="sidebar-selector-more"
              :class="{ 'is-visible': openMenuKey === `playlist-${item.key}` }"
              :aria-label="t('sidebar.actions.more')"
              @click.stop="toggleMenu(`playlist-${item.key}`, $event)"
            >
              <MoreHorizontal aria-hidden="true" />
            </button>
            <MenuDropdown
              v-if="!isSystemCollection(item)"
              :is-open="openMenuKey === `playlist-${item.key}`"
              :anchor-el="openMenuKey === `playlist-${item.key}` ? menuAnchorEl : null"
              :items="getPlaylistMenuItems(item)"
              @close="closeMenu"
              @select="(action) => handlePlaylistMenuSelect(item, action)"
            />
          </div>
        </TransitionGroup>
      </section>

      <section
        class="sidebar-group sidebar-selector-panel"
        :aria-label="t('sidebar.smartCollectionSection')"
      >
        <p class="sidebar-group-label">{{ t('sidebar.smartCollectionSection') }}</p>
        <TransitionGroup name="list" tag="div" class="sidebar-selector-list">
          <button
            v-for="item in smartCollections"
            :key="item.key"
            class="sidebar-selector-item"
            :class="{ 'is-active': item.key === activeCollection }"
            type="button"
            :aria-pressed="item.key === activeCollection"
            @click="emit('set-active-collection', item.key)"
          >
            <component
              :is="resolveItemIcon(item)"
              class="sidebar-selector-icon"
              aria-hidden="true"
            />
            <span class="sidebar-selector-name">{{ item.label }}</span>
            <strong class="sidebar-selector-count">{{ item.count }}</strong>
          </button>
        </TransitionGroup>
      </section>
    </div>

    <div class="sidebar-actions">
      <label class="sidebar-action" for="sidebar-audio-import">
        <span class="sidebar-settings-icon-wrap" aria-hidden="true">
          <HardDriveDownload class="sidebar-settings-icon" />
        </span>
        <span class="sidebar-settings-name">{{ t('sidebar.importAudio') }}</span>
      </label>
      <input
        id="sidebar-audio-import"
        class="sr-only"
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac"
        multiple
        @change="handleImport"
      />

      <div class="sidebar-divider" aria-hidden="true" />

      <button class="sidebar-settings" type="button" @click="emit('open-settings')">
        <span class="sidebar-settings-icon-wrap" aria-hidden="true">
          <Settings2 class="sidebar-settings-icon" />
        </span>
        <span class="sidebar-settings-name">{{ t('sidebar.settings') }}</span>
      </button>
    </div>

    <DialogModal
      :is-open="dialogState.isOpen"
      :title="dialogState.title"
      :message="dialogState.message"
      :input-label="dialogState.inputLabel"
      :input-value="dialogState.inputValue"
      :show-input="dialogState.showInput"
      :is-danger="dialogState.isDanger"
      :confirm-label="dialogState.confirmLabel"
      :cancel-label="dialogState.cancelLabel"
      :hint="dialogState.hint"
      :hint-link-label="dialogState.hintLinkLabel"
      :hint-route="dialogState.hintRoute"
      @close="closeDialog"
      @confirm="handleDialogConfirm"
    />
  </aside>
</template>

<style scoped>
.sidebar-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: 0 0.375rem;
  margin-bottom: 0.25rem;
}

.sidebar-group-action {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
  opacity: 0;
}

.sidebar-group-header:hover .sidebar-group-action,
.sidebar-group-action:focus {
  opacity: 1;
}

.sidebar-group-action:hover {
  background: var(--state-layer-hover);
  color: var(--ink);
}

.sidebar-group-action svg {
  width: 16px;
  height: 16px;
}

.sidebar-selector-item-wrap {
  position: relative;
}

.sidebar-selector-item-wrap.has-menu .sidebar-selector-item {
  padding-inline-end: 2.625rem;
}

.sidebar-selector-more {
  display: grid;
  place-items: center;
  position: absolute;
  top: 50%;
  right: 0.625rem;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
  transform: translateY(-50%);
  opacity: 0;
  z-index: 3;
}

.sidebar-selector-item-wrap:hover .sidebar-selector-more,
.sidebar-selector-item-wrap.is-menu-open .sidebar-selector-more,
.sidebar-selector-more:focus,
.sidebar-selector-more.is-visible {
  opacity: 1;
}

.sidebar-selector-more:hover {
  background: var(--state-layer-hover);
  color: var(--ink);
}

.sidebar-selector-more svg {
  width: 16px;
  height: 16px;
}

.sidebar-divider {
  height: 1px;
  background: var(--line);
  margin: var(--space-1) 0;
  border-radius: 1px;
}

.sidebar-action--link {
  text-decoration: none;
  color: inherit;
}

.sidebar-action--accent .sidebar-settings-name {
  color: var(--primary);
  font-weight: var(--font-weight-medium);
}

.sidebar-action--accent .sidebar-settings-icon-wrap {
  color: var(--primary);
}

.sidebar-gate-notice {
  margin: var(--space-2) 0.375rem 0;
}
</style>
