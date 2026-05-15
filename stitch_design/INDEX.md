# Stitch Design — 设计文件索引

> 来源: Stitch 项目 "Markdown Design System" (ID: 466264442173508246)
> 设计系统: **Liquid Glass** — 毛玻璃翡翠风格
> 目标应用: **Board Master** (棋盘大师) — 六边形跳棋小程序

---

## 1. 配色风格

### 1.1 色系定位

**翡翠色系 (Emerald Spectrum)** — 以 `#10B981` 为视觉锚点，向深浅两端展开。

| 层级 | 色值 | 语义 |
|------|------|------|
| deep-emerald | `#064E3B` | 最深绿，用于高对比文本 |
| primary | `#006c49` | 主色，标题/激活态 |
| primary-container | `#10b981` | 主色容器，核心按钮 |
| liquid-accent | `#A7F3D0` | 液态光斑装饰 |
| glass-surface | `rgba(209, 250, 229, 0.4)` | 毛玻璃表面 |
| background | `#f7f9fb` | 页面底色 |

完整调色板包含 5 级梯度: `#10B981 → #34D399 → #6EE7B7 → #A7F3D0 → #D1FAE5`

### 1.2 设计风格关键词

- **Glassmorphism (毛玻璃风格)**: `backdrop-filter: blur(16px)` + 半透明翡翠底色
- **构成主义 (Constructivism)**: 严谨的几何布局，8px 基网格
- **简约风格 (Minimalism)**: 少装饰，重层次
- **液态感 (Liquid)**: 大型模糊光斑 (`blur-[80px]` ~ `blur-[100px]`)、`mix-blend-multiply` 混合模式

### 1.3 光影层次 (Elevation)

| 层级 | 实现 |
|------|------|
| 背景光斑 | `bg-liquid-accent` / `bg-primary-container` 圆形模糊光球 |
| 毛玻璃表面 | `bg-glass-surface` + `backdrop-filter: blur(16px)` |
| 内发光边框 | `inner-glow`: `inset 1px 1px 0px rgba(255,255,255,0.6)` |
| 翡翠投影 | `shadow-[0px_4px_30px_rgba(16,185,129,0.1)]` — 带色相的阴影 |
| 玻璃描边 | `border-glass-stroke`: `rgba(255,255,255,0.6)` 半透明白边 |

### 1.4 圆角系统

全部采用大圆角 (`ROUND_FULL`):
- **DEFAULT**: `1rem` (16px)
- **lg**: `2rem` (32px)
- **xl**: `3rem` (48px)
- **full**: `9999px` (胶囊形)
- 底部 Dock 使用 `30px` 圆角 (`rounded-[30px]`)

---

## 2. UI 组件种类

### 2.1 导航类

| 组件 | 说明 | 出现位置 |
|------|------|---------|
| **TopAppBar** | 顶部固定栏，`h-[79~80px]`，毛玻璃底 + 底部翡翠投影 | 全部页面 |
| **侧边抽屉 (Navigation Drawer)** | 左侧滑出，占屏宽 65%，毛玻璃 + 白色右边框 | 侧边栏视图 |
| **返回按钮** | 圆形 `w-12 h-12`，Material arrow_back 图标 | 设置页 |
| **菜单按钮** | 圆形，Material menu_open 图标 | 游戏页 |
| **设置按钮** | 圆形，Material settings 图标 | 游戏页 |

### 2.2 按钮类

| 组件 | 样式 | 出现位置 |
|------|------|---------|
| **主按钮 (Primary)** | 实心 `bg-primary`，白字，`rounded-lg`，`shadow-lg shadow-primary/20`，按压 `active:scale-95` | 侧边栏"创建新棋盘" |
| **毛玻璃按钮 (Glass)** | `bg-glass-surface`，`backdrop-blur-md`，`border-glass-stroke`，`inner-glow`，`rounded-[30px]` | 底部 Dock 操作按钮 |
| **图标按钮** | 圆形 `rounded-full`，hover 半透明叠加 | TopAppBar 功能按钮 |

### 2.3 卡片/容器类

| 组件 | 样式 | 出现位置 |
|------|------|---------|
| **液态卡片 (Liquid Card)** | `bg-glass-surface` + `backdrop-blur-[16px]` + `border-glass-stroke` + `inner-glow` + `shadow-[0px_8px_40px_rgba(16,185,129,0.1)]`，`rounded-lg`，内边距 `p-[60px]` | 设置页内容区 |
| **玻璃渐变卡片 (Glass Gradient)** | `bg-glass-gradient` (135deg 翡翠渐变)，`backdrop-blur-md`，`border-glass-stroke`，`inner-glow`，`rounded-[30px]` | 底部状态栏 |

### 2.4 状态指示类

| 组件 | 样式 | 出现位置 |
|------|------|---------|
| **导航列表项 (激活态)** | `bg-primary/10` + `border-l-4 border-primary` + `text-primary` | 侧边栏选中棋盘 |
| **导航列表项 (默认态)** | hover 半透明黑底，`text-on-surface-variant` | 侧边栏未选中棋盘 |

### 2.5 游戏棋盘 (SVG)

- 六边形菱形网格，17 行，`ROWS_LAYOUT = [1,2,3,4,13,12,11,10,9,10,11,12,13,4,3,2,1]`
- 格子: `#f0f0f0` 灰色圆形，半径 15px
- 胜利区域: 翡翠色径向渐变 (`radialGradient`)
- 可跳目标: 空心绿色圆环 (`#10B981`, r=8, stroke=3)
- 跳跃箭头: 绿色实线 + 三角箭头 (`#10B981`, stroke=4)
- 提示路径: 粉红虚线 (`#FF4081`, dasharray=4,4) + 编号节点 (S,1,2,3...)

### 2.6 信息展示类

| 组件 | 内容 | 出现位置 |
|------|------|---------|
| **分数字段** | label "当前得分" / value "2,450" | 底部状态栏 |
| **计时字段** | label "落子剩余时间" / value "14s" | 底部状态栏 |
| **总时间字段** | label "总剩余时间" / value "08:30" | 底部状态栏 |
| **作者署名** | "作者：27届208夜樱" | 设置页 |

### 2.7 图标系统

全部使用 **Google Material Symbols** 图标字体 (`Material+Symbols+Outlined`):
- `add_circle` — 创建
- `grid_on` — 棋盘网格
- `apps` — 棋盘列表
- `menu_open` — 打开菜单
- `settings` — 设置
- `arrow_back` — 返回
- `undo` — 悔棋
- `refresh` — 重新开始

图标支持 `FILL` 变体 (0=线性, 1=填充)。

---

## 3. 页面类型

### 3.1 主游戏页 — 侧边栏视图 (`01-sidebar-view.html`)

- **布局**: 侧边抽屉 (65%宽度) + 背景遮罩 (`bg-black/40 backdrop-blur-sm`)
- **TopAppBar**: 菜单按钮 | 标题 "棋盘-1" | 设置按钮
- **主区域**: SVG 六边形棋盘 (`scale-90`, `max-w-[400px]`)
- **底部 Dock**: 3 个状态卡片 (得分/落子时间/总时间) + 2 个操作按钮 (悔棋/重新开始)
- **背景**: 两个翡翠色模糊光斑 (左上 `liquid-accent` blur-80, 右下 `primary-container` blur-100)
- **特性**: 侧边栏包含棋盘列表切换 + "创建新棋盘"入口

### 3.2 主游戏页 — 全屏棋盘视图 (`02-hex-board.html`)

- **与侧边栏视图结构相同，但无侧边栏遮罩**
- 纯游戏界面，适合沉浸式游玩
- 其余组件完全一致: TopAppBar + SVG 棋盘 + 底部 Dock + 背景光斑

### 3.3 设置页面 (`03-settings-page.html`)

- **布局**: 返回按钮 | 标题 "设置" | 占位 spacer (对称)
- **内容区**: 液态卡片容器，内含作者信息
- **背景**: 两层 `radial-gradient` 翡翠光圈 (8%~12% 透明度)
- **特点**: 极简设计，仅展示元信息

---

## 4. 字体系统

| Token | 字体 | 大小 | 字重 | 用途 |
|-------|------|------|------|------|
| headline-xl | Manrope | 48px | 800 | 大标题 |
| headline-lg | Manrope | 32px | 700 | 桌面标题 |
| headline-lg-mobile | Manrope | 28px | 700 | 移动端标题、数值大字 |
| body-md | Hanken Grotesk | 16px | 400 | 正文 |
| body-sm | Hanken Grotesk | 14px | 400 | 辅助文字 |
| label-bold | Hanken Grotesk | 12px | 700 | 标签/按钮文字 |

---

## 5. 间距系统

| Token | 值 | 用途 |
|-------|-----|------|
| unit | 8px | 基础间距单元 |
| gutter | 24px | 页边距/内容间隙 |
| container-padding-mobile | 20px | 移动端内边距 |
| container-padding-desktop | 40px | 桌面端内边距 |

---

## 6. 设计文件清单

| 文件 | 页面 | 行数 |
|------|------|------|
| `01-sidebar-view.html` | 主游戏页 + 侧边栏抽屉 | 279 |
| `02-hex-board.html` | 主游戏页 (全屏棋盘) | 252 |
| `03-settings-page.html` | 设置页 | 142 |
| `04-DESIGN.md` | 设计说明 (2行) | 2 |
| `05-design-system.json` | Liquid Glass 完整设计 Token | 133 |

---

## 7. 与游戏项目的映射关系

| 设计概念 | 项目对应 |
|----------|---------|
| 六边形菱形棋盘 (SVG) | `game-core/renderer.js` Canvas 绘制 |
| 翡翠 Liquid Glass 风格 | `uni.scss` 设计 Token 定义 |
| 底部 Dock (得分/时间/操作) | `components/ScoreBoard.vue` + `GameControls.vue` |
| 侧边栏棋盘列表 | 微信小程序 `wx.showActionSheet` 或自定义抽屉 |
| 设置页 | `pages/settings/settings.vue` |
| Material Symbols 图标 | 小程序内置 icon 或自定义 SVG |
| Hint 路径 (粉红虚线) | `renderer.js` 提示路径绘制层 |
