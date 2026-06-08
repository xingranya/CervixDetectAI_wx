# 06 · 接口参考

> 基础路径：`/api/miniapp`
> 实现位置：[server/src/routes/miniapp.js](../../server/src/routes/miniapp.js)
> 配套：[docs/api-contract.md](../api-contract.md)

## 6.1 通用约定

- 请求体：`application/json`，最大 3MB
- 鉴权：`POST /auth/login`、`GET /question-templates`、`GET /articles` 公开，其余接口需要 `Authorization: Bearer <token>`
- 响应格式：
  ```json
  { "success": true, "data": ... }
  // 或
  { "success": false, "message": "..." }
  ```
- 错误码：400 业务校验失败 / 401 鉴权失败 / 404 接口或资源不存在 / 500+ 服务异常
- 字段命名：后端内部用下划线，返回时统一映射为驼峰（如 `record_date → date`）

## 6.2 接口清单

| Method | Path | 鉴权 | 用途 |
|--------|------|------|------|
| POST | `/auth/login` | ❌ | 微信 code 登录并返回 token |
| GET | `/me` | ✅ | 当前用户资料 |
| PUT | `/me/profile` | ✅ | 更新昵称/头像外链 |
| POST | `/me/avatar` | ✅ | 上传头像 base64，返回更新后的用户资料 |
| GET | `/home` | ✅ | 首页摘要 |
| GET | `/records` | ✅ | 记录列表 |
| POST | `/records` | ✅ | 新建记录 |
| GET | `/records/:id` | ✅ | 记录详情 |
| PUT | `/records/:id` | ✅ | 修改记录 |
| DELETE | `/records/:id` | ✅ | 删除记录 |
| GET | `/reminders` | ✅ | 提醒列表 |
| GET | `/reminders/:id` | ✅ | 提醒详情 |
| POST | `/reminders` | ✅ | 新建提醒 |
| PUT | `/reminders/:id` | ✅ | 修改提醒 |
| PATCH | `/reminders/:id/done` | ✅ | 标记完成 |
| DELETE | `/reminders/:id` | ✅ | 删除提醒 |
| GET | `/question-templates` | ❌ | 问题模板列表（仅返回 `content` 数组） |
| GET | `/questions` | ✅ | 用户问题清单 |
| POST | `/questions` | ✅ | 新建单个问题 |
| POST | `/questions/batch` | ✅ | 批量新建（最多 20 条） |
| PUT | `/questions/:id` | ✅ | 修改问题（文本/备忘） |
| DELETE | `/questions/:id` | ✅ | 删除问题 |
| GET | `/articles` | ❌ | 健康知识列表 |
| POST | `/feedback` | ✅ | 提交反馈 |
## 6.3 详细字段

### POST /auth/login

请求体：

```json
{
  "code": "wx_login_code",
  "deviceId": "wx-device-... （可选）",
  "openid": "可选（如已用 code2Session 自取可不上送）",
  "nickname": "可选，默认 微信用户",
  "avatarUrl": "可选，http(s) 链接",
  "phone": "可选，未启用"
}
```

响应：

```json
{
  "success": true,
  "data": {
    "token": "64位 hex",
    "user": {
      "id": 1,
      "nickname": "微信用户",
      "avatarUrl": "https://.../uploads/avatars/xxx.png",
      "phone": "",
      "gender": ""
    }
  }
}
```

错误：

- 400：未拿到 `code`
- 401：`errcode=40029/40163`（凭证失效）
- 500：未配置 AppSecret（`40125`）
- 502：连接微信登录服务失败

### GET /me

```json
{ "success": true, "data": { "id": 1, "nickname": "微信用户", "avatarUrl": "", "phone": "", "gender": "" } }
```

### PUT /me/profile

请求体：`{ "nickname": "可选", "avatarUrl": "可选, http(s)" }`
响应：同 `GET /me` 的 `data` 结构。
限制：`nickname` 不能命中合规词。

### POST /me/avatar

请求体：

```json
{
  "avatarBase64": "base64 字符串（不带 data:image/...;base64, 前缀）",
  "fileType": "image/jpeg | image/png | image/webp"
}
```

响应：与 `GET /me` 相同的 `data`。
约束：base64 解码后 ≤ 2MB；落盘路径 `uploads/avatars/<userId>-<timestamp>-<rand6>.<ext>`；返回 URL 优先使用 `MINIAPP_PUBLIC_BASE_URL`。

### GET /home

```json
{
  "success": true,
  "data": {
    "userName": "微信用户",
    "latestTitle": "最近一次健康检查摘要",
    "latestDate": "2026-03-18",
    "latestSummary": "...",
    "nextReminder": "2026-09-18 前完成复查提醒",
    "disclaimer": "本小程序仅用于健康信息记录与提醒，具体健康问题请前往线下正规机构咨询。",
    "metrics": [
      { "label": "已记录", "value": "2 次" },
      { "label": "待关注", "value": "2 项" },
      { "label": "下次提醒", "value": "09-18" }
    ]
  }
}
```

### 记录相关

`GET /records`：

```json
{
  "success": true,
  "data": [
    {
      "id": "r20260318",
      "date": "2026-03-18",
      "title": "女性健康筛查记录",
      "project": "TCT / HPV 摘要记录",
      "summary": "...",
      "suggestion": "...",
      "status": "待复查"
    }
  ]
}
```

`POST /records` 请求体：

```json
{
  "date": "YYYY-MM-DD",
  "title": "string (≤120)",
  "project": "string (≤120)",
  "summary": "string (≤500)",
  "suggestion": "string (≤500)",
  "status": "已记录 | 待复查 | 待关注 | 已完成"
}
```

错误：缺字段/日期格式错/含合规词均返回 400。

`PUT /records/:id`：同上请求体。
`DELETE /records/:id`：成功返回 `{ success:true, data:{ deleted:true } }`；不存在或不属于当前用户返回 404。

### 提醒相关

`GET /reminders`：

```json
{
  "success": true,
  "data": [
    { "id": "m1", "title": "复查提醒", "date": "2026-09-18", "desc": "...", "done": false }
  ]
}
```

`POST /reminders`：

```json
{
  "title": "string",
  "date": "YYYY-MM-DD",
  "desc": "string (≤500)",
  "done": false
}
```

`PATCH /reminders/:id/done`：返回更新后的提醒。
`DELETE /reminders/:id`：成功返回 `{ deleted:true }`；不存在或不属于当前用户返回 404。

### 问题相关

`GET /question-templates`：`{ success:true, data:["...", "..."] }`

`GET /questions`：

```json
{
  "success": true,
  "data": [
    {
      "id": "12",
      "questionText": "...",
      "answerText": "...",
      "createdAt": "2026-05-01 10:00:00",
      "updatedAt": "2026-05-01 10:00:00"
    }
  ]
}
```

`POST /questions/batch`：

```json
{ "questions": ["...", "..."] }
```

响应：`{ success:true, data:{ questions: [...] } }`，最多保存 20 条。

`POST /questions`：`{ "questionText": "...", "answerText": "..." }`
`PUT /questions/:id`：同上。
`DELETE /questions/:id`：成功返回 `{ deleted:true }`；不存在或不属于当前用户返回 404。

### 健康知识

`GET /articles`：

```json
{
  "success": true,
  "data": [
    { "id": "a1", "title": "...", "summary": "...", "content": "..." }
  ]
}
```

### 反馈

`POST /feedback`：

```json
{ "type": "功能建议", "contact": "可选", "content": "必填，≤1000" }
```

响应：`{ success:true, data:{ received:true, message:"反馈已收到", id:"uuid" } }`。
`type` 限定为 `功能建议 / 使用问题 / 隐私与数据 / 其他反馈`，未知类型按“其他反馈”保存；`content` 或 `contact` 命中合规词会返回 400。

## 6.4 接口依赖关系

```text
GET  /me                       ──→ repositories.findUserById
PUT  /me/profile               ──→ repositories.updateProfile
POST /me/avatar                ──→ avatarStorage.saveAvatar + repositories.updateProfile
GET  /home                     ──→ repositories.getHome
GET  /records                  ──→ repositories.listRecords
POST /records                  ──→ normalizeRecordPayload → repositories.createRecord
GET  /records/:id              ──→ repositories.getRecordById
PUT  /records/:id              ──→ normalizeRecordPayload → repositories.updateRecord
DEL  /records/:id              ──→ repositories.deleteRecord
GET  /reminders                ──→ repositories.listReminders
GET  /reminders/:id            ──→ repositories.getReminderById
POST /reminders                ──→ normalizeReminderPayload → repositories.createReminder
PUT  /reminders/:id            ──→ normalizeReminderPayload → repositories.updateReminder
PATCH /reminders/:id/done      ──→ repositories.completeReminder
DEL  /reminders/:id            ──→ repositories.deleteReminder
GET  /question-templates       ──→ repositories.listQuestionTemplates
GET  /questions                ──→ repositories.listQuestions
POST /questions                ──→ normalizeQuestionPayload → repositories.createQuestion
POST /questions/batch          ──→ normalizeQuestions → repositories.saveQuestions
PUT  /questions/:id            ──→ normalizeQuestionPayload → repositories.updateQuestion
DEL  /questions/:id            ──→ repositories.deleteQuestion
GET  /articles                 ──→ repositories.listArticles
POST /feedback                 ──→ requireText + assertComplianceText → repositories.createFeedback
POST /auth/login               ──→ requestWechatSession + repositories.login
```

## 6.5 与现有 [api-contract.md](../api-contract.md) 的关系

`docs/api-contract.md` 维护的是面向前端/产品的高层契约，本文件补充了实现层细节：

- 字段命名（驼峰映射）
- 返回体包装
- 错误码细节
- 鉴权要求
- 与仓库层函数的对应
- 静态资源的跨域策略
