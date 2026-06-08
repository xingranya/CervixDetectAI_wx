# 02 · 系统架构

## 2.1 整体分层

```text
┌──────────────────────────────────────────────────────────────┐
│  微信小程序 (miniprogram)                                    │
│  ─ Pages / Subpackages / Components / Utils                 │
│     - utils/request.js: 统一 wx.request 封装 + 内存缓存     │
│     - utils/navigation.js: 路由封装 + 集中路径常量           │
│     - utils/page-state.js: 加载/就绪/空/错误 四态机          │
│     - utils/feedback.js: Toast / Modal                       │
│     - utils/avatar.js: 头像本地路径与 base64 互转            │
│     - utils/form.js: 提交期间 loading 锁                     │
└──────────────┬───────────────────────────────────────────────┘
               │ HTTPS / wx.request（Bearer Token）
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Node API (server)                                           │
│  ─ Express + helmet + cors + morgan                          │
│     - routes/miniapp.js        → 仅做入参出参                 │
│     - middleware/auth.js       → Bearer Token 校验           │
│     - middleware/errorHandler  → 统一 4xx/5xx 响应            │
│     - services/miniapp.service → 业务校验、合规词拦截         │
│     - services/avatar-storage  → 头像解码、落盘、外链生成     │
│     - repositories/...         → MySQL CRUD                   │
└──────────────┬───────────────────────────────────────────────┘
               │ mysql2 / promise pool
               ▼
┌──────────────────────────────────────────────────────────────┐
│  MySQL: cervixdetectai_wx                                   │
│  wx_users / wx_sessions / wx_health_records / wx_reminders  │
│  wx_question_templates / wx_user_questions / wx_articles    │
│  wx_feedback                                                │
└──────────────────────────────────────────────────────────────┘
               ▲
               │ 静态资源 /uploads/avatars/*
┌──────────────┴───────────────────────────────────────────────┐
│  server/uploads  (头像文件保存)                              │
└──────────────────────────────────────────────────────────────┘
```

## 2.2 请求时序（登录 + 写记录示例）

```text
用户点击「新增检查记录」
        │
        ▼
Page.record-form#submitForm
        │
        │ withPageLoading(this, async () => { ... })
        ▼
utils/request#request  ──  Authorization: Bearer <token>  ──▶
        │
        ▼
POST /api/miniapp/records  ──  routes/miniapp.js
        │
        ▼
services/miniapp.service#createRecord
        │ • normalizeRecordPayload
        │ • requireDate / requireText / assertComplianceText
        ▼
repositories/miniapp.repository#createRecord
        │ • INSERT INTO wx_health_records ...
        │ • mapRecord(row)
        ▼
返回 { success: true, data: record } ─────────────▶
        ▼
Page.record-form
        │ • setCachedData(recordDetail, res)
        │ • upsertCachedListItem(records, saved)
        │ • markCacheDirty(home)         // 下次回首页自动刷新
        │ • navigateBackLater()
        ▼
上一页 onShow 检测到 records 缓存失效 → 重新拉取 → setData
```

## 2.3 缓存模型

[utils/request.js](../../miniprogram/utils/request.js) 维护了三块运行时数据：

| 名称 | 作用 | 关键 API |
|------|------|----------|
| `responseCache` | GET 请求的内存缓存，按 `cacheKey` 索引 | `setCachedData` / `getCachedData` / `isCacheFresh` |
| `inflightRequests` | 同一 GET 请求复用 in-flight Promise，避免抖动 | `request` 内部 |
| `responseCache[i].dirty` | 标记某条目为脏，下次访问时强制刷新 | `markCacheDirty` / `consumeCacheDirty` |

约定：

- `CACHE_KEYS.home` 60s 缓存；`articles`、`questionTemplates` 5 分钟缓存；其他默认 30s
- 写操作（POST/PUT/PATCH/DELETE）成功后调用 `upsertCachedListItem` / `updateCachedListItem` / `removeCachedListItem`，并对首页摘要 `markCacheDirty(CACHE_KEYS.home)`，让首页在下次显示时按需刷新
- 401 状态码：清空 token + user + 全量缓存，`wx.reLaunch` 到登录页

## 2.4 登录态与 Token

- 登录成功后，小程序把 `token` 写入 `wx.setStorageSync("token", ...)`，把规范化后的 `user` 写入 `wx.setStorageSync("user", ...)`。
- 所有受保护接口的请求头：`Authorization: Bearer <token>`。
- 后端中间件 [auth.js](../../server/src/middleware/auth.js) 解析 Bearer，查询 `wx_sessions`，将 `req.user = { id, token }` 注入。
- 失效：会话过期 / token 错误 → 401 → 小程序跳转登录页并清空本地存储。

## 2.5 环境分流

- 前端 [config/app.js](../../miniprogram/config/app.js) 暴露 4 个 API 根地址：
  - `apiBaseUrl`（默认值）
  - `devtoolsApiBaseUrl`（开发者工具）
  - `deviceApiBaseUrl`（同 WiFi 真机）
  - `productionApiBaseUrl`（体验版/正式版，必须 HTTPS）
- `request.js#resolveBaseUrl` 通过 `wx.getAccountInfoSync().miniProgram.envVersion` 判断：非 `develop` 一律走 `productionApiBaseUrl`，其余情况按 `platform === 'devtools'` 在 `devtoolsApiBaseUrl` 与 `deviceApiBaseUrl` 之间切换。

## 2.6 错误与状态机

- 页面级通用状态：`loading / ready / empty / error`（[utils/page-state.js](../../miniprogram/utils/page-state.js)）。
- 网络错误：先返回陈旧缓存（如有），同时通过 Toast 提示用户。
- 业务错误：服务层抛出 `error.status = 400/401/500`，[errorHandler.js](../../server/src/middleware/errorHandler.js) 统一返回 `{ success: false, message }`。
- 合规词拦截：服务层命中 `PROHIBITED_SERVICE_TERMS` 即抛 400，前端弹出 Toast。

## 2.7 静态资源

- 后端把 `server/uploads/` 通过 `app.use("/uploads", express.static(...))` 暴露。
- 头像下载被小程序 `<image>` 跨域访问，因此显式设置 `Cross-Origin-Resource-Policy: cross-origin` 与 `Access-Control-Allow-Origin: *`。
- 上线时建议将 `MINIAPP_PUBLIC_BASE_URL` 配置为公网 HTTPS 域名，让头像地址可以被外网访问。

## 2.8 关键依赖关系

| 上游 | 下游 | 说明 |
|------|------|------|
| 任意 Page | `utils/request` | 全部 HTTP 入口 |
| 任意 Page | `utils/navigation` | 路由跳转 + 集中路径常量 |
| 任意 Page | `utils/page-state` | 列表/详情状态判定 |
| 任意 Page | `utils/feedback` | 错误/成功提示 |
| 登录页 | `utils/avatar` | 临时头像持久化与 base64 编码 |
| `reminder-form` | `packages/reminders/utils/subscription` | 微信订阅消息封装 |
| `routes/miniapp` | `services/miniapp` | 业务编排 |
| `services/miniapp` | `repositories/miniapp` | SQL 调用 |
| `services/miniapp` | `services/avatar-storage` | 头像保存到 `uploads/avatars/` |
| `routes/miniapp`（除 `/auth/login`） | `middleware/auth` | 受保护接口统一拦截 |
