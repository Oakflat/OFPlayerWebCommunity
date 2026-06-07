# 主题系统

## 主题架构概览

OFPlayer 的主题系统基于 CSS Custom Properties（CSS 变量），支持多主题切换和颜色方案（亮色/暗色）。

## 主题层次

```
┌─────────────────────────────────────────────────┐
│              Design Tokens (设计令牌)             │
│         packages/ofplayer-ui/src/styles/tokens.css│
├─────────────────────────────────────────────────┤
│              Theme Layer (主题层)                 │
│    mist.css / paper.css / material.css           │
├─────────────────────────────────────────────────┤
│              Component Styles (组件样式)          │
│              style.css / scoped styles           │
└─────────────────────────────────────────────────┘
```

## 可用主题

### Mist（默认）

**位置**: `src/themes/mist.js`, `src/themes/mist.css`

**风格**: 玻璃质感、半透明

**特点**:
- 毛玻璃效果（backdrop-filter: blur）
- 半透明背景
- 柔和的阴影
- 现代感、轻盈感

**适用场景**: 默认主题，适合大多数用户

---

### Paper

**位置**: `src/themes/paper.js`, `src/themes/paper.css`

**风格**: 温暖、哑光

**特点**:
- 纸质感背景
- 无反光
- 柔和的边框
- 温馨、舒适感

**适用场景**: 喜欢温暖质感的用户

---

### Material

**位置**: `src/themes/material.js`, `src/themes/material.css`

**风格**: Material Design 风格（预留）

**状态**: 预留/未来实现

## CSS 变量体系

### 变量命名规范

```css
--{category}-{property}-{variant}
```

**类别**:

| 类别 | 说明 | 示例 |
|------|------|------|
| `ink` | 文本颜色 | `--ink`, `--ink-subtle`, `--ink-muted` |
| `surface` | 背景颜色 | `--surface-panel`, `--surface-elevated` |
| `line` | 边框/分割线 | `--line`, `--line-subtle` |
| `primary` | 主色调 | `--primary`, `--primary-hover` |
| `state` | 状态层 | `--state-layer-hover`, `--state-layer-pressed` |
| `space` | 间距 | `--space-1`, `--space-2`, `--space-3` |
| `radius` | 圆角 | `--radius-sm`, `--radius-md`, `--radius-lg` |
| `duration` | 动画时长 | `--duration-sm`, `--duration-md` |
| `ease` | 缓动函数 | `--ease-standard`, `--ease-emphasized` |

### 核心变量

#### 文本颜色

```css
--ink                    /* 主文本 */
--ink-subtle             /* 次要文本 */
--ink-muted              /* 弱化文本 */
--ink-inverse            /* 反色文本 */
```

#### 背景颜色

```css
--surface-page           /* 页面背景 */
--surface-panel          /* 面板背景 */
--surface-elevated       /* 悬浮面板 */
--surface-overlay        /* 遮罩层 */
```

#### 边框/分割线

```css
--line                   /* 主分割线 */
--line-subtle            /* 细分割线 */
```

#### 主色调

```css
--primary                /* 主色 */
--primary-hover          /* 主色悬停 */
--primary-pressed        /* 主色按下 */
--primary-subtle         /* 主色背景 */
```

#### 状态层

```css
--state-layer-hover      /* 悬停状态层 */
--state-layer-pressed    /* 按下状态层 */
--state-layer-selected   /* 选中状态层 */
```

#### 间距

```css
--space-0: 0px;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
```

#### 圆角

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

#### 动画

```css
--duration-sm: 120ms;
--duration-md: 200ms;
--duration-lg: 300ms;
--duration-xl: 500ms;

--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
--ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
--ease-emphasized-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1);
--ease-emphasized-accelerate: cubic-bezier(0.3, 0, 0.8, 0.15);
```

### 颜色方案

支持亮色和暗色方案：

```css
[data-color-scheme="light"] {
  --ink: #1a1a1a;
  --ink-subtle: #666666;
  --surface-page: #ffffff;
  /* ... */
}

[data-color-scheme="dark"] {
  --ink: #f0f0f0;
  --ink-subtle: #999999;
  --surface-page: #1a1a1a;
  /* ... */
}
```

## 主题切换机制

### 应用主题

```javascript
// preferencesStore.js
function syncDocumentPreferences(state) {
  document.documentElement.dataset.theme = state.theme
  document.documentElement.dataset.colorScheme = state.colorScheme
  document.documentElement.dataset.effectiveColorScheme = getEffectiveColorScheme(state.colorScheme)
  document.documentElement.dataset.motion = state.motion
}
```

### 首次加载优化

```javascript
// main.js - 在 Vue 挂载前同步应用主题
const visualSnapshot = readVersioned('ofp:visual')
if (visualSnapshot) {
  const root = document.documentElement
  root.dataset.theme = visualSnapshot.theme ?? 'mist'
  root.dataset.colorScheme = visualSnapshot.colorScheme ?? 'system'
  root.dataset.motion = visualSnapshot.motion ?? 'full'
}
```

### 系统颜色方案检测

```javascript
function getEffectiveColorScheme(colorScheme) {
  if (colorScheme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return colorScheme
}
```

## 动画控制

### 动画级别

| 级别 | 说明 |
|------|------|
| `full` | 完整动画 |
| `reduced` | 减少动画（尊重系统偏好） |
| `none` | 无动画 |

### 应用动画级别

```css
[data-motion="none"] * {
  animation-duration: 0ms !important;
  transition-duration: 0ms !important;
}

[data-motion="reduced"] {
  --duration-sm: 0ms;
  --duration-md: 0ms;
  --duration-lg: 0ms;
}
```

## 主题注册

### 主题注册表

**位置**: `src/themes/index.js`

```javascript
import mist from './mist'
import paper from './paper'
import material from './material'

export const themes = {
  mist,
  paper,
  material,
}
```

### 主题对象结构

```javascript
// src/themes/mist.js
export default {
  id: 'mist',
  name: 'Mist',
  description: 'Glass-like, translucent',
  preview: {
    background: 'rgba(255, 255, 255, 0.8)',
    accent: '#3b82f6',
  },
}
```

## 添加新主题

### 步骤 1: 创建主题文件

```css
/* src/themes/mytheme.css */
[data-theme="mytheme"] {
  --ink: #1a1a1a;
  --ink-subtle: #666666;
  --ink-muted: #999999;
  
  --surface-page: #f5f5f5;
  --surface-panel: #ffffff;
  --surface-elevated: #ffffff;
  
  --line: #e5e5e5;
  --line-subtle: #f0f0f0;
  
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --primary-pressed: #1d4ed8;
  
  /* ... 其他变量 */
}
```

### 步骤 2: 创建主题配置

```javascript
/* src/themes/mytheme.js */
export default {
  id: 'mytheme',
  name: 'My Theme',
  description: 'Custom theme description',
  preview: {
    background: '#f5f5f5',
    accent: '#3b82f6',
  },
}
```

### 步骤 3: 注册主题

```javascript
/* src/themes/index.js */
import mytheme from './mytheme'

export const themes = {
  mist,
  paper,
  material,
  mytheme,  // 添加
}
```

### 步骤 4: 导入样式

```javascript
/* src/main.js */
import './themes/mytheme.css'
```

## 组件样式规范

### 使用 CSS 变量

```css
/* ✓ 正确 */
.button {
  background: var(--primary);
  color: var(--ink-inverse);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
}

/* ✗ 错误 - 硬编码颜色 */
.button {
  background: #3b82f6;
  color: white;
  border-radius: 8px;
  padding: 8px 16px;
}
```

### Scoped 样式

```vue
<style scoped>
.my-component {
  background: var(--surface-panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
}
</style>
```

### 全局样式

```css
/* src/style.css */
:root {
  /* 默认变量值（会被主题覆盖） */
}

*,
*::before,
*::after {
  box-sizing: border-box;
}
```

## 设计令牌包

### @ofplayer/ui

**位置**: `packages/ofplayer-ui/src/styles/tokens.css`

**说明**: 共享的设计令牌，用于 UI 组件包

```css
/* tokens.css */
:root {
  --ui-space-1: 4px;
  --ui-space-2: 8px;
  --ui-radius-sm: 4px;
  --ui-radius-md: 8px;
  /* ... */
}
```

## 最佳实践

### 1. 始终使用 CSS 变量

```css
/* ✓ 正确 */
.component {
  color: var(--ink);
  background: var(--surface-panel);
}

/* ✗ 错误 */
.component {
  color: #333;
  background: #fff;
}
```

### 2. 使用语义化变量

```css
/* ✓ 正确 - 语义化 */
.button-primary {
  background: var(--primary);
}

/* ✗ 错误 - 具体颜色 */
.button-primary {
  background: var(--blue-500);
}
```

### 3. 处理颜色方案

```css
/* ✓ 正确 - 使用变量 */
.card {
  background: var(--surface-panel);
  color: var(--ink);
}

/* ✗ 错误 - 硬编码 */
.card {
  background: white;
  color: black;
}
```

### 4. 尊重动画偏好

```css
/* ✓ 正确 - 使用变量 */
.animated {
  transition: all var(--duration-md) var(--ease-standard);
}

/* ✗ 错误 - 硬编码时长 */
.animated {
  transition: all 200ms ease;
}
```
