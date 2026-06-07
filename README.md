# OFPlayer Community

> 音乐能跨越我们与彼此之间的偏见，跨越时间与空间，传达作者的想法。

OFPlayer Community 是一个 local-first 的 Web 音乐播放器。它专注于本地音乐导入、播放、整理和轻量管理，目标是在浏览器里提供干净、克制、响应直接的桌面级音乐体验。

这个仓库是 OFPlayer 的公开社区版本，保留播放器、工具、教程和可复用 UI 组件，移除了产品官网、账号层级、推广位和私有发布流程。

## 致谢

首先，我想感谢所有默默关注以及提供正反馈的人。正是因为大家的支持，让我有着极大的动力推进这个项目。

我一直认为好的音乐能够极大改变一个人，那么好的载体也是。这也是我制作 OFPlayer 的初衷——我希望音乐能跨越我们与彼此之间的偏见，跨越时间与空间，传达作者的想法。

OFPlayer 也希望传达我的想法：以漂亮的 UI、深思熟虑的功能为社区带来动力。因此，我们的大部分代码将长期保持 MIT 许可证。

## 项目定位

OFPlayer 希望以漂亮的 UI、深思熟虑的功能和可读的工程结构，为自托管与本地音乐社区提供一个可以长期演进的播放器基础。

当前版本适合：

- 本地音频库播放和整理
- 浏览器内音乐工具和教程
- Vue 3 音乐播放器结构参考
- 社区二次开发和 UI 组件复用

当前版本不包含：

- 在线音源
- 登录、账号、云同步
- 社交功能
- 重型可视化
- 私有发布和账号层级能力

## 功能特性

| 能力 | 说明 |
| --- | --- |
| 本地导入 | 导入本地音频文件并创建本地曲库 |
| 元数据解析 | 提取标题、艺术家、专辑、封面、时长、比特率等信息 |
| 播放控制 | 播放、暂停、上一首、下一首、进度条和音量控制 |
| 曲库组织 | 支持库、播放列表、收藏、最近播放和当前队列 |
| 本地持久化 | 使用 IndexedDB 保存曲库、会话和 UI 偏好 |
| 外部曲库 | 支持 WebDAV / Navidrome 等外部库连接入口 |
| 音乐工具 | 提供歌词、音频、元数据等浏览器内工具页面 |
| 主题系统 | 支持主题、明暗模式和播放器颜色自定义 |

## 技术栈

| 技术 | 用途 |
| --- | --- |
| Vue 3 | 前端框架 |
| Vite | 开发服务器和构建工具 |
| Vue Router | 路由管理 |
| music-metadata | 音频元数据解析 |
| lucide-vue-next | 图标库 |
| IndexedDB | 本地数据持久化 |
| Browser Audio API | 音频播放 |
| Vitest | 单元测试 |

## 快速开始

### 环境要求

- Node.js 18+
- npm

### 安装与运行

```bash
npm install
npm run dev
```

默认开发服务器由 Vite 提供。启动后打开终端输出中的本地地址即可进入播放器。

### 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run test` | 运行测试 |
| `npm run lint` | 运行 ESLint |
| `npm run format` | 格式化源码 |

## 代码结构

```text
ofplayer-web/
├─ src/
│  ├─ app/              # 应用编排层
│  ├─ components/       # Vue 组件
│  ├─ composables/      # 组合式函数
│  ├─ models/           # 数据模型
│  ├─ services/         # 领域服务层
│  ├─ stores/           # 状态管理
│  ├─ styles/           # 样式系统
│  ├─ themes/           # 主题配置
│  ├─ tools/            # 浏览器内音乐工具
│  ├─ App.vue
│  └─ main.js
├─ public/
│  ├─ docs/             # 社区文档
│  └─ tutorials/        # 自建音乐库教程
├─ packages/
│  └─ ofplayer-ui/      # 可复用 UI 组件
├─ tests/               # 测试文件
└─ package.json
```

## 架构概览

### 应用编排层

`src/app/ofplayerApp.js` 负责初始化数据服务、领域服务和各类 store，并串联导入、切歌、播放控制、设置更新等应用行为。

### 数据层

`src/services/data/**` 抽象存储驱动。默认使用 IndexedDB，并保留本地 fallback，方便浏览器环境下稳定运行。

### 领域服务层

- `libraryService`：库的创建、删除、重排，以及默认播放列表初始化
- `playlistService`：播放列表操作与曲目归属关系管理
- `trackService`：本地文件导入、曲目对象创建、资源释放
- `metadataService`：音频标签、封面、时长和技术元数据解析

### 状态层

- `libraryStore`：库、播放列表、曲目、关系表
- `playerStore`：播放状态、历史记录、当前曲目
- `preferencesStore`：音量、语言、主题、显示偏好
- `sessionStore`：当前队列、当前曲目指针等会话状态

## 文档

- [public/docs](public/docs/)：社区开发文档
- [public/tutorials](public/tutorials/)：自建音乐库教程
- [THEMES.md](THEMES.md)：主题系统说明
- [OPEN_SOURCE_SCOPE.md](OPEN_SOURCE_SCOPE.md)：公开版本范围说明

## 参与开发

欢迎围绕本地音乐体验、播放器 UI、音乐工具和文档改进提交贡献。提交前建议运行：

```bash
npm run lint
npm run test
npm run build
```

## 许可证

本仓库采用 MIT 许可证，详见 [LICENSE](LICENSE)。

> 好的音乐值得好的载体。让我们一起构建更好的音乐体验。
