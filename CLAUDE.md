# CLAUDE.md — CervixDetectAI_wx

## 项目概述

"云端智诊"微信小程序 — 女性健康管理助手。提审定位为健康记录工具，**不提供**在线诊断、治疗或问诊服务。

- **前端**：原生微信小程序（WXML + WXSS + JS），无第三方框架
- **后端**：Node.js + Express + MySQL（三层架构：routes → services → repositories）
- **AI 助手**：调用阿里云 DashScope / OpenAI 兼容 API，含合规拦截

## 目录结构

```text
CervixDetectAI_wx/
├── miniprogram/                  # 小程序前端
│   ├── app.js / app.json         # 入口与路由配置
│   ├── config/app.js             # 运行时配置（API 地址、模板 ID）
│   ├── pages/                    # 主包页面（home / login / records / reminders / profile）
│   ├── packages/                 # 分包页面（records / reminders / tools / profile / assistant / notifications）
│   ├── components/               # 复用组件（empty-state / privacy-consent / skeleton 等）
│   ├── utils/                    # 工具模块（request / navigation / page-state / feedback 等）
│   ├── styles/                   # 设计系统（design-tokens / utilities / theme.json）
│   └── assets/icons/             # Tab 栏图标
├── server/                       # Node.js API 服务
│   ├── src/
│   │   ├── app.js                # Express 应用入口
│   │   ├── config/               # 环境变量与数据库连接池
│   │   ├── middleware/            # 认证与错误处理
│   │   ├── routes/               # 路由定义（miniapp.js / webhook.js）
│   │   ├── services/             # 业务逻辑层
│   │   └── repositories/         # 数据访问层（MySQL 查询）
│   ├── database/                 # 建表脚本与迁移
│   └── public/agreements/        # 隐私与服务协议 HTML
├── docs/                         # 设计文档（.drawio）
└── outputs/                      # 生成的报告
```

## 技术栈与关键依赖

| 层面 | 技术 |
|------|------|
| 前端框架 | 原生微信小程序 + WeUI 组件库 |
| 后端框架 | Express 4.18 |
| 数据库 | MySQL（mysql2 promise pool，utf8mb4） |
| 安全 | helmet / cors / express-rate-limit（120 req/min） |
| AI 集成 | DashScope（阿里云）/ OpenAI 兼容 API，SSE 流式响应 |
| 设计系统 | CSS 自定义属性（`--wx-` 前缀），支持明暗模式 |

## 常用命令

```bash
# 前端：用微信开发者工具打开 miniprogram/ 目录

# 后端
cd server
npm install          # 安装依赖
npm run dev          # 启动开发服务
npm run check        # 语法检查（node --check）

# 数据库
mysql -u root -p < database/init.sql           # 初始化建表与演示数据
mysql -u root -p cervixdetectai_wx < database/upgrade-login-crud.sql  # 升级脚本
```

## 架构与代码模式

### 前端页面模式（4 文件一组）

每个页面由 `index.js` + `index.wxml` + `index.wxss` + `index.json` 组成：

```javascript
// index.js 标准模式
const { apiRequest } = require('../../utils/request')
const { PAGE_STATE } = require('../../utils/page-state')

Page({
  data: {
    pageState: PAGE_STATE.LOADING,
    list: []
  },
  onLoad() { this.fetchData() },
  onShow() { /* 刷新标记的数据 */ },
  onPullDownRefresh() { this.fetchData().finally(() => wx.stopPullDownRefresh()) },

  async fetchData() {
    this.setData({ pageState: PAGE_STATE.LOADING })
    try {
      const res = await apiRequest('/endpoint')
      this.setData({ list: res.data, pageState: res.data.length ? PAGE_STATE.READY : PAGE_STATE.EMPTY })
    } catch (e) {
      this.setData({ pageState: PAGE_STATE.ERROR })
    }
  }
})
```

### HTTP 请求工具（utils/request.js）

核心特性：**响应缓存**（默认 30s）、**重复请求合并**（inflight dedup）、**500 时降级到过期缓存**、自动 Bearer token 注入、401 跳转登录、SSE 流式支持。

- GET 请求默认使用缓存，POST 不缓存
- `markCacheDirty(url)` 标记缓存失效，下次 GET 重新请求
- AI 聊天使用 `streamRequest()` 发起流式请求

### 后端三层架构

```text
routes/miniapp.js     → 路由定义、限流、asyncRoute 错误包装
services/*.service.js → 业务逻辑、合规检查、数据清洗
repositories/*.repository.js → MySQL 查询、行→对象映射
```

- 公开路由（login / articles 等）放在 `authenticate` 中间件之前
- 受保护路由自动需要 Bearer token
- 所有路由用 `asyncRoute` 包装以捕获 async 错误

### AI 助手合规模式

AI 助手有**双重合规拦截**：

1. **输入检查**：拦截用户消息中的违禁医疗术语
2. **输出检查**：拦截 AI 回复中的诊断/治疗类表述
3. **强制免责声明**：每次回复附加健康信息提示

修改 AI 助手时，务必保持 `ai-assistant.service.js` 中的合规检查逻辑完整。

## 代码规范

### 命名

| 类型 | 规则 | 示例 |
|------|------|------|
| 页面/分包目录 | kebab-case | `record-form`、`reminder-form` |
| 服务端模块 | dot-separated | `miniapp.service.js`、`miniapp.repository.js` |
| JS 变量/函数 | camelCase | `fetchData`、`pageState` |
| CSS 类名 | BEM-like 描述性 | `hero-user-row`、`action-card` |
| CSS 自定义属性 | `--wx-` 前缀 | `--wx-brand-500`、`--wx-text-primary` |

### 模块系统

- **全项目使用 CommonJS**（`require` / `module.exports`），不使用 ES Modules
- 异步操作统一使用 `async/await`
- 防御性编码：大量 null/undefined 检查、输入清洗、文本长度限制

### 分包与懒加载

主包仅包含 5 个核心页面，其余按功能拆分到 `packages/` 下的 6 个分包。`app.json` 中配置了 `preloadRule`，进入特定页面时预加载关联分包。

### 设计系统

- 所有颜色/间距/字体通过 CSS 自定义属性引用，不硬编码值
- 明暗模式通过 `prefers-color-scheme` 媒体查询实现
- 诊断状态语义色：normal / ASCUS / LSIL / HSIL / SCC
- 患者状态色：pending / done / attention
- 响应式单位使用 `rpx`

## 关键配置文件

| 文件 | 用途 |
|------|------|
| `miniprogram/app.json` | 页面路由、分包、tabBar、预加载规则 |
| `miniprogram/config/app.js` | API 地址、超时、模板消息 ID |
| `miniprogram/styles/theme.json` | 原生导航栏/Tab 栏明暗模式配色 |
| `project.config.json` | 微信开发者工具项目配置 |
| `miniapp-privacy.json` | 隐私授权弹窗文案与协议链接 |
| `server/.env` | 数据库凭据、微信 AppSecret、AI API Key |

## 审核与合规要点

本项目需通过微信小程序审核，以下规则**必须遵守**：

1. **登录可选**：用户不登录即可浏览首页、健康知识、隐私说明等
2. **隐私先行**：首次登录前必须经过官方隐私授权流程
3. **头像/昵称延迟**：登录后在资料引导页单独处理，用户可跳过
4. **AI 合规**：健康助手仅做术语解释和健康科普，禁止诊断/治疗/用药建议
5. **订阅消息**：仅在用户主动点击时才请求授权
6. **类目合规**：服务类目为"工具 / 健康管理"，不选"医疗服务"相关类目

## 开发注意事项

- **API 地址**：`miniprogram/config/app.js` 中分环境配置（devtools / device / production）
- **真机调试**：手机无法访问 localhost，需改 `deviceApiBaseUrl` 为电脑局域网 IP
- **HTTPS**：体验版/正式版必须配置公网 HTTPS 域名，并在微信后台加入 request 合法域名
- **数据库编码**：统一使用 `utf8mb4_unicode_ci` 排序规则
- **缓存策略**：修改数据后调用 `markCacheDirty()` 确保下次读取获取最新数据
- **限流**：后端全局 120 req/min，特定路由有独立限流配置

## 文档与资源

- `README.md` — 项目总览与运行说明
- `docs/` — 设计文档（.drawio 格式）
- `server/database/init.sql` — 完整建表与演示数据
- `server/database/migrations/` — 增量迁移脚本
- `server/public/agreements/` — 隐私与服务协议落地页