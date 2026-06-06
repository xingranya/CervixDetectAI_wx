# 小程序 API 设计

所有接口统一挂载在：

```text
/api/miniapp
```

## 首页

`GET /home`

返回最近检查摘要、下一次复查提醒和服务边界说明。

## 检查记录

`GET /records`

返回检查摘要列表。字段只保留健康管理所需信息：

- `id`
- `date`
- `title`
- `project`
- `summary`
- `suggestion`
- `status`

`GET /records/:id`

返回单条检查摘要详情。

## 复查提醒

`GET /reminders`

返回提醒列表。

`PATCH /reminders/:id/done`

标记提醒已完成。

## 问题整理

`GET /question-templates`

返回就诊前问题模板。

`POST /questions`

保存用户选择的问题清单。演示版当前直接回显。

## 健康知识

`GET /articles`

返回健康管理知识卡片和正文：

- `id`
- `title`
- `summary`
- `content`

## 反馈

`POST /feedback`

保存用户反馈。演示版当前直接返回收到状态。

前端同时保留微信官方 `open-type="feedback"` 入口，方便用户提交带日志的反馈。

## 合规原则

- API 不返回诊断结论字段。
- API 不返回治疗方案字段。
- API 不返回医生问诊内容。
- API 不提供图片识别入口。
- API 会拦截明显越界的医疗服务表达，例如在线问诊、诊断、治疗方案、处方代开等。
- 如后续对接主系统报告，应先经过“患者安全摘要”映射，只输出健康记录摘要。

## 后端分层

- `routes/miniapp.js`：只负责 HTTP 入参、状态码和响应格式。
- `services/miniapp.service.js`：负责业务校验、字段清洗和数据源选择。
- `repositories/miniapp.repository.js`：负责 MySQL 访问。
- `repositories/mock.repository.js`：负责无数据库演示兜底。
- `config/env.js` 与 `config/database.js`：负责环境变量和连接池。
