# 服务层

## 服务层概览

服务层实现了 OFPlayer 的核心业务逻辑，位于状态层和数据层之间。每个服务专注于特定领域的操作，通过工厂函数创建并注入依赖。

## 服务列表

### libraryService

**位置**: `src/services/libraryService.js`

**职责**: 管理库（Library）的 CRUD 操作

**依赖**:
- `dataService` - 数据访问层

**方法**:

```javascript
// 加载目录（库、播放列表、曲目、关系）
loadCatalog()

// 列出所有库
listLibraries()

// 创建库
// 返回: { library, defaultPlaylist }
createLibrary(input)

// 重命名库
renameLibrary(libraryId, name)

// 删除库
// 返回: { deletedLibraryId, deletedPlaylistIds, deletedTrackIds, deletedRelationIds, fallbackLibraryId }
deleteLibrary(libraryId)

// 重新排序库
reorderLibraries(orderedLibraryIds)
```

**创建库流程**:

```javascript
async function createLibrary(input = {}) {
  // 1. 规范化名称
  const normalizedName = normalizeEntityName(name, 'Library')
  
  // 2. 创建库模型
  const library = createLibraryModel({
    name: normalizedName,
    order: libraries.length,
    source,
  })
  
  // 3. 创建默认播放列表（系统播放列表：所有曲目）
  const defaultPlaylist = createDefaultAllTracksPlaylistModel({
    libraryId: library.id,
    order: 0,
  })
  
  // 4. 持久化
  await Promise.all([
    dataService.catalog.putLibrary(library),
    dataService.catalog.putPlaylist(defaultPlaylist),
  ])
  
  // 5. 失效缓存
  invalidateCatalogCache()
  
  return { library, defaultPlaylist }
}
```

**删除库保护机制**:
- 默认库（`isDefault: true`）不可删除
- 删除库会同时删除其所有播放列表和曲目
- 删除后自动选择第一个可用库作为回退

---

### playlistService

**位置**: `src/services/playlistService.js`

**职责**: 管理播放列表操作和曲目关系

**依赖**:
- `dataService` - 数据访问层

**方法**:

```javascript
// 创建播放列表
createPlaylist({ libraryId, name })

// 重命名播放列表
renamePlaylist(playlistId, name)

// 删除播放列表
deletePlaylist(playlistId)

// 重新排序播放列表
reorderPlaylists(libraryId, orderedPlaylistIds)

// 添加曲目到播放列表
addTrackToPlaylist({ playlistId, trackId, index })

// 从播放列表移除曲目
removeTrackFromPlaylist({ playlistId, trackId })

// 重新排序播放列表中的曲目
reorderPlaylistTracks(playlistId, orderedTrackIds)
```

**播放列表类型**:

| 类型 | 说明 | 可操作性 |
|------|------|----------|
| `system` | 系统播放列表（如"所有曲目"） | 不可重命名、不可删除 |
| `user` | 用户创建的播放列表 | 可重命名、可删除 |

---

### trackService

**位置**: `src/services/trackService.js`

**职责**: 管理曲目导入、元数据提取、资源释放

**依赖**:
- `dataService` - 数据访问层

**方法**:

```javascript
// 导入文件
importFiles({ libraryId, files })

// 更新曲目元数据
updateTrackMetadata(trackId, patch)

// 从库中删除曲目
deleteTrackFromLibrary(trackId)

// 切换收藏状态
toggleFavorite(trackId)

// 设置收藏状态
setFavorite(trackId, isFavorite)

// 释放曲目资源（Object URL）
releaseTracks(tracks)
```

**导入流程**:

```javascript
async function importFiles({ libraryId, files }) {
  const importedTracks = []
  
  for (const file of files) {
    // 1. 检查文件类型
    if (!isSupportedAudioFile(file)) continue
    
    // 2. 提取元数据
    const metadata = await extractMetadata(file)
    
    // 3. 创建曲目模型
    const track = createTrackModel(file, {
      libraryId,
      ...metadata,
    })
    
    // 4. 持久化
    await dataService.catalog.putTrack(track)
    
    // 5. 添加到默认播放列表
    const defaultPlaylist = getDefaultPlaylistForLibrary(libraryId)
    if (defaultPlaylist) {
      await addTrackToPlaylist({
        playlistId: defaultPlaylist.id,
        trackId: track.id,
      })
    }
    
    importedTracks.push(track)
  }
  
  return importedTracks
}
```

**支持的音频格式**:

```javascript
const SUPPORTED_AUDIO_EXTENSIONS = new Set([
  'mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'
])
```

---

### metadataService

**位置**: `src/services/metadataService.js`

**职责**: 提取音频文件的元数据

**依赖**:
- `music-metadata` - 音频元数据解析库

**方法**:

```javascript
// 提取元数据
extractMetadata(file)

// 创建元数据显示项
createTrackMetaItems(track, options)
```

**提取的元数据字段**:

| 字段 | 说明 |
|------|------|
| `title` | 标题 |
| `artist` | 艺术家 |
| `albumArtist` | 专辑艺术家 |
| `album` | 专辑 |
| `genre` | 流派 |
| `year` | 年份 |
| `trackNumber` | 曲目号 |
| `trackTotal` | 总曲目数 |
| `discNumber` | 碟号 |
| `discTotal` | 总碟数 |
| `composer` | 作曲家 |
| `lyricist` | 作词 |
| `comment` | 备注 |
| `duration` | 时长 |
| `bitrate` | 比特率 |
| `sampleRate` | 采样率 |
| `bitDepth` | 位深度 |
| `artwork` | 封面（Base64） |

---

### externalLibraryService

**位置**: `src/services/externalLibraryService.js`

**职责**: 管理外部库连接（WebDAV、Subsonic）

**依赖**:
- `dataService` - 数据访问层
- `libraryService` - 库服务

**方法**:

```javascript
// 连接外部库
connectLibrary({ connection })

// 同步外部库
syncLibrary({ libraryId })

// 解析可播放曲目
resolvePlayableTrack(track)

// 释放可播放曲目资源
releasePlayableTrack(track)
```

**外部连接类型**:

| 类型 | 说明 |
|------|------|
| `webdav` | WebDAV 服务器 |
| `subsonic` | Subsonic 兼容服务器 |

---

### albumViewService

**位置**: `src/services/albumViewService.js`

**职责**: 处理专辑/艺术家浏览视图的逻辑

**方法**:

```javascript
// 获取专辑分组
getAlbumGroups(tracks)

// 获取艺术家分组
getArtistGroups(tracks)
```

---

### lyricsStorage

**位置**: `src/services/lyricsStorage.js`

**职责**: 歌词的持久化存储

**方法**:

```javascript
// 保存歌词
saveLyrics(trackId, lyrics)

// 加载歌词
loadLyrics(trackId)

// 删除歌词
deleteLyrics(trackId)
```

---

### telemetryService

**位置**: `src/services/telemetryService.js`

**职责**: 遥测分析（使用 Umami）

**方法**:

```javascript
// 设置遥测启用状态
setTelemetryEnabled(enabled)

// 追踪播放
trackPlay()

// 追踪暂停
trackPause()

// 追踪定位
trackSeek()

// 追踪跳过下一首
trackSkipNext()

// 追踪跳过上一首
trackSkipPrev()
```

## 数据访问层

### DataService

**位置**: `src/services/data/index.js`

**职责**: 提供统一的数据访问接口，支持多种存储驱动

**创建**:

```javascript
import { createDataService } from '../services/data'

// 使用 IndexedDB（默认）
const dataService = createDataService({ driver: 'indexeddb' })

// 使用 localStorage
const dataService = createDataService({ driver: 'local' })
```

**接口**:

```javascript
dataService = {
  catalog: {
    // 库操作
    putLibrary(library),
    putLibraries(libraries),
    deleteLibrary(libraryId),
    
    // 播放列表操作
    putPlaylist(playlist),
    deletePlaylist(playlistId),
    
    // 曲目操作
    putTrack(track),
    putTracks(tracks),
    deleteTrack(trackId),
    deleteTracks(trackIds),
    
    // 关系操作
    putPlaylistTrackRelation(relation),
    putPlaylistTrackRelations(relations),
    deletePlaylistTrackRelation(relationId),
    deletePlaylistTrackRelations(relationIds),
    
    // 查询
    getAll(),
    getAllTrackAssets(),
    getTrackAssets(trackId),
  },
  
  preferences: {
    load(),
    save(preferences),
  },
  
  session: {
    load(),
    save(session),
  },
  
  history: {
    append(entry),
    loadRecent(limit),
  },
  
  clearAllData(),
}
```

### IndexedDB 实现

**位置**: `src/services/data/indexedDbDataService.js`

**数据库结构**:

| Object Store | 说明 |
|--------------|------|
| `libraries` | 库 |
| `playlists` | 播放列表 |
| `tracks` | 曲目元数据 |
| `trackAssets` | 曲目音频数据（Blob） |
| `playlistTrackRelations` | 播放列表-曲目关系 |
| `preferences` | 偏好设置 |
| `session` | 会话状态 |
| `history` | 播放历史 |

### localStorage 实现

**位置**: `src/services/data/localDataService.js`

**说明**: 作为降级方案，当 IndexedDB 不可用时使用。所有数据存储在 localStorage 中，曲目音频数据以 Base64 编码存储。

## 辅助函数

### catalogHelpers

**位置**: `src/services/catalogHelpers.js`

**方法**:

```javascript
// 断言默认库受保护
assertDefaultLibraryIsProtected(library)

// 规范化实体名称
normalizeEntityName(name, fallback)

// 重新排序实体
reorderEntities(entities, orderedIds)

// 按顺序排序
sortByOrder(items)
```

### catalogState

**位置**: `src/services/catalogState.js`

**职责**: 管理目录缓存

**方法**:

```javascript
// 确保目录已初始化
ensureCatalogInitialized(dataService)

// 失效缓存
invalidateCatalogCache()
```

## 服务使用示例

### 完整的库创建流程

```javascript
// 1. 创建服务
const dataService = createDataService()
const libraryService = createLibraryService({ dataService })
const playlistService = createPlaylistService({ dataService })
const trackService = createTrackService({ dataService })

// 2. 创建库
const { library, defaultPlaylist } = await libraryService.createLibrary('My Music')

// 3. 导入文件
const files = [file1, file2, file3]
const importedTracks = await trackService.importFiles({
  libraryId: library.id,
  files,
})

// 4. 创建用户播放列表
const playlist = await playlistService.createPlaylist({
  libraryId: library.id,
  name: 'Favorites',
})

// 5. 添加曲目到播放列表
await playlistService.addTrackToPlaylist({
  playlistId: playlist.id,
  trackId: importedTracks[0].id,
})
```

### 外部库连接流程

```javascript
// 1. 创建服务
const externalLibraryService = createExternalLibraryService({
  dataService,
  libraryService,
})

// 2. 连接外部库
const connection = {
  type: 'webdav',
  url: 'https://example.com/music',
  username: 'user',
  password: 'pass',
}

const result = await externalLibraryService.connectLibrary({ connection })

// 3. 同步外部库
await externalLibraryService.syncLibrary({ libraryId: result.library.id })

// 4. 解析可播放曲目
const track = libraryStore.getTrackById(trackId)
const playableTrack = await externalLibraryService.resolvePlayableTrack(track)
```

## 最佳实践

### 1. 依赖注入

```javascript
// ✓ 正确 - 通过工厂函数注入依赖
const libraryService = createLibraryService({ dataService })

// ✗ 错误 - 直接导入全局实例
import { dataService } from './data'
```

### 2. 错误处理

```javascript
// ✓ 正确 - 捕获并处理错误
try {
  await libraryService.deleteLibrary(libraryId)
} catch (error) {
  if (error.message === 'Library not found.') {
    // 处理库不存在
  }
}

// ✗ 错误 - 忽略错误
await libraryService.deleteLibrary(libraryId)
```

### 3. 缓存失效

```javascript
// ✓ 正确 - 修改后失效缓存
await dataService.catalog.putLibrary(library)
invalidateCatalogCache()

// ✗ 错误 - 忘记失效缓存
await dataService.catalog.putLibrary(library)
// 下次 loadCatalog() 可能返回旧数据
```
