# 用 Navidrome 搭建私人音乐流媒体服务

> Navidrome 是个开源音乐服务器，兼容 Subsonic API。自己搭一个，像私人 Spotify 一样听自己的歌。
>
> 内容按 Navidrome 官方安装文档与 GitHub Releases 更新（2026-05），不绑定特定版本号。最新 Release 以 GitHub Releases 页面为准。

## 为什么选 Navidrome

[Navidrome](https://www.navidrome.org/) 是个自托管的音乐流媒体服务器：

- **界面现代**：Web UI 好看，支持暗色模式
- **多用户**：给家里每个人建独立账户
- **自动扫描**：监控音乐文件夹，库自动更新
- **播放列表**：收藏、播放列表、队列都支持
- **跨平台**：各种客户端都能连
- **兼容 Subsonic API**：OFPlayer 原生支持

## 准备工作

### 硬件要求

| 场景 | 最低配置 | 推荐配置 |
|------|----------|----------|
| 个人使用 | 1 核 CPU / 512MB RAM | 2 核 CPU / 1GB RAM |
| 家庭共享 | 2 核 CPU / 1GB RAM | 4 核 CPU / 2GB RAM |
| 大型库（> 10000 首） | 2 核 CPU / 2GB RAM | 4 核 CPU / 4GB RAM |

### 软件要求

- Docker（推荐）或直接运行二进制文件
- 音乐文件（MP3、FLAC、WAV、AAC 等）

## 方案一：Docker 部署（推荐）

### 创建目录结构

```bash
mkdir -p /opt/navidrome/data
mkdir -p /opt/navidrome/music  # 你的音乐目录
```

### 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  navidrome:
    image: deluan/navidrome:latest
    container_name: navidrome
    restart: unless-stopped
    ports:
      - "4533:4533"
    volumes:
      - ./data:/data                # Navidrome 配置数据
      - /path/to/your/music:/music:ro  # 音乐目录（只读）
    environment:
      ND_MUSICFOLDER: /music
      ND_SCANSCHEDULE: 1h           # 每小时扫描一次
      ND_LOGLEVEL: info
      ND_BASEURL: ""
    user: "1000:1000"               # 根据你的用户 ID 调整
```

### 启动服务

```bash
docker-compose up -d
```

### 查看日志

```bash
docker logs -f navidrome
```

## 方案二：二进制安装

### Linux

```bash
# 获取最新版本号
LATEST_URL=$(curl -fsSLI -o /dev/null -w '%{url_effective}' https://github.com/navidrome/navidrome/releases/latest)
VERSION="${LATEST_URL##*/v}"

# 下载最新版本（以 linux_amd64 为例）
wget "https://github.com/navidrome/navidrome/releases/download/v${VERSION}/navidrome_${VERSION}_linux_amd64.tar.gz"

# 解压
tar -xzf "navidrome_${VERSION}_linux_amd64.tar.gz"

# 创建目录
mkdir -p /opt/navidrome/data

# 运行
./navidrome --musicfolder /path/to/your/music --datafolder /opt/navidrome/data
```

### Windows

1. 下载 Windows 版本：<https://github.com/navidrome/navidrome/releases>
2. 解压到固定目录
3. 运行：

```powershell
.\navidrome.exe --musicfolder "D:\Music" --datafolder ".\data"
```

## 初始配置

### 访问 Web 界面

1. 打开浏览器访问 `http://localhost:4533`
2. 首次访问会创建管理员账户
3. 填写用户名和密码

### 设置音乐库

音乐目录通常在启动参数或环境变量中配置：

- Docker：设置 `ND_MUSICFOLDER=/music`，并把宿主机音乐目录挂载到容器的 `/music`
- 二进制：启动时使用 `--musicfolder /path/to/your/music`

首次登录创建管理员账户后，Navidrome 会按配置扫描音乐目录。也可以在界面中手动触发重新扫描。

### 配置扫描选项

在设置中可以调整：

| 选项 | 说明 | 推荐值 |
|------|------|--------|
| 扫描频率 | 自动扫描间隔 | 1 小时 |
| 忽略的模式 | 忽略的文件模式 | `.jpg, .png, .txt` |
| 编译艺术家 | 多艺术家专辑处理 | 启用 |

## 连接 OFPlayer

### 步骤一：获取连接信息

在 Navidrome 中：
1. 点击右上角头像 → 「设置」
2. 记录你的服务器地址：`http://你的IP:4533`

### 步骤二：在 OFPlayer 中配置

1. 打开 OFPlayer
2. 选择「连接外部库」
3. 选择提供商：**Subsonic**
4. 填写配置：

| 字段 | 值 |
|------|-----|
| 服务器地址 | `http://你的IP:4533` |
| 用户名 | 你的 Navidrome 用户名 |
| 密码 | 你的 Navidrome 密码 |

5. 点「连接」；OFPlayer 会先测 Subsonic API，再创建外部库同步曲目

### 注意

OFPlayer 用 Subsonic API 连 Navidrome。连接弹窗里选 **Navidrome/Subsonic**，填上 `http://你的IP:4533`、用户名和密码就行。

## 多用户管理

### 创建用户

1. 以管理员登录
2. 点击右上角头像 → 「管理」→ 「用户」
3. 点击「创建新用户」
4. 填写用户信息：

| 字段 | 说明 |
|------|------|
| 用户名 | 登录用户名 |
| 密码 | 登录密码 |
| 管理员权限 | 是否为管理员 |
| 可用 | 是否启用账户 |

### 权限管理

Navidrome 支持细粒度权限：

- **播放**：允许播放音乐
- **下载**：允许下载音乐
- **编辑**：允许编辑元数据
- **管理**：允许管理其他用户

## 高级功能

### 播放列表

Navidrome 支持播放列表，服务端和兼容客户端都能管理队列和收藏。具体智能播放列表能力随版本变化，以官方文档为准。

### 歌词

Navidrome 支持内嵌歌词和外置 `.lrc` 文件：

- 内嵌：ID3 标签里的歌词
- 外置：同目录的 `.lrc` 文件

### 专辑封面

支持多种来源：

- 内嵌：音频文件里的封面
- 文件夹：`cover.jpg` 或 `folder.jpg`
- 在线：可以从网络获取（可选）

## 性能优化

### 数据库优化

大型音乐库建议：

```bash
# 在 docker-compose.yml 中添加环境变量
environment:
  ND_DBPATH: /data/navidrome.db
  ND_CACHEFOLDER: /data/cache
```

### 扫描优化

调整扫描参数：

```bash
environment:
  ND_SCANSCHEDULE: 30m       # 更频繁的扫描
  ND_LOGLEVEL: warn          # 减少日志
```

### 网络优化

使用反向代理：

```nginx
server {
    listen 443 ssl;
    server_name music.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:4533;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 客户端应用

Navidrome 兼容各种 Subsonic 客户端：

### 桌面端

- **OFPlayer**：原生支持，干净界面
- **Sonixd**：跨平台客户端
- **Sublime Music**：Linux 客户端

### 移动端

- **Ultrasonic**（Android）
- **Amperfy**（iOS）
- **play:Sub**（iOS）

### Web 界面

Navidrome 自带 Web 界面，支持：
- 响应式设计
- 暗色模式
- 播放列表管理
- 歌词显示

## 故障排查

### 音乐不显示

1. 检查音乐目录路径
2. 确认文件权限（需要可读）
3. 手动触发扫描

### 播放卡顿

1. 检查网络带宽
2. 降低音频质量（开转码）
3. 优先用局域网地址或稳定的 HTTPS 反代

### 连接失败

1. 确认服务在跑
2. 检查端口是否开放
3. 验证用户名密码

## 备份与恢复

### 备份数据

```bash
# 备份配置和数据库
tar -czf navidrome-backup-$(date +%Y%m%d).tar.gz /opt/navidrome/data
```

### 恢复数据

```bash
# 停止服务
docker-compose down

# 恢复数据
tar -xzf navidrome-backup-20240101.tar.gz -C /

# 启动服务
docker-compose up -d
```

## 升级指南

### Docker 升级

```bash
# 拉取新镜像
docker-compose pull

# 重启服务
docker-compose up -d
```

### 注意事项

- 升级前备份数据
- 看版本发布说明
- 数据库会自动迁移

## 与其他方案对比

| 特性 | Navidrome | OpenList + WebDAV | Jellyfin |
|------|-----------|----------------|----------|
| 专注音乐 | ✓ | ✗ | ✗ |
| Web UI | ✓ | ✓ | ✓ |
| 多用户 | ✓ | ✓ | ✓ |
| Subsonic API | ✓ | ✗ | 插件 |
| 自动扫描 | ✓ | ✗ | ✓ |
| 智能播放列表 | ✓ | ✗ | ✓ |
| 资源占用 | 低 | 低 | 高 |

## 总结

Navidrome 是个优秀的自托管音乐方案：

- 现代 Web 界面
- 多用户
- 自动扫描和元数据管理
- 兼容 Subsonic 生态
- OFPlayer 原生支持

看完这篇，你应该能自己搭起来，并用 OFPlayer 连上了。

---

**参考来源**：
- Navidrome 官方安装文档：<https://www.navidrome.org/docs/installation/>
- Navidrome Docker 安装文档：<https://www.navidrome.org/docs/installation/docker/>
- Navidrome GitHub Releases：<https://github.com/navidrome/navidrome/releases>

**相关文章**：
- [AList WebDAV 服务搭建：存量用户参考](./01-alist-webdav-music-server-setup.md)
- [OpenList（AList 社区驱动分支）搭建教程](./02-openlist-setup-guide.md)
- [OFPlayer 连接 WebDAV 音乐库完整指南](./03-ofplayer-webdav-connection-guide.md)
- [WebDAV 音乐库常见问题排查指南](./05-webdav-troubleshooting.md)
