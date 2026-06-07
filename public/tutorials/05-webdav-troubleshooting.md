# WebDAV 音乐库常见问题排查指南

> WebDAV 连不上？这篇从简到深带你排查。
>
> 命令已改为 OpenList 优先，AList 仅作为存量环境兼容项；OFPlayer 行为已对照当前 WebDAV/Subsonic 适配器实现更新（2026-05）。

## 快速诊断清单

出问题先按这个顺序查：

- [ ] 服务器在跑吗？
- [ ] 网络通吗？
- [ ] 端口开没开？
- [ ] 用户名密码对吗？
- [ ] 路径对不对？
- [ ] 防火墙挡没挡？

## 连接问题

### 问题：无法连接到服务器

**症状**：OFPlayer 提示「连接失败」或「服务器不可达」

**排查**：

#### 1. 检查服务器是否运行

```bash
# Docker 服务
docker ps | grep -E 'openlist|alist'

# 系统服务
systemctl status openlist
systemctl status alist

# 直接运行
ps aux | grep -E '[o]penlist|[a]list'
```

如果未运行，启动服务：

```bash
# Docker
docker-compose up -d

# 系统服务
systemctl start openlist
systemctl start alist

# 直接运行
./openlist server
# 或存量 AList：./alist server
```

#### 2. 测试网络连通性

```bash
# 测试 IP 连通
ping 192.168.1.100

# 测试端口连通
telnet 192.168.1.100 5244

# 使用 curl 测试
curl -I http://192.168.1.100:5244
```

#### 3. 检查端口监听

```bash
# Linux
netstat -tlnp | grep 5244
ss -tlnp | grep 5244

# Windows
netstat -ano | findstr :5244

# macOS
lsof -i :5244
```

#### 4. 检查防火墙

```bash
# Linux (ufw)
sudo ufw status
sudo ufw allow 5244

# Linux (firewalld)
sudo firewall-cmd --list-ports
sudo firewall-cmd --add-port=5244/tcp --permanent
sudo firewall-cmd --reload

# Windows
# 检查 Windows Defender 防火墙设置
```

### 问题：连接超时

**症状**：连接长时间无响应，最终超时

**常见原因**：

1. 网络延迟高
   ```bash
   # 测试延迟
   ping -c 10 192.168.1.100
   ```

2. 服务器负载高
   ```bash
   # 检查服务器负载
   top
   htop
   ```

3. DNS 解析问题
   ```bash
   # 使用 IP 而非域名测试
   curl http://192.168.1.100:5244
   ```

**解决**：

- 用局域网 IP 代替公网域名
- 检查服务器资源占用
- 优化服务器配置

## 认证问题

### 问题：用户名或密码错误

**症状**：提示「认证失败」或「401 Unauthorized」

**排查**：

#### 1. 确认用户名密码

```bash
# 查看 OpenList 初始密码
docker logs openlist 2>&1 | grep password

# 重置 OpenList 密码
docker exec -it openlist ./openlist admin set NEW_PASSWORD

# 存量 AList 环境
docker logs alist 2>&1 | grep password
docker exec -it alist ./alist admin set NEW_PASSWORD
```

#### 2. 检查用户权限

在 OpenList/AList 管理界面：
1. 检查用户是否存在
2. 确认用户已启用
3. 验证用户有访问权限

#### 3. 测试认证

```bash
# 使用 curl 测试基本认证
curl -u username:password http://192.168.1.100:5244/dav/music
```

OFPlayer 连接弹窗用用户名和密码。如果你的 WebDAV 服务启用了特殊 Token 规则，先用 curl 验证服务端规则，再换成标准 Basic Auth 账户连 OFPlayer。

## 路径问题

### 问题：找不到音乐文件

**症状**：连接成功，但看不到音乐文件

**排查**：

#### 1. 检查挂载路径

```bash
# 查看 OpenList 数据目录
docker exec -it openlist ls -la /opt/openlist/data/

# 存量 AList 数据目录
docker exec -it alist ls -la /opt/alist/data/
```

#### 2. 验证文件存在

```bash
# 检查音乐目录
ls -la /path/to/your/music

# 检查文件权限
stat /path/to/your/music/song.mp3
```

#### 3. 测试 WebDAV 路径

```bash
# 列出根目录
curl -u username:password http://192.168.1.100:5244/dav/

# 列出音乐目录
curl -u username:password http://192.168.1.100:5244/dav/music
```

### 问题：路径拼接错误

**症状**：提示「路径不存在」或「404 Not Found」

**常见错误**：

| 错误配置 | 正确配置 |
|----------|----------|
| 地址：`http://ip:5244/dav/music`<br>路径：`/music` | 地址：`http://ip:5244/dav`<br>路径：`/music` |
| 地址：`http://ip:5244`<br>路径：`/dav/music` | 地址：`http://ip:5244/dav`<br>路径：`/music` |

**OFPlayer 的路径拼接**：

OFPlayer 按「Endpoint + Root Path」拼 WebDAV 地址。推荐配置：
- Endpoint：`http://ip:5244/dav`
- Root Path：`/music`

## 性能问题

### 问题：扫描速度慢

**症状**：同步音乐库非常耗时

**排查**：

#### 1. 检查网络带宽

```bash
# 测试下载速度
wget -O /dev/null http://192.168.1.100:5244/dav/music/test.mp3

# 使用 iperf 测试局域网速度
iperf3 -s  # 服务器端
iperf3 -c 192.168.1.100  # 客户端
```

#### 2. 检查服务器性能

```bash
# CPU 使用率
top

# 磁盘 I/O
iotop

# 网络连接
netstat -an | grep 5244 | wc -l
```

#### 3. 优化建议

- 使用 SSD 存储音乐
- 减少嵌套目录层级
- 启用服务器端缓存
- 使用有线网络连接

### 问题：播放卡顿

**症状**：音乐播放中断或卡顿

**排查**：

#### 1. 检查实时带宽

```bash
# 监控网络流量
iftop
nethogs
```

#### 2. 检查服务器响应时间

```bash
# 测试 WebDAV 响应时间
time curl -u username:password http://192.168.1.100:5244/dav/music/song.mp3 -o /dev/null
```

#### 3. 优化

- 降低音频质量（转码为 MP3）
- 优先用局域网地址或稳定的 HTTPS 反代
- 错开高峰时段
- 升级网络设备

## 格式问题

### 问题：某些音频格式不支持

**症状**：部分音乐无法播放

**排查**：

#### 1. 检查文件格式

```bash
# 查看文件类型
file song.flac

# 使用 ffprobe 检查音频信息
ffprobe song.flac
```

#### 2. 常见格式支持

| 格式 | OFPlayer 支持 | 备注 |
|------|---------------|------|
| MP3 | ✓ | 哪儿都能播 |
| FLAC | ✓ | 无损 |
| WAV | ✓ | 无损 |
| AAC | ✓ | 苹果设备常用 |
| OGG | ✓ | 开源格式 |
| WMA | ✗ | 建议转码 |
| APE | ✗ | 建议转码 |

#### 3. 格式转换

```bash
# 使用 ffmpeg 转换格式
ffmpeg -i song.wma song.mp3

# 批量转换
for f in *.wma; do ffmpeg -i "$f" "${f%.wma}.mp3"; done
```

### 问题：元数据缺失

**症状**：音乐文件缺少标题、艺术家等信息

**解决**：

#### 1. 用音乐标签编辑器

推荐工具：
- **MusicBrainz Picard**（跨平台）
- **Mp3tag**（Windows）
- **Kid3**（跨平台）

#### 2. 规范文件命名

```
格式参考：
01. 歌曲名.flac
艺术家 - 歌曲名.flac
```

#### 3. 规范目录结构

```
结构参考：
艺术家/专辑/歌曲文件
周杰伦/范特西/01. 爱在西元前.flac
```

## WebDAV 特定问题

### 问题：PROPFIND 请求失败

**症状**：提示「WebDAV request failed with HTTP 405」

**原因**：服务器不支持 WebDAV 协议

**排查**：

1. 确认服务器开启了 WebDAV 支持
2. 检查 WebDAV 路径是否正确
3. OpenList/AList 默认支持 WebDAV，不需要额外开

### 问题：深度遍历失败

**症状**：只能看到一级目录，无法递归扫描

**排查**：

```bash
# 测试 PROPFIND 请求
curl -u username:password \
  -X PROPFIND \
  -H "Depth: infinity" \
  http://192.168.1.100:5244/dav/music
```

**排查**：

- 检查服务器配置是否允许深度遍历
- 减少目录嵌套层级
- 手动指定子目录

## 日志分析

### 查看 OFPlayer 日志

OFPlayer 的连接弹窗会显示主要错误。需要进一步排查的话，打开浏览器开发者工具 Console/Network，重点看这些错误：

```
WebDAV request failed with HTTP 401
WebDAV request failed with HTTP 404
Subsonic request failed with HTTP 401
```

### 查看服务器日志

```bash
# Docker 日志
docker logs -f openlist
# 存量 AList：docker logs -f alist

# 系统日志
journalctl -u openlist -f
# 存量 AList：journalctl -u alist -f
```

### 常见错误码

| HTTP 状态码 | 含义 | 解决 |
|-------------|------|------|
| 401 | 认证失败 | 检查用户名密码 |
| 403 | 权限不足 | 检查用户权限 |
| 404 | 路径不存在 | 检查路径配置 |
| 405 | 方法不允许 | 检查 WebDAV 支持 |
| 500 | 服务器错误 | 检查服务器日志 |

## 高级排查

### 使用 curl 调试

```bash
# 详细输出
curl -v -u username:password http://192.168.1.100:5244/dav/music

# 只看头部
curl -I -u username:password http://192.168.1.100:5244/dav/music

# 测试 PROPFIND
curl -u username:password \
  -X PROPFIND \
  -H "Depth: 1" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?><propfind xmlns="DAV:"><allprop/></propfind>' \
  http://192.168.1.100:5244/dav/music
```

### 使用 Wireshark 抓包

1. 启动 Wireshark
2. 过滤 WebDAV 流量：`http.host == 192.168.1.100`
3. 分析请求和响应

### 检查 SSL/TLS 证书

```bash
# 检查证书有效性
openssl s_client -connect music.example.com:443

# 查看证书详情
openssl x509 -in cert.pem -text -noout
```

## 预防措施

### 定期维护

- 定期备份配置和数据库
- 监控服务器资源使用
- 及时更新软件版本

### 监控告警

设置监控：
- 服务存活检测
- 磁盘空间监控
- 网络连接监控

### 文档记录

记录：
- 服务器配置
- 网络拓扑
- 故障处理流程

## 获取帮助

还没搞定？试试这些：

1. 看官方文档（OpenList：<https://doc.openlist.team/>，Navidrome：<https://www.navidrome.org/docs/>）
2. 搜 GitHub Issues
3. 加入社区讨论
4. 提交 Issue（带上日志）

## 总结

WebDAV 排查记住这几条：

- 从简到繁，别跳步
- 多用命令行验证连接
- 看日志拿详细错误信息
- 记下问题和怎么解决的
- 定期维护，少出问题

---

**参考来源**：
- OpenList 官方文档：<https://doc.openlist.team/>
- OFPlayer WebDAV/Subsonic 适配器：`src/services/externalLibraryAdapters.js`
- OFPlayer 外部库连接弹窗：`src/components/ExternalLibraryDialog.vue`

**相关文章**：
- [AList WebDAV 服务搭建：存量用户参考](./01-alist-webdav-music-server-setup.md)
- [OpenList（AList 社区驱动分支）搭建教程](./02-openlist-setup-guide.md)
- [OFPlayer 连接 WebDAV 音乐库完整指南](./03-ofplayer-webdav-connection-guide.md)
- [用 Navidrome 搭建私人音乐流媒体服务](./04-navidrome-setup-guide.md)
