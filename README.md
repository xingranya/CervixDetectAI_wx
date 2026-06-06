# CervixDetectAI_wx

面向毕业设计与比赛演示的微信小程序版本。提审定位为“女性健康管理助手”，重点提供检查摘要记录、复查提醒、就诊前问题整理和健康知识浏览。

## 类目建议

微信小程序后台填写：

- 主体：个人主体
- 服务类目：工具 / 健康管理
- 小程序名称：CervixDetectAI云端智诊
- 小程序简称：云端智诊
- 简介：女性用户的健康管理助手，记录检查摘要、管理复查提醒、整理就诊前问题。产品仅用于健康信息记录与提醒，不提供在线诊断、治疗或问诊服务。

不要选择“医疗服务 / 就医服务 / 查报告单 / 互联网医院”。这些类目需要医疗机构、卫健委批文、合作医院协议或互联网诊疗资质，不适合个人主体。

## 项目结构

```text
CervixDetectAI_wx/
├── miniprogram/          # 微信原生小程序前端
├── server/               # 轻量 Node API 服务
└── docs/                 # 提审与比赛说明材料
```

## 首版功能

- 首页：展示最近记录、复查提醒、快捷入口和合规提示。
- 检查记录：新增、查看、编辑、删除用户维护的健康检查摘要。
- 复查提醒：新增、编辑、删除待办提醒，可标记完成。
- 问题整理：保存线下咨询前问题，可补充咨询记录备忘。
- 健康知识：提供筛查准备、记录管理、隐私保护等基础知识。
- 我的：展示隐私政策、反馈入口和服务说明。

## 运行方式

小程序前端使用微信开发者工具打开 `miniprogram/`。

后端仅作为毕业设计演示 API，进入 `server/` 后安装依赖并运行：

```bash
npm install
npm run dev
```

根据项目要求，当前不会自动启动任何开发服务。

## 数据库

数据库名称：

```text
cervixdetectai_wx
```

建库语句：

```sql
CREATE DATABASE cervixdetectai_wx
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

完整建表与演示数据脚本：

```text
server/database/init.sql
```

已建库升级脚本：

```text
server/database/upgrade-login-crud.sql
```
