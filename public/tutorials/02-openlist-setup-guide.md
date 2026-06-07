# OpenList 搭建教程：当前推荐的 WebDAV 文件管理方案

> OpenList 是 AList 的社区驱动 fork，用来搭个人文件管理和 WebDAV 服务很合适。这篇从零开始带你搞定。
>
> 本文命令、Docker 镜像与迁移说明已按 OpenList 官方仓库和官方文档更新（2026-05）。

## 为什么选择 OpenList？

[OpenList](https://github.com/OpenListTeam/OpenList) 是 AList 的社区驱动分支。新部署推荐优先选它：

- **活跃维护**：社区驱动，bug 修得快
- **安全更新**：漏洞响应及时
- **新功能**：社区需求持续跟进
- **迁移路径**：官方文档有 AList v3 → OpenList v4 的迁移说明

## 快速开始

### 方式一：一键脚本安装（Linux/macOS）

```bash
curl -fsSL https://res.oplist.org/script/v4.sh > install-openlist-v4.sh
sudo bash install-openlist-v4.sh
```

按脚本提示完成安装。安装完成后，如果需要重置管理员密码，可以使用 OpenList 的管理命令；如果是 Docker 部署，也可以先查看容器日志：

```bash
openlist admin set NEW_PASSWORD
```

启动服务：

```bash
openlist server
```

### 方式二：Docker 安装（推荐）

#### 创建目录结构

```bash
mkdir -p /opt/openlist/data
mkdir -p /opt/openlist/music  # 你的音乐目录
```

#### 创建 docker-compose.yml

```yaml
services:
  openlist:
    image: openlistteam/openlist:latest
    container_name: openlist
    user: '0:0'
    restart: unless-stopped
    ports:
      - "5244:5244"
    volumes:
      - ./data:/opt/openlist/data
      - /path/to/your/music:/opt/openlist/music  # 修改为你的音乐目录
    environment:
      - TZ=Asia/Shanghai
      - UMASK=022
```

#### 启动服务

```bash
docker-compose up -d
```

查看初始密码：

```bash
docker logs openlist 2>&1 | grep password
```

如果日志中没有可用密码，进入容器后重置：

```bash
docker exec -it openlist ./openlist admin set NEW_PASSWORD
```

### 方式三：Windows 安装

1. 访问 OpenList Releases：<https://github.com/OpenListTeam/OpenList/releases>
2. 下载 Windows amd64 版本
3. 解压到固定目录
4. 运行：

```powershell
.\openlist.exe server
```

## 初始配置

### 访问管理界面

1. 打开浏览器访问 `http://localhost:5244`
2. 点击右下角「管理」
3. 使用 `admin` 和初始密码登录

### 修改管理员密码

1. 进入管理界面
2. 点击左侧「用户」菜单
3. 编辑 admin 用户
4. 修改密码并保存

### 添加音乐存储

1. 点击左侧「存储」菜单
2. 点击「添加」按钮
3. 选择「本机存储」
4. 配置参数：

| 参数 | 值 | 说明 |
|------|-----|------|
| 挂载路径 | `/music` | WebDAV 虚拟路径 |
| 根文件夹 | `/opt/openlist/music` | 实际音乐目录 |
| 缓存大小 | `10` | 缓存文件数量 |

5. 点击「添加」保存

## WebDAV 配置详解

OpenList 默认开启 WebDAV 服务，地址格式：

```
http://你的IP:5244/dav/挂载路径
```

### WebDAV 认证方式

#### 基本认证（用户名密码）

```
用户名：admin（或你创建的用户）
密码：你的密码
```

OFPlayer 连接 OpenList 时用用户名和密码就行。为了兼容更多播放器，这里默认不用 URL Token。

### WebDAV 路径规则

| 挂载路径 | WebDAV 地址 |
|----------|-------------|
| `/music` | `http://IP:5244/dav/music` |
| `/lossless` | `http://IP:5244/dav/lossless` |
| `/` | `http://IP:5244/dav/`（根目录） |

## 进阶配置

### 配置反向代理（Nginx）

如果需要 HTTPS 或域名访问：

```nginx
server {
    listen 443 ssl http2;
    server_name music.example.com;

    ssl_certificate /etc/letsencrypt/live/music.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/music.example.com/privkey.pem;

    client_max_body_size 0;  # 不限制上传大小

    location / {
        proxy_pass http://127.0.0.1:5244;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebDAV 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 配置 HTTPS 访问

使用 Let's Encrypt 免费证书：

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d music.example.com

# 自动续期
sudo certbot renew --dry-run
```

### 多用户配置

1. 创建新用户：

| 字段 | 说明 |
|------|------|
| 用户名 | 登录用户名 |
| 密码 | 登录密码 |
| 权限 | 只读/读写 |
| 可访问目录 | 限制访问范围 |

2. 为不同用户设置不同权限：
   - 家庭成员：只读，访问 `/family` 目录
   - 自己：读写，访问所有目录

### 性能优化

OpenList 的具体缓存和并发参数会随版本变化，建议通过管理界面调整存储缓存。改配置文件前先备份 `/opt/openlist/data`，以当前官方文档为准。

## 音乐库组织最佳实践

### 目录结构

```
music/
├── 华语流行/
│   ├── 周杰伦/
│   │   ├── 2001 - 范特西/
│   │   │   ├── 01. 爱在西元前.flac
│   │   │   ├── 02. 爸我回来了.flac
│   │   │   └── cover.jpg
│   │   └── 2003 - 叶惠美/
│   └── 陈奕迅/
├── 欧美经典/
├── 日韩流行/
├── 纯音乐/
└── 有声书/
```

### 文件命名规范

格式参考：
```
序号. 歌曲名.扩展名
示例：01. 爱在西元前.flac
```

或者带上艺术家：
```
艺术家 - 歌曲名.扩展名
示例：周杰伦 - 爱在西元前.flac
```

### 封面图片

每个专辑目录放置 `cover.jpg` 或 `folder.jpg` 作为封面。

## 安全建议

### 1. 修改默认端口

在配置文件中修改：

```json
{
  "port": 8080
}
```

### 2. 上 HTTPS

务必用 HTTPS 加密传输，别让密码明文跑在公网上。

### 3. 限制访问 IP

在防火墙里限制来源：

```bash
# 只允许内网访问
sudo ufw allow from 192.168.0.0/16 to any port 5244
```

### 4. 定期备份

备份数据目录：

```bash
tar -czf openlist-backup-$(date +%Y%m%d).tar.gz /opt/openlist/data
```

## 故障排查

### 服务无法启动

检查端口占用：

```bash
lsof -i :5244
```

查看日志：

```bash
docker logs openlist
```

### WebDAV 连接失败

1. 检查防火墙设置
2. 确认服务正在运行
3. 验证用户名密码

### 文件列表为空

1. 检查存储配置中的根文件夹路径
2. 确认文件夹中有文件
3. 检查文件权限

## 升级指南

### Docker 升级

```bash
# 拉取新镜像
docker-compose pull

# 重启服务
docker-compose up -d
```

### 二进制升级

1. 停止当前服务
2. 备份数据目录
3. 替换二进制文件
4. 重启服务

## 与 AList 的区别

| 特性 | AList | OpenList |
|------|-------|----------|
| 项目定位 | 原项目/存量环境 | 社区驱动 fork |
| 新部署建议 | 仅作旧教程参考 | 推荐 |
| 迁移文档 | - | 官方提供 AList v3 → OpenList v4 迁移说明 |
| Docker 镜像 | `xhofe/alist` | `openlistteam/openlist` |

## 总结

OpenList 是本系列当前推荐的 WebDAV 方案。看完这篇你应该知道：

- 怎么安装和配置 OpenList
- 怎么设置 WebDAV 服务
- 怎么组织音乐文件
- 怎么做安全加固
- 遇到问题怎么排

接下来看怎么用 OFPlayer 连你的 OpenList WebDAV 音乐库。

---

**参考来源**：
- OpenList 官方仓库：<https://github.com/OpenListTeam/OpenList>
- OpenList 安装文档：<https://doc.openlist.team/guide/installation/>
- OpenList 迁移文档：<https://doc.oplist.org/guide/migrate>

**相关文章**：
- [AList WebDAV 服务搭建：存量用户参考](./01-alist-webdav-music-server-setup.md)
- [OFPlayer 连接 WebDAV 音乐库完整指南](./03-ofplayer-webdav-connection-guide.md)
- [用 Navidrome 搭建私人音乐流媒体服务](./04-navidrome-setup-guide.md)
- [WebDAV 音乐库常见问题排查指南](./05-webdav-troubleshooting.md)
