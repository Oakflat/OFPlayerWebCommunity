# OFPlayer 连接 WebDAV 音乐库完整指南

> 这篇讲怎么用 OFPlayer 连接你的 WebDAV 音乐库，跨设备管理和播放。
>
> 内容已对照当前 `src/services/externalLibraryAdapters.js` 与 `src/components/ExternalLibraryDialog.vue` 更新：OFPlayer 支持 WebDAV 与 Subsonic/Navidrome，FTP 在界面中展示但当前不可用。

## 关于 OFPlayer

OFPlayer 是个 local-first 的桌面感音乐播放器，干净、轻量，专注本地播放。支持：

- 本地音频文件导入和播放
- **WebDAV 远程音乐库连接**
- Subsonic/Navidrome 音乐服务器
- 简洁白底界面，让你只关注音乐

## 连接 WebDAV 音乐库

### 前置条件

连之前确认已经：

1. 搭好了 WebDAV 服务（新部署看 [OpenList 教程](./02-openlist-setup-guide.md)，存量看 [AList 参考](./01-alist-webdav-music-server-setup.md)）
2. 知道 WebDAV 服务地址
3. 有用户名和密码

### 步骤一：打开连接对话框

1. 启动 OFPlayer
2. 左侧边栏找到「导入」或「+」
3. 选「连接外部库」或「External Library」

### 步骤二：选择服务提供商

OFPlayer 支持三种远程服务提供商：

| 提供商 | 说明 | 适用场景 |
|--------|------|----------|
| **WebDAV** | 通用 WebDAV 协议 | OpenList、AList 存量环境、任何 WebDAV 服务器 |
| **Subsonic** | Subsonic API 协议 | Navidrome、Subsonic 服务器 |
| **FTP** | FTP 协议（当前不可用） | 需等待桌面桥接或改用 WebDAV/Subsonic |

选择「WebDAV」继续。

### 步骤三：填写连接信息

#### 服务名称

给你的音乐库起一个名字，例如：
- 「家庭音乐库」
- 「无损收藏」
- 「我的 NAS 音乐」

#### 服务器地址（Endpoint）

填写你的 WebDAV 服务器地址。常见格式：

| 服务 | 地址格式 | 示例 |
|------|----------|------|
| OpenList | `http://IP:5244/dav` | `http://192.168.1.100:5244/dav` |
| AList 存量环境 | `http://IP:5244/dav` | `http://192.168.1.100:5244/dav` |
| Nginx 反代 | `https://域名/dav` | `https://music.example.com/dav` |
| 群晖 WebDAV | `http://IP:5005` 或 `https://IP:5006` | `http://192.168.1.100:5005` |

**重要提示**：
- 地址必须包含协议头（`http://` 或 `https://`）
- 不要包含末尾的斜杠
- 如果使用反向代理，确保 WebDAV 路径正确

#### 根路径（Root Path）

指定音乐库在服务器上的起始目录：

| 情况 | 填写内容 |
|------|----------|
| 音乐在 `/music` 目录 | `/music` |
| 音乐在 `/music/flac` 目录 | `/music/flac` |
| 音乐在根目录 | 留空或填写 `/` |

**OpenList/AList 用户注意**：
- 如果你在 OpenList 中挂载路径是 `/music`，这里填写 `/music`
- 如果音乐在子目录，如 `/music/flac`，填写 `/music/flac`

#### 用户名和密码

填写你的 WebDAV 服务登录凭据：

- **OpenList/AList**：管理界面的用户名和密码
- **群晖**：DSM 账户和密码
- **Nginx 基本认证**：配置的用户名和密码

### 步骤四：连接并同步

填写完信息后，点击「连接」按钮。OFPlayer 会先验证连接，再创建外部库并开始同步。

OFPlayer 会：
1. 验证服务器地址是否可达
2. 检查认证信息是否正确
3. 确认 WebDAV 协议支持

### 步骤五：后续同步

连接成功后 OFPlayer 会：

1. 扫描指定目录下的所有音频文件
2. 先用文件名生成基础曲目信息
3. 把音乐加到本地数据库
4. 第一次播放或需要补充信息时，再读远程文件的内嵌标签

同步时间取决于你有多少首歌，几分钟到几十分钟不等。

## OFPlayer 的智能功能

### 当前元数据处理

OFPlayer 按来源处理元数据：

- **本地导入**：读取音频文件内嵌标签
- **WebDAV**：同步时先用文件名生成标题，第一次播放时下载远程文件补充内嵌标签
- **Subsonic/Navidrome**：通过 Subsonic API 拿标题、艺术家、专辑、封面等

### 递归扫描

OFPlayer 用 WebDAV `PROPFIND` 逐级遍历目录，导入支持的音频文件。默认单次最多同步 5000 首，可以在连接模型里扩展同步参数。

### 文件名基础解析

WebDAV 初始同步用文件名当基础标题：

```
01. 爱在西元前.flac          → 01. 爱在西元前
周杰伦 - 爱在西元前.flac    → 周杰伦 - 爱在西元前
```

### 播放缓存

播放远程音乐时 OFPlayer 会：

1. 不需要认证的 WebDAV 音频，直接用远程 URL 播
2. 需要认证的 WebDAV 音频，先读成浏览器 `Blob`，再创建临时 object URL
3. 切歌时释放临时 object URL，避免长期占内存

## 高级配置

### 连接 Navidrome 服务器

如果你使用 Navidrome 作为音乐服务器：

1. 选择提供商：**Subsonic**
2. 服务器地址：`http://你的IP:4533`
3. 根路径：留空（或填写 musicFolderId）
4. 用户名/密码：Navidrome 账户

OFPlayer 使用 Subsonic API 连接 Navidrome，提供商用 **Navidrome/Subsonic**，别用 WebDAV。

### 连接 OpenList/AList

标准 WebDAV 配置：

1. 选择提供商：**WebDAV**
2. 服务器地址：`http://你的IP:5244/dav`
3. 根路径：`/music`（你的挂载路径）
4. 用户名/密码：OpenList/AList 账户

Endpoint 和根路径按「服务器地址 + Root Path」拼接。推荐把服务器地址写到 `/dav`，挂载路径写到 Root Path。

### 使用 HTTPS 连接

如果配置了 HTTPS：

1. 服务器地址：`https://music.example.com/dav`
2. 确保证书有效（自签名证书可能需要额外配置）
3. 其他配置不变

## 多设备同步

### 家庭共享

1. 在 OpenList/AList 中创建多个用户
2. 为每个家庭成员创建独立账户
3. 设置不同的访问权限
4. 每个设备使用各自账户连接

### 远程访问

配置方法：
1. 路由器端口转发或内网穿透
2. 配置 HTTPS 加密
3. 使用域名访问（更方便）

## 常见问题

### Q：连接失败，提示 "WebDAV request failed"

常见原因：
1. 服务器地址填错了
2. 端口没开
3. 防火墙挡了

排查：
```bash
# 测试服务器是否可达
curl -u username:password http://your-ip:5244/dav/music

# 检查防火墙
sudo ufw status
```

### Q：同步后看不到音乐

常见原因：
1. 根路径配错了
2. 文件格式不支持
3. 文件权限问题

排查：
- 确认根路径没错
- 检查文件格式（MP3、FLAC、WAV 等）
- 确认文件有读取权限

### Q：播放卡顿

常见原因：
1. 网络带宽不够
2. 服务器性能瓶颈
3. 文件太大

排查：
- 优先局域网连接
- 考虑转码压缩
- 升级网络设备

### Q：元数据显示不对

OFPlayer 读取优先级：
1. 文件内置 ID3 标签
2. Subsonic/Navidrome API 返回的信息
3. 文件名基础标题

如果不对：
- 编辑文件的 ID3 标签
- 改用规范的文件名

## 性能优化建议

### 网络优化

- 使用有线网络连接
- 确保路由器性能足够
- 避免网络拥塞时段同步

### 服务器优化

- 使用 SSD 存储音乐
- 增加服务器内存
- 优化 WebDAV 服务器配置

### 客户端优化

- 限制同时播放数量
- 切换网络较差时，优先使用局域网地址或 HTTPS 反代

## 总结

用 OFPlayer 连 WebDAV 音乐库：

- 干净界面里管理远程音乐
- 从 WebDAV 或 Subsonic/Navidrome 同步曲目
- 递归扫描 WebDAV 或读取 Subsonic 曲库
- 流畅播放远程音乐
- 多设备同步

不依赖平台，数据在自己手里。

---

**参考来源**：
- OFPlayer WebDAV/Subsonic 适配器：`src/services/externalLibraryAdapters.js`
- OFPlayer 外部库连接弹窗：`src/components/ExternalLibraryDialog.vue`
- OpenList 官方文档：<https://doc.openlist.team/>
- Navidrome Subsonic API 文档：<https://www.navidrome.org/docs/developers/subsonic-api/>

**相关文章**：
- [AList WebDAV 服务搭建：存量用户参考](./01-alist-webdav-music-server-setup.md)
- [OpenList（AList 社区驱动分支）搭建教程](./02-openlist-setup-guide.md)
- [用 Navidrome 搭建私人音乐流媒体服务](./04-navidrome-setup-guide.md)
- [WebDAV 音乐库常见问题排查指南](./05-webdav-troubleshooting.md)
