# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-06-18T10:01:31.190Z
> Files: 509 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `.DS_Store` (~4913 tok)
- `.gitignore` — Git ignore rules (~156 tok)
- `AGENTS.md` — AGENTS.md (~886 tok)
- `CLAUDE.md` — CLAUDE.md — CervixDetectAI_wx (~1368 tok)
- `DESIGN.md` — Design System: 云端智诊 (~2187 tok)
- `miniapp-privacy.json` (~224 tok)
- `PRODUCT.md` — Product (~243 tok)
- `project.config.json` (~255 tok)
- `project.miniapp.json` (~112 tok)
- `README.md` — Project documentation (~644 tok)

## .claude/

- `settings.json` (~6 tok)
- `settings.local.json` (~144 tok)

## .claude/skills/impeccable/

- `SKILL.md` — Setup (~4919 tok)

## .claude/skills/impeccable/reference/

- `adapt.md` — Assess Adaptation Challenge (~2529 tok)
- `animate.md` — Register (~2591 tok)
- `audit.md` — Diagnostic Scan (~1819 tok)
- `bolder.md` — Register (~1619 tok)
- `brand.md` — Brand register (~2613 tok)
- `clarify.md` — Assess Current Copy (~2661 tok)
- `codex.md` — Codex: Visual Direction & Asset Production (~1751 tok)
- `colorize.md` — Register (~3367 tok)
- `craft.md` — Craft Flow (~2986 tok)
- `critique.md` — ## Purpose (~9031 tok)
- `delight.md` — Register (~2433 tok)
- `distill.md` — Assess Current State (~1411 tok)
- `document.md` — The frontmatter: token schema (~6958 tok)
- `extract.md` — Extract Flow (~835 tok)
- `harden.md` — Assess Hardening Needs (~2146 tok)
- `hooks.md` — /impeccable hooks (~1883 tok)
- `init.md` — Init Flow (~3164 tok)
- `interaction-design.md` — Interaction Design (~1644 tok)
- `layout.md` — Register (~2167 tok)
- `live.md` — Prerequisites (~14884 tok)
- `onboard.md` — Assess Onboarding Needs (~1935 tok)
- `optimize.md` — Assess Performance Issues (~1898 tok)
- `overdrive.md` — Assess What "Extraordinary" Means Here (~2247 tok)
- `polish.md` — Design System Discovery (~3239 tok)
- `product.md` — Product register (~938 tok)
- `quieter.md` — Register (~1203 tok)
- `shape.md` — Philosophy (~2834 tok)
- `typeset.md` — Register (~3565 tok)

## .claude/skills/impeccable/scripts/

- `command-metadata.json` — Declares feel (~2286 tok)
- `context-signals.mjs` — Context-signals gatherer for the bare `{{command_prefix}}impeccable` (~2149 tok)
- `context.mjs` — Context loader: prints PRODUCT.md (and DESIGN.md if present) as one (~2774 tok)
- `critique-storage.mjs` — Critique persistence helper. (~2400 tok)
- `detect-csp.mjs` — Scan a project tree for Content-Security-Policy signals and classify the (~1803 tok)
- `detect.mjs` — Declares __dirname (~166 tok)
- `hook-admin.mjs` — `/impeccable hooks <on|off|status|reset>` — manage the design hook runtime (~6234 tok)
- `hook-before-edit.mjs` — Impeccable design hook — Cursor preToolUse write gate. (~4432 tok)
- `hook-lib.mjs` — Shared library for the Impeccable design hook. (~14864 tok)
- `hook.mjs` — Impeccable design hook — PostToolUse entry point. (~533 tok)
- `live-accept.mjs` — CLI helper: deterministic accept/discard of variant sessions. (~8070 tok)
- `live-browser-dom.js` — Browser-side DOM helpers for Impeccable live mode. (~1215 tok)
- `live-browser-session.js` — Browser-side durable session helpers for Impeccable live mode. (~942 tok)
- `live-browser.js` — Impeccable Live Variant Mode - Browser Script (~123942 tok)
- `live-commit-manual-edits.mjs` — CLI helper: apply pending live copy edits as one AI-owned batch. (~11237 tok)
- `live-complete.mjs` — Canonical durable completion acknowledgement for Impeccable live sessions. (~785 tok)
- `live-copy-edit-agent.mjs` — Applies staged live copy-edit batches by waking a local AI coding agent. (~7693 tok)
- `live-discard-manual-edits.mjs` — CLI helper: discard pending manual edits from the buffer without applying. (~450 tok)
- `live-inject.mjs` — CLI helper: insert/remove the live variant mode script tag in the project's (~6020 tok)
- `live-insert.mjs` — CLI helper: find an anchor element in source and splice an insert-variant (~2420 tok)
- `live-manual-edit-evidence.mjs` — Collect evidence for pending live copy edits. (~3122 tok)
- `live-poll.mjs` — CLI client for the live variant mode poll/reply protocol. (~3614 tok)
- `live-resume.mjs` — Recover the next agent action from the durable live-session journal. (~1190 tok)
- `live-server.mjs` — Live variant mode server (self-contained, zero dependencies). (~11334 tok)
- `live-status.mjs` — Print durable recovery status for Impeccable live sessions. (~562 tok)
- `live-wrap.mjs` — CLI helper: find an element in source and wrap it in a variant container. (~9592 tok)
- `live.mjs` — CLI entry point: prepare everything needed to enter the live variant poll loop. (~2276 tok)
- `modern-screenshot.umd.js` — v: q, P, W + 29 more (~8369 tok)
- `palette.mjs` — Brand-seed picker. Returns one OKLCH seed color + the mood it most (~15414 tok)
- `pin.mjs` — Pin/unpin sub-commands as standalone skill shortcuts. (~1634 tok)

## .claude/skills/impeccable/scripts/detector/

- `design-system.mjs` — DESIGN_NAMES: firstExisting, resolveDesignMdPath, resolveDesignSidecarPath + 27 more (~6592 tok)
- `detect-antipatterns-browser.js` — Anti-Pattern Browser Detector for Impeccable (~61589 tok)
- `detect-antipatterns.mjs` — Anti-Pattern Detector for Impeccable (~492 tok)
- `findings.mjs` — getAP: finding (~97 tok)

## .claude/skills/impeccable/scripts/detector/browser/injected/

- `index.mjs` — IS_BROWSER: getSpotlightBackdrop, updateSpotlightClipPath, showSpotlight + 8 more (~20472 tok)

## .claude/skills/impeccable/scripts/detector/cli/

- `main.mjs` — formatFindings: handleStdin, confirm, printUsage, detectCli (~2961 tok)

## .claude/skills/impeccable/scripts/detector/engines/browser/

- `detect-url.mjs` — serializeDesignSystemForBrowser: runVisualContrastFallback, detectUrl, createBrowserDetector (~2657 tok)

## .claude/skills/impeccable/scripts/detector/engines/regex/

- `detect-text.mjs` — Strip HTML to plain text — drops script/style/comments/tags so (~6524 tok)

## .claude/skills/impeccable/scripts/detector/engines/static-html/

- `css-cascade.mjs` — jsdom CSS-variable border override map (~9167 tok)
- `detect-html.mjs` — checkStaticPageTypography: checkElementBrokenImage, detectHtml (~2655 tok)

## .claude/skills/impeccable/scripts/detector/engines/visual/

- `screenshot-contrast.mjs` — sanitizeScreenshotClip: compareScreenshotContrast, captureVisualContrastCandidate (~1742 tok)

## .claude/skills/impeccable/scripts/detector/node/

- `file-system.mjs` — Check if a port is listening and optionally verify it matches the expected framework. (~1830 tok)

## .claude/skills/impeccable/scripts/detector/profile/

- `profiler.mjs` — profileNow: createDetectorProfile, recordProfileEvent, extractFindingIds + 6 more (~1214 tok)

## .claude/skills/impeccable/scripts/detector/registry/

- `antipatterns.mjs` — Declares ANTIPATTERNS (~4941 tok)

## .claude/skills/impeccable/scripts/detector/rules/

- `checks.mjs` — DETECTOR_IS_BROWSER: checkBorders, isEmojiOnlyText, checkColors + 5 more (~30656 tok)

## .claude/skills/impeccable/scripts/detector/shared/

- `color.mjs` — ─── Section 2: Color Utilities ───────────────────────────────────────────── (~1172 tok)
- `constants.mjs` — ─── Section 1: Constants ─────────────────────────────────────────────────── (~1080 tok)
- `page.mjs` — Check if content looks like a full page (not a component/partial) (~68 tok)

## .claude/skills/impeccable/scripts/lib/

- `design-parser.mjs` — Parse a DESIGN.md (Stitch-spec format) into a structured JSON model that (~6882 tok)
- `impeccable-config.mjs` — CLI-side reader/writer for the unified `.impeccable` config. (~5730 tok)
- `impeccable-paths.mjs` — Exports IMPECCABLE_DIR, LIVE_DIR, CRITIQUE_DIR, getImpeccableDir + 18 more (~1046 tok)
- `is-generated.mjs` — Decide whether a given file is "generated" (regenerated by a build step, (~604 tok)

## .claude/skills/impeccable/scripts/live/

- `browser-script-parts.mjs` — Exports LIVE_BROWSER_SCRIPT_PARTS, resolveLiveBrowserScriptParts, assertLiveBrowserScriptParts, readLiveBrowserScriptParts, assembleLiveBrowserScript (~458 tok)
- `completion.mjs` — Exports completionTypeForAcceptResult, completionAckForAcceptResult (~259 tok)
- `event-validation.mjs` — Shared event validation for the live helper server. (~1683 tok)
- `insert-ui.mjs` — Pure helpers for live-mode insert UI (browser + tests). (~4178 tok)
- `manual-apply.mjs` — Exports createManualApplyController, manualEditApplyChunkSize, countManualApplyOps, writeManualApplyEvidence (~9307 tok)
- `manual-edit-routes.mjs` — API routes: GET (10 endpoints) (~3983 tok)
- `manual-edits-buffer.mjs` — Shared helpers for the pending-manual-edits buffer on disk. (~1364 tok)
- `session-store.mjs` — Exports createLiveSessionStore (~2852 tok)
- `svelte-component.mjs` — Svelte live-mode component injection helpers. (~7440 tok)
- `sveltekit-adapter.mjs` — SvelteKit live-mode adapter. (~2498 tok)
- `ui-core.mjs` — Framework-neutral Impeccable live chrome contract. (~1478 tok)
- `vocabulary.mjs` — Canonical design-command vocabulary for Live Mode: each command's value, human (~881 tok)

## .codebuddy/

- `settings.local.json` (~53 tok)

## .codegraph/

- `.gitignore` — Git ignore rules (~61 tok)
- `codegraph.db-shm` (~8738 tok)
- `daemon.log` (~3209 tok)
- `daemon.pid` (~45 tok)

## .codex/skills/wechat-miniprogram/

- `index.md` — WeChat Mini Program Skill (~77 tok)
- `SKILL.md` — WeChat Mini Program Skill (~1416 tok)

## .codex/skills/wechat-miniprogram/references/

- `api.md` — Api (~1618 tok)
- `cloud.md` — Cloud (~1211 tok)
- `components.md` — Components (~818 tok)
- `framework.md` — Framework (~26114 tok)
- `getting_started.md` — Getting Started (~6659 tok)
- `index.md` — Wechat-Miniprogram Documentation Index (~79 tok)
- `other.md` — Other (~2628 tok)
- `reference.md` — Reference (~242 tok)

## .cursor/

- `.DS_Store` (~2184 tok)
- `hooks.json` (~54 tok)

## .cursor/rules/

- `codegraph.mdc` — Declares Y (~827 tok)

## .cursor/skills/

- `.DS_Store` (~2186 tok)

## .cursor/skills/TDesign 微信小程序组件/

- `_skillhub_meta.json` (~44 tok)
- `.DS_Store` (~1640 tok)
- `SKILL.md` — TDesign Mini Program Skill (~3740 tok)

## .cursor/skills/TDesign 微信小程序组件/references/

- `.DS_Store` (~1640 tok)

## .cursor/skills/TDesign 微信小程序组件/references/miniprogram-chat/

- `getting-started.md` — Wechat MiniProgram For AI Chat (~453 tok)
- `sse.md` — 什么是流式输出 (~961 tok)

## .cursor/skills/TDesign 微信小程序组件/references/miniprogram-chat/components/

- `attachments.md` — Attachments 文件附件 (~1964 tok)
- `chat-actionbar.md` — ChatActionbar 对话操作 (~1009 tok)
- `chat-content.md` — ChatContent 对话正文 (~711 tok)
- `chat-list.md` — ChatList 对话列表 (~11522 tok)
- `chat-loading.md` — ChatLoading 对话加载 (~740 tok)
- `chat-markdown.md` — ChatMarkdown Markdown内容 (~1665 tok)
- `chat-message.md` — ChatMessage 对话消息体 (~3064 tok)
- `chat-sender.md` — ChatSender 对话输入 (~7059 tok)
- `chat-thinking.md` — ChatThinking 思考过程 (~1578 tok)

## .cursor/skills/TDesign 微信小程序组件/references/miniprogram/

- `custom-style.md` — 样式覆盖 (~483 tok)
- `custom-theme.md` — 自定义主题 (~358 tok)
- `dark-mode.md` — 深色模式 (~469 tok)
- `getting-started.md` — Wechat MiniProgram (~438 tok)
- `overview.md` — 组件概览 (~760 tok)

## .cursor/skills/TDesign 微信小程序组件/references/miniprogram/components/

- `action-sheet.md` — ActionSheet 动作面板 (~2250 tok)
- `avatar.md` — Avatar 头像 (~2497 tok)
- `back-top.md` — BackTop 返回顶部 (~558 tok)
- `badge.md` — Badge 徽标 (~1695 tok)
- `button.md` — Button 按钮 (~4518 tok)
- `calendar.md` — Calendar 日历 (~3296 tok)
- `cascader.md` — Cascader 级联选择器 (~3951 tok)
- `cell.md` — Cell 单元格 (~1654 tok)
- `checkbox.md` — Checkbox 多选框 (~3223 tok)
- `collapse.md` — Collapse 折叠面板 (~1666 tok)
- `count-down.md` — CountDown 倒计时 (~1669 tok)
- `date-time-picker.md` — DateTimePicker 时间选择器 (~2982 tok)
- `dialog.md` — Dialog 对话框 (~4512 tok)
- `divider.md` — Divider 分割线 (~899 tok)
- `drawer.md` — Drawer 抽屉 (~1158 tok)
- `dropdown-menu.md` — DropdownMenu 下拉菜单 (~1864 tok)
- `empty.md` — Empty 空状态 (~639 tok)
- `fab.md` — Fab 悬浮按钮 (~1460 tok)
- `footer.md` — Footer 页脚 (~1049 tok)
- `form.md` — 组件概览 (~760 tok)
- `grid.md` — Grid 宫格 (~3884 tok)
- `guide.md` — Guide 引导 (~5131 tok)
- `icon.md` — Icon 图标 (~1804 tok)
- `image-viewer.md` — ImageViewer 图片预览 (~1329 tok)
- `image.md` — Image 图片 (~1297 tok)
- `indexes.md` — Indexes 索引 (~2005 tok)
- `input.md` — Input 输入框 (~3728 tok)
- `link.md` — Link 链接 (~1883 tok)
- `list.md` — 组件概览 (~760 tok)
- `loading.md` — Loading 加载 (~1599 tok)
- `message.md` — Message 消息通知 (~1890 tok)
- `navbar.md` — Navbar 导航栏 (~1885 tok)
- `notice-bar.md` — NoticeBar 公告栏 (~2057 tok)
- `overlay.md` — Overlay 遮罩层 (~465 tok)
- `picker.md` — Picker 选择器 (~3451 tok)
- `popup.md` — Popup 弹出层 (~1641 tok)
- `progress.md` — Progress 进度条 (~1279 tok)
- `pull-down-refresh.md` — PullDownRefresh 下拉刷新 (~1333 tok)
- `radio.md` — Radio 单选框 (~2704 tok)
- `rate.md` — Rate 评分 (~2600 tok)
- `result.md` — Result 结果 (~951 tok)
- `search.md` — Search 搜索框 (~1778 tok)
- `side-bar.md` — SideBar 侧边栏 (~4549 tok)
- `skeleton.md` — Skeleton 骨架屏 (~1655 tok)
- `slider.md` — Slider 滑动选择器 (~2297 tok)
- `stepper.md` — Stepper 步进器 (~1178 tok)
- `steps.md` — Steps 步骤条 (~2818 tok)
- `sticky.md` — Sticky 吸顶容器 (~838 tok)
- `swipe-cell.md` — SwipeCell 滑动操作 (~1889 tok)
- `swiper.md` — Swiper 轮播图 (~3189 tok)
- `switch.md` — Switch 开关 (~1777 tok)
- `tab-bar.md` — TabBar 底部标签栏 (~2765 tok)
- `table.md` — 组件概览 (~760 tok)
- `tabs.md` — Tabs 选项卡 (~2930 tok)
- `tag.md` — Tag 标签 (~2641 tok)
- `textarea.md` — Textarea 多行文本框 (~1936 tok)
- `toast.md` — Toast 轻提示 (~1520 tok)
- `tree-select.md` — TreeSelect 树形选择器 (~1609 tok)
- `upload.md` — Upload 上传 (~3188 tok)

## .cursor/skills/impeccable/

- `SKILL.md` — Setup (~4852 tok)

## .cursor/skills/impeccable/reference/

- `adapt.md` — Assess Adaptation Challenge (~2529 tok)
- `animate.md` — Register (~2592 tok)
- `audit.md` — Diagnostic Scan (~1819 tok)
- `bolder.md` — Register (~1620 tok)
- `brand.md` — Brand register (~2613 tok)
- `clarify.md` — Assess Current Copy (~2661 tok)
- `codex.md` — Codex: Visual Direction & Asset Production (~1751 tok)
- `colorize.md` — Register (~3368 tok)
- `craft.md` — Craft Flow (~2986 tok)
- `critique.md` — ## Purpose (~9034 tok)
- `delight.md` — Register (~2435 tok)
- `distill.md` — Assess Current State (~1412 tok)
- `document.md` — The frontmatter: token schema (~6959 tok)
- `extract.md` — Extract Flow (~836 tok)
- `harden.md` — Assess Hardening Needs (~2146 tok)
- `hooks.md` — /impeccable hooks (~1883 tok)
- `init.md` — Init Flow (~3170 tok)
- `interaction-design.md` — Interaction Design (~1644 tok)
- `layout.md` — Register (~2167 tok)
- `live.md` — Prerequisites (~14884 tok)
- `onboard.md` — Assess Onboarding Needs (~1935 tok)
- `optimize.md` — Assess Performance Issues (~1898 tok)
- `overdrive.md` — Assess What "Extraordinary" Means Here (~2249 tok)
- `polish.md` — Design System Discovery (~3239 tok)
- `product.md` — Product register (~938 tok)
- `quieter.md` — Register (~1205 tok)
- `shape.md` — Philosophy (~2837 tok)
- `typeset.md` — Register (~3565 tok)

## .cursor/skills/impeccable/scripts/

- `command-metadata.json` — Declares feel (~2286 tok)
- `context-signals.mjs` — Context-signals gatherer for the bare `{{command_prefix}}impeccable` (~2149 tok)
- `context.mjs` — Context loader: prints PRODUCT.md (and DESIGN.md if present) as one (~2774 tok)
- `critique-storage.mjs` — Critique persistence helper. (~2400 tok)
- `detect-csp.mjs` — Scan a project tree for Content-Security-Policy signals and classify the (~1803 tok)
- `detect.mjs` — Declares __dirname (~166 tok)
- `hook-admin.mjs` — `/impeccable hooks <on|off|status|reset>` — manage the design hook runtime (~6234 tok)
- `hook-before-edit.mjs` — Impeccable design hook — Cursor preToolUse write gate. (~4432 tok)
- `hook-lib.mjs` — Shared library for the Impeccable design hook. (~14864 tok)
- `hook.mjs` — Impeccable design hook — PostToolUse entry point. (~533 tok)
- `live-accept.mjs` — CLI helper: deterministic accept/discard of variant sessions. (~8070 tok)
- `live-browser-dom.js` — Browser-side DOM helpers for Impeccable live mode. (~1215 tok)
- `live-browser-session.js` — Browser-side durable session helpers for Impeccable live mode. (~942 tok)
- `live-browser.js` — Impeccable Live Variant Mode - Browser Script (~123942 tok)
- `live-commit-manual-edits.mjs` — CLI helper: apply pending live copy edits as one AI-owned batch. (~11237 tok)
- `live-complete.mjs` — Canonical durable completion acknowledgement for Impeccable live sessions. (~785 tok)
- `live-copy-edit-agent.mjs` — Applies staged live copy-edit batches by waking a local AI coding agent. (~7693 tok)
- `live-discard-manual-edits.mjs` — CLI helper: discard pending manual edits from the buffer without applying. (~450 tok)
- `live-inject.mjs` — CLI helper: insert/remove the live variant mode script tag in the project's (~6020 tok)
- `live-insert.mjs` — CLI helper: find an anchor element in source and splice an insert-variant (~2420 tok)
- `live-manual-edit-evidence.mjs` — Collect evidence for pending live copy edits. (~3122 tok)
- `live-poll.mjs` — CLI client for the live variant mode poll/reply protocol. (~3614 tok)
- `live-resume.mjs` — Recover the next agent action from the durable live-session journal. (~1190 tok)
- `live-server.mjs` — Live variant mode server (self-contained, zero dependencies). (~11334 tok)
- `live-status.mjs` — Print durable recovery status for Impeccable live sessions. (~562 tok)
- `live-wrap.mjs` — CLI helper: find an element in source and wrap it in a variant container. (~9592 tok)
- `live.mjs` — CLI entry point: prepare everything needed to enter the live variant poll loop. (~2276 tok)
- `modern-screenshot.umd.js` — v: q, P, W + 29 more (~8369 tok)
- `palette.mjs` — Brand-seed picker. Returns one OKLCH seed color + the mood it most (~15414 tok)
- `pin.mjs` — Pin/unpin sub-commands as standalone skill shortcuts. (~1634 tok)

## .cursor/skills/impeccable/scripts/detector/

- `design-system.mjs` — DESIGN_NAMES: firstExisting, resolveDesignMdPath, resolveDesignSidecarPath + 27 more (~6592 tok)
- `detect-antipatterns-browser.js` — Anti-Pattern Browser Detector for Impeccable (~61589 tok)
- `detect-antipatterns.mjs` — Anti-Pattern Detector for Impeccable (~492 tok)
- `findings.mjs` — getAP: finding (~97 tok)

## .cursor/skills/impeccable/scripts/detector/browser/injected/

- `index.mjs` — IS_BROWSER: getSpotlightBackdrop, updateSpotlightClipPath, showSpotlight + 8 more (~20472 tok)

## .cursor/skills/impeccable/scripts/detector/cli/

- `main.mjs` — formatFindings: handleStdin, confirm, printUsage, detectCli (~2961 tok)

## .cursor/skills/impeccable/scripts/detector/engines/browser/

- `detect-url.mjs` — serializeDesignSystemForBrowser: runVisualContrastFallback, detectUrl, createBrowserDetector (~2657 tok)

## .cursor/skills/impeccable/scripts/detector/engines/regex/

- `detect-text.mjs` — Strip HTML to plain text — drops script/style/comments/tags so (~6524 tok)

## .cursor/skills/impeccable/scripts/detector/engines/static-html/

- `css-cascade.mjs` — jsdom CSS-variable border override map (~9167 tok)
- `detect-html.mjs` — checkStaticPageTypography: checkElementBrokenImage, detectHtml (~2655 tok)

## .cursor/skills/impeccable/scripts/detector/engines/visual/

- `screenshot-contrast.mjs` — sanitizeScreenshotClip: compareScreenshotContrast, captureVisualContrastCandidate (~1742 tok)

## .cursor/skills/impeccable/scripts/detector/node/

- `file-system.mjs` — Check if a port is listening and optionally verify it matches the expected framework. (~1830 tok)

## .cursor/skills/impeccable/scripts/detector/profile/

- `profiler.mjs` — profileNow: createDetectorProfile, recordProfileEvent, extractFindingIds + 6 more (~1214 tok)

## .cursor/skills/impeccable/scripts/detector/registry/

- `antipatterns.mjs` — Declares ANTIPATTERNS (~4941 tok)

## .cursor/skills/impeccable/scripts/detector/rules/

- `checks.mjs` — DETECTOR_IS_BROWSER: checkBorders, isEmojiOnlyText, checkColors + 5 more (~30656 tok)

## .cursor/skills/impeccable/scripts/detector/shared/

- `color.mjs` — ─── Section 2: Color Utilities ───────────────────────────────────────────── (~1172 tok)
- `constants.mjs` — ─── Section 1: Constants ─────────────────────────────────────────────────── (~1080 tok)
- `page.mjs` — Check if content looks like a full page (not a component/partial) (~68 tok)

## .cursor/skills/impeccable/scripts/lib/

- `design-parser.mjs` — Parse a DESIGN.md (Stitch-spec format) into a structured JSON model that (~6882 tok)
- `impeccable-config.mjs` — CLI-side reader/writer for the unified `.impeccable` config. (~5730 tok)
- `impeccable-paths.mjs` — Exports IMPECCABLE_DIR, LIVE_DIR, CRITIQUE_DIR, getImpeccableDir + 18 more (~1046 tok)
- `is-generated.mjs` — Decide whether a given file is "generated" (regenerated by a build step, (~604 tok)

## .cursor/skills/impeccable/scripts/live/

- `browser-script-parts.mjs` — Exports LIVE_BROWSER_SCRIPT_PARTS, resolveLiveBrowserScriptParts, assertLiveBrowserScriptParts, readLiveBrowserScriptParts, assembleLiveBrowserScript (~458 tok)
- `completion.mjs` — Exports completionTypeForAcceptResult, completionAckForAcceptResult (~259 tok)
- `event-validation.mjs` — Shared event validation for the live helper server. (~1683 tok)
- `insert-ui.mjs` — Pure helpers for live-mode insert UI (browser + tests). (~4178 tok)
- `manual-apply.mjs` — Exports createManualApplyController, manualEditApplyChunkSize, countManualApplyOps, writeManualApplyEvidence (~9307 tok)
- `manual-edit-routes.mjs` — API routes: GET (10 endpoints) (~3983 tok)
- `manual-edits-buffer.mjs` — Shared helpers for the pending-manual-edits buffer on disk. (~1364 tok)
- `session-store.mjs` — Exports createLiveSessionStore (~2852 tok)
- `svelte-component.mjs` — Svelte live-mode component injection helpers. (~7440 tok)
- `sveltekit-adapter.mjs` — SvelteKit live-mode adapter. (~2498 tok)
- `ui-core.mjs` — Framework-neutral Impeccable live chrome contract. (~1478 tok)
- `vocabulary.mjs` — Canonical design-command vocabulary for Live Mode: each command's value, human (~881 tok)

## .cursor/skills/skyline渲染引擎/

- `_skillhub_meta.json` (~39 tok)
- `.DS_Store` (~1640 tok)
- `SKILL.md` — Skyline 渲染引擎技能 (~1447 tok)

## .cursor/skills/skyline渲染引擎/references/

- `.DS_Store` (~1640 tok)

## .cursor/skills/skyline渲染引擎/references/components/

- `SKILL.md` — Skyline 组件开发指南 (~2116 tok)

## .cursor/skills/skyline渲染引擎/references/components/references/form/

- `input.md` — input 与 textarea 组件 (~1502 tok)

## .cursor/skills/skyline渲染引擎/references/components/references/layout/

- `swiper.md` — swiper 组件增强特性 (~1499 tok)

## .cursor/skills/skyline渲染引擎/references/components/references/media/

- `image.md` — image 组件 (~1212 tok)
- `text.md` — text 与 span 组件 (~1239 tok)

## .cursor/skills/skyline渲染引擎/references/components/references/scroll/

- `draggable-sheet.md` — draggable-sheet 半屏可拖拽组件 (~1567 tok)
- `list-grid-view.md` — list-view 与 grid-view (~1386 tok)
- `nested-scroll.md` — 嵌套滚动模式 (~1868 tok)
- `scroll-view.md` — scroll-view 组件详解 (~1885 tok)
- `sticky.md` — 吸顶布局：sticky-section 与 sticky-header (~1564 tok)

## .cursor/skills/skyline渲染引擎/references/components/references/special/

- `share-element.md` — share-element 共享元素动画 (~1701 tok)
- `snapshot.md` — snapshot 截图组件 (~1917 tok)

## .cursor/skills/skyline渲染引擎/references/config/

- `SKILL.md` — Skyline JSON 配置规范 (~1163 tok)

## .cursor/skills/skyline渲染引擎/references/config/references/

- `app-config.md` — app.json Skyline 配置详解 (~751 tok)
- `page-config.md` — 页面级配置详解 (~737 tok)
- `patterns.md` — 配置模板 (~936 tok)
- `project-config.md` — project.config.json 配置 (~366 tok)

## .cursor/skills/skyline渲染引擎/references/overview/

- `SKILL.md` — Skyline 渲染引擎概览 (~1148 tok)

## .cursor/skills/skyline渲染引擎/references/overview/references/api/

- `getSkylineInfo.md` — wx.getSkylineInfo / wx.getSkylineInfoSync (~707 tok)
- `preloadSkylineView.md` — wx.preloadSkylineView (~701 tok)

## .cursor/skills/skyline渲染引擎/references/overview/references/changelog/

- `changelog.md` — Skyline 更新日志 (~1223 tok)

## .cursor/skills/skyline渲染引擎/references/overview/references/introduction/

- `component-support.md` — Skyline 组件支持情况 (~926 tok)
- `features.md` — Skyline 功能特性 (~971 tok)
- `overview.md` — Skyline 渲染引擎简介 (~610 tok)

## .cursor/skills/skyline渲染引擎/references/overview/references/migration/

- `best-practice.md` — Skyline 最佳实践 (~998 tok)
- `compatibility.md` — Skyline 常见兼容问题 (~1087 tok)
- `getting-started.md` — Skyline 迁移起步 (~1147 tok)
- `release.md` — Skyline 发布上线指南 (~775 tok)

## .cursor/skills/skyline渲染引擎/references/overview/references/performance/

- `comparison.md` — Skyline 性能对比 (~602 tok)

## .cursor/skills/skyline渲染引擎/references/route/

- `SKILL.md` — Skyline 自定义路由与页面转场 (~1343 tok)

## .cursor/skills/skyline渲染引擎/references/route/references/api/

- `navigate-to.md` — wx.navigateTo 路由参数 (~651 tok)
- `route-events.md` — 路由事件监听 API (~509 tok)
- `router-api.md` — wx.router API 参考 (~747 tok)

## .cursor/skills/skyline渲染引擎/references/route/references/custom-route/

- `custom-route-guide.md` — 自定义路由完整指南 (~1420 tok)
- `route-patterns.md` — 路由动画代码模式 (~2162 tok)

## .cursor/skills/skyline渲染引擎/references/route/references/open-container/

- `open-container.md` — 容器转场动画（open-container） (~537 tok)

## .cursor/skills/skyline渲染引擎/references/route/references/pop-gesture/

- `pop-gesture.md` — 页面返回手势 (~433 tok)

## .cursor/skills/skyline渲染引擎/references/route/references/preset-route/

- `preset-route.md` — 预设路由 (~422 tok)

## .cursor/skills/skyline渲染引擎/references/scroll-api/

- `SKILL.md` — Skyline 滚动控制 API (~1315 tok)

## .cursor/skills/skyline渲染引擎/references/scroll-api/references/

- `patterns.md` — 滚动 API 代码模式 (~1225 tok)

## .cursor/skills/skyline渲染引擎/references/scroll-api/references/api/

- `draggable-sheet-context.md` — DraggableSheetContext API 参考 (~511 tok)
- `scroll-view-context.md` — ScrollViewContext API 参考 (~817 tok)
- `worklet-scroll-context.md` — worklet.scrollViewContext API 参考 (~549 tok)

## .cursor/skills/skyline渲染引擎/references/worklet/

- `SKILL.md` — Worklet 动画系统 (~1189 tok)

## .cursor/skills/skyline渲染引擎/references/worklet/references/animation/

- `combine-animation.md` — 组合动画 (~677 tok)
- `easing.md` — Easing 缓动函数 (~646 tok)
- `timing-spring-decay.md` — 基础动画类型 (~1095 tok)

## .cursor/skills/skyline渲染引擎/references/worklet/references/base/

- `scroll-view-context.md` — ScrollViewContext (~286 tok)
- `shared-derived.md` — SharedValue 与 DerivedValue (~768 tok)

## .cursor/skills/skyline渲染引擎/references/worklet/references/core/

- `worklet-overview.md` — Worklet 动画概览 (~1406 tok)

## .cursor/skills/skyline渲染引擎/references/worklet/references/tool/

- `thread-communication.md` — 线程通信：runOnUI 与 runOnJS (~823 tok)

## .cursor/skills/skyline渲染引擎/references/wxss/

- `SKILL.md` — Skyline WXSS 样式支持 (~1709 tok)

## .cursor/skills/skyline渲染引擎/references/wxss/references/

- `animation.md` — WXSS 变换、过渡与动画 (~785 tok)
- `basics.md` — WXSS 基础数据类型 (~374 tok)
- `flex.md` — WXSS Flex 布局属性 (~412 tok)
- `layout.md` — WXSS 布局与定位属性 (~391 tok)
- `text.md` — WXSS 文本属性 (~608 tok)
- `visual.md` — WXSS 背景、边框与视觉效果 (~909 tok)

## .cursor/skills/微信小程序开发框架/

- `_skillhub_meta.json` (~42 tok)
- `index.md` — WeChat Mini Program Skill (~77 tok)
- `SKILL.md` — WeChat Mini Program Skill (~1499 tok)

## .cursor/skills/微信小程序开发框架/references/

- `api.md` — Api (~1618 tok)
- `cloud.md` — Cloud (~1211 tok)
- `components.md` — Components (~818 tok)
- `framework.md` — Framework (~26112 tok)
- `getting_started.md` — Getting Started (~6660 tok)
- `index.md` — Wechat-Miniprogram Documentation Index (~79 tok)
- `other.md` — Other (~2628 tok)
- `reference.md` — Reference (~242 tok)

## .impeccable/

- `config.local.json` (~14 tok)
- `design.json` (~3092 tok)
- `hook.cache.json` (~8 tok)

## .impeccable/critique/

- `2026-06-17T13-55-16Z__miniprogram.md` — UX Critique: miniprogram (云端智诊微信小程序) (~885 tok)

## .nezha/

- `config.toml` (~184 tok)

## .playwright-cli/

- `console-2026-06-18T08-17-13-487Z.log` (~1021 tok)
- `console-2026-06-18T08-22-41-485Z.log` (~1059 tok)
- `page-2026-06-18T08-17-15-877Z.yml` (~3543 tok)
- `page-2026-06-18T08-22-43-541Z.yml` (~14778 tok)
- `page-2026-06-18T08-22-47-613Z.yml` (~15076 tok)
- `page-2026-06-18T08-22-48-292Z.yml` (~15104 tok)
- `page-2026-06-18T08-23-28-826Z.yml` (~1029 tok)
- `page-2026-06-18T08-23-29-100Z.yml` (~5677 tok)

## .qoder/

- `.DS_Store` (~1639 tok)

## .qoder/skills/

- `.DS_Store` (~1639 tok)

## .qoder/skills/impeccable/

- `.DS_Store` (~2186 tok)
- `SKILL.md` — Setup (~4919 tok)

## .qoder/skills/impeccable/reference/

- `adapt.md` — Assess Adaptation Challenge (~2529 tok)
- `animate.md` — Register (~2592 tok)
- `audit.md` — Diagnostic Scan (~1819 tok)
- `bolder.md` — Register (~1620 tok)
- `brand.md` — Brand register (~2613 tok)
- `clarify.md` — Assess Current Copy (~2661 tok)
- `codex.md` — Codex: Visual Direction & Asset Production (~1751 tok)
- `colorize.md` — Register (~3368 tok)
- `craft.md` — Craft Flow (~2986 tok)
- `critique.md` — ## Purpose (~9031 tok)
- `delight.md` — Register (~2435 tok)
- `distill.md` — Assess Current State (~1412 tok)
- `document.md` — The frontmatter: token schema (~6959 tok)
- `extract.md` — Extract Flow (~836 tok)
- `harden.md` — Assess Hardening Needs (~2146 tok)
- `hooks.md` — /impeccable hooks (~1882 tok)
- `init.md` — Init Flow (~3169 tok)
- `interaction-design.md` — Interaction Design (~1644 tok)
- `layout.md` — Register (~2167 tok)
- `live.md` — Prerequisites (~14880 tok)
- `onboard.md` — Assess Onboarding Needs (~1935 tok)
- `optimize.md` — Assess Performance Issues (~1898 tok)
- `overdrive.md` — Assess What "Extraordinary" Means Here (~2249 tok)
- `polish.md` — Design System Discovery (~3239 tok)
- `product.md` — Product register (~938 tok)
- `quieter.md` — Register (~1205 tok)
- `shape.md` — Philosophy (~2837 tok)
- `typeset.md` — Register (~3565 tok)

## .qoder/skills/impeccable/scripts/

- `.DS_Store` (~1638 tok)
- `command-metadata.json` — Declares feel (~2286 tok)
- `context-signals.mjs` — Context-signals gatherer for the bare `{{command_prefix}}impeccable` (~2149 tok)
- `context.mjs` — Context loader: prints PRODUCT.md (and DESIGN.md if present) as one (~2774 tok)
- `critique-storage.mjs` — Critique persistence helper. (~2400 tok)
- `detect-csp.mjs` — Scan a project tree for Content-Security-Policy signals and classify the (~1803 tok)
- `detect.mjs` — Declares __dirname (~166 tok)
- `hook-admin.mjs` — `/impeccable hooks <on|off|status|reset>` — manage the design hook runtime (~6234 tok)
- `hook-before-edit.mjs` — Impeccable design hook — Cursor preToolUse write gate. (~4432 tok)
- `hook-lib.mjs` — Shared library for the Impeccable design hook. (~14864 tok)
- `hook.mjs` — Impeccable design hook — PostToolUse entry point. (~533 tok)
- `live-accept.mjs` — CLI helper: deterministic accept/discard of variant sessions. (~8070 tok)
- `live-browser-dom.js` — Browser-side DOM helpers for Impeccable live mode. (~1215 tok)
- `live-browser-session.js` — Browser-side durable session helpers for Impeccable live mode. (~942 tok)
- `live-browser.js` — Impeccable Live Variant Mode - Browser Script (~123942 tok)
- `live-commit-manual-edits.mjs` — CLI helper: apply pending live copy edits as one AI-owned batch. (~11237 tok)
- `live-complete.mjs` — Canonical durable completion acknowledgement for Impeccable live sessions. (~785 tok)
- `live-copy-edit-agent.mjs` — Applies staged live copy-edit batches by waking a local AI coding agent. (~7693 tok)
- `live-discard-manual-edits.mjs` — CLI helper: discard pending manual edits from the buffer without applying. (~450 tok)
- `live-inject.mjs` — CLI helper: insert/remove the live variant mode script tag in the project's (~6020 tok)
- `live-insert.mjs` — CLI helper: find an anchor element in source and splice an insert-variant (~2420 tok)
- `live-manual-edit-evidence.mjs` — Collect evidence for pending live copy edits. (~3122 tok)
- `live-poll.mjs` — CLI client for the live variant mode poll/reply protocol. (~3614 tok)
- `live-resume.mjs` — Recover the next agent action from the durable live-session journal. (~1190 tok)
- `live-server.mjs` — Live variant mode server (self-contained, zero dependencies). (~11334 tok)
- `live-status.mjs` — Print durable recovery status for Impeccable live sessions. (~562 tok)
- `live-wrap.mjs` — CLI helper: find an element in source and wrap it in a variant container. (~9592 tok)
- `live.mjs` — CLI entry point: prepare everything needed to enter the live variant poll loop. (~2276 tok)
- `modern-screenshot.umd.js` — v: q, P, W + 29 more (~8369 tok)
- `palette.mjs` — Brand-seed picker. Returns one OKLCH seed color + the mood it most (~15414 tok)
- `pin.mjs` — Pin/unpin sub-commands as standalone skill shortcuts. (~1634 tok)

## .qoder/skills/impeccable/scripts/detector/

- `design-system.mjs` — DESIGN_NAMES: firstExisting, resolveDesignMdPath, resolveDesignSidecarPath + 27 more (~6592 tok)
- `detect-antipatterns-browser.js` — Anti-Pattern Browser Detector for Impeccable (~61589 tok)
- `detect-antipatterns.mjs` — Anti-Pattern Detector for Impeccable (~492 tok)
- `findings.mjs` — getAP: finding (~97 tok)

## .qoder/skills/impeccable/scripts/detector/browser/injected/

- `index.mjs` — IS_BROWSER: getSpotlightBackdrop, updateSpotlightClipPath, showSpotlight + 8 more (~20472 tok)

## .qoder/skills/impeccable/scripts/detector/cli/

- `main.mjs` — formatFindings: handleStdin, confirm, printUsage, detectCli (~2961 tok)

## .qoder/skills/impeccable/scripts/detector/engines/browser/

- `detect-url.mjs` — serializeDesignSystemForBrowser: runVisualContrastFallback, detectUrl, createBrowserDetector (~2657 tok)

## .qoder/skills/impeccable/scripts/detector/engines/regex/

- `detect-text.mjs` — Strip HTML to plain text — drops script/style/comments/tags so (~6524 tok)

## .qoder/skills/impeccable/scripts/detector/engines/static-html/

- `css-cascade.mjs` — jsdom CSS-variable border override map (~9167 tok)
- `detect-html.mjs` — checkStaticPageTypography: checkElementBrokenImage, detectHtml (~2655 tok)

## .qoder/skills/impeccable/scripts/detector/engines/visual/

- `screenshot-contrast.mjs` — sanitizeScreenshotClip: compareScreenshotContrast, captureVisualContrastCandidate (~1742 tok)

## .qoder/skills/impeccable/scripts/detector/node/

- `file-system.mjs` — Check if a port is listening and optionally verify it matches the expected framework. (~1830 tok)

## .qoder/skills/impeccable/scripts/detector/profile/

- `profiler.mjs` — profileNow: createDetectorProfile, recordProfileEvent, extractFindingIds + 6 more (~1214 tok)

## .qoder/skills/impeccable/scripts/detector/registry/

- `antipatterns.mjs` — Declares ANTIPATTERNS (~4941 tok)

## .qoder/skills/impeccable/scripts/detector/rules/

- `checks.mjs` — DETECTOR_IS_BROWSER: checkBorders, isEmojiOnlyText, checkColors + 5 more (~30656 tok)

## .qoder/skills/impeccable/scripts/detector/shared/

- `color.mjs` — ─── Section 2: Color Utilities ───────────────────────────────────────────── (~1172 tok)
- `constants.mjs` — ─── Section 1: Constants ─────────────────────────────────────────────────── (~1080 tok)
- `page.mjs` — Check if content looks like a full page (not a component/partial) (~68 tok)

## .qoder/skills/impeccable/scripts/lib/

- `design-parser.mjs` — Parse a DESIGN.md (Stitch-spec format) into a structured JSON model that (~6882 tok)
- `impeccable-config.mjs` — CLI-side reader/writer for the unified `.impeccable` config. (~5730 tok)
- `impeccable-paths.mjs` — Exports IMPECCABLE_DIR, LIVE_DIR, CRITIQUE_DIR, getImpeccableDir + 18 more (~1046 tok)
- `is-generated.mjs` — Decide whether a given file is "generated" (regenerated by a build step, (~604 tok)

## .qoder/skills/impeccable/scripts/live/

- `browser-script-parts.mjs` — Exports LIVE_BROWSER_SCRIPT_PARTS, resolveLiveBrowserScriptParts, assertLiveBrowserScriptParts, readLiveBrowserScriptParts, assembleLiveBrowserScript (~458 tok)
- `completion.mjs` — Exports completionTypeForAcceptResult, completionAckForAcceptResult (~259 tok)
- `event-validation.mjs` — Shared event validation for the live helper server. (~1683 tok)
- `insert-ui.mjs` — Pure helpers for live-mode insert UI (browser + tests). (~4178 tok)
- `manual-apply.mjs` — Exports createManualApplyController, manualEditApplyChunkSize, countManualApplyOps, writeManualApplyEvidence (~9307 tok)
- `manual-edit-routes.mjs` — API routes: GET (10 endpoints) (~3983 tok)
- `manual-edits-buffer.mjs` — Shared helpers for the pending-manual-edits buffer on disk. (~1364 tok)
- `session-store.mjs` — Exports createLiveSessionStore (~2852 tok)
- `svelte-component.mjs` — Svelte live-mode component injection helpers. (~7440 tok)
- `sveltekit-adapter.mjs` — SvelteKit live-mode adapter. (~2498 tok)
- `ui-core.mjs` — Framework-neutral Impeccable live chrome contract. (~1478 tok)
- `vocabulary.mjs` — Canonical design-command vocabulary for Live Mode: each command's value, human (~881 tok)

## .rtk/

- `filters.toml` — Project-local RTK filters — commit this file with your repo. (~136 tok)

## .serena/

- `.gitignore` — Git ignore rules (~7 tok)
- `project.local.yml` — This file allows you to locally override settings in project.yml for development purposes. (~115 tok)
- `project.yml` — the name by which the project can be referenced within Serena (~2152 tok)

## .stitch/

- `DESIGN.md` — Brand & Style (~1851 tok)
- `metadata.json` (~244 tok)

## .stitch/designs/

- `home_screen.html` — CervixDetectAI - Health Management (~29854 tok)
- `profile_screen.html` — CervixDetectAI - Profile (~3834 tok)
- `records_screen.html` — Checkup Records - Health Management (~4004 tok)

## .trae/skills/impeccable/

- `SKILL.md` — Setup (~4907 tok)

## .trae/skills/impeccable/reference/

- `adapt.md` — Assess Adaptation Challenge (~2529 tok)
- `animate.md` — Register (~2592 tok)
- `audit.md` — Diagnostic Scan (~1819 tok)
- `bolder.md` — Register (~1620 tok)
- `brand.md` — Brand register (~2613 tok)
- `clarify.md` — Assess Current Copy (~2661 tok)
- `codex.md` — Codex: Visual Direction & Asset Production (~1751 tok)
- `colorize.md` — Register (~3368 tok)
- `craft.md` — Craft Flow (~2986 tok)
- `critique.md` — ## Purpose (~9030 tok)
- `delight.md` — Register (~2435 tok)
- `distill.md` — Assess Current State (~1412 tok)
- `document.md` — The frontmatter: token schema (~6959 tok)
- `extract.md` — Extract Flow (~836 tok)
- `harden.md` — Assess Hardening Needs (~2146 tok)
- `hooks.md` — /impeccable hooks (~1880 tok)
- `init.md` — Init Flow (~3169 tok)
- `interaction-design.md` — Interaction Design (~1644 tok)
- `layout.md` — Register (~2167 tok)
- `live.md` — Prerequisites (~14877 tok)
