# OFplayer 主题系统

## 概述

OFplayer 采用可扩展的主题系统，支持多种视觉风格的切换。当前已实现三种主题：

1. **Mist（薄雾）** - 默认主题，轻盈玻璃质感
2. **Paper（纸感）** - 温润纸质触感
3. **Material（预留）** - Google Material Design 风格

## 架构设计

### 文件结构

```
src/themes/
├── index.js          # 主题系统入口，提供主题配置访问接口
├── mist.js           # Mist 主题配置
├── mist.css          # Mist 主题样式
├── paper.js          # Paper 主题配置
├── paper.css         # Paper 主题样式
├── material.js       # Material 主题配置（预留）
└── material.css      # Material 主题样式（预留）
```

### 设计令牌分层

主题系统采用分层设计：

```
:root (全局基础变量)
  ├─ 动效系统（缓动曲线）
  ├─ 字体系统（字体族、字号、字重）
  ├─ 间距系统
  └─ 过渡时长

[data-theme="xxx"] (主题变量)
  ├─ 颜色系统（ink、line、surface）
  ├─ 阴影系统
  ├─ 圆角系统
  └─ 滚动条样式
```

## 使用方法

### 切换主题

主题通过 `data-theme` 属性控制：

```javascript
// 设置主题
document.documentElement.dataset.theme = 'paper'

// 获取当前主题
const currentTheme = document.documentElement.dataset.theme
```

### 主题配置

每个主题包含：

```javascript
{
  name: 'mist',           // 主题标识
  label: '薄雾',          // 显示名称
  description: '描述',    // 主题描述
  icon: 'Cloud',         // 图标名称
  features: {            // 主题特性
    hasGradient: true,
    hasTransparency: true,
    borderRadius: 'rounded'
  },
  tokens: {              // 设计令牌
    ink: {...},
    line: {...},
    surface: {...},
    shadow: {...},
    radius: {...}
  }
}
```

### CSS 变量使用

```css
/* 在组件中使用主题变量 */
.my-component {
  color: var(--ink);
  background: var(--surface-panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
}
```

## 主题特性

### Mist 主题

- ✨ 半透明玻璃效果
- 🌊 渐变背景
- 💨 柔和阴影
- 🎯 大圆角设计

```css
--surface-shell: rgba(255, 255, 255, 0.95);
--shadow-shell: 0 32px 64px -12px rgba(26, 31, 46, 0.12);
--radius-xl: 1.5rem;
```

### Paper 主题

- 📄 纯色纸质背景
- 🎨 温润色调
- 📐 柔和圆角
- 🖋️ 清晰边界

```css
--surface-shell: #fafaf8;
--shadow-shell: 0 20px 60px -15px rgba(0, 0, 0, 0.08);
--radius-xl: 1rem;
```

### Material 主题（预留）

- 🎯 Material Design 规范
- 📊 Elevation 系统
- 🌈 明确的色彩层级
- 💫 Ripple 效果

```css
--elevation-1: 0 1px 3px rgba(0,0,0,0.12);
--elevation-2: 0 3px 6px rgba(0,0,0,0.16);
--elevation-3: 0 10px 20px rgba(0,0,0,0.19);
```

## 扩展新主题

### 1. 创建主题配置

```javascript
// src/themes/new-theme.js
export const newTheme = {
  name: 'new-theme',
  label: '新主题',
  description: '主题描述',
  icon: 'Star',
  features: {
    hasGradient: false,
    hasTransparency: false,
    borderRadius: 'medium'
  },
  tokens: {
    ink: {
      base: '#000000',
      soft: '#666666',
      muted: '#999999',
      subtle: '#cccccc'
    },
    // ... 其他令牌
  }
}
```

### 2. 创建主题样式

```css
/* src/themes/new-theme.css */
[data-theme="new-theme"] {
  --ink: #000000;
  --ink-soft: #666666;
  /* ... 其他变量 */
}

/* 主题特殊样式 */
[data-theme="new-theme"] .player-shell {
  /* 特殊样式 */
}
```

### 3. 注册主题

```javascript
// src/themes/index.js
import { newTheme } from './new-theme'

export const THEMES = {
  mist: mistTheme,
  paper: paperTheme,
  material: materialTheme,
  'new-theme': newTheme,  // 添加新主题
}
```

### 4. 导入样式

```javascript
// src/main.js
import './themes/new-theme.css'
```

### 5. 更新翻译

```javascript
// src/composables/useI18n.js
theme: {
  // ... 其他主题
  newTheme: '新主题',
  newThemeCopy: '新主题描述',
}
```

## 最佳实践

1. **使用语义化变量名**
   ```css
   /* ✅ 好 */
   color: var(--ink);
   background: var(--surface-panel);

   /* ❌ 避免 */
   color: var(--color-text-primary);
   ```

2. **保持主题一致性**
   - 所有颜色使用主题变量
   - 避免硬编码颜色值
   - 保持视觉层次清晰

3. **性能优化**
   - 主题样式按需加载
   - 避免过度使用 backdrop-filter
   - 优化阴影和渐变

4. **可访问性**
   - 确保文本对比度符合 WCAG 标准
   - 支持减少动效偏好
   - 提供高对比度选项（未来）

## 未来规划

- [ ] 深色模式支持
- [ ] 自定义主题编辑器
- [ ] 主题预览功能
- [ ] 主题导入/导出
- [ ] 社区主题市场
