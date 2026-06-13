本文档详细介绍了 CervixDetectAI 微信小程序中公共组件的设计理念、架构模式和具体实现。这些组件位于 `miniprogram/components/` 目录下，为整个应用提供了统一的用户体验和开发范式。

## 设计系统基础

### 设计令牌（Design Tokens）

项目通过设计令牌实现了统一的视觉语言。这些令牌定义在 [miniprogram/styles/design-tokens.wxss](miniprogram/styles/design-tokens.wxss) 中，涵盖了颜色、阴影、圆角、间距和动画等核心视觉属性。

**颜色系统**采用语义化命名，包括品牌色（`--wx-brand-*`）、文本色（`--wx-text-*`）和背景色（`--wx-bg-*`）。品牌色以蓝色为主，分为9个色阶，满足不同场景需求。文本色根据重要性分为主要、次要和三级，确保信息层次清晰。

**阴影系统**为不同层级的元素提供了差异化的视觉深度，从卡片阴影（`--wx-shadow-card`）到浮动阴影（`--wx-shadow-float`），帮助用户理解界面元素的层次关系。

**圆角和间距系统**使用统一的命名规范（`--wx-radius-*`、`--wx-space-*`），确保界面元素在不同屏幕尺寸下保持一致的比例关系。

Sources: [design-tokens.wxss](miniprogram/styles/design-tokens.wxss#L1-L107)

### 主题支持

项目支持浅色和深色两种主题模式，通过 [miniprogram/styles/theme.json](miniprogram/styles/theme.json) 配置。主题切换时，导航栏、标签栏和背景色会相应调整，确保在不同环境下的可读性和视觉舒适度。

深色模式的设计考虑了降低蓝光辐射和减少视觉疲劳，同时保持足够的对比度以满足可访问性要求。

Sources: [theme.json](miniprogram/styles/theme.json#L1-L19)

## 组件分类与功能

项目中的公共组件可以分为以下几类：

**信息展示类组件**：
- `empty-state`：用于列表为空时的状态展示
- `section-header`：页面区段的标题和描述展示
- `skeleton`：内容加载时的骨架屏占位

**交互控制类组件**：
- `privacy-consent`：隐私协议同意弹窗
- `setup-sheet`：用户资料设置底部弹窗
- `weui-confirm`：通用确认对话框

**布局辅助类组件**：
- `section-header`：支持插槽的灵活标题组件

下表总结了各组件的关键特性：

| 组件 | 主要功能 | 关键属性 | 事件 | 使用场景 |
|------|----------|----------|------|----------|
| `empty-state` | 空状态展示 | `title`, `desc`, `icon`, `buttonText` | `action` | 列表为空、搜索无结果 |
| `section-header` | 区段标题 | `title`, `icon`, `desc` | - | 页面各区块的标题 |
| `privacy-consent` | 隐私协议弹窗 | `visible` | `accept`, `decline` | 登录前协议确认 |
| `setup-sheet` | 资料设置弹窗 | `visible`, `loggedIn` | `closed` | 用户资料编辑 |
| `skeleton` | 骨架屏 | `mode`, `rows` | - | 内容加载状态 |
| `weui-confirm` | 确认对话框 | `show`, `title`, `content` | `cancel`, `confirm` | 删除确认、退出登录 |

## 组件架构模式

### 组件设计原则

所有公共组件遵循以下设计原则：

**单一职责原则**：每个组件专注于解决一个特定问题，避免功能过度耦合。例如，`empty-state` 只负责空状态展示，不包含数据加载逻辑。

**可复用性设计**：通过灵活的属性配置和插槽机制，组件能够在不同场景下复用。`section-header` 的 `extra` 插槽允许插入自定义操作按钮。

**一致性体验**：组件遵循统一的设计语言，包括颜色、间距、动画和交互模式，确保用户在整个应用中获得一致的体验。

**渐进增强**：组件在不同设备能力下都能正常工作，高级特性（如动画）在不支持时优雅降级。

### 组件通信模式

组件与页面之间的通信主要采用以下模式：

**属性传递**：页面通过属性向组件传递数据，如 `title`、`visible` 等。组件内部监听属性变化并做出响应。

**事件触发**：组件通过事件向页面传递用户交互结果。例如，`privacy-consent` 在用户同意后触发 `accept` 事件。

**插槽扩展**：`section-header` 使用具名插槽允许页面插入自定义内容，提供了最大的灵活性。

**状态同步**：某些组件（如 `setup-sheet`）需要与页面状态保持同步，通过双向绑定或状态提升实现。

## 组件详细分析

### empty-state 组件

`empty-state` 组件用于在列表为空或搜索无结果时提供友好的用户提示。组件结构简洁，包含图标、标题、描述和可选的操作按钮。

**设计特点**：
- 支持两种图标类型：自定义图片（`icon`）和微信图标（`weuiIcon`）
- 按钮使用渐变背景，与品牌色保持一致
- 圆角卡片设计，与整体风格统一

**使用示例**：
```xml
<empty-state
  wx:if="{{pageStatus === 'empty'}}"
  title="还没有检查记录"
  desc="可以先添加一次检查摘要，后续复查时更方便查看。"
  weui-icon="add"
  button-text="添加第一条记录"
  bind:action="createRecord"
/>
```

Sources: [empty-state/index.js](miniprogram/components/empty-state/index.js#L1-L30), [empty-state/index.wxml](miniprogram/components/empty-state/index.wxml#L1-L12), [empty-state/index.wxss](miniprogram/components/empty-state/index.wxss#L1-L76)

### section-header 组件

`section-header` 是项目中最常用的组件之一，为页面各个区块提供统一的标题样式。组件支持图标、标题、描述和额外操作插槽。

**设计特点**：
- 灵活的图标系统，支持图片和微信图标
- 插槽机制允许插入自定义操作按钮
- 响应式布局，在不同屏幕尺寸下保持良好显示

**使用示例**：
```xml
<section-header title="检查记录" weui-icon="note">
  <button slot="extra" class="mini-primary" bind:tap="createRecord">
    <view class="button-content">
      <mp-icon icon="add" color="rgb(24, 118, 210)" size="{{16}}" />
      <text class="button-text">新增</text>
    </view>
  </button>
</section-header>
```

Sources: [section-header/index.js](miniprogram/components/section-header/index.js#L1-L24), [section-header/index.wxml](miniprogram/components/section-header/index.wxml#L1-L14), [section-header/index.wxss](miniprogram/components/section-header/index.wxss#L1-L48)

### privacy-consent 组件

`privacy-consent` 组件用于在用户登录前展示隐私协议，并获取用户的明确同意。这是满足微信小程序隐私合规要求的关键组件。

**设计特点**：
- 模态弹窗设计，阻止用户操作直到做出选择
- 复选框机制确保用户主动同意
- 支持查看完整的协议内容
- 记录同意时间，满足合规要求

**交互流程**：
1. 用户触发需要登录的功能时，弹出隐私协议弹窗
2. 用户阅读协议内容，可以点击查看完整协议
3. 用户勾选同意复选框后，"同意并继续"按钮变为可点击状态
4. 用户点击同意后，记录同意状态和时间，触发 `accept` 事件
5. 用户也可以选择"仅浏览"模式，继续使用部分功能

Sources: [privacy-consent/index.js](miniprogram/components/privacy-consent/index.js#L1-L42), [privacy-consent/index.wxml](miniprogram/components/privacy-consent/index.wxml#L1-L32), [privacy-consent/index.wxss](miniprogram/components/privacy-consent/index.wxss#L1-L164)

### setup-sheet 组件

`setup-sheet` 是一个复杂的底部弹窗组件，用于让用户设置昵称和头像。组件整合了表单处理、文件上传、状态管理和协议同意等多个功能。

**设计特点**：
- 底部弹窗模式，符合微信小程序的设计规范
- 动画过渡效果，提升用户体验
- 支持协议同意和资料设置的分离处理
- 头像选择支持微信原生选择器
- 表单验证和保存状态管理

**状态管理**：
组件内部维护多个状态变量：
- `profileForm`：表单数据
- `avatarLocalPath`：头像本地路径
- `avatarUploadPending`：头像上传待处理状态
- `saving`：保存中状态
- `setupEnabled`：是否已同意设置协议

**使用示例**：
```xml
<setup-sheet
  visible="{{setupSheetVisible}}"
  loggedIn="{{!isGuest}}"
  bind:closed="onSetupSheetClosed"
/>
```

Sources: [setup-sheet/index.js](miniprogram/components/setup-sheet/index.js#L1-L232), [setup-sheet/index.wxml](miniprogram/components/setup-sheet/index.wxml#L1-L86), [setup-sheet/index.wxss](miniprogram/components/setup-sheet/index.wxss#L1-L349)

### skeleton 组件

`skeleton` 组件提供内容加载时的骨架屏占位，减少用户的等待焦虑感。组件支持多种布局模式，适应不同的内容结构。

**设计特点**：
- 多种预设模式：`hero`、`card`、`list`、`default`
- 微妙的动画效果（`sk-shimmer`），暗示内容正在加载
- 使用品牌色的低透明度变体，保持视觉一致性
- 列表模式支持自定义行数

**模式说明**：
- `hero`：头部区域骨架屏，包含头像和统计卡片
- `card`：卡片内容骨架屏，适用于单个内容块
- `list`：列表项骨架屏，适用于列表内容
- `default`：默认骨架屏，包含标题和内容行

Sources: [skeleton/index.js](miniprogram/components/skeleton/index.js#L1-L19), [skeleton/index.wxml](miniprogram/components/skeleton/index.wxml#L1-L51), [skeleton/index.wxss](miniprogram/components/skeleton/index.wxss#L1-L124)

### weui-confirm 组件

`weui-confirm` 是一个通用的确认对话框组件，基于微信 WeUI 设计规范实现。组件用于需要用户确认的重要操作，如删除记录、退出登录等。

**设计特点**：
- 遮罩层阻止背景操作
- 支持自定义标题、内容和按钮文本
- 警告模式（`confirmWarn`）用于危险操作，使用红色按钮
- 点击遮罩层可关闭对话框

**使用示例**：
```xml
<weui-confirm
  show="{{confirmDialog.show}}"
  title="退出登录"
  content="退出后可重新登录继续管理自己的记录。"
  confirm-text="退出"
  confirm-warn="{{true}}"
  bind:cancel="closeConfirmDialog"
  bind:confirm="confirmLogout"
/>
```

Sources: [weui-confirm/index.js](miniprogram/components/weui-confirm/index.js#L1-L43), [weui-confirm/index.wxml](miniprogram/components/weui-confirm/index.wxml#L1-L15), [weui-confirm/index.wxss](miniprogram/components/weui-confirm/index.wxss#L1-L103)

## 组件使用指南

### 最佳实践

**选择合适的组件**：根据功能需求选择最合适的组件。例如，列表为空时使用 `empty-state`，需要用户确认时使用 `weui-confirm`。

**遵循设计规范**：使用设计令牌中的颜色、间距和圆角值，确保视觉一致性。避免硬编码样式值。

**合理使用插槽**：对于需要灵活扩展的组件（如 `section-header`），善用插槽机制插入自定义内容。

**状态管理**：对于复杂组件（如 `setup-sheet`），确保状态管理清晰，避免状态不一致导致的交互问题。

**错误处理**：组件应该优雅地处理错误情况，如网络请求失败、文件上传失败等，提供友好的错误提示。

### 性能优化

**按需加载**：使用微信小程序的 `lazyCodeLoading` 特性，只在需要时加载组件。

**避免过度渲染**：合理使用 `wx:if` 和 `hidden`，避免不必要的组件渲染。

**图片优化**：对于 `empty-state` 等组件中的图片，使用合适的尺寸和格式，减少加载时间。

**动画性能**：使用 CSS 动画而非 JavaScript 动画，利用 GPU 加速提升性能。

### 可访问性考虑

**语义化标签**：使用合适的 ARIA 属性，如 `aria-role`、`aria-label` 等，提升屏幕阅读器的兼容性。

**键盘导航**：确保所有交互元素都可以通过键盘访问和操作。

**颜色对比度**：确保文本和背景之间有足够的对比度，满足 WCAG 2.1 AA 标准。

**动画控制**：提供减少动画的选项，尊重用户的系统偏好设置。

## 设计规范与约束

### 视觉一致性

所有组件必须遵循项目的设计系统，使用设计令牌中定义的颜色、间距和圆角值。这确保了整个应用的视觉一致性。

**颜色使用**：
- 主要操作使用品牌蓝色（`--wx-brand-500`）
- 危险操作使用警告红色（`--wx-danger`）
- 文本使用语义化颜色（`--wx-text-primary` 等）

**间距规范**：
- 组件内部间距使用 `--wx-space-*` 令牌
- 组件之间保持一致的间距
- 移动端优先设计，考虑触摸目标尺寸

### 交互模式

**反馈机制**：所有用户操作都应该有即时反馈，包括视觉、触觉和听觉反馈。

**状态指示**：加载状态、保存状态等都应该有明确的视觉指示。

**错误恢复**：提供清晰的错误信息和恢复路径，避免用户陷入死胡同。

**确认模式**：重要操作（如删除）需要二次确认，避免误操作。

### 合规要求

**隐私保护**：涉及用户数据的功能必须获得用户明确同意，遵循《隐私与服务说明》。

**内容安全**：用户生成的内容需要经过合规词过滤，避免违规内容。

**数据最小化**：只收集必要的用户数据，遵循数据最小化原则。

**透明度**：向用户清晰地说明数据用途和处理方式，保持透明度。

通过遵循这些设计规范和约束，公共组件不仅提供了统一的用户体验，也确保了应用的安全性和合规性。组件的设计充分考虑了微信小程序的特性和限制，为开发者提供了高效、可靠的开发工具。