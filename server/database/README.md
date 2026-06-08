# 数据库初始化

数据库名称：

```text
cervixdetectai_wx
```

数据库连接信息写在本地 `server/.env` 中。

初始化 SQL：

```text
server/database/init.sql
```

脚本会幂等写入一组默认演示数据，包含演示用户、检查记录、复查提醒、问题模板和健康知识，方便首次打开小程序时直接看到完整效果。

执行方式：

```bash
mysql -h mysql7.sqlpub.com -P 3312 -u xingranya666 -p cervixdetectai_wx < server/database/init.sql
```

如果当前目录在 `server/`，则执行：

```bash
mysql -h mysql7.sqlpub.com -P 3312 -u xingranya666 -p cervixdetectai_wx < database/init.sql
```

为避免密码出现在终端历史里，建议执行后按提示输入密码。
