# 二次开发指南

## 概述

本文档为基于 OFPlayer 进行二次开发的开发者提供指导，包括扩展建议、最佳实践和注意事项。

## 开发前准备

### 环境要求

- Node.js 18+
- npm 9+
- Git

### 快速开始

```bash
# 克隆仓库
git clone <repository-url>
cd ofplayer

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 项目结构理解

```
src/
├── app/ofplayerApp.js    # 应用编排层 - 扩展入口
├── components/           # UI 组件 - 视图扩展
├── composables/          # 逻辑复用 - 功能扩展
├── models/               # 数据模型 - 实体扩展
├── services/             # 业务服务 - 逻辑扩展
├── stores/               # 状态管理 - 状态扩展
├── themes/               # 主题系统 - 外观扩展
└── utils/                # 工具函数 - 通用扩展
```

## 常见扩展场景

### 1. 添加新功能

#### 步骤 1: 定义数据模型

```javascript
// src/models/newFeature.js
export function createNewFeatureModel(overrides = {}) {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name ?? '',
    // ... 其他字段
    createdAt: new Date().toISOString(),
  }
}
```

#### 步骤 2: 创建服务

```javascript
// src/services/newFeatureService.js
export function createNewFeatureService({ dataService }) {
  async function create(input) {
    const model = createNewFeatureModel(input)
    await dataService.newFeatures.put(model)
    return model
  }

  async function getById(id) {
    return dataService.newFeatures.get(id)
  }

  return { create, getById }
}
```

#### 步骤 3: 创建 Store

```javascript
// src/stores/newFeatureStore.js
import { ref } from 'vue'

export function createNewFeatureStore({ newFeatureService }) {
  const items = ref([])

  async function hydrate() {
    items.value = await newFeatureService.list()
  }

  async function create(input) {
    const item = await newFeatureService.create(input)
    items.value = [...items.value, item]
    return item
  }

  return { items, hydrate, create }
}
```

#### 步骤 4: 集成到 ofplayerApp

```javascript
// src/app/ofplayerApp.js
export function createOFPlayerApp(options = {}) {
  // ... 现有代码

  // 添加新功能
  const newFeatureService = createNewFeatureService({ dataService })
  const newFeatureStore = createNewFeatureStore({ newFeatureService })

  // 在 hydrate 中添加
  async function hydrate() {
    await Promise.all([
      // ... 现有 hydrate
      newFeatureStore.hydrate(),
    ])
  }

  return {
    // ... 现有返回值
    newFeatureItems: newFeatureStore.items,
    createNewFeature: newFeatureStore.create,
  }
}
```

#### 步骤 5: 创建组件

```vue
<!-- src/components/NewFeaturePanel.vue -->
<script setup>
import { useOFPlayerApp } from '../app/ofplayerApp'

const props = defineProps({
  // 定义 props
})

const emit = defineEmits([
  // 定义 events
])

const { newFeatureItems, createNewFeature } = useOFPlayerApp()
</script>

<template>
  <!-- 组件模板 -->
</template>
```

### 2. 添加新的智能视图

#### 步骤 1: 定义视图键

```javascript
// src/models/collection.js
export const SMART_VIEW_KEYS = {
  // ... 现有键
  MY_CUSTOM_VIEW: 'my-custom-view',
}
```

#### 步骤 2: 实现视图逻辑

```javascript
// src/services/customViewService.js
export function getCustomViewTracks(tracks) {
  // 自定义过滤逻辑
  return tracks.filter(track => /* 条件 */)
}
```

#### 步骤 3: 注册到导航

```javascript
// 在 PlayerPage.vue 或相关组件中
const smartCollections = computed(() => [
  // ... 现有视图
  {
    key: 'view:my-custom-view',
    label: 'My Custom View',
    count: customViewTracks.value.length,
  },
])
```

### 3. 添加新的数据源

#### 步骤 1: 创建适配器

```javascript
// src/services/externalLibraryAdapters.js
export function createMyAdapter({ connection }) {
  async function listFiles() {
    // 实现文件列表获取
  }

  async function getFileContent(fileId) {
    // 实现文件内容获取
  }

  return { listFiles, getFileContent }
}
```

#### 步骤 2: 注册适配器

```javascript
// src/services/externalLibraryAdapters.js
const adapters = {
  webdav: createWebDavAdapter,
  subsonic: createSubsonicAdapter,
  mysource: createMyAdapter,  // 添加
}
```

#### 步骤 3: 更新 UI

```vue
<!-- src/components/LibraryPanel.vue -->
<script setup>
const connectionTypes = [
  { value: 'webdav', label: 'WebDAV' },
  { value: 'subsonic', label: 'Subsonic' },
  { value: 'mysource', label: 'My Source' },  // 添加
]
</script>
```

### 4. 自定义播放器行为

#### 修改播放结束行为

```javascript
// src/app/ofplayerApp.js
const playerStore = createPlayerStore({
  // ... 其他配置
  onTrackEnded: () => {
    // 自定义行为
    if (/* 单曲循环 */) {
      playerStore.seek(0)
      playerStore.play()
      return
    }
    
    // 默认行为：播放下一首
    playNext()
  },
})
```

#### 添加均衡器

```javascript
// src/composables/useAudioPlayer.js
export function useAudioPlayer(options) {
  // ... 现有代码

  // 添加均衡器
  const audioContext = new AudioContext()
  const source = audioContext.createMediaElementSource(audioElement)
  const equalizer = audioContext.createBiquadFilter()

  source.connect(equalizer)
  equalizer.connect(audioContext.destination)

  function setEqualizerBand(frequency, gain) {
    equalizer.frequency.value = frequency
    equalizer.gain.value = gain
  }

  return {
    // ... 现有返回值
    setEqualizerBand,
  }
}
```

### 5. 添加歌词功能

#### 步骤 1: 创建歌词服务

```javascript
// src/services/lyricsService.js
export function createLyricsService({ dataService }) {
  async function fetchLyrics(track) {
    // 从本地文件或在线获取歌词
  }

  async function saveLyrics(trackId, lyrics) {
    await dataService.lyrics.put({ trackId, lyrics })
  }

  return { fetchLyrics, saveLyrics }
}
```

#### 步骤 2: 创建歌词 Composable

```javascript
// src/composables/useLyrics.js
import { ref, watch } from 'vue'

export function useLyrics({ currentTrack, lyricsService }) {
  const lyrics = ref(null)
  const currentLine = ref(null)

  watch(currentTrack, async (track) => {
    if (track) {
      lyrics.value = await lyricsService.fetchLyrics(track)
    }
  })

  function syncWithTime(currentTime) {
    // 同步歌词与播放时间
  }

  return { lyrics, currentLine, syncWithTime }
}
```

### 6. 添加主题

参考 [主题系统](./08-theming.md) 文档。

```css
/* src/themes/custom.css */
[data-theme="custom"] {
  --ink: #1a1a1a;
  --surface-page: #f8f8f8;
  --primary: #ff6b6b;
  /* ... */
}
```

## 最佳实践

### 1. 遵循分层架构

```javascript
// ✓ 正确 - 遵循分层
// 1. 模型定义
const track = createTrackModel(file)

// 2. 服务处理
await trackService.import(track)

// 3. Store 更新
libraryStore.addTrack(track)

// 4. 组件响应
// 自动通过响应式更新

// ✗ 错误 - 跨层访问
// 组件直接调用 dataService
await dataService.catalog.putTrack(track)
```

### 2. 使用依赖注入

```javascript
// ✓ 正确 - 通过工厂函数注入
const service = createMyService({ dataService, otherService })

// ✗ 错误 - 直接导入全局实例
import { dataService } from './data'
```

### 3. 保持响应性

```javascript
// ✓ 正确 - 使用 computed
const filteredTracks = computed(() => {
  return tracks.value.filter(t => t.isFavorite)
})

// ✗ 错误 - 非响应式计算
const filteredTracks = tracks.filter(t => t.isFavorite)
```

### 4. 处理异步操作

```javascript
// ✓ 正确 - async/await + 错误处理
async function loadData() {
  try {
    isLoading.value = true
    const data = await service.fetch()
    items.value = data
  } catch (error) {
    console.error('Failed to load:', error)
    showError.value = true
  } finally {
    isLoading.value = false
  }
}

// ✗ 错误 - 忽略错误
async function loadData() {
  items.value = await service.fetch()
}
```

### 5. 释放资源

```javascript
// ✓ 正确 - 组件卸载时释放
onBeforeUnmount(() => {
  // 移除事件监听
  document.removeEventListener('keydown', handler)
  
  // 清理定时器
  clearInterval(timer)
  
  // 释放 Object URL
  URL.revokeObjectURL(url)
})

// ✗ 错误 - 不清理资源
// 可能导致内存泄漏
```

## 注意事项

### 1. 不要破坏现有功能

- 修改前先理解现有逻辑
- 保持向后兼容
- 充分测试

### 2. 保持代码风格一致

```javascript
// 遵循项目现有风格
// - 使用 2 空格缩进
// - 使用单引号
// - 使用尾逗号
// - 使用 const/let 而非 var
```

### 3. 性能考虑

```javascript
// ✓ 正确 - 虚拟列表
<VirtualList :items="largeList" />

// ✓ 正确 - 懒加载
const HeavyComponent = () => import('./HeavyComponent.vue')

// ✓ 正确 - 防抖
const debouncedSearch = debounce(search, 300)

// ✗ 错误 - 大列表直接渲染
<div v-for="item in hugeList">{{ item }}</div>
```

### 4. 数据安全

```javascript
// ✓ 正确 - 验证输入
function createUser(input) {
  if (!input.name || typeof input.name !== 'string') {
    throw new Error('Invalid name')
  }
  // ...
}

// ✗ 错误 - 直接使用输入
function createUser(input) {
  // input.name 可能是 undefined 或恶意数据
}
```

### 5. 错误处理

```javascript
// ✓ 正确 - 完整的错误处理
async function criticalOperation() {
  try {
    await riskyOperation()
  } catch (error) {
    // 记录错误
    console.error('Operation failed:', error)
    
    // 用户提示
    showErrorToast('操作失败，请重试')
    
    // 恢复状态
    isLoading.value = false
  }
}

// ✗ 错误 - 忽略错误
async function criticalOperation() {
  await riskyOperation()  // 可能失败但未处理
}
```

## 调试技巧

### 1. 使用 Vue Devtools

- 安装 Vue Devtools 浏览器扩展
- 查看组件树和状态
- 追踪响应式依赖

### 2. 性能分析

```javascript
// 添加性能标记
performance.mark('operation-start')
await heavyOperation()
performance.mark('operation-end')
performance.measure('operation', 'operation-start', 'operation-end')

// 查看结果
const entries = performance.getEntriesByName('operation')
console.log('Duration:', entries[0].duration)
```

### 3. 状态调试

```javascript
// 在开发环境添加调试信息
if (import.meta.env.DEV) {
  watch(tracks, (newTracks) => {
    console.log('Tracks updated:', newTracks.length)
  }, { deep: true })
}
```

## 测试建议

### 1. 单元测试

```javascript
// 测试模型
describe('createTrackModel', () => {
  it('should create track with defaults', () => {
    const track = createTrackModel()
    expect(track.id).toBeDefined()
    expect(track.title).toBe('')
  })

  it('should use provided values', () => {
    const track = createTrackModel(null, { title: 'Test' })
    expect(track.title).toBe('Test')
  })
})
```

### 2. 集成测试

```javascript
// 测试服务
describe('libraryService', () => {
  it('should create library', async () => {
    const service = createLibraryService({ dataService })
    const result = await service.createLibrary('Test')
    expect(result.library.name).toBe('Test')
  })
})
```

### 3. 组件测试

```javascript
// 测试组件
import { mount } from '@vue/test-utils'

describe('PlayerPanel', () => {
  it('should emit select-track', async () => {
    const wrapper = mount(PlayerPanel, {
      props: { tracks: mockTracks },
    })
    
    await wrapper.find('.song-row').trigger('click')
    expect(wrapper.emitted('select-track')).toBeTruthy()
  })
})
```

## 部署注意事项

### 1. 环境变量

```bash
# .env.example
VITE_TELEMETRY_URL=https://your-umami.example.com
VITE_TELEMETRY_WEBSITE_ID=your-website-id
```

### 2. 构建优化

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue'],
          'music-metadata': ['music-metadata'],
        },
      },
    },
  },
}
```

### 3. 部署检查清单

- [ ] 运行 `npm run build` 无错误
- [ ] 运行 `npm run lint` 无警告
- [ ] 测试所有主要功能
- [ ] 检查浏览器兼容性
- [ ] 验证 PWA 功能（如适用）
- [ ] 测试离线功能

## 获取帮助

- 查看现有文档：`doc/` 目录
- 阅读源代码注释
- 检查 `OPEN_SOURCE_SCOPE.md` 了解公开/私有边界
- 参考 `THEMES.md` 了解主题系统

## 贡献指南

如需贡献代码，请：

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request
5. 等待审核

详细指南参见 `doc/tauri-community-maintainer-guide.md`
