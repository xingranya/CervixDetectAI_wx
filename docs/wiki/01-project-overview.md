# 01 · 项目总览

## 1.1 项目定位

- **小程序名**：云端智诊
- **小程序 AppID**：`xxx`（见 [project.config.json](../../project.config.json)、[config/app.js](../../miniprogram/config/app.js)）
- **提审类目**：工具 / 健康管理（个人主体，不接入医疗服务类目）
- **目标用户**：需要长期管理健康检查摘要、复查安排、线下咨询备忘的女性用户
- **价值主张**：把个人健康记录、复查提醒、就诊前问题清单沉淀到小程序内，便于复查或线下咨询时回顾

## 1.2 功能范围

首版功能（参考根目录 [README.md](../../README.md)）：

| 功能 | 描述 | 对应入口 |
|------|------|----------|
| 首页 | 最近检查摘要、下次提醒、快捷操作卡片、免责声明 | [pages/home/index](../../miniprogram/pages/home/index) |
| 登录 | 微信 code2Session 登录，昵称头像选填 | [pages/login/index](../../miniprogram/pages/login/index) |
| 检查记录 | 新增、查看、编辑、删除健康检查摘要 | [pages/records/index](../../miniprogram/pages/records/index)、[packages/records](../../miniprogram/packages/records) |
| 复查提醒 | 提醒 CRUD、标记完成、订阅消息（按需开启） | [pages/reminders/index](../../miniprogram/pages/reminders/index)、[packages/reminders](../../miniprogram/packages/reminders) |
| 问题整理 | 选择模板问题 + 自定义问题，填写咨询备忘 | [packages/tools/questions](../../miniprogram/packages/tools/questions) |
| 健康知识 | 文章列表 + 弹层正文 | [packages/tools/articles](../../miniprogram/packages/tools/articles) |
| 我的 | 用户资料、菜单入口、登录态切换、退出登录 | [pages/profile/index](../../miniprogram/pages/profile/index) |
| 隐私说明 | 微信官方隐私协议 + 项目说明 | [packages/profile/privacy](../../miniprogram/packages/profile/privacy) |
| 合规说明 | 列出可提供与不提供的服务边界 | [packages/profile/compliance](../../miniprogram/packages/profile/compliance) |
| 意见反馈 | 站内反馈表单（保存到后端），并保留 `open-type="feedback"` 入口 | [packages/profile/feedback](../../miniprogram/packages/profile/feedback) |

## 1.3 目录结构

```text
CervixDetectAI_wx/
├── miniprogram/                # 微信原生小程序前端
│   ├── app.js / app.json / app.wxss
│   ├── config/app.js           # 运行环境配置（API 地址、模板 ID）
│   ├── components/             # 公共组件（empty-state / section-header / privacy-popup）
│   ├── pages/                  # 主包页面（首页、登录、记录、提醒、我的）
│   ├── packages/               # 分包（records / reminders / tools / profile）
│   └── utils/                  # 公共工具（request / navigation / form / feedback / avatar / page-state）
│
├── server/                     # 轻量 Node API 服务
│   ├── src/
│   │   ├── app.js              # Express 入口
│   │   ├── config/             # 环境变量、数据库连接池
│   │   ├── middleware/         # 鉴权、统一错误处理
│   │   ├── repositories/       # MySQL 数据访问层
│   │   ├── routes/             # 路由层
│   │   └── services/           # 业务服务层（含头像存储、合规校验）
│   ├── database/
│   │   ├── init.sql            # 全新初始化脚本
│   │   └── upgrade-login-crud.sql  # 老库升级脚本
│   ├── uploads/                # 用户头像静态资源（运行时生成）
│   ├── .env.example
│   └── package.json
│
├── docs/
│   ├── api-contract.md         # 现有 API 文档（保持原样）
│   ├── category-guide.md       # 提审类目填写说明
│   ├── submission-checklist.md # 提审前自查清单
│   └── wiki/                   # Code Wiki（本目录）
│
├── project.config.json         # 微信开发者工具工程配置
└── README.md
```

## 1.4 技术栈

### 前端

- 微信原生小程序（无 npm 依赖、无框架）
- 分包加载：4 个分包在 `app.json` 中声明，`pages/home` 与 `pages/profile` 设置了预加载规则
- 状态管理：每个 Page 自管理 data；跨页数据通过 `wx.storage` 与 [utils/request.js](../../miniprogram/utils/request.js) 的内存缓存共享
- 全局组件：`empty-state` / `section-header` / `privacy-popup`
- 公共工具：网络请求、路由、加载态、提示、头像处理、页面状态机

### 后端

- 运行时：Node.js（无 TypeScript）
- 框架：Express 4 + helmet + cors + morgan
- 数据库：MySQL（通过 `mysql2/promise` 连接池）
- 鉴权：自定义 Bearer Token，会话表 `wx_sessions` 30 天有效期
- 微信登录：通过 `code2Session` 换取 OpenID，生成自有 token
- 头像存储：本地 `uploads/avatars/`，通过静态资源对外暴露（`/uploads` 目录）
- 校验：服务层做基础清洗、日期校验、合规词拦截（`PROHIBITED_SERVICE_TERMS`）

## 1.5 合规与边界

- **不提供**：AI 诊断、辅助诊断、在线问诊、诊疗建议、治疗方案、处方代开、疾病预测、病变识别、挂号缴费、报告单官方查询。
- **提供**：本人填写的健康检查摘要、复查提醒、就诊前问题清单、健康管理知识、隐私与服务边界说明、用户反馈。
- 前后端共享同一份禁用词清单，小程序前端在文案中规避；后端在服务层对反馈、记录、提醒、问题等文本做拦截（[services/miniapp.service.js:6-17](../../server/src/services/miniapp.service.js)）。

## 1.6 提审要点

- 提审时按 [submission-checklist.md](../submission-checklist.md) 自查。
- 隐私保护指引需声明头像、昵称、健康记录、提醒、反馈等用途；头像昵称必须为选填。
- 默认首屏是首页，未登录也能浏览功能。
- 上线前需在 `miniprogram/config/app.js` 配置 `productionApiBaseUrl` 为公网 HTTPS 域名，并在小程序后台加入 request 合法域名与上传合法域名。
