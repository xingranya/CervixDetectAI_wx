# 03 · 小程序端指南

> 范围：`miniprogram/` 目录下的所有页面、组件、分包与工具函数。

## 3.1 全局配置

### [app.json](../../miniprogram/app.json)

- **主包页面**：`pages/home/index`（默认首屏）、`pages/login/index`、`pages/records/index`、`pages/reminders/index`、`pages/profile/index`
- **分包**（4 个）：
  - `packages/records`：`record-detail` / `record-form`
  - `packages/reminders`：`reminder-form`
  - `packages/tools`：`questions` / `articles`
  - `packages/profile`：`privacy` / `compliance` / `feedback`
- **预加载**：`pages/home/index` 预加载 `packages/records + packages/reminders + packages/tools`；`pages/profile/index` 预加载 `packages/profile`
- **TabBar**：首页 / 记录 / 提醒 / 我的（与主包 4 个页面一一对应）
- 全局开关：`style: v2`、`lazyCodeLoading: requiredComponents`、`__usePrivacyCheck__: true`

### [app.js](../../miniprogram/app.js)

- 启动时生成 `deviceId`（持久化到 `wx.storage`），并监听网络状态/小程序更新
- `globalData` 暴露 `apiBaseUrl` 系列、AppID、应用名、是否在线、是否有新版本

### [config/app.js](../../miniprogram/config/app.js)

- 4 套 API 根地址 + `requestTimeout`（12s）
- `subscriptionTemplateIds.reminder`：订阅消息模板 ID（如未配置，提醒页会显示「服务通知模板配置后，可在这里开启微信提醒。」）

## 3.2 工具函数（utils）

| 文件 | 关键导出 | 说明 |
|------|----------|------|
| [request.js](../../miniprogram/utils/request.js) | `request`、`CACHE_KEYS`、`login`、`updateProfile`、`uploadAvatar`、`createFeedback`、各种缓存 API、`createLoginRequiredError`、`getToken`、`isLoggedIn`、`isLoginRequiredError` | 统一 `wx.request` 封装；401 处理；GET 缓存、in-flight 复用、Stale 兜底；登录后 `clearAllCaches` |
| [navigation.js](../../miniprogram/utils/navigation.js) | `ROUTES`、`buildUrl`、`openRoute`、`navigateBackLater` | 路由常量；自动判断 `switchTab` / `navigateTo` / `redirectTo` / `reLaunch` |
| [page-state.js](../../miniprogram/utils/page-state.js) | `PAGE_STATUS`、`resolveListStatus`、`resolveDetailStatus` | 列表/详情状态四态机（loading/ready/empty/error） |
| [feedback.js](../../miniprogram/utils/feedback.js) | `showErrorToast`、`showSuccessToast`、`showErrorModal`、`getErrorMessage` | 统一提示文案 |
| [form.js](../../miniprogram/utils/form.js) | `withPageLoading(page, task)` | 异步任务期间维护 `page.data.loading`，避免重复提交 |
| [avatar.js](../../miniprogram/utils/avatar.js) | `normalizeStoredUser`、`persistAvatarFile`、`readFileBase64`、`resolveAvatarFileType` 等 | 头像本地路径与 base64 互转；路径安全判定 |

## 3.3 公共组件（components）

| 组件 | 路径 | 关键属性/方法 | 用途 |
|------|------|---------------|------|
| `empty-state` | [components/empty-state](../../miniprogram/components/empty-state) | `title` / `desc` / `icon` / `buttonText`，事件 `action` | 列表为空时的占位卡片 |
| `section-header` | [components/section-header](../../miniprogram/components/section-header) | `title` / `icon` / `desc`，slot `extra` | 顶部区段标题，额外按钮放 slot |
| `privacy-popup` | [components/privacy-popup](../../miniprogram/components/privacy-popup) | 事件 `agree` / `disagree`，方法 `requireAuthorization` | 微信隐私协议弹层封装；登录页使用其 `requireAuthorization` 在提交前确认隐私协议 |

## 3.4 主包页面（pages）

| 页面 | 关键逻辑 | 主要 API |
|------|----------|----------|
| [pages/home/index](../../miniprogram/pages/home/index) | 展示最近摘要 + 下次提醒 + 快捷入口；未登录显示 `GUEST_HOME`；提供 `onPullDownRefresh` | `GET /home` |
| [pages/login/index](../../miniprogram/pages/login/index) | `wx.login()` → 调 `/auth/login`；头像选择后 `wx.saveFile` 持久化，base64 上传 `/me/avatar`；登录成功 `clearAllCaches` | `POST /auth/login`、`POST /me/avatar` |
| [pages/records/index](../../miniprogram/pages/records/index) | 列表 + 摘要统计；编辑/删除/查看/新增 | `GET /records`、`DELETE /records/:id` |
| [pages/reminders/index](../../miniprogram/pages/reminders/index) | 列表 + 待办统计 + 标记完成（`PATCH /reminders/:id/done`） | `GET /reminders`、`PATCH /reminders/:id/done`、`DELETE /reminders/:id` |
| [pages/profile/index](../../miniprogram/pages/profile/index) | 头像昵称展示与重试上传；菜单导航；退出登录（清 token + 缓存 + 跳转登录） | `GET /me`、`GET /home`（摘要卡片）、`POST /me/avatar` |

## 3.5 分包页面

### packages/records

- [record-form](../../miniprogram/packages/records/record-form)：新建/编辑记录，状态选项 `已记录 / 待复查 / 待关注 / 已完成`
- [record-detail](../../miniprogram/packages/records/record-detail)：详情页，落地页缓存策略（先看 `recordDetail` 缓存，没有再回退到 `records` 列表）

### packages/reminders

- [reminder-form](../../miniprogram/packages/reminders/reminder-form)：标题选项 `复查提醒 / 资料准备 / 记录整理 / 线下咨询准备`，可触发 `requestReminderSubscription()`
- [utils/subscription](../../miniprogram/packages/reminders/utils/subscription)：封装 `wx.requestSubscribeMessage`，未配置模板时返回 `accepted:false, available:false`

### packages/tools

- [questions](../../miniprogram/packages/tools/questions)：模板多选 + 自定义文本 → 批量保存（`/questions/batch`），单条编辑（`PUT /questions/:id`），单条删除
- [articles](../../miniprogram/packages/tools/articles)：文章列表 + 弹层正文展示

### packages/profile

- [privacy](../../miniprogram/packages/profile/privacy)：纯静态隐私说明
- [compliance](../../miniprogram/packages/profile/compliance)：列出可提供/不可提供服务清单
- [feedback](../../miniprogram/packages/tools/../../packages/profile/feedback)：站内反馈表单，类型枚举 `功能建议 / 使用问题 / 隐私与数据 / 其他反馈`；未登录时引导走微信官方反馈入口

## 3.6 关键函数与约定

### 缓存 key 列表（[CACHE_KEYS](../../miniprogram/utils/request.js)）

| Key | 数据 | 缓存时长 |
|-----|------|----------|
| `home` | 首页摘要 + 指标 | 60s |
| `records` | 记录列表 | 默认 30s |
| `recordDetail:<id>` | 记录详情 | 默认 30s |
| `reminders` | 提醒列表 | 默认 30s |
| `reminderDetail:<id>` | 提醒详情 | 默认 30s |
| `questions` | 用户问题清单 | 默认 30s |
| `questionTemplates` | 问题模板 | 5min |
| `articles` | 健康知识 | 5min |

### 写后缓存策略

以「新增记录」为例（[packages/records/record-form/index.js](../../miniprogram/packages/records/record-form/index.js#L119-L139)）：

```js
const savedRecord = res.data;
setCachedData(CACHE_KEYS.recordDetail(savedRecord.id), res);
upsertCachedListItem(CACHE_KEYS.records, savedRecord, { prepend: !this.data.id });
markCacheDirty(CACHE_KEYS.home);
```

- 详情缓存覆盖当前记录
- 列表缓存做 upsert；新建时 `prepend: true`，编辑时原地替换
- 首页 `home` 标记为脏，下次进入首页时自动 `silent` 拉新

### 401 行为（[request.js:273-281](../../miniprogram/utils/request.js)）

- 有 token：清空 token/user/全量缓存 → `wx.reLaunch` 登录页 → 拒绝
- 无 token：抛出 `LOGIN_REQUIRED` 错误，由调用方决定是否弹登录引导

### 路由常量（[navigation.js](../../miniprogram/utils/navigation.js)）

- `ROUTES` 维护 14 条路径（4 主包 + 10 分包）
- `TAB_ROUTES` 列出会被 `switchTab` 调用的路径；`openRoute` 自动判断

## 3.7 数据流示例：标记提醒完成

```text
[pages/reminders/index] #markDone
  └─ request PATCH /reminders/:id/done
       └─ res.data = updatedReminder
  ├─ updateCachedListItem(CACHE_KEYS.reminders, id, reminder)
  ├─ setCachedData(CACHE_KEYS.reminderDetail(id), res)
  ├─ markCacheDirty(CACHE_KEYS.home)
  ├─ showSuccessToast("已完成")
  ├─ wx.vibrateShort({ type: "light" })
  └─ this.applyReminders(reminders)        // 内部 sortReminders + 重新计算 summary
```

## 3.8 提审友好的能力

- 主包首屏是 `pages/home/index`，未登录也能浏览
- 登录按钮只在「需要保存个人数据」时才引导
- 头像昵称均为选填，未填写显示「微信用户」
- 全局启用 `lazyCodeLoading: requiredComponents`，关键分包预加载
- 主要页面都支持 `onPullDownRefresh`
- 提醒页订阅消息需用户主动点击触发
- 后端拦截合规词，避免用户内容越界
