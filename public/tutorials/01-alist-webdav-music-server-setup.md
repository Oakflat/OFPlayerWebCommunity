# AList 搭建个人音乐库 WebDAV 服务（存量用户参考）

> 如果你已经部署了 AList，这篇可以帮你核对 WebDAV 配置，或迁移前做参考。新环境建议直接看 [OpenList 搭建教程](./02-openlist-setup-guide.md)。
>
> OpenList 是 AList 的社区驱动 fork，当前教程系列已经把 OpenList 作为新部署首选，AList 仅保留给存量用户。

## 自建音乐库能解决什么

流媒体很方便，但有它的问题：

- **版权下架**：昨天还能听的歌，今天灰了
- **音质缩水**：在线播放为了省流量，音质打折扣
- **数据不在自己手里**：播放记录、收藏列表全在平台那边
- **断网就没辙**：服务器出问题或没网的时候，什么都播不了

自己搭一个音乐库，这些问题都不是问题。无损文件想存什么格式就存什么格式，局域网内几台设备随便放，没人能下架你的歌。

## 什么是 AList？

[AList](https://alistgo.com/) 是一个支持多种存储的文件列表程序，它可以：

- 将本地硬盘、云存储（阿里云盘、百度网盘、OneDrive 等）统一管理
- 提供 WebDAV 接口，让各种播放器可以访问
- 浏览文件夹并通过 WebDAV 暴露目录
- 支持多用户、权限管理

如果你还没有部署，可以直接看 [OpenList 教程](./02-openlist-setup-guide.md)。如果你已经在用 AList，可以先按这篇核对当前配置，后面再考虑迁移。

## 准备工作

### 硬件要求

| 场景 | 最低配置 | 推荐配置 |
|------|----------|----------|
| 个人使用（< 1000 首） | 树莓派 4B / 旧笔记本 | N100 小主机 |
| 家庭共享（< 10000 首） | N100 小主机 | Intel i3 级别 |
| 大型音乐库（> 10000 首） | Intel i3 级别 | Intel i5 / SSD |

### 软件要求

- **操作系统**：Windows 10/11、macOS、Linux 均可
- **音乐文件**：MP3、FLAC、WAV、AAC、OGG 等常见格式
- **网络**：需要路由器端口转发或内网穿透（如需外网访问）

## 方案一：Windows 本地部署（旧环境参考）

适合只在局域网内用的用户。

### 第一步：下载 AList

1. 访问 AList 当前站点或 GitHub Releases，确认下载来源
2. 选择 Windows 版本（amd64）
3. 解压到一个固定目录，如 `C:\AList`
4. 如果是全新部署，请改用 OpenList

### 第二步：初始化 AList

打开 PowerShell 或 CMD，进入 AList 目录：

```powershell
cd C:\AList
.\alist.exe server
```

首次运行会显示管理员密码，请务必记录：

```
INFO[2024-01-01 12:00:00] start server @ 0.0.0.0:5244
INFO[2024-01-01 12:00:00] admin password: abc12345
```

### 第三步：访问管理界面

1. 打开浏览器，访问 `http://localhost:5244`
2. 点击右下角「管理」按钮
3. 输入用户名 `admin` 和刚才的密码登录

### 第四步：添加本地存储

1. 在管理界面，点击左侧「存储」菜单
2. 点击「添加」按钮
3. 选择「本机存储」驱动
4. 填写配置：

| 字段 | 值 | 说明 |
|------|-----|------|
| 挂载路径 | `/music` | WebDAV 中的虚拟路径 |
| 根文件夹 | `D:\Music` | 你实际存放音乐的目录 |
| 缓存大小 | `10` | 缓存文件数量 |

5. 点击「添加」保存

### 第五步：开启 WebDAV

AList 默认已开启 WebDAV，地址格式为：

```
http://你的IP:5244/dav/music
```

查看你的局域网 IP：

```powershell
ipconfig | findstr "IPv4"
```

假设 IP 是 `192.168.1.100`，则 WebDAV 地址为：

```
http://192.168.1.100:5244/dav/music
```

## 方案二：Docker 部署（存量环境较方便）

适合已经使用 AList 镜像的环境继续维护。全新部署请优先使用 OpenList。

### Windows 安装 Docker

1. 下载 Docker Desktop：<https://www.docker.com/products/docker-desktop/>
2. 安装并重启电脑
3. 启动 Docker Desktop

### 创建 docker-compose.yml

创建一个新文件夹 `C:\AList-Docker`，在其中创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  alist:
    image: xhofe/alist:latest
    container_name: alist
    restart: unless-stopped
    ports:
      - "5244:5244"
    volumes:
      - ./data:/opt/alist/data        # AList 配置数据
      - D:/Music:/opt/alist/music     # 你的音乐目录
    environment:
      - TZ=Asia/Shanghai
```

### 启动服务

在 `docker-compose.yml` 所在目录打开 PowerShell：

```powershell
docker-compose up -d
```

查看初始密码：

```powershell
docker logs alist 2>&1 | findstr "password"
```

后续步骤与「方案一」的第三步到第五步相同。

## 方案三：NAS 部署（群晖/威联通）

### 群晖 NAS（旧环境参考）

1. 打开「套件中心」
2. 搜索并安装「Docker」
3. 在 Docker 中搜索镜像 `xhofe/alist`
4. 创建容器，映射端口 5244
5. 挂载你的音乐文件夹

### 威联通 NAS（旧环境参考）

1. 打开 Container Station
2. 搜索并创建 `xhofe/alist` 容器
3. 配置端口和文件夹映射

## 进阶配置

### 设置 HTTPS（安全访问）

如果需要在外网安全访问，建议配置 HTTPS：

1. 申请域名和 SSL 证书（可使用免费的 Let's Encrypt）
2. 使用 Nginx 反向代理：

```nginx
server {
    listen 443 ssl;
    server_name music.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5244;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 配置多个音乐目录

可以添加多个存储，按类别组织：

- `/lossless` → `D:\Music\FLAC`（无损音乐）
- `/mp3` → `D:\Music\MP3`（有损压缩）
- `/podcast` → `D:\Podcasts`（播客）

### 创建子账户

1. 在管理界面点击「用户」菜单
2. 创建新用户
3. 设置权限（只读/读写）
4. 限制可访问的目录

## 音乐文件组织建议

为了获得最好的体验，建议把音乐文件整理成这个结构：

```
Music/
├── 华语/
│   ├── 周杰伦/
│   │   ├── 范特西/
│   │   │   ├── 01. 爱在西元前.flac
│   │   │   ├── 02. 爸我回来了.flac
│   │   │   └── cover.jpg
│   │   └── 叶惠美/
│   └── 陈奕迅/
├── 欧美/
├── 日韩/
└── 纯音乐/
```

文件命名参考：
- 带序号：`01. 歌曲名.flac`
- 带艺术家：`周杰伦 - 爱在西元前.flac`
- 每个专辑文件夹放一个 `cover.jpg` 做封面

## 验证 WebDAV 服务

### 使用浏览器测试

访问 `http://你的IP:5244/dav/music`，应该能看到文件列表。

### 使用 Windows 资源管理器

1. 打开「此电脑」
2. 点击「映射网络驱动器」
3. 输入地址：`http://你的IP:5244/dav/music`
4. 输入 AList 用户名和密码
5. 应该能看到音乐文件

## 下一步

确认 AList WebDAV 服务可用后：

1. **用 OFPlayer 连接**：OFPlayer 原生支持 WebDAV，可以直接连你的音乐库
2. **手机播放**：用支持 WebDAV 的播放器（VLC、foobar2000 Mobile 都行）
3. **多设备同步**：电脑、手机、平板都能访问同一个音乐库
4. **迁移到 OpenList**：新维护建议参考 OpenList 官方迁移文档和本系列的 OpenList 教程

## 常见问题

### Q：AList 启动失败？

检查端口 5244 是否被占用：

```powershell
netstat -ano | findstr :5244
```

如果被占用，可以在配置文件中修改端口。

### Q：WebDAV 连接失败？

1. 检查防火墙是否放行 5244 端口
2. 确认 AList 服务正在运行
3. 检查用户名密码是否正确

### Q：音乐扫描很慢？

- 确保存储设备速度足够（推荐 SSD）
- 减少嵌套层级
- 使用 AList 的缓存功能

### Q：支持哪些音频格式？

AList 本身不限制格式，但播放器得能播。常见的有：
- MP3（通吃）
- FLAC（无损，推荐）
- WAV（无损，文件比较大）
- AAC（苹果设备常用）
- OGG（开源格式）

## 总结

用 AList 或 OpenList 搭一个 WebDAV 音乐服务，能做到：

- 把分散在各处的音乐文件统一管起来
- 通过 WebDAV 协议让各种播放器都能访问
- 局域网内高速播放
- 配上 HTTPS 安全地远程访问
- 数据完全在自己手上

新部署的话，下一步建议先完成 OpenList 配置；已经在用 AList 的话，可以继续看 OFPlayer 连接指南。

---

**参考来源**：
- AList 官网：<https://alistgo.com/>
- OpenList 官方仓库：<https://github.com/OpenListTeam/OpenList>
- OpenList 迁移文档：<https://doc.oplist.org/guide/migrate>

**相关文章**：
- [OpenList（AList 社区驱动分支）搭建教程](./02-openlist-setup-guide.md)
- [OFPlayer 连接 WebDAV 音乐库完整指南](./03-ofplayer-webdav-connection-guide.md)
- [用 Navidrome 搭建私人音乐流媒体服务](./04-navidrome-setup-guide.md)
- [WebDAV 音乐库常见问题排查指南](./05-webdav-troubleshooting.md)
