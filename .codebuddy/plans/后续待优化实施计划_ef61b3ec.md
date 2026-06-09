---
name: 后续待优化实施计划
overview: 基于对已完成的 7 大优化的全面审查，制定剩余待优化项的实施计划，包括：按钮组件替换、图标替换、搜索框替换、骨架屏、隐私弹窗重构、服务端安全加固、Skyline worklet 动画等。
todos:
  - id: replace-buttons-icons
    content: 替换全页面 t-button + t-icon：[skill:TDesign 微信小程序组件] 验证 API 后批量替换 11 个页面的按钮和图标
    status: completed
  - id: replace-search
    content: 替换 mp-searchbar 为 t-search（records/reminders/questions）+ 适配 JS 事件
    status: completed
    dependencies:
      - replace-buttons-icons
  - id: add-skeleton
    content: 添加 t-skeleton 骨架屏替换 loading-ring（home/records/reminders/articles/record-detail）
    status: completed
    dependencies:
      - replace-buttons-icons
  - id: refactor-popups
    content: 重构 privacy-popup 和 feedback official-sheet 为 t-popup + 修复 record-detail status-pill → t-tag
    status: completed
    dependencies:
      - replace-buttons-icons
  - id: fix-server-cors
    content: 修复服务端 CORS：.env 删除 MINIAPP_ALLOWED_ORIGIN=* 让安全默认值生效
    status: completed
  - id: skyline-advanced
    content: "[skill:skyline渲染引擎] Skyline 进阶：worklet 动画 + 自定义路由转场 + pop-gesture"
    status: completed
    dependencies:
      - replace-buttons-icons
      - replace-search
      - add-skeleton
      - refactor-popups
---

## 产品概述

对"云端智诊"微信小程序继续进行剩余优化，在前一轮 7 大优化已落地的基础上，完成尚未覆盖的 TDesign 组件替换、安全修复和 Skyline 进阶功能。

## 核心功能

### 已完成项审视结论

经逐文件审查，以下优化已正确落地：

- TDesign 配置（package.json、project.config.json、移除 style:v2）
- CSS 变量系统（30+ 变量 + 暗色模式 + theme.json）
- 组件替换（weui-confirm → t-dialog、empty-state → t-empty、safe-note → t-notice-bar 9处、pill → t-tag、article弹窗 → t-popup）
- Skyline 适配（12 页面 scroll-view、rendererOptions、WeUI 页面 webview 渲染器）
- 性能优化（lazy-load、缓存持久化、分享功能）
- 开发规范（sitemap、CORS env.js 默认值）

### 审视发现的问题

1. **login 页面缺少 scroll-view 包裹** — 唯一未包裹的页面，虽然 renderer=webview 但应保持一致
2. **record-detail 的 status-pill 仍为手写** — 未替换为 t-tag
3. **feedback 的 official-sheet-mask 仍为手写弹窗** — 未替换为 t-popup
4. **articles 的 t-popup 事件绑定** — bind:visible-change="closeArticle" 需验证 JS 端事件处理是否适配 t-popup 的 detail.visible 参数
5. **server/.env 中 MINIAPP_ALLOWED_ORIGIN 仍为 \*** — env.js 默认值已改为微信域名，但 .env 覆盖了默认值

### 待优化内容

- 全页面自定义按钮替换为 t-button（11 个页面，约 30+ 处）
- mp-icon 替换为 t-icon（25+ 处，需图标名映射）
- mp-searchbar 替换为 t-search（3 个页面）
- loading-ring 替换为 t-skeleton 骨架屏
- privacy-popup 用 t-popup 重构
- 服务端 CORS 限制
- Skyline 进阶：worklet 动画、自定义路由转场

## 技术栈

- 前端框架: 微信小程序原生框架 + TDesign MiniProgram 组件库（已安装 ^1.5.0）
- 渲染引擎: Skyline（已配置全局，WeUI 页面 webview 兼容）
- 组件框架: glass-easel（已配置）
- 后端: Express.js（仅修复 CORS 配置）

## 实施方案

### 一、t-button 全局替换

**映射关系：**

| 旧样式类 | t-button 属性 | 说明 |
| --- | --- | --- |
| `.primary-button` | `theme="primary" size="large" block` | 主按钮 |
| `.primary-button` + icon | `theme="primary" icon="xxx" size="large" block` | 带图标主按钮 |
| `.text-button` | `variant="text" size="medium"` | 文字按钮 |
| `.text-button.danger` | `variant="text" theme="danger" size="medium"` | 危险文字按钮 |
| `.mini-primary` | `theme="primary" size="small"` | 小型主按钮 |
| `.ghost-button` | `variant="outline" size="medium"` | 描边按钮 |
| `.ghost-button.small-button` | `variant="outline" size="small"` | 小描边按钮 |
| `.plain-link` | `variant="text" size="medium"` | 文字链接 |


**关键决策：** t-button 自带 hover 态和 disabled 样式，替换后可移除 `.action-card-pressed`、`.notify-button-disabled` 等自定义按压/禁用样式。

**注意：** t-button 使用 `<t-button>` 标签而非 `<button>`，不再支持 `open-type`（如 `chooseAvatar`、`agreePrivacyAuthorization`、`feedback`）。这些页面需保留原生 `<button>`：login 的头像选择按钮、隐私同意按钮，feedback 的官方反馈按钮。

### 二、mp-icon → t-icon 替换

**图标名映射（WeUI → TDesign）：**

| mp-icon name | t-icon name | 用途 |
| --- | --- | --- |
| me | user | 用户 |
| note | file | 记录/文件 |
| add | add | 添加 |
| delete | delete | 删除 |
| info | info-circle | 信息 |
| comment | chat | 评论/反馈 |
| arrow | chevron-right | 箭头 |
| close | close | 关闭 |
| time | time | 时间/提醒 |
| search | search | 搜索 |


**注意：** t-icon 的 size 单位是 rpx，mp-icon 的 size 是逻辑像素，需调整。t-icon 使用 `name` 属性而非 `icon`。

### 三、mp-searchbar → t-search 替换

t-search API 差异：

- `value` → `value`（相同）
- `placeholder` → `placeholder`（相同）
- `bindinput` → `bind:change`
- `bindclear` → `bind:clear`
- `search` 回调 → `bind:submit`
- `cancel` 属性 → 不需要（t-search 默认无取消按钮）

3 个页面 JS 端的搜索逻辑需适配新事件名。

### 四、t-skeleton 骨架屏

替换方案：

- 在 `pageStatus === 'loading'` 时，用 `<t-skeleton>` 渲染内容骨架
- 骨架配置按页面内容定制（卡片、列表项、文字行等）
- 移除 `.loading-ring` 和 `.local-loading` 样式

涉及页面：home、records、reminders、articles、record-detail

### 五、privacy-popup → t-popup 重构

当前使用手写遮罩 `.privacy-mask` + 面板，改为：

```xml
<t-popup visible="{{visible}}" placement="center" bind:visible-change="onPopupVisibleChange">
  <!-- 内容保留 -->
</t-popup>
```

保留原生 `<button open-type="agreePrivacyAuthorization">`，仅替换外层容器。

### 六、服务端安全修复

- `.env` 中 `MINIAPP_ALLOWED_ORIGIN=*` 改为具体域名（或删除该行让 env.js 默认值生效）
- uploads 的 `Access-Control-Allow-Origin: *` 是小程序图片跨域加载必需，保留但添加安全注释

### 七、Skyline 进阶

- action-card 的 hover-class 改为 worklet `applyAnimatedStyle`
- 添加自定义 routeBuilder（slide 转场）
- 启用 pop-gesture 右滑返回

## 目录结构

```
miniprogram/
├── pages/home/
│   ├── index.wxml            # [MODIFY] t-button+t-icon 替换
│   ├── index.wxss             # [MODIFY] 移除已替换的按钮样式
│   ├── index.json             # [MODIFY] 注册 t-button+t-icon
│   └── index.js               # [MODIFY] 无改动
├── pages/login/
│   ├── index.wxml             # [MODIFY] t-button+t-icon 替换（保留 open-type 原生按钮）+ 添加 scroll-view
│   ├── index.wxss             # [MODIFY] 移除已替换的按钮样式
│   └── index.json             # [MODIFY] 注册 t-button+t-icon
├── pages/records/
│   ├── index.wxml             # [MODIFY] t-button+t-icon+t-search 替换
│   ├── index.wxss             # [MODIFY] 移除已替换的按钮/搜索样式
│   ├── index.js               # [MODIFY] 适配 t-search 事件
│   └── index.json             # [MODIFY] 注册 t-button+t-icon+t-search
├── pages/reminders/
│   ├── index.wxml             # [MODIFY] t-button+t-icon+t-search 替换
│   ├── index.wxss             # [MODIFY] 移除已替换的按钮/搜索样式
│   ├── index.js               # [MODIFY] 适配 t-search 事件
│   └── index.json             # [MODIFY] 注册 t-button+t-icon+t-search
├── pages/profile/
│   ├── index.wxml             # [MODIFY] t-button+t-icon 替换
│   ├── index.wxss             # [MODIFY] 移除已替换的按钮样式
│   └── index.json             # [MODIFY] 注册 t-button+t-icon
├── packages/records/record-detail/
│   ├── index.wxml             # [MODIFY] t-button+t-icon+t-tag(status-pill) 替换
│   ├── index.wxss             # [MODIFY] 移除 status-pill 样式
│   └── index.json             # [MODIFY] 注册 t-button+t-icon+t-tag
├── packages/records/record-form/
│   ├── index.wxml             # [MODIFY] t-button+t-icon 替换
│   ├── index.wxss             # [MODIFY] 移除已替换的按钮样式
│   └── index.json             # [MODIFY] 注册 t-button+t-icon
├── packages/reminders/reminder-form/
│   ├── index.wxml             # [MODIFY] t-button+t-icon 替换
│   ├── index.wxss             # [MODIFY] 移除已替换的按钮样式
│   └── index.json             # [MODIFY] 注册 t-button+t-icon
├── packages/tools/questions/
│   ├── index.wxml             # [MODIFY] t-button+t-icon+t-search 替换
│   ├── index.wxss             # [MODIFY] 移除已替换的按钮/搜索样式
│   ├── index.js               # [MODIFY] 适配 t-search 事件
│   └── index.json             # [MODIFY] 注册 t-button+t-icon+t-search
├── packages/tools/articles/
│   ├── index.wxml             # [MODIFY] t-button+t-icon 替换 + 验证 t-popup 事件
│   ├── index.wxss             # [MODIFY] 移除已替换的按钮样式
│   ├── index.js               # [MODIFY] 适配 t-popup visible-change 事件参数
│   └── index.json             # [MODIFY] 注册 t-button+t-icon
├── packages/profile/feedback/
│   ├── index.wxml             # [MODIFY] t-button+t-icon 替换 + official-sheet → t-popup
│   ├── index.wxss             # [MODIFY] 移除 official-sheet 样式
│   └── index.json             # [MODIFY] 注册 t-button+t-icon+t-popup
├── components/
│   ├── privacy-popup/
│   │   ├── index.wxml         # [MODIFY] 外层容器替换为 t-popup
│   │   ├── index.wxss         # [MODIFY] 移除 .privacy-mask 样式
│   │   └── index.json         # [MODIFY] 注册 t-popup
│   └── section-header/        # [MODIFY] mp-icon → t-icon
├── utils/
│   └── date.wxs               # [NEW] WXS 日期格式化（上一轮创建，待在 WXML 中引用）
server/
├── .env                       # [MODIFY] MINIAPP_ALLOWED_ORIGIN 改为微信域名或删除
```

## 实施注意事项

- t-button 不支持 `open-type`，login 页面的头像选择和隐私授权按钮必须保留原生 `<button>`
- t-icon 的图标名需在实施时逐一验证（TDesign 图标名可能因版本不同略有差异），推荐在微信开发者工具中实时验证
- t-search 的 JS 事件处理与 mp-searchbar 不同，需同步修改 search 回调逻辑
- articles 页面的 t-popup `bind:visible-change` 事件需确认 JS 端处理函数签名兼容
- 替换按钮后可删除对应页面 WXSS 中的 `.primary-button`、`.text-button`、`.ghost-button`、`.mini-primary`、`.plain-link` 等样式定义，减少包体积
- 骨架屏需按页面内容布局定制 `row-col` 配置，不可统一复用
- Skyline worklet 动画需在页面 JS 中使用 `this.applyAnimatedStyle`，且仅在 Skyline 渲染器下生效

## Agent Extensions

### Skill

- **TDesign 微信小程序组件**
- Purpose: 验证 t-button、t-icon、t-search、t-skeleton、t-popup 的精确 API 用法、属性名、事件名、图标名称映射
- Expected outcome: 产出每个组件的精确属性配置，避免实施时 API 不匹配导致返工
- **skyline渲染引擎**
- Purpose: 确认 worklet 动画 applyAnimatedStyle 的用法、自定义 routeBuilder 配置、pop-gesture 启用方式
- Expected outcome: 产出可复制的 worklet 动画代码模板和路由转场配置
- **微信小程序开发框架**
- Purpose: 验证 t-search 替换 mp-searchbar 后的事件兼容性、scroll-view 在 Skyline/webview 混合模式下的行为
- Expected outcome: 确认混合渲染器模式下的最佳实践