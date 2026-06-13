本文档面向初学者，详细介绍如何将 CervixDetectAI 微信小程序的后端服务部署到服务器上。我们将从环境准备开始，逐步讲解配置、数据库初始化、服务启动和生产环境优化等关键环节。

## 部署前准备

在开始部署之前，需要确认服务器环境满足以下基本要求。这些要求是后端服务正常运行的基础。

| 环境要求 | 最低版本 | 说明                                                   |
| -------- | -------- | ------------------------------------------------------ |
| Node.js  | ≥ 18.0   | 推荐使用 LTS 版本（如 18.x 或 20.x），自带 `fetch` API |
| MySQL    | ≥ 5.7    | 推荐 8.0+，支持 JSON 字段和更好的字符集                |
| npm      | ≥ 9.0    | 随 Node.js 一起安装                                    |
| 操作系统 | Linux    | 推荐 Ubuntu 20.04+ 或 CentOS 7+                        |

此外，还需要准备以下信息：

- **微信小程序 AppID 和 AppSecret**：从微信公众平台获取
- **MySQL 数据库连接信息**：主机地址、端口、用户名、密码
- **服务器公网 IP 或域名**：用于配置小程序合法域名

Sources: [README.md](server/README.md#L1-L65), [package.json](server/package.json#L1-L20)

## 环境变量配置

环境变量是后端服务的核心配置，包含数据库连接、微信 API 密钥、端口设置等关键信息。正确配置环境变量是服务正常运行的前提。

### 创建环境变量文件

首先，在 `server/` 目录下创建 `.env` 文件。可以从 `.env.example` 文件复制一份作为模板：

```bash
cd server
cp .env.example .env
```

然后编辑 `.env` 文件，填入实际的配置值。以下是完整的环境变量说明：

| 环境变量                      | 必填 | 默认值              | 说明                                                            |
| ----------------------------- | ---- | ------------------- | --------------------------------------------------------------- |
| `PORT`                        | 否   | `3789`              | 服务监听端口                                                    |
| `HOST`                        | 否   | `0.0.0.0`           | 服务监听地址，`0.0.0.0` 表示接受所有网络接口的连接              |
| `MINIAPP_ALLOWED_ORIGIN`      | 否   | `*`                 | CORS 允许的来源，生产环境建议设为小程序域名                     |
| `MINIAPP_PUBLIC_BASE_URL`     | 是   | 空                  | 公网可访问的基础 URL，用于生成头像等静态资源的完整 URL          |
| `WECHAT_APP_ID`               | 是   | 空                  | 微信小程序 AppID                                                |
| `WECHAT_APP_SECRET`           | 是   | 空                  | 微信小程序 AppSecret                                            |
| `WECHAT_REPORT_TEMPLATE_ID`   | 否   | 已有默认值          | 检查报告订阅消息模板 ID                                         |
| `WECHAT_REMINDER_TEMPLATE_ID` | 否   | 已有默认值          | 复查提醒订阅消息模板 ID                                         |
| `WECHAT_MINIPROGRAM_STATE`    | 否   | `formal`            | 小程序状态：`formal` 正式版，`developer` 开发版，`trial` 体验版 |
| `DB_HOST`                     | 是   | `127.0.0.1`         | MySQL 主机地址                                                  |
| `DB_PORT`                     | 否   | `3306`              | MySQL 端口                                                      |
| `DB_NAME`                     | 是   | `cervixdetectai_wx` | 数据库名称                                                      |
| `DB_USER`                     | 是   | `root`              | 数据库用户名                                                    |
| `DB_PASSWORD`                 | 是   | 空                  | 数据库密码                                                      |
| `DB_CONNECTION_LIMIT`         | 否   | `10`                | 数据库连接池最大连接数                                          |

### 环境变量配置示例

以下是一个完整的 `.env` 配置示例：

```bash
# 服务配置
PORT=3789
HOST=0.0.0.0
MINIAPP_ALLOWED_ORIGIN=*
MINIAPP_PUBLIC_BASE_URL=https://xcx.hpvsc.icu

# 微信小程序配置
WECHAT_APP_ID=xxxxxxxxxxxxxxxxxxx
WECHAT_APP_SECRET=your_wechat_appsecret_here
WECHAT_REPORT_TEMPLATE_ID=eZJlyXlekmNOsM1mLn8bcn29P2k-WAXo0XunYj96uSk
WECHAT_REMINDER_TEMPLATE_ID=Mpn-CisfT0yxvsrkrzSfHbZQY7Vr2rwWesquRE-dgn8
WECHAT_MINIPROGRAM_STATE=formal

# 数据库配置
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=cervixdetectai_wx
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_CONNECTION_LIMIT=10
```

**重要提示**：`.env` 文件包含敏感信息，绝对不能提交到代码仓库。项目 `.gitignore` 已配置忽略 `.env` 文件。

Sources: [.env.example](server/.env.example#L1-L18), [env.js](server/src/config/env.js#L1-L26)

## 数据库初始化

数据库是后端服务的数据存储核心。初始化过程包括创建数据库、创建表结构和插入演示数据。

### 创建数据库

如果数据库尚未创建，需要先在 MySQL 中创建数据库。连接到 MySQL 服务器后执行：

```sql
CREATE DATABASE IF NOT EXISTS cervixdetectai_wx
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 执行初始化脚本

项目提供了完整的初始化脚本 `server/database/init.sql`，包含所有表结构和演示数据。执行以下命令：

```bash
mysql -h <数据库主机> -P <数据库端口> -u <用户名> -p cervixdetectai_wx < server/database/init.sql
```

例如，使用本地 MySQL：

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p cervixdetectai_wx < server/database/init.sql
```

### 数据库表结构概览

初始化脚本会创建以下核心表：

| 表名                    | 说明           | 主要字段                                           |
| ----------------------- | -------------- | -------------------------------------------------- |
| `wx_users`              | 用户表         | `id`, `openid`, `nickname`, `avatar_url`           |
| `wx_sessions`           | 登录会话表     | `token`, `user_id`, `expires_at`                   |
| `wx_health_records`     | 健康检查记录表 | `id`, `user_id`, `record_date`, `title`, `project` |
| `wx_reminders`          | 复查提醒表     | `id`, `user_id`, `title`, `remind_date`, `done`    |
| `wx_question_templates` | 问题模板表     | `id`, `content`, `sort_order`                      |
| `wx_user_questions`     | 用户问题表     | `id`, `user_id`, `question_text`, `answer_text`    |
| `wx_articles`           | 健康知识文章表 | `id`, `title`, `summary`, `content`                |
| `wx_feedback`           | 用户反馈表     | `id`, `user_id`, `feedback_type`, `content`        |

### 数据库升级

如果已经存在旧版本数据库，可以使用升级脚本 `server/database/upgrade-login-crud.sql` 来更新表结构：

```bash
mysql -h <数据库主机> -P <数据库端口> -u <用户名> -p cervixdetectai_wx < server/database/upgrade-login-crud.sql
```

升级脚本会检查并添加缺失的字段和索引，不会破坏现有数据。

Sources: [init.sql](server/database/init.sql#L1-L262), [upgrade-login-crud.sql](server/database/upgrade-login-crud.sql#L1-L162)

## 安装依赖与启动服务

完成环境变量配置和数据库初始化后，就可以安装依赖并启动服务了。

### 安装 Node.js 依赖

在 `server/` 目录下执行：

```bash
npm install
```

这会根据 `package.json` 安装以下核心依赖：

| 依赖包    | 版本    | 说明                       |
| --------- | ------- | -------------------------- |
| `express` | ^4.18.3 | Web 框架                   |
| `mysql2`  | ^3.11.5 | MySQL 客户端，支持 Promise |
| `cors`    | ^2.8.5  | CORS 中间件                |
| `helmet`  | ^7.1.0  | 安全头中间件               |
| `morgan`  | ^1.10.0 | HTTP 请求日志              |
| `dotenv`  | ^16.4.7 | 环境变量加载               |

Sources: [package.json](server/package.json#L1-L20)

### 启动服务

#### 开发模式启动

```bash
npm run dev
```

这等同于 `node src/app.js`，会在前台运行服务，日志直接输出到终端。适合开发调试。

#### 后台运行（开发演示）

如果需要在后台运行服务，可以使用 `nohup`：

```bash
nohup node src/app.js > server.log 2>&1 &
```

这会将服务放到后台运行，并将日志输出到 `server.log` 文件。

### 验证服务状态

服务启动后，可以通过健康检查接口验证服务是否正常运行：

```bash
curl http://localhost:3789/health
```

正常响应应该返回：

```json
{
  "ok": true,
  "service": "cervixdetectai-wx-server",
  "mysql": "enabled",
  "database": "cervixdetectai_wx"
}
```

### 代码语法检查

项目提供了语法检查命令，可以验证所有源文件是否有语法错误：

```bash
npm run check
```

这会使用 `node --check` 检查所有核心源文件。

Sources: [app.js](server/src/app.js#L1-L49), [package.json](server/package.json#L1-L20)

## 生产环境部署

生产环境部署需要考虑进程管理、反向代理、HTTPS、日志和监控等方面。以下是推荐的生产环境部署方案。

### 方案一：使用 PM2 进程管理

PM2 是 Node.js 应用最流行的进程管理器，提供自动重启、日志管理、集群模式等功能。

#### 安装 PM2

```bash
npm install -g pm2
```

#### 使用 PM2 启动服务

```bash
cd server
pm2 start src/app.js --name cervixdetectai-server
```

#### PM2 常用命令

| 命令                                | 说明             |
| ----------------------------------- | ---------------- |
| `pm2 list`                          | 查看所有进程状态 |
| `pm2 logs cervixdetectai-server`    | 查看实时日志     |
| `pm2 restart cervixdetectai-server` | 重启服务         |
| `pm2 stop cervixdetectai-server`    | 停止服务         |
| `pm2 delete cervixdetectai-server`  | 删除进程         |
| `pm2 save`                          | 保存当前进程列表 |
| `pm2 startup`                       | 生成开机自启脚本 |

#### PM2 配置文件（可选）

创建 `ecosystem.config.js` 文件可以更精细地控制 PM2：

```javascript
module.exports = {
  apps: [
    {
      name: "cervixdetectai-server",
      script: "src/app.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3789,
      },
    },
  ],
};
```

然后使用配置文件启动：

```bash
pm2 start ecosystem.config.js
```

### 方案二：使用 systemd 管理服务

systemd 是 Linux 系统的服务管理器，适合需要系统级服务管理的场景。

#### 创建 systemd 服务文件

创建文件 `/etc/systemd/system/cervixdetectai.service`：

```ini
[Unit]
Description=CervixDetectAI WeChat Mini Program Server
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/CervixDetectAI_wx/server
EnvironmentFile=/path/to/CervixDetectAI_wx/server/.env
ExecStart=/usr/bin/node src/app.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=cervixdetectai

[Install]
WantedBy=multi-user.target
```

#### 启用并启动服务

```bash
sudo systemctl daemon-reload
sudo systemctl enable cervixdetectai
sudo systemctl start cervixdetectai
sudo systemctl status cervixdetectai
```

### 方案三：使用 Docker 容器化部署

Docker 可以将应用及其依赖打包成容器，便于部署和迁移。

#### 创建 Dockerfile

在 `server/` 目录下创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 创建上传目录
RUN mkdir -p uploads/avatars

# 暴露端口
EXPOSE 3789

# 启动命令
CMD ["node", "src/app.js"]
```

#### 创建 docker-compose.yml

在项目根目录创建 `docker-compose.yml`：

```yaml
version: "3.8"

services:
  server:
    build: ./server
    ports:
      - "3789:3789"
    environment:
      - PORT=3789
      - HOST=0.0.0.0
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=cervixdetectai_wx
      - DB_USER=root
      - DB_PASSWORD=your_password
      - WECHAT_APP_ID=your_app_id
      - WECHAT_APP_SECRET=your_app_secret
      - MINIAPP_PUBLIC_BASE_URL=https://your-domain.com
    depends_on:
      - mysql
    volumes:
      - ./server/uploads:/app/uploads
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=your_password
      - MYSQL_DATABASE=cervixdetectai_wx
    volumes:
      - mysql_data:/var/lib/mysql
      - ./server/database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"
    restart: unless-stopped

volumes:
  mysql_data:
```

#### 使用 Docker Compose 启动

```bash
docker-compose up -d
```

## 反向代理配置（Nginx）

生产环境强烈建议使用 Nginx 作为反向代理，主要作用包括：

- 终结 HTTPS（SSL/TLS 加密）
- 负载均衡
- 静态资源缓存
- 请求限流
- 日志记录

### 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install epel-release
sudo yum install nginx
```

### 配置 Nginx

创建 Nginx 配置文件 `/etc/nginx/sites-available/cervixdetectai`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;  # 替换为你的域名

    # SSL 证书配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # SSL 优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 请求大小限制（头像上传需要）
    client_max_body_size 5m;

    # 代理到 Node.js 服务
    location / {
        proxy_pass http://127.0.0.1:3789;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源缓存
    location /uploads/ {
        proxy_pass http://127.0.0.1:3789;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, immutable";
    }

    # 健康检查端点
    location /health {
        proxy_pass http://127.0.0.1:3789;
        access_log off;
    }
}
```

### 启用配置

```bash
sudo ln -s /etc/nginx/sites-available/cervixdetectai /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置语法
sudo systemctl reload nginx
```

### SSL 证书配置

推荐使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加以下行（每天检查两次）
0 0,12 * * * /usr/bin/certbot renew --quiet
```

Sources: [app.js](server/src/app.js#L1-L49), [avatar-storage.service.js](server/src/services/avatar-storage.service.js#L1-L104)

## 微信小程序域名配置

部署到公网后，需要在微信公众平台配置合法域名，否则小程序无法访问后端接口。

### 配置合法域名

登录微信公众平台，进入「开发」→「开发管理」→「开发设置」→「服务器域名」，配置以下域名：

| 配置项                | 说明         | 示例                    |
| --------------------- | ------------ | ----------------------- |
| request 合法域名      | API 请求域名 | `https://xcx.hpvsc.icu` |
| uploadFile 合法域名   | 文件上传域名 | `https://xcx.hpvsc.icu` |
| downloadFile 合法域名 | 文件下载域名 | `https://xcx.hpvsc.icu` |

**注意**：

- 域名必须使用 HTTPS
- 域名不能使用 IP 地址
- 域名不能带端口号
- 域名需要完成 ICP 备案

### 配置小程序 API 地址

编辑 `miniprogram/config/app.js` 文件，配置正确的 API 地址：

```javascript
module.exports = {
  // ... 其他配置
  apiBaseUrl: "https://xcx.hpvsc.icu/api/miniapp",
  devtoolsApiBaseUrl: "https://xcx.hpvsc.icu/api/miniapp",
  deviceApiBaseUrl: "https://xcx.hpvsc.icu/api/miniapp",
  productionApiBaseUrl: "https://xcx.hpvsc.icu/api/miniapp",
  // ... 其他配置
};
```

Sources: [config/app.js](miniprogram/config/app.js#L1-L15)

## 部署后验证

部署完成后，需要进行全面的验证，确保服务正常运行。

### 1. 验证服务状态

```bash
# 检查服务进程
ps aux | grep node

# 检查端口监听
netstat -tlnp | grep 3789

# 检查健康状态
curl -k https://your-domain.com/health
```

### 2. 验证数据库连接

```bash
# 测试数据库连接
mysql -h <数据库主机> -P <数据库端口> -u <用户名> -p -e "SELECT 1"

# 检查数据库表
mysql -h <数据库主机> -P <数据库端口> -u <用户名> -p cervixdetectai_wx -e "SHOW TABLES"
```

### 3. 验证 API 接口

```bash
# 测试公开接口
curl https://your-domain.com/api/miniapp/articles

# 测试需要认证的接口（需要有效 token）
curl -H "Authorization: Bearer <token>" https://your-domain.com/api/miniapp/home
```

### 4. 验证静态资源

```bash
# 测试头像上传目录
curl -I https://your-domain.com/uploads/avatars/
```

## 常见问题排查

以下是部署过程中可能遇到的常见问题及解决方案。

| 问题             | 可能原因                         | 解决方案                                                       |
| ---------------- | -------------------------------- | -------------------------------------------------------------- |
| 服务无法启动     | 端口被占用                       | 检查端口占用：`lsof -i :3789`，停止占用进程或修改端口          |
| 数据库连接失败   | 数据库配置错误                   | 检查 `.env` 中的数据库配置，确保数据库服务已启动               |
| 微信登录失败     | AppID/AppSecret 错误             | 检查 `.env` 中的微信配置，确保与微信公众平台一致               |
| 头像无法显示     | `MINIAPP_PUBLIC_BASE_URL` 未配置 | 设置正确的公网 URL，确保能通过公网访问                         |
| 接口 401 错误    | Token 过期或无效                 | 检查 `wx_sessions` 表，确保 `expires_at` 在有效期内            |
| 接口 403 错误    | 域名未配置                       | 在微信公众平台配置合法域名                                     |
| 接口 502 错误    | Nginx 无法连接后端               | 检查 Node.js 服务是否运行，检查 Nginx 配置                     |
| 头像上传失败     | 目录权限问题                     | 确保 `uploads/avatars/` 目录可写：`chmod 755 uploads/avatars/` |
| 订阅消息发送失败 | 模板 ID 错误或用户未订阅         | 检查模板 ID，确保用户已订阅消息                                |

## 安全建议

### 环境变量安全

- 使用强密码作为 `DB_PASSWORD` 和 `WECHAT_APP_SECRET`
- 定期轮换密钥
- 限制 `.env` 文件权限：`chmod 600 .env`

### 数据库安全

- 使用强密码
- 限制数据库访问 IP
- 定期备份数据库

### 服务安全

- 使用 HTTPS
- 配置防火墙，只开放必要端口
- 定期更新 Node.js 和依赖包
- 监控服务日志

### 备份策略

建议制定以下备份策略：

| 备份内容 | 备份频率 | 备份方式             |
| -------- | -------- | -------------------- |
| 数据库   | 每天     | `mysqldump` 逻辑备份 |
| 上传文件 | 每天     | 文件级备份           |
| 配置文件 | 变更时   | 版本控制             |
| 应用代码 | 变更时   | Git                  |

## 下一步

完成部署后，建议继续阅读以下文档：

- [微信小程序提审指南](6-wei-xin-xiao-cheng-xu-ti-shen-zhi-nan)：了解如何提交小程序审核
- [系统分层架构](8-xi-tong-fen-ceng-jia-gou)：深入了解后端架构设计
- [数据库表结构设计](19-shu-ju-ku-biao-jie-gou-she-ji)：了解数据库详细设计
- [鉴权机制与会话管理](18-jian-quan-ji-zhi-yu-hui-hua-guan-li)：了解用户认证机制

如果遇到部署问题，可以参考 [环境搭建与运行](2-huan-jing-da-jian-yu-yun-xing) 文档中的常见问题解答。
