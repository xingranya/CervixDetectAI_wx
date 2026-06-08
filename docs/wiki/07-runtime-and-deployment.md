# 07 · 运行与部署

## 7.1 准备

### 依赖

- Node.js（建议 ≥ 18，自带 `fetch`，无需 `node-fetch`）
- MySQL ≥ 5.7（或 8.0+）
- 微信开发者工具（用于打开 `miniprogram/`）

### 仓库

```text
CervixDetectAI_wx/
├── miniprogram/   # 微信小程序
├── server/        # Node API
└── docs/          # 提审 + Wiki
```

## 7.2 后端启动

### 安装依赖

```bash
cd server
npm install
```

`.env` 示例（参考 `.env.example`）：

```text
PORT=3789
HOST=0.0.0.0
MINIAPP_ALLOWED_ORIGIN=*
MINIAPP_PUBLIC_BASE_URL=https://your-domain.example.com

WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=xxxxxxxxxxxxxxxx

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=cervixdetectai_wx
DB_USER=root
DB_PASSWORD=your_password
DB_CONNECTION_LIMIT=10
```

### 初始化数据库

```bash
mysql -h <host> -P <port> -u <user> -p cervixdetectai_wx < server/database/init.sql
```

或在控制台已建库的情况下执行老库升级：

```bash
mysql -h <host> -P <port> -u <user> -p cervixdetectai_wx < server/database/upgrade-login-crud.sql
```

### 启动

```bash
cd server
npm run dev      # = node src/app.js
```

或后台运行（开发演示用）：

```bash
nohup node src/app.js > server.log 2>&1 &
```

### 校验

```bash
npm run check    # 对所有源文件做 node --check
```

### 健康检查

```bash
curl http://<host>:3789/health
# { "ok": true, "service": "cervixdetectai-wx-server", "mysql": "enabled", "database": "cervixdetectai_wx" }
```

## 7.3 小程序调试

### 1. 打开项目

- 启动微信开发者工具
- 导入 `miniprogram/` 目录
- AppID 使用 [project.config.json](../../project.config.json) 中配置的小程序 AppID；服务端 `.env` 的 `WECHAT_APP_ID` 必须与它一致。

### 2. 配置 API 地址

按 [miniprogram/config/app.js](../../miniprogram/config/app.js) 维护：

| 场景 | 字段 | 备注 |
|------|------|------|
| 开发者工具（电脑 localhost） | `devtoolsApiBaseUrl` | 默认 `https://xcx.hpvsc.icu/api/miniapp` |
| 同 WiFi 真机 | `deviceApiBaseUrl` | 改为电脑局域网 IP，如 `http://192.168.1.10:3789/api/miniapp` |
| 体验版 / 正式版 | `productionApiBaseUrl` | 公网 HTTPS 域名 |
| 全局默认 | `apiBaseUrl` | 兜底 |

注意：真机无法访问电脑 `localhost`，同 WiFi 调试时需使用局域网 IP。

### 3. 真机登录

- 触发 `wx.login` 拿到 `code`
- 后端走 `code2Session` 换 `openid` → 返回自定义 token
- 头像用 `open-type="chooseAvatar"` + 昵称 `type="nickname"`，登录页会把临时头像转 base64 上传到 `/me/avatar`
- 如出现 `chooseAvatar:fail api scope is not declared in the privacy agreement`，需在小程序后台「用户隐私保护指引」中声明头像用途
- 部署到公网时务必设置 `MINIAPP_PUBLIC_BASE_URL`，否则头像外链是内网地址

## 7.4 后端生产部署建议

- **进程管理**：使用 `pm2` / `systemd` / `Docker` 守护 `node src/app.js`
- **反向代理**：建议使用 Nginx 终结 HTTPS，再把流量代理到 `127.0.0.1:3789`
  - `client_max_body_size 5m;`（允许上传更大头像/反馈，但小程序侧限制 2MB）
  - `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`（`app.set('trust proxy', 1)` 已开启）
- **HTTPS 证书**：使用 Let's Encrypt / 阿里云免费证书
- **MySQL**：建议内网部署；连接池上限可按并发量调整
- **静态资源**：
  - 头像落盘到 `uploads/avatars/`
  - 上线初期可直接交给 Express 静态托管
  - 数据量增长后可迁移到对象存储（OSS/COS/S3），同步修改 `avatarStorage.saveAvatar` 与 `MINIAPP_PUBLIC_BASE_URL`
- **环境变量**：用 `.env` 注入；切勿把 `.env` 提交到仓库
- **日志**：`morgan('dev')` 在生产可改为 `combined` 写到文件
- **监控**：建议至少暴露 `/health` 给负载均衡探针

## 7.5 小程序发布

按 [docs/submission-checklist.md](../submission-checklist.md) 与 [docs/category-guide.md](../category-guide.md)：

1. 后台类目：工具 / 健康管理
2. 配置 `productionApiBaseUrl` 为公网 HTTPS 域名
3. 在小程序后台加入：
   - request 合法域名
   - uploadFile 合法域名
   - downloadFile 合法域名（用于头像）
4. 配置订阅消息模板 ID（如需微信服务通知）
5. 隐私保护指引声明头像、昵称、健康记录、提醒、反馈等用途
6. 提交前自检：搜索禁用词、确保首屏是首页不强制登录
7. 提交审核并跟踪结果

## 7.6 常见问题

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 登录后立即掉登录 | 401 / 会话过期 | 检查 `wx_sessions` 的 `expires_at` 是否在 30 天内；前端 token 同步更新 |
| 头像不显示 | 头像 URL 是内网 IP / HTTPS 头缺失 | 设置 `MINIAPP_PUBLIC_BASE_URL` 为公网域名；Nginx 启用 HTTPS |
| `chooseAvatar:fail api scope is not declared in the privacy agreement` | 隐私协议未声明头像用途 | 在微信后台用户隐私保护指引里补充；隐私弹层兜底 |
| 接口 `url not in domain list` | 后台未配置合法域名 | 把后端域名加入小程序 request/uploadFile/downloadFile 合法域名 |
| 反馈提交报 400 包含禁用词 | 合规模型拦截 | 按 [submission-checklist.md](../submission-checklist.md) 改写为「健康记录、复查提醒、线下咨询准备」类描述 |
| 启动报 `WECHAT_APP_SECRET` 相关错误 | 没配置 | 在 `.env` 中补充 `WECHAT_APP_SECRET` |
| 数据库连不上 | 端口/账号/防火墙 | `mysql -h ... -P ... -u ... -p` 自测；确认 `DB_HOST` 走的是内网地址 |

## 7.7 目录权限与备份

- `server/uploads/avatars/`：需要可写权限；建议每日做文件级备份
- MySQL：建议每日逻辑备份（`mysqldump`），增量备份视情况
- `.env`：限制为 `chmod 600`，不要入仓
