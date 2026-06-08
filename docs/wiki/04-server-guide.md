# 04 · 后端指南

> 范围：`server/` 目录下的 Express 服务。

## 4.1 启动与配置

### 入口 [src/app.js](../../server/src/app.js)

- 装载中间件：`helmet`（cross-origin 静态资源策略）/ `cors` / `express.json`（3MB 上限）/ `morgan`
- 静态资源：`/uploads` 指向 `server/uploads`，并显式设置 `Cross-Origin-Resource-Policy: cross-origin` 与 `Access-Control-Allow-Origin: *`
- 健康检查：`GET /health` → `{ ok, service, mysql, database }`
- 业务路由：`/api/miniapp` 挂载到 [routes/miniapp.js](../../server/src/routes/miniapp.js)
- 统一 404 + 错误处理：[middleware/errorHandler.js](../../server/src/middleware/errorHandler.js)
- 启动：`npm run dev` = `node src/app.js`，监听 `0.0.0.0:3789`（端口可由 `PORT` 覆盖）
- 静态检查：`npm run check` 对所有源文件做 `node --check`

### 环境变量 [config/env.js](../../server/src/config/env.js)

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3789` | 监听端口 |
| `HOST` | `0.0.0.0` | 监听地址 |
| `MINIAPP_ALLOWED_ORIGIN` | `*` | CORS 允许来源 |
| `MINIAPP_PUBLIC_BASE_URL` | 空 | 头像返回 URL 的前缀（建议公网 HTTPS 域名） |
| `WECHAT_APP_ID` | 空 | 微信小程序 AppID（必填） |
| `WECHAT_APP_SECRET` | 空 | 微信小程序 AppSecret（必填） |
| `DB_HOST` | `127.0.0.1` | MySQL 主机 |
| `DB_PORT` | `3306` | MySQL 端口 |
| `DB_NAME` | `cervixdetectai_wx` | 数据库名 |
| `DB_USER` | `root` | 用户 |
| `DB_PASSWORD` | 空 | 密码 |
| `DB_CONNECTION_LIMIT` | `10` | 连接池上限 |

> ⚠️ 生产环境必须显式提供 `WECHAT_APP_ID`、`WECHAT_APP_SECRET` 与 `MINIAPP_PUBLIC_BASE_URL`，否则登录或头像外链会失败。

### 数据库连接 [config/database.js](../../server/src/config/database.js)

- 单例 `mysql.createPool(env.database)`
- `query(sql, params)` 封装 `pool.execute`，返回首行首列结构

## 4.2 路由层 [routes/miniapp.js](../../server/src/routes/miniapp.js)

- 全部返回 `{ success: true, data }`；错误由 `errorHandler` 统一包装
- 用 `asyncRoute` 把 handler 包成 try/catch
- 路由分组：
  - **公开**：`POST /auth/login`、`GET /question-templates`、`GET /articles`
  - **鉴权后**（`router.use(authenticate)`）：个人资料、首页摘要、记录、提醒、个人问题清单、站内反馈
- 详细字段见 [06 接口参考](./06-api-reference.md)

## 4.3 中间件

### [middleware/auth.js](../../server/src/middleware/auth.js)

- 解析 `Authorization: Bearer <token>`
- 调 `miniappService.getSessionByToken(token)` 查 `wx_sessions`
- 命中则把 `req.user = { id, token }` 注入；未命中返回 401

### [middleware/errorHandler.js](../../server/src/middleware/errorHandler.js)

- `notFoundHandler`：返回 `{ success: false, message: '接口不存在' }`
- `errorHandler`：根据 `error.status` 输出 `success:false + message`；`>=500` 统一文案「服务暂时不可用，请稍后再试」

## 4.4 服务层 [services/miniapp.service.js](../../server/src/services/miniapp.service.js)

### 合规校验

- `PROHIBITED_SERVICE_TERMS` 列出 10 个禁止词
- `assertComplianceText(text, fieldName)`：命中时抛 400
- 应用场景：
  - 登录昵称
  - 修改资料（昵称）
  - 反馈的 `content` 与 `contact`
  - 记录 / 提醒 / 问题的所有文本字段

### 文本与日期工具

- `cleanText(value, maxLength)`：去首尾空白 + 截断
- `requireText(value, fieldName, maxLength)`：必填校验 + 合规校验
- `requireDate(value, fieldName)`：要求 `YYYY-MM-DD` 格式且真实日期
- `normalizeDone(value)`：接受布尔/数字/字符串
- `normalizeQuestions(questions)`：去空 + 截断最多 20 条
- 三个 `normalizeXxxPayload`：记录 / 提醒 / 问题的字段归一化

### 主要业务方法

| 方法 | 入参 | 行为 |
|------|------|------|
| `login` | `{ code, deviceId, openid, nickname, avatarUrl, phone }` | 委派 repository；登录昵称会做合规校验 |
| `getSessionByToken` | `token` | 委派 repository |
| `getMe` / `updateProfile` | `userId` / `{ nickname, avatarUrl }` | profile 修改会做昵称合规校验 |
| `uploadAvatar` | `req, { avatarBase64, fileType }` | 调 `avatarStorage.saveAvatar` 落盘，更新 `avatarUrl` |
| `getHome` | `userId` | 委派 repository |
| 记录 CRUD | `userId` + payload | 入参全部经 `normalizeRecordPayload` |
| 提醒 CRUD + `completeReminder` | `userId` + payload | 入参经 `normalizeReminderPayload` |
| `listQuestionTemplates` | - | 委派 repository |
| 问题 CRUD / `saveQuestions` | `userId` + payload | 批量保存会先归一化再去重截断 |
| `listArticles` | - | 委派 repository |
| `createFeedback` | `userId, { type, contact, content }` | `type` 限定为前端枚举兜底到“其他反馈”，`content` 走 `requireText`，`contact` 可为空 |

## 4.5 头像存储 [services/avatar-storage.service.js](../../server/src/services/avatar-storage.service.js)

- `decodeAvatar`：校验 `fileType` ∈ `image/jpeg | image/png | image/webp`，校验 base64 不为空，校验大小 ≤ 2MB，并比对文件签名避免伪造 MIME
- `saveAvatar`：写入 `server/uploads/avatars/<userId>-<timestamp>-<rand6>.<ext>`
- 返回值：`<publicBaseUrl>/uploads/avatars/<filename>`
- `publicBaseUrl` 优先取 `MINIAPP_PUBLIC_BASE_URL`，否则使用 `req.protocol://req.get("host")`

## 4.6 仓库层 [repositories/miniapp.repository.js](../../server/src/repositories/miniapp.repository.js)

### 通用

- `createCompactId()`：`crypto.randomUUID().replace(/-/g, "")`（用于记录 / 提醒的 32 字符主键）
- `createToken()`：`crypto.randomBytes(32).toString("hex")`（用于会话）
- 行映射器：`mapUser` / `mapRecord` / `mapReminder` / `mapQuestion`，把下划线字段转成驼峰 + 格式化日期

### 登录与会话 [login / getSessionByToken]

- `requestWechatSession(code)`：调 `https://api.weixin.qq.com/sns/jscode2session` 换取 openid；区分 `40029/40163`（凭证失效）、`40125`（AppSecret 无效） 等错误
- `login`：upsert `wx_users`（按 `openid` 唯一键），新写一行 `wx_sessions`（30 天有效期）

### 用户 / 资料

- `findUserById` / `getMe` / `updateProfile`

### 首页摘要 `getHome(userId)`

- 拉 `nickname` + 最近一条 `wx_health_records`（按 `record_date DESC, created_at DESC`）+ 最早一条 `wx_reminders`（`done=0`，按 `remind_date ASC`）+ 统计 `wx_health_records` 与 `wx_reminders` 数量
- 输出：`{ userName, latestTitle, latestDate, latestSummary, nextReminder, disclaimer, metrics[3] }`

### 记录 CRUD

- `listRecords` / `getRecordById` / `createRecord` / `updateRecord` / `deleteRecord`
- 主键策略：自生成 `createCompactId()`，关联 `user_id`

### 提醒 CRUD

- `listReminders`（按 `done ASC, remind_date ASC, created_at DESC`）
- `getReminderById` / `createReminder`（`done=1` 时记录 `completed_at`）
- `updateReminder`（同样规则同步 `completed_at`）
- `completeReminder`（强制 `done=1` + `completed_at=NOW()`）
- `deleteReminder`

### 问题

- `listQuestionTemplates`：按 `sort_order, id` 升序
- `listQuestions` / `getQuestionById` / `createQuestion` / `updateQuestion` / `deleteQuestion`
- `saveQuestions`：循环 `createQuestion`，返回 `{ questions: createdQuestions }`

### 知识 / 反馈

- `listArticles`：`is_active=1` 排序
- `createFeedback`：写入 `wx_feedback`，主键 `crypto.randomUUID()`

## 4.7 后端依赖图

```text
routes/miniapp.js
   ├─ services/miniapp.service.js
   │     ├─ repositories/miniapp.repository.js
   │     │     └─ config/database.js
   │     │           └─ config/env.js
   │     └─ services/avatar-storage.service.js
   │           └─ config/env.js
   ├─ middleware/auth.js
   │     └─ services/miniapp.service.js (getSessionByToken)
   └─ middleware/errorHandler.js
```

## 4.8 安全与边界

- `helmet` 提供基础安全头
- CORS 默认 `*`（可收紧到具体来源）
- 不存储用户的微信 `session_key`（仅一次性换取 openid）
- 头像走 base64 + 大小/MIME 校验 + 文件名随机后缀
- 业务层不返回「诊断、治疗方案、问诊内容」字段；合规模型限制在 `services/miniapp.service.js`
- 401 之后前端主动清空本地 token，但后端 token 仍会保留到自然过期；如需主动失效可加 `DELETE /api/miniapp/auth/logout` 扩展
