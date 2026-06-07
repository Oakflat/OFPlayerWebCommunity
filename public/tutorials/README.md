# OFPlayer 自建音乐库教程系列

> 从零开始搭自己的音乐服务器，用 OFPlayer 随时随地听。
>
> AList 相关内容已降级为存量用户/迁移参考；新部署优先选 OpenList 或 Navidrome。外部项目以各自官方文档为准（2026-05）。

## 教程目录

### 入门篇

1. **[OpenList（AList 社区驱动分支）搭建教程](./02-openlist-setup-guide.md)**
   - 零基础也能上手
   - Windows / Docker / NAS 多种姿势部署
   - 当前推荐的 WebDAV 自托管方案

2. **[AList WebDAV 服务搭建：存量用户参考](./01-alist-webdav-music-server-setup.md)**
   - 给已经部署了 AList 的用户
   - 迁移前核对配置用
   - 局域网和远程访问都有

### 实战篇

3. **[OFPlayer 连接 WebDAV 音乐库完整指南](./03-ofplayer-webdav-connection-guide.md)**
   - 一步步带你连
   - WebDAV / Subsonic 两种协议
   - 多设备同步

4. **[用 Navidrome 搭建私人音乐流媒体服务](./04-navidrome-setup-guide.md)**
   - 专业级音乐服务器
   - 多用户
   - 兼容 Subsonic 生态

### 进阶篇

5. **[WebDAV 音乐库常见问题排查指南](./05-webdav-troubleshooting.md)**
   - 连接问题怎么查
   - 性能优化建议
   - 高级调试技巧

## 快速开始

第一次搭的话，按这个顺序来：

1. 选一个方案：
   - **想简单 / WebDAV** → [OpenList 教程](./02-openlist-setup-guide.md)
   - **要专业功能** → [Navidrome 教程](./04-navidrome-setup-guide.md)
   - **已经在用 AList** → [AList 存量参考](./01-alist-webdav-music-server-setup.md)，再看要不要迁移到 OpenList

2. 搭好之后，看 [OFPlayer 连接指南](./03-ofplayer-webdav-connection-guide.md)

3. 出问题了，查 [排查指南](./05-webdav-troubleshooting.md)

## 方案对比

| 特性 | AList | OpenList | Navidrome |
|------|-------|----------|-----------|
| 部署难度 | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| 当前建议 | 存量参考 | WebDAV 首选 | 专业音乐库首选 |
| Web UI | ✓ | ✓ | ✓ |
| WebDAV | ✓ | ✓ | ✗ |
| Subsonic API | ✗ | ✗ | ✓ |
| 多用户 | ✓ | ✓ | ✓ |
| 自动扫描 | ✗ | ✗ | ✓ |
| 资源占用 | 低 | 低 | 中 |
| 适合场景 | 旧部署维护 | 通用文件管理 | 专业音乐管理 |

## 推荐配置

### 家庭用户（< 1000 首）

- **服务器**：树莓派 4B 或旧笔记本
- **方案**：OpenList + OFPlayer
- **优点**：部署简单，资源占用低

### 音乐爱好者（1000-10000 首）

- **服务器**：N100 小主机
- **方案**：Navidrome + OFPlayer
- **优点**：专业功能，多用户支持

### 发烧友（> 10000 首）

- **服务器**：Intel i3+ / NAS
- **方案**：Navidrome + OpenList（混合方案）
- **优点**：灵活管理，高性能

## 常见问题

### Q：选哪个方案？

- 只想快速搭个 WebDAV → OpenList
- 已经在用 AList → 先按存量参考维护，后面迁移到 OpenList
- 要专业功能 → Navidrome

### Q：需要什么硬件？

- 最低：树莓派 4B / 旧笔记本
- 推荐：N100 小主机
- 发烧：Intel i3+ / NAS

### Q：要公网 IP 吗？

- 局域网用：不需要
- 远程访问：需要（或者用内网穿透）

### Q：支持什么音频格式？

- MP3、FLAC、WAV、AAC、OGG
- 其它格式看播放器支不支持

## 参考来源

- OpenList 官方仓库：<https://github.com/OpenListTeam/OpenList>
- OpenList 官方文档：<https://doc.openlist.team/>
- Navidrome 官方安装文档：<https://www.navidrome.org/docs/installation/>
- Navidrome GitHub Releases：<https://github.com/navidrome/navidrome/releases>

## 技术支持

- **OFPlayer Community 播放器**：`/app`
- **OFPlayer Community 文档**：`/docs`

## 许可证

本教程系列采用 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 许可协议。
