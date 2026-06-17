---
name: 云端智诊
description: 女性健康管理助手——轻量、友好、日常的健康信息记录工具
colors:
  brand-blue: "#2563eb"
  brand-blue-deep: "#1d4ed8"
  brand-blue-navy: "#0d47a1"
  brand-blue-ink: "#172554"
  brand-blue-50: "#eff6ff"
  brand-blue-100: "#dbeafe"
  brand-blue-200: "#bfdbfe"
  brand-blue-300: "#93c5fd"
  brand-blue-400: "#60a5fa"
  text-primary: "#1e293b"
  text-secondary: "#475569"
  text-tertiary: "#64748b"
  text-on-brand: "#ffffff"
  bg-primary: "#ffffff"
  bg-secondary: "#f8fafc"
  bg-tertiary: "#f0f4ff"
  bg-input: "#f8f9ff"
  bg-glass: "rgba(255,255,255,0.78)"
  bg-glass-light: "rgba(255,255,255,0.62)"
  bg-card: "rgba(255,255,255,0.82)"
  border-default: "rgba(198,210,236,0.58)"
  border-light: "rgba(195,198,214,0.48)"
  border-brand: "rgba(37,99,235,0.12)"
  diagnosis-normal: "#14b8a6"
  diagnosis-ascus: "#f59e0b"
  diagnosis-lsil: "#f97316"
  diagnosis-hsil: "#ef4444"
  diagnosis-scc: "#991b1b"
  danger: "#ba1a1a"
  success: "#14b8a6"
  warning: "#f59e0b"
  fab-blue: "#1876d2"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "42rpx"
    fontWeight: 900
    lineHeight: 1.15
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "34rpx"
    fontWeight: 800
    lineHeight: 1.28
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "30rpx"
    fontWeight: 800
    lineHeight: 1.22
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "27rpx"
    fontWeight: 400
    lineHeight: 1.52
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "24rpx"
    fontWeight: 700
    lineHeight: 1.25
rounded:
  xs: "12rpx"
  sm: "16rpx"
  md: "24rpx"
  lg: "32rpx"
  xl: "36rpx"
  pill: "999rpx"
spacing:
  xs: "8rpx"
  sm: "16rpx"
  md: "32rpx"
  lg: "48rpx"
  xl: "64rpx"
components:
  button-primary:
    backgroundColor: "{colors.brand-blue}"
    textColor: "{colors.text-on-brand}"
    rounded: "{rounded.sm}"
    height: "86rpx"
    padding: "0 24rpx"
  button-ghost:
    backgroundColor: "{colors.bg-primary}"
    textColor: "{colors.brand-blue}"
    rounded: "{rounded.sm}"
    height: "76rpx"
    padding: "0 24rpx"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.brand-blue}"
    rounded: "0"
    padding: "0"
  button-danger:
    backgroundColor: "rgba(186,26,26,0.06)"
    textColor: "{colors.danger}"
    rounded: "18rpx"
    height: "78rpx"
    padding: "0 24rpx"
  chip-default:
    backgroundColor: "{colors.brand-blue-100}"
    textColor: "{colors.brand-blue-navy}"
    rounded: "{rounded.pill}"
    height: "44rpx"
    padding: "0 18rpx"
  card-default:
    backgroundColor: "{colors.bg-primary}"
    rounded: "{rounded.sm}"
    padding: "28rpx"
    size: "100%"
  card-hero:
    backgroundColor: "{colors.bg-primary}"
    rounded: "18rpx"
    padding: "30rpx"
    size: "100%"
---

# Design System: 云端智诊

## 1. Overview

**Creative North Star: "轻量健康仪表盘"**

云端智诊的设计系统服务于一个核心定位：女性健康管理助手工具。界面传递的是"个人健康笔记本"的日常感，而非医疗诊疗系统的严肃感。视觉语言以品牌蓝为唯一主色调，搭配大面积留白和半透明卡片层叠，营造轻量、清晰、易于快速扫描的信息层级。

设计明确拒绝三个方向：不使用卡通化图标和粉色泡泡等低幼元素；不堆砌仪表盘式统计卡片形成通用健康 App 的既视感；不采用冷色调密集表格和诊断报告式排版。所有视觉决策都围绕"工具感优先、医疗感退后"展开——让用户觉得在管理一个简洁的个人记录本，而不是面对一套诊疗系统。

**Key Characteristics:**
- 品牌蓝单色调主导，语义色（绿/黄/橙/红）仅用于健康状态指示
- 系统字体栈，无自定义字体依赖，保证微信环境原生体验
- 半透明卡片 + 柔和阴影 + 渐变点缀，营造层次而不沉重
- 8rpx 基础网格，rpx 单位保证跨设备一致性
- 完整暗色模式适配，通过 CSS 变量自动切换
- 审核合规内嵌设计，合规文案自然融入页面流

## 2. Colors

品牌蓝色阶承载整个系统的情感基调，语义色阶负责健康状态的直觉传达，中性灰阶保证信息可读性。

### Primary

- **品牌蓝** (`#2563eb`): 主按钮、品牌标识、tab 选中态、链接、进度指示。是系统中唯一的"行动色"，所有可点击的主要元素均使用此色。
- **品牌蓝深** (`#1d4ed8`): 主按钮渐变终点，与品牌蓝形成 135° 渐变，增加按钮深度感。
- **品牌蓝墨** (`#0d47a1`): 标签胶囊文字色、深色强调文本，用于需要比品牌蓝更深沉的蓝色场景。
- **品牌蓝底** (`#eff6ff` / `#dbeafe` / `#bfdbfe`): 品牌色浅色系，用于胶囊背景、图标容器底色、action-card 色调变体。

### Neutral

- **墨灰** (`#1e293b`): 主标题和正文文字色，确保在所有背景上的可读性。
- **中灰** (`#475569`): 次要文字、描述文案、图标颜色，层级低于主文字。
- **浅灰** (`#64748b`): 辅助文字、提示文案、占位符，层级最低的文字色。
- **白底** (`#ffffff`): 卡片和面板背景主色。
- **浅底** (`#f8fafc`): 页面二级背景色，与白色卡片形成微弱层次对比。
- **蓝底** (`#f0f4ff`): 三级背景色，用于 section 区域和图标容器底色，带有品牌色调倾向。
- **玻璃白** (`rgba(255,255,255,0.78)`): 半透明卡片和覆盖层背景，配合 backdrop-filter 使用。

### Semantic

- **正常绿** (`#14b8a6`): 健康状态"正常"、已完成标记、成功指示。
- **注意黄** (`#f59e0b`): 待处理、ASCUS 级别诊断色、需要关注的提醒。
- **警告橙** (`#f97316`): LSIL 级别诊断色、较高风险状态。
- **危险红** (`#ef4444` / `#ba1a1a`): HSIL 级别、退出登录、注销账户等破坏性操作。

### Diagnostic Scale

系统内置五级医学诊断色阶（`--wx-diagnosis-normal` 到 `--wx-diagnosis-scc`），从绿到深红递进，用于检查记录的状态标签和卡片边线。每种诊断色均配有 10% 透明度的底色变体，用于背景填充。

### Named Rules

**The 单色行动 Rule.** 品牌蓝是系统中唯一的"可点击"信号色。语义色（绿/黄/橙/红）永远不代表"可操作"，仅传递状态信息。如果用户看到蓝色，意味着可以点击；看到其他颜色，意味着需要阅读。

## 3. Typography

**Display Font:** 系统字体栈 `-apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif`
**Body Font:** 同上

**Character:** 完全依赖系统原生字体，在 iOS 上呈现苹方，Android 上呈现微软雅黑或系统默认字体。选择零自定义字体依赖，保证微信环境的加载速度和原生体验一致性。

### Hierarchy

- **Display** (900, 42rpx, 1.15): 个人中心用户名、最醒目的页面级标题。极少使用，仅在需要强调身份的场景出现。
- **Headline** (800, 34rpx, 1.28): 首页 hero 标题、section 标题、卡片主标题。是页面信息架构的核心层级。
- **Title** (800, 30rpx, 1.22): 卡片内主标题、操作按钮文字、体验模式标题。
- **Body** (400, 27rpx, 1.52): 描述文案、卡片正文、hero 副标题。行高 1.52 保证中文长文可读性。
- **Label** (700, 24rpx, 1.25): 标签胶囊、指标数值标签、辅助说明、菜单描述。

### Named Rules

**The 800/900 权重 Rule.** 标题层级的 font-weight 严格使用 800 和 900，正文使用 400。不使用 500/600 等中间权重作为标题，避免层级模糊。

## 4. Elevation

系统采用柔和阴影 + 半透明层叠的混合深度方案。卡片使用极轻的扩散阴影营造悬浮感，hero 区域使用更深的阴影强调信息层级顶部。深度通过四个明确的层级传达：基础平面 → 卡片 → 面板 → 模态覆盖层。

### Shadow Vocabulary

- **Card** (`var(--wx-shadow-card)`): 所有静态卡片的默认阴影，极轻柔的扩散阴影，让卡片从背景中微微浮起。
- **Elevated** (`var(--wx-shadow-elevated)`): Hero 区域和重要面板，比 card 阴影更深、扩散更广，传达更高的层级位置。
- **Button** (`var(--wx-shadow-button)`): 主按钮专属阴影，带有品牌蓝色调 (`rgba(var(--wx-brand-500-rgb), ...)`)，让按钮从卡片中跳脱出来。
- **Modal** (`var(--wx-shadow-modal)`): 确认对话框和模态面板，深色集中阴影，营造"覆盖在一切之上"的感觉。
- **Overlay** (`rgba(11,28,48,0.48)`): 模态遮罩层，深蓝灰色调而非纯黑，保持品牌色温一致性。

### Named Rules

**The 微浮 Rule.** 卡片阴影永远轻柔——它是"卡片从背景微微浮起"，而不是"卡片被光源照射"。如果阴影看起来像投影而非环境光，说明值太重了。

## 5. Components

### Buttons

- **Shape:** 小圆角矩形 (16rpx / `--wx-radius-sm`)
- **Primary:** 品牌蓝 135° 渐变填充 (`#2563eb → #1d4ed8`)，白色粗体文字 (800, 30rpx)，带品牌蓝色调阴影。高度 86rpx，全宽或自适应。
- **Hover / Press:** 按压时 `scale(0.98)` + `opacity: 0.88`，通过 `u-hover` 类实现，过渡 160ms。
- **Ghost:** 白色背景 + 默认边框，品牌蓝文字 (700, 28rpx)，高度 76rpx。用于次要操作。
- **Text:** 无边框无背景，品牌蓝文字 (700, 26rpx)，仅文字可点击。用于内联链接。
- **Danger:** 危险红浅色背景 + 红色细边框，红色文字。用于退出登录和注销账户。

### Chips / Pills

- **Style:** 品牌蓝浅底 (`--wx-brand-100`) + 品牌蓝墨文字 (`--wx-brand-700`)，药丸形 (999rpx)，最小高度 44rpx，水平内边距 18rpx。
- **Variants:** 成功绿底 (`--wx-status-done-bg`)、警告黄底 (`--wx-status-pending-bg`)、危险红底 (`--wx-status-attention-bg`)，用于不同健康状态的标签。

### Cards / Containers

- **Corner Style:** 小圆角 (16rpx / `--wx-radius-sm`)，Hero 卡片使用 18rpx。
- **Background:** 白色 (`--wx-bg-primary`) 为主；Hero 区域使用径向渐变 + 线性渐变复合背景；Action-card 提供蓝/薄荷/天蓝三种色调变体。
- **Shadow Strategy:** 参见 Elevation 部分。静态卡片使用 card 阴影，hero 使用 elevated 阴影。
- **Border:** 默认边框 (`rgba(198,210,236,0.58)`)，1rpx 实线，提供微弱的结构界定。
- **Internal Padding:** 统一 28rpx (`--wx-space-sm` 的 2x)。

### Inputs / Fields

- **Style:** 输入框底色 (`--wx-bg-input: #f8f9ff`)，默认边框，16rpx 圆角。
- **Focus:** 边框颜色加深为表单聚焦蓝 (`rgba(24,118,210,0.32)`)，产生聚焦环效果。
- **Disabled:** 禁用底色 (`#f2f4fb`)，文字和边框均降低透明度。

### Navigation

- **TabBar:** 底部固定，4 个 tab（首页/记录/提醒/我的）。未选中灰色 (`#66748a`)，选中品牌蓝 (`#2563eb`)，浅蓝白底色 (`#f8f9ff`)，白色分割线。使用 PNG 图标资源。
- **页面导航:** 使用微信原生 navigationBar，浅灰蓝底色 (`#f8fafc`)，黑色文字。

### Hero Dashboard Card

首页核心组件，承载品牌标识、用户状态、健康指标和行动入口。使用径向渐变 + 线性渐变复合背景，elevated 级阴影，内含品牌胶囊标识、头像、状态药丸、下次提醒卡片、3 列 KPI 指标网格和操作按钮。是整个系统中最具视觉层次感的单一组件。

### Action Grid

2 列网格，每个 action-card 包含圆形图标容器 + 标题/描述文字。提供四种色调变体（蓝/薰衣草/薄荷/青），通过不同的背景色和边框色区分功能入口。按压时微缩 (`scale(0.98)`) 并加深边框为品牌蓝。

### AI FAB (Floating Action Button)

右下角固定悬浮按钮，实心品牌蓝 (`#1876d2`)，药丸形，带蓝色调阴影。内含 ✦ 图标和"健康助手"标签。按压微缩 (`scale(0.95)`)。z-index 100，始终在内容之上。

## 6. Do's and Don'ts

### Do:

- **Do** 使用品牌蓝作为唯一的"可操作"信号色——所有可点击的主要元素都应是蓝色。
- **Do** 保持卡片阴影轻柔——它们是环境光微浮效果，不是方向性投影。
- **Do** 使用语义色（绿/黄/橙/红）仅传递健康状态信息，永远不用它们做按钮或链接色。
- **Do** 在暗色模式下保持所有设计令牌的对等映射，确保完整可读性。
- **Do** 使用 800/900 权重的标题和 400 权重的正文，形成清晰的层级对比。
- **Do** 保持 8rpx 基础网格对齐，所有间距和尺寸使用 rpx 单位。
- **Do** 在卡片内使用 28rpx 统一内边距，保持视觉节奏一致。

### Don't:

- **Don't** 使用卡通化医疗图标、粉色泡泡、拟人化器官等过度可爱/低幼风格元素。
- **Don't** 堆砌仪表盘式统计卡片——每张卡片的信息应当可扫描，不堆砌数据指标。
- **Don't** 采用冷色调密集表格和诊断报告式排版的严肃医疗系统界面风格。
- **Don't** 使用 `border-left` 或 `border-right` 大于 1px 作为彩色侧边条纹。
- **Don't** 使用渐变文字（`background-clip: text` + 渐变背景）。
- **Don't** 将毛玻璃效果（`backdrop-filter: blur`）作为默认卡片样式——仅用于特定的 glass-surface 组件。
- **Don't** 使用 500/600 等中间 font-weight 作为标题——标题用 800/900，正文用 400，层级才有清晰度。
- **Don't** 在语义色上使用同色系文字——语义色仅作为背景和边线，文字应使用对应的深色调令牌。
