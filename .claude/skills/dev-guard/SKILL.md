---
name: dev-guard
description: >
  障碍跳棋 (Obstacle Checkers) 项目专属开发守则，在开发新功能、修改 bug、
  调整细节、添加组件、重构代码等所有开发场景下自动适用。包含 .vue 文件
  ≤ 400 行规范、组件解耦策略、game-core 纯净性要求、uni-app 平台研究协议、
  设计系统速查及开发前自检清单。
tags:
  - project
  - architecture
  - coding-standard
  - uni-app
  - vue3
---

# Dev Guard — 障碍跳棋项目开发守则

以下规范在本项目的所有开发场景中自动适用。阅读完整的 CLAUDE.md 了解详细架构。

---

## A. 文件与组件规范

### .vue 文件大小限制

- **≤ 400 行**（template + script + style 合计）。这是硬性限制，由 PreToolUse hook 强制执行。
- 超过 300 行时就应该考虑提取子组件。
- 如果需要向一个已超过 400 行的既有文件添加代码，**必须先重构**：提取子组件以减量，然后再添加新功能。
- `pages/index/index.vue`（~790 行）是该项目中最大的文件——任何接触该文件的改动都必须以组件提取为起点。

### game-core 纯净性

`game-core/*.js` 模块是**纯函数**模块，不涉及 UI 依赖：

```
禁止导入: Vue, uni-app, wx, components/, pages/, common/
允许导入: 仅限其他 game-core/ 模块
```

它们接收状态参数并返回新状态。页面组件负责变更。

### 组件命名

- 组件：PascalCase（`BoardGrid.vue`, `SidebarDrawer.vue`）
- 页面：pages/ 下的 kebab-case 目录（`pages/index/index.vue`）
- 目前组件全部平铺在 `components/` 下。除非明确约定，不要创建子目录。

### 页面职责边界

| 页面 | 职责 | 注意 |
|------|------|------|
| `pages/index/index.vue` | 游戏状态持有者，编排游戏循环 | 不要在此处添加 UI 辅助函数——提取为组件 |
| `pages/create/create.vue` | 关卡生成配置，调用 `growPathElegantAsync()` | |
| `pages/load/load.vue` | Base64 关卡导入 | 简单表单 |
| `pages/info/info.vue` | 静态文章页 | |
| `pages/config/config.vue` | **死代码**，由 create.vue 替代 | 不要修改 |
| `pages/settings/settings.vue` | 存根页面 | 仅作者信息 |

---

## B. 平台研究协议

### 在编写任何平台特定代码之前

1. 查阅 `docs/dev_docs/INDEX.md` 找到相关主题
2. 阅读与你任务匹配的具体 dev 文档：
   - 微信小程序行为：`docs/dev_docs/13-小程序专题.md`
   - 条件编译：`docs/dev_docs/08-条件编译.md`
   - 性能优化：`docs/dev_docs/14-性能优化.md`
   - 环境变量：`docs/dev_docs/17-环境变量.md`
3. 如果 dev 文档不足，**主动搜索**官方 uni-app 文档 (`uniapp.dcloud.net.cn`) 和微信小程序文档 (`developers.weixin.qq.com`)
4. 不要仅凭通用 Vue 知识来判断 uni-app 的具体细节（路由、生命周期、存储、条件编译）

### 需牢记的关键平台差异

| 关注点 | H5 | MP-WEIXIN |
|--------|-----|-----------|
| 音频 | Web Audio API 合成 | `uni.createInnerAudioContext()` |
| 字体 | 自托管 WOFF2 (`common/fonts.css`) | `wx.loadFontFace` 从 Google Fonts CDN 加载 |
| 棋盘尺寸 | ResizeObserver + SelectorQuery | 仅 `uni.createSelectorQuery()` |
| Base64 | `btoa` / `atob` | `uni.arrayBufferToBase64` / `uni.base64ToArrayBuffer` |
| 图标 | `static/icons/` 中的本地 PNG（无图标字体、无 CDN） | 同 H5 |

### 开始任何任务前

重新阅读项目根目录下的 CLAUDE.md。它包含详细的架构说明、组件清单和具体实现的注意事项（例如，对话框使用 CSS opacity 过渡，而非 Vue `<transition>`）。

---

## C. 架构边界守则

### 三层架构

```
pages/          → 状态持有者、导航、页面布局
  └─ 导入 game-core/ 函数，使用 components/
components/     → 展示型组件，props 输入 / events 输出
  └─ 不直接导入 game-core/
game-core/      → 纯函数，零 UI 依赖
  └─ 仅导入其他 game-core/ 模块
```

### 各层职责：什么该放哪里

| 关注点 | 位置 |
|--------|------|
| 六边形数学、坐标变换 | `game-core/constants.js` |
| 棋盘创建、映射 | `game-core/board.js` |
| 跳跃验证、移动执行 | `game-core/logic.js` |
| BFS 求解器、寻解 | `game-core/solver.js` |
| 关卡生成 | `game-core/generator.js` |
| 计分、罚分 | `game-core/penalties.js` |
| 协作调度 | `game-core/scheduler.js` |
| 音频合成/播放 | `game-core/audio.js` |
| 状态管理 | `pages/index/index.vue` |
| 棋盘渲染、格子交互 | `components/BoardGrid.vue` |
| 分数展示、操作按钮 | `components/BottomDock.vue` |
| 导航头部 | `components/GameAppBar.vue` |
| 关卡列表、侧滑面板 | `components/SidebarDrawer.vue` |
| 加载/结果覆盖层 | `components/CircleProgressDialog.vue` |
| 毛玻璃卡片容器 | `components/LiquidCard.vue` |
| PNG 图标映射 | `components/IconSprite.vue` |

### 状态流转

- 页面组件持有**所有**可变状态（棋盘、计时器、分数、历史记录、UI 状态）
- 调用 `executeMove()` 等 game-core 函数，这些函数返回**新**状态（不可变）
- 将当前状态作为 props 向下传递给子组件
- 子组件向上 emit 事件（`cell-tap`, `undo` 等）——由页面处理
- 计时器由页面通过 `setInterval` 统一管理，不在组件内分散管理

### 绝对不要修改的文件

- `origin_game/` — V1 参考原型（只读）
- `uni.promisify.adaptor.js` — 框架适配器
- `manifest.json` — 由 HBuilderX IDE 管理
- `pages/config/config.vue` — 死代码，不要触碰

---

## D. 开发前检查清单

### 开始任何代码变更前

1. [ ] 重新阅读 CLAUDE.md 了解项目特定上下文
2. [ ] 如果要修改 `.vue` 文件，**先检查其当前行数**。超过 300 行则先规划组件提取
3. [ ] 如果任务涉及特定平台（H5 vs MP），阅读 `docs/dev_docs/` 中的相关 dev 文档
4. [ ] 判断变更属于 game-core（纯函数）、components（UI）还是页面（状态编排）。参见模块 C
5. [ ] 如果要新增 UI，检查 `components/` 中是否已有匹配的组件。优先复用
6. [ ] 验证拟议的变更不会将 Vue/uni-app API 导入到 game-core 模块中
7. [ ] 对于 SCSS 变更，**先检查** `common/design-tokens.scss` 中的设计 token，再使用硬编码颜色

### 变更完成后

8. [ ] 验证 .vue 文件不超过 400 行（hook 会强制执行，但请主动检查）
9. [ ] 对于 game-core 变更，验证没有意外添加 Vue/uni-app 导入
10. [ ] 在心理上走一遍每个条件编译指令（`#ifdef H5` / `#ifdef MP-WEIXIN`）是否正确

---

## E. 设计系统速查

### 关键色板（完整 Token 位于 `common/design-tokens.scss`）

| Token | 值 | 用途 |
|-------|-----|------|
| `$color-primary` | `#006c49` | 标题、激活态 |
| `$color-primary-container` | `#10b981` | 主按钮 |
| `$color-liquid-accent` | `#A7F3D0` | 装饰光斑 |
| 毛玻璃表面 | `rgba(209, 250, 229, 0.4)` | 卡片背景 |
| 页面底色 | `#f7f9fb` | 基础页面颜色 |
| `$color-error` | `#ba1a1a` | 删除按钮、错误状态 |

### 毛玻璃模式（Glass Morphism）

```scss
@import '../common/design-tokens';
@import '../common/glass-utilities';

.my-card {
  @include glass-surface(24px);    // background + backdrop-filter + border
  @include glass-border;           // 1px rgba(255,255,255,0.6) 边框
  @include emerald-shadow(4px, 30px, 0.1); // 带色相的投影
  border-radius: $radius-default;  // 1rem
}
```

### 字体系统

- 标题：**Manrope**（700/800 字重）
- 正文：**Hanken Grotesk**（400/700 字重）
- H5：自托管 WOFF2（`common/fonts.css`）
- MP：`wx.loadFontFace` 从 Google Fonts CDN 加载（在 `App.vue` 中）
- **不要在 H5 中嵌入 Google Fonts 链接**——使用自托管文件

### 间距与尺寸

- 基准：8px
- 间距：24px
- 移动端内边距：20px
- 小程序中使用 `rpx` 单位（750rpx = 屏幕宽度）

### 完整设计参考

- `stitch_design/INDEX.md` — 完整设计系统文档（组件到样式的映射、高度/阴影层级、图标系统）
- `common/design-tokens.scss` — 所有 SCSS 颜色/间距变量
- `common/glass-utilities.scss` — 毛玻璃混入
- `common/fonts.css` — H5 字体声明
