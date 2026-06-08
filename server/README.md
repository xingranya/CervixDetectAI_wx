# CervixDetectAI 微信小程序后端

该服务提供小程序 API，固定使用 MySQL 保存数据。接口只返回健康管理摘要，不返回超出个人健康记录范围的内容。

## 数据库

数据库名称：

```text
cervixdetectai_wx
```

当前本地配置文件为 `server/.env`，已按以下连接信息配置：

```text
DB_HOST=mysql7.sqlpub.com
DB_PORT=3312
DB_NAME=cervixdetectai_wx
DB_USER=xingranya666
```

初始化 SQL 在：

```text
server/database/init.sql
```

执行方式：

```bash
mysql -h mysql7.sqlpub.com -P 3312 -u xingranya666 -p cervixdetectai_wx < database/init.sql
```

如果你已经在控制台手动创建了 `cervixdetectai_wx`，直接执行上面的初始化脚本即可。

## API

- `GET /api/miniapp/home`
- `GET /api/miniapp/records`
- `GET /api/miniapp/records/:id`
- `GET /api/miniapp/reminders`
- `PATCH /api/miniapp/reminders/:id/done`
- `GET /api/miniapp/question-templates`
- `POST /api/miniapp/questions`
- `GET /api/miniapp/articles`
- `POST /api/miniapp/feedback`

`GET /api/miniapp/articles` 返回 `id/title/summary/content`，前端用于文章列表和正文弹层。

`POST /api/miniapp/feedback` 会写入 MySQL，并做基础内容清洗和健康服务边界校验；如果用户提交明显越界的医疗服务表达，会返回 400。

公开接口仅包括 `POST /api/miniapp/auth/login`、`GET /api/miniapp/question-templates` 和 `GET /api/miniapp/articles`。检查记录、复查提醒、个人问题清单和站内反馈都需要 `Authorization: Bearer <token>`。

## 校验

先安装依赖：

```bash
npm install
```

```bash
npm run check
```
