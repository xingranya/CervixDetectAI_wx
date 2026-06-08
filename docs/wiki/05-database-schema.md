# 05 · 数据库设计

> 数据库：`cervixdetectai_wx`（字符集 `utf8mb4` / 排序 `utf8mb4_unicode_ci`）
> 完整建表脚本：[server/database/init.sql](../../server/database/init.sql)
> 老库升级脚本：[server/database/upgrade-login-crud.sql](../../server/database/upgrade-login-crud.sql)

## 5.1 表清单

| 表名 | 用途 | 关联 |
|------|------|------|
| `wx_users` | 小程序用户 | — |
| `wx_sessions` | 登录会话 | → `wx_users.id` |
| `wx_health_records` | 健康检查摘要记录 | → `wx_users.id` |
| `wx_reminders` | 复查提醒 | → `wx_users.id` |
| `wx_question_templates` | 就诊前问题模板 | — |
| `wx_user_questions` | 用户整理的问题清单 | → `wx_users.id` |
| `wx_articles` | 健康管理知识 | — |
| `wx_feedback` | 站内反馈 | → `wx_users.id` |

## 5.2 表结构

### wx_users

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | 用户主键 |
| `openid` | VARCHAR(128) | UNIQUE | 微信 openid |
| `nickname` | VARCHAR(80) | NOT NULL, DEFAULT '微信用户' | 昵称 |
| `avatar_url` | VARCHAR(500) | NULL | 头像外链 |
| `phone` | VARCHAR(32) | NULL | 手机号（保留字段，未启用） |
| `gender` | VARCHAR(16) | NULL | 性别（保留字段） |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### wx_sessions

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `token` | CHAR(64) | PK | 64 字符十六进制 token |
| `user_id` | BIGINT UNSIGNED | FK→wx_users.id ON DELETE CASCADE | 用户 |
| `expires_at` | DATETIME | NOT NULL | 默认 `NOW() + 30 天` |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

索引：`idx_wx_sessions_user_expires (user_id, expires_at)`

### wx_health_records

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | VARCHAR(32) | PK | 32 字符紧凑 UUID |
| `user_id` | BIGINT UNSIGNED | FK→wx_users.id | 用户 |
| `record_date` | DATE | NOT NULL | 检查日期 |
| `title` | VARCHAR(120) | NOT NULL | 记录标题 |
| `project` | VARCHAR(120) | NOT NULL | 检查项目 |
| `summary` | VARCHAR(500) | NOT NULL | 摘要 |
| `suggestion` | VARCHAR(500) | NOT NULL | 提醒建议 |
| `status` | VARCHAR(40) | DEFAULT '已记录' | 状态 |
| `created_at` / `updated_at` | DATETIME | — | 时间戳 |

索引：`idx_wx_health_records_user_date (user_id, record_date)`

### wx_reminders

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | VARCHAR(32) | PK | 32 字符紧凑 UUID |
| `user_id` | BIGINT UNSIGNED | FK→wx_users.id | 用户 |
| `title` | VARCHAR(120) | NOT NULL | 提醒标题 |
| `remind_date` | DATE | NOT NULL | 提醒日期 |
| `description` | VARCHAR(500) | NOT NULL | 提醒内容 |
| `done` | TINYINT(1) | DEFAULT 0 | 是否完成 |
| `completed_at` | DATETIME | NULL | 完成时间 |
| `created_at` / `updated_at` | DATETIME | — | 时间戳 |

索引：`idx_wx_reminders_user_done_date (user_id, done, remind_date)`

### wx_question_templates

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | 模板主键 |
| `content` | VARCHAR(255) | NOT NULL | 问题内容 |
| `sort_order` | INT | DEFAULT 0 | 排序 |
| `is_active` | TINYINT(1) | DEFAULT 1 | 是否启用 |
| `created_at` / `updated_at` | DATETIME | — | 时间戳 |

索引：`idx_wx_question_templates_active_sort (is_active, sort_order)`

### wx_user_questions

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | 主键 |
| `user_id` | BIGINT UNSIGNED | FK→wx_users.id | 用户 |
| `question_text` | VARCHAR(255) | NOT NULL | 问题内容 |
| `answer_text` | TEXT | NULL | 备忘 |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

索引：`idx_wx_user_questions_user_time (user_id, updated_at, created_at)`（老库升级会再补 `idx_wx_user_questions_user_updated` 兜底）

### wx_articles

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | VARCHAR(32) | PK | 文章主键 |
| `title` | VARCHAR(120) | NOT NULL | 标题 |
| `summary` | VARCHAR(500) | NOT NULL | 摘要 |
| `content` | TEXT | NULL | 正文 |
| `sort_order` | INT | DEFAULT 0 | 排序 |
| `is_active` | TINYINT(1) | DEFAULT 1 | 是否上架 |
| `created_at` / `updated_at` | DATETIME | — | 时间戳 |

索引：`idx_wx_articles_active_sort (is_active, sort_order)`

### wx_feedback

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | CHAR(36) | PK | UUID |
| `user_id` | BIGINT UNSIGNED | FK→wx_users.id | 提交人 |
| `feedback_type` | VARCHAR(40) | NOT NULL, DEFAULT '其他反馈' | 反馈类型 |
| `contact` | VARCHAR(120) | NULL | 联系方式 |
| `content` | VARCHAR(1000) | NOT NULL | 反馈正文 |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 提交时间 |

索引：`idx_wx_feedback_user_time (user_id, created_at)`

## 5.3 初始化与升级

### 全新初始化

```bash
mysql -h <host> -P <port> -u <user> -p cervixdetectai_wx < server/database/init.sql
```

`init.sql` 还内置了一份演示数据：

- 演示用户 `id=1, openid=demo-openid-001, nickname='张女士'`
- 4 条 `wx_health_records`（筛查摘要、年度检查、复查前资料整理等）
- 4 条 `wx_reminders`（复查、资料准备、记录整理、线下咨询准备）
- 7 条 `wx_question_templates`
- 5 条 `wx_articles`

### 老库升级

```bash
mysql -h <host> -P <port> -u <user> -p cervixdetectai_wx < server/database/upgrade-login-crud.sql
```

升级点：

- 幂等创建 `wx_sessions` 表
- 存储过程 `upgrade_cervixdetectai_wx_login_crud()`：
  - 给 `wx_users` 加 `avatar_url`
  - 给 `wx_user_questions` 加 `answer_text` 与 `updated_at`
  - 兜底添加 `idx_wx_user_questions_user_updated` 索引
  - 给 `wx_feedback` 加 `feedback_type`
  - 幂等补充演示记录、提醒、问题模板和健康知识默认数据
- 升级完成后自动 `DROP PROCEDURE`

## 5.4 实体关系

```text
wx_users 1───* wx_sessions
wx_users 1───* wx_health_records
wx_users 1───* wx_reminders
wx_users 1───* wx_user_questions
wx_users 1───* wx_feedback

wx_question_templates   （独立表，登录用户可选）
wx_articles             （独立表，全用户可浏览）
```
