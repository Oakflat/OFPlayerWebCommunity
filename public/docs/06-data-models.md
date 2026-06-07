# 数据模型

## 模型设计原则

1. **工厂函数** - 使用 `create*Model()` 函数创建标准化对象
2. **数据规范化** - 自动规范化输入数据（类型转换、默认值）
3. **不可变性** - 模型对象是普通对象，修改时创建新对象
4. **ID 生成** - 使用 `crypto.randomUUID()` 或降级方案

## 核心模型

### Library (库)

**位置**: `src/models/library.js`

**字段**:

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `id` | `string` | 自动生成 | 唯一标识（格式: `library-{uuid}`） |
| `name` | `string` | `''` | 库名称 |
| `order` | `number` | `0` | 排序顺序 |
| `isDefault` | `boolean` | `false` | 是否为默认库 |
| `source` | `object` | 见下文 | 数据源信息 |
| `createdAt` | `string` | 当前时间 | 创建时间（ISO） |
| `updatedAt` | `string` | 当前时间 | 更新时间（ISO） |

**source 字段**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `kind` | `'local' \| 'external'` | 数据源类型 |
| `provider` | `string` | 提供者（如 `'webdav'`、`'subsonic'`） |
| `connectionId` | `string` | 连接 ID |
| `remoteId` | `string` | 远程 ID |
| `rootPath` | `string` | 根路径 |

**工厂函数**:

```javascript
import { createLibraryModel, createDefaultLibraryModel } from '../models/library'

// 创建普通库
const library = createLibraryModel({ name: 'My Music' })

// 创建默认库
const defaultLibrary = createDefaultLibraryModel({ name: 'Local Library' })
```

**常量**:

```javascript
DEFAULT_LIBRARY_ID = 'library-default'
```

---

### Playlist (播放列表)

**位置**: `src/models/playlist.js`

**字段**:

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `id` | `string` | 自动生成 | 唯一标识（格式: `playlist-{uuid}`） |
| `libraryId` | `string` | `''` | 所属库 ID |
| `name` | `string` | `''` | 播放列表名称 |
| `order` | `number` | `0` | 排序顺序 |
| `kind` | `'system' \| 'user'` | `'user'` | 类型 |
| `systemKey` | `string \| null` | `null` | 系统播放列表标识 |
| `createdAt` | `string` | 当前时间 | 创建时间（ISO） |
| `updatedAt` | `string` | 当前时间 | 更新时间（ISO） |

**播放列表类型**:

```javascript
PLAYLIST_KINDS = {
  SYSTEM: 'system',  // 系统播放列表（不可删除、不可重命名）
  USER: 'user',      // 用户播放列表
}
```

**系统播放列表标识**:

```javascript
SYSTEM_PLAYLIST_KEYS = {
  ALL_TRACKS: 'all-tracks',  // 所有曲目
}
```

**工厂函数**:

```javascript
import { 
  createPlaylistModel, 
  createDefaultAllTracksPlaylistModel,
  isSystemPlaylist 
} from '../models/playlist'

// 创建用户播放列表
const playlist = createPlaylistModel({
  libraryId: 'library-xxx',
  name: 'Favorites',
  kind: 'user',
})

// 创建默认"所有曲目"播放列表
const allTracks = createDefaultAllTracksPlaylistModel({
  libraryId: 'library-xxx',
})

// 检查是否为系统播放列表
isSystemPlaylist(playlist)  // false
isSystemPlaylist(allTracks) // true
```

---

### Track (曲目)

**位置**: `src/models/track.js`

**字段**:

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `id` | `string` | 自动生成 | 唯一标识（UUID） |
| `libraryId` | `string` | `''` | 所属库 ID |
| `libraryOrder` | `number` | `0` | 库内排序 |
| `isFavorite` | `boolean` | `false` | 是否收藏 |
| `title` | `string` | 从文件名提取 | 标题 |
| `artist` | `string` | `''` | 艺术家 |
| `albumArtist` | `string` | `''` | 专辑艺术家 |
| `album` | `string` | `''` | 专辑 |
| `genre` | `string` | `''` | 流派 |
| `year` | `number` | `0` | 年份 |
| `trackNumber` | `number` | `0` | 曲目号 |
| `trackTotal` | `number` | `0` | 总曲目数 |
| `discNumber` | `number` | `0` | 碟号 |
| `discTotal` | `number` | `0` | 总碟数 |
| `composer` | `string` | `''` | 作曲家 |
| `lyricist` | `string` | `''` | 作词 |
| `comment` | `string` | `''` | 备注 |
| `displayTitle` | `string` | 自动生成 | 显示标题（标题 - 艺术家） |
| `fileName` | `string` | `''` | 文件名 |
| `fileSize` | `number` | `0` | 文件大小（字节） |
| `size` | `number` | `0` | 文件大小（同 fileSize） |
| `duration` | `number` | `0` | 时长（秒） |
| `format` | `string` | 从文件名提取 | 文件格式 |
| `bitrate` | `number` | `0` | 比特率 |
| `sampleRate` | `number` | `0` | 采样率 |
| `bitDepth` | `number` | `0` | 位深度 |
| `artwork` | `string` | `''` | 封面（Base64） |
| `mimeType` | `string` | `''` | MIME 类型 |
| `importedAt` | `string` | 当前时间 | 导入时间（ISO） |
| `metadataVersion` | `number` | `0` | 元数据版本 |
| `source` | `object` | 见下文 | 数据源信息 |
| `file` | `File \| null` | `null` | 原始文件对象（运行时） |

**source 字段**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `kind` | `string` | 源类型（`'object-url'`、`'external-url'`、`'unavailable'`） |
| `url` | `string` | 可播放 URL |
| `provider` | `string` | 提供者 |
| `connectionId` | `string` | 连接 ID |
| `remoteId` | `string` | 远程 ID |
| `remoteKey` | `string` | 远程键 |
| `path` | `string` | 路径 |
| `originPath` | `string` | 原始路径 |
| `contentType` | `string` | 内容类型 |
| `etag` | `string` | ETag |
| `persistUrl` | `boolean` | 是否持久化 URL |

**支持的音频格式**:

```javascript
SUPPORTED_AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'])
```

**工厂函数**:

```javascript
import { 
  createTrackModel,
  createPersistedTrackModel,
  createRuntimeTrackFromPersistedTrack,
  createPersistableTrackMetadata,
  isSupportedAudioFile,
  isPlayableTrack,
  updateTrackModel,
  revokeTrackResource,
} from '../models/track'

// 从文件创建曲目
const track = createTrackModel(file, {
  libraryId: 'library-xxx',
  title: 'Song Title',
  artist: 'Artist Name',
})

// 从持久化记录创建运行时曲目
const runtimeTrack = createRuntimeTrackFromPersistedTrack(persistedRecord)

// 创建可持久化的元数据（不含 Blob）
const metadata = createPersistableTrackMetadata(track)

// 检查是否为支持的音频文件
isSupportedAudioFile(file) // true/false

// 检查曲目是否可播放
isPlayableTrack(track) // true/false

// 更新曲目
const updatedTrack = updateTrackModel(track, { title: 'New Title' })

// 释放资源（Object URL）
revokeTrackResource(track)
```

**显示标题生成规则**:

```javascript
function createDisplayTitle({ title, artist, fileName }) {
  const safeTitle = normalizeText(title, sanitizeTrackTitle(fileName))
  const safeArtist = normalizeText(artist)
  return safeArtist ? `${safeTitle} - ${safeArtist}` : safeTitle
}
```

---

### Collection (集合)

**位置**: `src/models/collection.js`

**说明**: Collection 是一个抽象概念，用于统一表示播放列表和智能视图。

**集合类型**:

| 类型 | 说明 | 示例 |
|------|------|------|
| `playlist` | 播放列表 | `playlist:{playlistId}` |
| `view` | 智能视图 | `view:all-favorites` |

**引用格式**:

```javascript
// 播放列表引用
'playlist:{playlistId}'

// 智能视图引用
'view:{viewKey}'
```

**智能视图键**:

```javascript
SMART_VIEW_KEYS = {
  ALL_TRACKS: 'all-tracks',
  RECENT_IMPORTS: 'recent-imports',
  ALL_PLAYS: 'all-plays',
  ALL_FAVORITES: 'all-favorites',
  CURRENT_QUEUE: 'current-queue',
  ALBUMS: 'albums',
  ARTISTS: 'artists',
}
```

**工具函数**:

```javascript
import { 
  parseCollectionRef,
  createPlaylistCollectionRef,
  createViewCollectionRef,
  SMART_VIEW_KEYS 
} from '../models/collection'

// 解析集合引用
const { type, value } = parseCollectionRef('playlist:xxx')
// { type: 'playlist', value: 'xxx' }

const { type, value } = parseCollectionRef('view:all-favorites')
// { type: 'view', value: 'all-favorites' }

// 创建引用
createPlaylistCollectionRef('playlist-xxx') // 'playlist:playlist-xxx'
createViewCollectionRef('all-favorites')    // 'view:all-favorites'
```

---

### Playback (播放状态)

**位置**: `src/models/playback.js`

**说明**: 定义播放状态的形状

---

### PlaybackHistory (播放历史)

**位置**: `src/models/playbackHistory.js`

**字段**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `trackId` | `string` | 曲目 ID |
| `type` | `string` | 历史类型 |
| `position` | `number` | 播放位置 |
| `duration` | `number` | 曲目时长 |
| `recordedAt` | `string` | 记录时间（ISO） |

**历史类型**:

```javascript
PLAYBACK_HISTORY_TYPES = {
  PLAYED: 'played',   // 开始播放
  PAUSED: 'paused',   // 暂停
  ENDED: 'ended',     // 播放结束
}
```

**工厂函数**:

```javascript
import { createPlaybackHistoryEntryModel } from '../models/playbackHistory'

const entry = createPlaybackHistoryEntryModel({
  trackId: 'track-xxx',
  type: 'played',
  position: 30,
  duration: 180,
})
```

---

### Preferences (偏好设置)

**位置**: `src/models/preferences.js`

**字段**:

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `volume` | `number` | `0.8` | 音量 |
| `rememberVolume` | `boolean` | `false` | 记住音量 |
| `language` | `string` | `'zh-CN'` | 语言 |
| `theme` | `string` | `'mist'` | 主题 |
| `colorScheme` | `string` | `'system'` | 颜色方案 |
| `motion` | `string` | `'full'` | 动画级别 |
| `showTechnicalMetadata` | `boolean` | `true` | 显示技术元数据 |
| `librarySearchQuery` | `string` | `''` | 搜索查询 |
| `librarySortOption` | `string` | `'recent'` | 排序选项 |
| `libraryTypeFilter` | `string` | `'all'` | 类型过滤 |
| `activeLibrary` | `string` | `null` | 当前活跃库 |
| `activeCollection` | `string` | `null` | 当前活跃集合 |
| `sidebarSection` | `string` | `null` | 侧边栏展开部分 |
| `dataDriver` | `string` | `'indexeddb'` | 数据驱动 |
| `telemetryEnabled` | `boolean` | `null` | 遥测同意 |

**工厂函数**:

```javascript
import { createPreferencesModel } from '../models/preferences'

const prefs = createPreferencesModel({
  volume: 0.5,
  theme: 'paper',
})
```

---

### Session (会话)

**位置**: `src/models/session.js`

**字段**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `queueTrackIds` | `string[]` | 队列中的曲目 ID |
| `currentTrackId` | `string \| null` | 当前曲目 ID |

---

### ExternalLibrary (外部库)

**位置**: `src/models/externalLibrary.js`

**字段**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 连接 ID |
| `type` | `string` | 连接类型（`'webdav'`、`'subsonic'`） |
| `name` | `string` | 连接名称 |
| `url` | `string` | 服务器 URL |
| `username` | `string` | 用户名 |
| `password` | `string` | 密码 |
| `libraryId` | `string` | 关联的库 ID |

---

### PlaylistTrackRelation (播放列表-曲目关系)

**位置**: `src/models/playlistTrackRelation.js`

**字段**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 关系 ID |
| `playlistId` | `string` | 播放列表 ID |
| `trackId` | `string` | 曲目 ID |
| `order` | `number` | 排序顺序 |

---

### LibraryNavigation (库导航)

**位置**: `src/models/libraryNavigation.js`

**说明**: 定义导航摘要的形状，用于侧边栏显示

## 模型使用最佳实践

### 1. 始终使用工厂函数

```javascript
// ✓ 正确 - 使用工厂函数
const track = createTrackModel(file, { libraryId })

// ✗ 错误 - 手动创建对象
const track = {
  id: generateId(),
  libraryId,
  // ...可能遗漏字段
}
```

### 2. 处理可选字段

```javascript
// ✓ 正确 - 工厂函数会处理 undefined
const track = createTrackModel(file, {
  title: metadata.title,  // 可能是 undefined
})

// ✗ 错误 - 不检查 undefined
const track = {
  title: metadata.title,  // 可能是 undefined，导致问题
}
```

### 3. 区分运行时和持久化模型

```javascript
// 运行时模型（包含 Object URL）
const runtimeTrack = createTrackModel(file)

// 持久化模型（不含 Object URL，包含 Blob）
const persistedTrack = createPersistedTrackModel(track)

// 可持久化的元数据（不含 Blob）
const metadata = createPersistableTrackMetadata(track)
```

### 4. 释放资源

```javascript
// 释放 Object URL
revokeTrackResource(track)

// 批量释放
tracks.forEach(revokeTrackResource)
```
