---
name: CervixDetectAI_wx 小程序规范审查与优化
overview: 对"云端智诊"微信小程序进行全面代码审查，涵盖安全漏洞、开发规范、性能优化、Skyline渲染引擎适配和TDesign组件替换等5大维度，共计30+项优化建议。
todos:
  - id: fix-security
    content: 修复安全问题：轮换密钥、限制CORS、uploads鉴权、sitemap限制索引
    status: pending
  - id: setup-tdesign
    content: 配置TDesign：创建package.json、修改project.config.json、移除style:v2、构建npm
    status: pending
  - id: css-variables
    content: 建立CSS变量主题系统和公共样式，引入TDesign token，重构app.wxss
    status: pending
    dependencies:
      - setup-tdesign
  - id: replace-global-components
    content: 全局替换：t-button/t-icon/t-loading/t-avatar/t-dialog/t-notice-bar替换手写UI
    status: pending
    dependencies:
      - css-variables
  - id: replace-page-components
    content: 逐页面替换：t-search/t-empty/t-tag/t-cell/t-input/t-textarea/t-popup/t-skeleton/t-sticky
    status: pending
    dependencies:
      - replace-global-components
  - id: adapt-skyline
    content: Skyline适配：添加renderer配置、scroll-view包裹、worklet动画、自定义路由转场
    status: pending
    dependencies:
      - replace-page-components
  - id: performance-optimize
    content: 性能优化：虚拟列表、骨架屏、WXS日期格式化、图片懒加载、缓存持久化
    status: pending
    dependencies:
      - adapt-skyline
---

## 产品概述

对"云端智诊"(CervixDetectAI_wx)微信小程序进行规范性审查与优化，识别不符合小程序开发规范的代码、可优化的性能问题、以及可引入 Skyline 渲染引擎和 TDesign 组件库的位置，并给出完整的改造方案。

## 核心功能

- 审查安全问题（密钥泄露、CORS 宽松、上传无鉴权等）
- 审查开发规范问题（重复CSS、硬编码、缺少暗色模式、无npm构建配置等）
- 规划 Skyline 渲染引擎适配（scroll-view 包裹、worklet 动画、自定义路由转场）
- 规划 TDesign 组件替换（15+ 处手写 UI 替换为企业级组件）
- 规划性能优化（虚拟列表、骨架屏、WXS 计算、图片懒加载等）
- 产出完整的改造实施方案与文件级修改清单

## 技术栈

- 前端框架: 微信小程序原生框架 + TDesign MiniProgram 组件库
- 渲染引擎: Skyline（从 WebView 迁移）
- 组件框架: glass-easel
- 样式方案: CSS 变量主题系统 + TDesign Design Token
- 后端: Express.js + MySQL（已有，仅修复安全问题）

## 实施方案

### 一、安全修复（最高优先级）

- 轮换 server/.env 中泄露的 DB_PASSWORD 和 WECHAT_APP_SECRET
- 限制 CORS origin 为小程序域名
- uploads 目录移除 Access-Control-Allow-Origin: *，增加鉴权中间件
- sitemap.json 限制仅首页和公开内容页可索引
- 订阅消息模板 ID 抽取为服务端统一配置，前端从接口获取

### 二、TDesign 组件库引入

**安装配置:**

1. 创建 miniprogram/package.json，安装 tdesign-miniprogram
2. 修改 project.config.json 添加 packNpmManually + packNpmRelationList
3. 从 app.json 移除 "style": "v2"（与 TDesign 冲突）
4. 微信开发者工具构建 npm

**组件替换映射（15+处）:**

| 当前实现 | TDesign 组件 | 涉及页面 |
| --- | --- | --- |
| .primary-button / .text-button / .mini-primary / .ghost-button | t-button | 全部页面 |
| weui-confirm 自定义确认弹窗 | t-dialog | records, reminders, record-detail, profile |
| mp-searchbar | t-search | records, reminders, questions |
| 裸 input/textarea | t-input / t-textarea | record-form, reminder-form, feedback, login |
| empty-state 自定义组件 | t-empty | records, reminders, articles |
| mp-cell / mp-cells | t-cell | record-form, reminder-form, feedback, login |
| .pill 状态标签 | t-tag | records, reminders, record-detail |
| .loading-ring 自定义加载 | t-loading | 全部页面 |
| .safe-note 免责声明 | t-notice-bar | 全部页面 |
| 自定义头像展示 | t-avatar | home, login, profile |
| 文章弹窗 / 反馈说明弹窗 | t-popup | articles, feedback |
| 无骨架屏 | t-skeleton（新增） | 全部列表页 |
| 无左滑删除 | t-swipe-cell（新增） | records, reminders |
| section-header 吸顶 | t-sticky | records, reminders |
| 50+ PNG 图标 | t-icon（Icon 组件） | 全局替换 |


### 三、Skyline 渲染引擎适配

**配置层:**

- app.json 添加 "renderer": "skyline"、"componentFramework": "glass-easel"、"rendererOptions"
- 各页面 json 可按需覆盖 "renderer": "skyline"
- 注意: Skyline 下页面默认不滚动，需用 scroll-view 包裹

**组件适配:**

- 所有页面外层添加 `<scroll-view type="list" scroll-y style="height: 100vh">`
- action-card 的 hover 动画改用 worklet 的 applyAnimatedStyle
- 列表页可选用 scroll-view type="list" 的虚拟列表能力
- share-element 实现页面转场共享元素动画

**路由转场:**

- 添加自定义 routeBuilder，实现页面切换动画（如 slide-in-right）
- 配置 pop-gesture 支持右滑返回手势

**样式适配:**

- 检查所有 CSS 属性在 Skyline 下的兼容性（如 backdrop-filter 不支持）
- 移除不支持的 CSS 特性，寻找 Skyline 替代方案

### 四、CSS 架构重构

**问题:** .card, .primary-button, .pill, .icon-chip, .safe-note, .section-kicker 等在多文件重复定义且值不一致

**方案:**

1. 建立 app.wxss 全局 CSS 变量系统（颜色、间距、圆角、阴影）
2. 公共样式类统一到 app.wxss，各页面只写差异样式
3. 引入 TDesign CSS 变量（--td-brand-color 等），组件自动跟随主题
4. 支持暗色模式: app.json 添加 "darkmode": true，定义 darkmode.wxss

### 五、性能优化

- 列表页使用 scroll-view type="list" 虚拟滚动（Skyline 特性）
- 添加 t-skeleton 骨架屏替代纯 loading 旋转环
- 图片添加 lazy-load 属性
- 日期格式化等高频计算迁移到 WXS
- setData 仅传递差异字段，避免整体替换
- 缓存策略升级: 内存缓存 + Storage 持久化双层缓存
- preloadRule 扩展覆盖更多页面入口

## 目录结构

```
miniprogram/
├── app.js                    # [MODIFY] 添加 Skyline 初始化逻辑
├── app.json                  # [MODIFY] 添加 renderer/glass-easel/darkmode，移除 style:v2
├── app.wxss                  # [MODIFY] 添加 CSS 变量系统、TDesign 主题 token、公共样式
├── package.json              # [NEW] npm 依赖声明（tdesign-miniprogram）
├── darkmode.wxss             # [NEW] 暗色模式样式变量
├── config/app.js             # [MODIFY] 移除硬编码模板ID，改用接口获取
├── pages/home/
│   ├── index.wxml            # [MODIFY] scroll-view 包裹、TDesign 组件替换
│   ├── index.wxss            # [MODIFY] 移除重复样式，使用 CSS 变量
│   ├── index.js              # [MODIFY] 优化 setData、骨架屏数据
│   └── index.json            # [MODIFY] TDesign 组件声明
├── pages/login/
│   ├── index.wxml            # [MODIFY] t-button/t-input/t-avatar 替换
│   ├── index.wxss            # [MODIFY] 精简样式
│   └── index.json            # [MODIFY] TDesign 组件声明
├── pages/records/
│   ├── index.wxml            # [MODIFY] scroll-view+t-search+t-empty+t-tag+t-button+t-skeleton
│   ├── index.wxss            # [MODIFY] 大幅精简
│   ├── index.js              # [MODIFY] 虚拟列表、骨架屏
│   └── index.json            # [MODIFY] TDesign 组件声明
├── pages/reminders/
│   ├── index.wxml            # [MODIFY] 同 records 改造
│   ├── index.wxss            # [MODIFY] 大幅精简
│   └── index.json            # [MODIFY] TDesign 组件声明
├── pages/profile/
│   ├── index.wxml            # [MODIFY] t-avatar+t-cell+t-button 替换
│   ├── index.wxss            # [MODIFY] 精简
│   └── index.json            # [MODIFY] TDesign 组件声明
├── packages/records/record-detail/
│   ├── index.wxml            # [MODIFY] scroll-view+t-tag+t-button+t-dialog 替换
│   ├── index.wxss            # [MODIFY] 精简
│   └── index.json            # [MODIFY] TDesign 组件声明
├── packages/records/record-form/
│   ├── index.wxml            # [MODIFY] t-input+t-textarea+t-cell+t-button 替换
│   ├── index.wxss            # [MODIFY] 精简
│   └── index.json            # [MODIFY] TDesign 组件声明
├── packages/reminders/reminder-form/
│   ├── index.wxml            # [MODIFY] 同 record-form 改造
│   ├── index.wxss            # [MODIFY] 精简
│   └── index.json            # [MODIFY] TDesign 组件声明
├── packages/tools/questions/
│   ├── index.wxml            # [MODIFY] t-search+t-checkbox 替换
│   ├── index.wxss            # [MODIFY] 精简
│   └── index.json            # [MODIFY] TDesign 组件声明
├── packages/tools/articles/
│   ├── index.wxml            # [MODIFY] t-popup+t-empty 替换
│   ├── index.wxss            # [MODIFY] 精简
│   └── index.json            # [MODIFY] TDesign 组件声明
├── packages/profile/feedback/
│   ├── index.wxml            # [MODIFY] t-input+t-textarea+t-upload+t-popup 替换
│   ├── index.wxss            # [MODIFY] 精简
│   └── index.json            # [MODIFY] TDesign 组件声明
├── components/
│   ├── empty-state/          # [DELETE] 用 t-empty 替代
│   ├── section-header/       # [MODIFY] 简化，或用 t-navbar 替代
│   ├── privacy-popup/        # [MODIFY] 用 t-popup 重构
│   └── weui-confirm/         # [DELETE] 用 t-dialog 替代
├── utils/
│   ├── request.js            # [MODIFY] 添加 Storage 持久化缓存层
│   ├── navigation.js         # [MODIFY] 无大改动
│   ├── page-state.js         # [MODIFY] 无大改动
│   ├── feedback.js           # [MODIFY] 用 TDesign Toast/Dialog API 替换
│   ├── avatar.js             # [MODIFY] 无大改动
│   ├── date.wxs              # [NEW] 日期格式化 WXS 模块
│   └── auth.js               # [MODIFY] 统一路由守卫逻辑
project.config.json           # [MODIFY] 添加 packNpmManually/packNpmRelationList
server/
├── .env                      # [MODIFY] 轮换密钥，限制 CORS
├── src/app.js                # [MODIFY] 限制 CORS、uploads 添加鉴权
├── src/services/miniapp.service.js  # [MODIFY] 模板ID 抽取配置
sitemap.json                  # [MODIFY] 限制索引页面
```

## 实施注意事项

- TDesign 引入时必须移除 app.json 的 "style": "v2"，否则样式冲突
- Skyline 适配需逐页面测试，WebView 和 Skyline 可共存（页面级 renderer 配置）
- CSS 变量系统需先定义完整再替换，避免中间状态页面样式错乱
- 50+ PNG 图标替换为 t-icon 需确认图标名称映射关系
- project.config.json 的 packNpmManually 配置后需在开发者工具重新"构建 npm"
- Skyline 下 page 默认不滚动是最大的破坏性变更，所有页面必须添加 scroll-view

## Agent Extensions

### Skill

- **微信小程序开发框架**
- Purpose: 验证所有页面是否符合小程序开发规范（生命周期、setData用法、组件规范、配置项等）
- Expected outcome: 输出完整的规范违规清单及修复建议
- **skyline渲染引擎**
- Purpose: 确认 Skyline 适配所需的配置项、组件用法（scroll-view enhanced mode、worklet动画、自定义路由），以及 WXSS 兼容性检查
- Expected outcome: 产出完整的 Skyline 迁移配置与组件改造方案
- **TDesign 微信小程序组件**
- Purpose: 确认各 TDesign 组件的引入路径、API用法、主题定制方式、暗色模式支持，生成组件替换映射表
- Expected outcome: 产出精确到文件路径的 TDesign 组件替换实施方案