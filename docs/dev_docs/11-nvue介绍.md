> **原文链接**：[nvue 介绍](https://uniapp.dcloud.net.cn/tutorial/nvue-outline.html)
>
> **提示**：本文档内容来源于 uni-app 官方开发文档，由 AI 整理生成。开发时请以官方实际文档为准，访问上述链接查阅最新、最完整的开发文档和 API 参考。

# nvue 介绍

`uni-app` App 端嵌入了一个经过改进的 weex 原生渲染引擎，从而提供原生渲染能力。

在 App 端，vue 页面使用 webview 渲染，而 nvue 页面（即 native vue 的缩写）则采用原生渲染。同一 App 中可以混用两种页面类型。

虽然 nvue 也能多端编译输出 H5 和小程序，但其 CSS 写法受限，因此如果不涉及 App 开发则无需使用 nvue。

## 适用场景

1. **高性能区域长列表或瀑布流滚动** — 推荐使用 nvue 的 `list`、`recycle-list`、`waterfall` 等组件
2. **复杂自定义下拉刷新** — pages.json 仅内置两种样式，自定义下拉刷新推荐 nvue 的 refresh 组件
3. **左右拖动的长列表** — 使用 nvue 实现左右滑动切换更流畅
4. **区域滚动 + 左右拖动 + 吸顶组合排版**
5. **软键盘右下角按钮文字改为"发送"** — 聊天场景
6. **解决原生控件层级问题** — map、video、live-pusher 等被前端 view 覆盖时
7. **深度使用 map 组件** — App 端 nvue 的 map 功能更完善
8. **深度使用 video 组件** — 如嵌入 swiper 实现抖音式滑动切换
9. **直播推流** — nvue 的 live-pusher 组件功能完善且无层级问题
10. **极致化 App 启动速度** — 首页使用 nvue 并配置 fast 模式

**但 nvue 在某些场景不如 vue 页面：**
- **canvas** — nvue 的 canvas 性能不高，推荐用 vue 页面的 renderjs 技术
- **动态横竖屏** — nvue 的 CSS 不支持媒体查询

## 编译模式

### weex 编译模式与 uni-app 编译模式

| 对比项 | weex 编译模式 | uni-app 编译模式 |
|--------|-------------|----------------|
| 平台 | 仅 App | 所有端 |
| 组件 | weex 组件如 div | uni-app 组件如 view |
| 生命周期 | 仅支持 weex 生命周期 | 支持所有 uni-app 生命周期 |
| JS API | weex API、uni API、Plus API | weex API、uni API、Plus API |
| 单位 | 750px 为屏幕宽度 | 750rpx 为屏幕宽度 |
| 全局样式 | 手动引入 | app.vue 样式即为全局样式 |
| 页面滚动 | 必须嵌套 list 或 scroll-view | 默认支持页面滚动 |

```json
// manifest.json 中配置编译模式
{
  "app-plus": {
    "nvueCompiler": "uni-app"
  }
}
```

## 纯原生渲染模式

在 manifest.json 的 `"app-plus"` 下配置 `"renderer":"native"`，即启用纯原生渲染模式。此时 pages.json 中的 vue 页面将被忽略。

## 快速上手

### 1. 新建 nvue 页面

在 HBuilderX 中新建页面时可选择建立 nvue 页面。所有页面均需在 `pages.json` 中注册。如果同一路由下同时存在同名的 vue 和 nvue 文件，在 App 端仅使用 nvue 页面。

### 2. 开发 nvue 页面

nvue 页面结构同 vue，由 `template`、`style`、`script` 构成：
- **template** — 支持 weex 组件、uni-app 组件及 App 端 nvue 专用组件
- **style** — 仅支持 flex 布局
- **script** — 支持 nvue API、uni API、plus API

## nvue 开发与 vue 开发的主要区别

1. 显隐控制只可使用 `v-if`，不可使用 `v-show`
2. 仅支持 `flex` 布局
3. 布局方向默认为竖排（`column`）
4. 文字内容必须放在 `<text>` 组件下
5. 只有 `text` 标签可设置字体大小和颜色
6. 不支持百分比和媒体查询
7. 不支持背景图（可用 image 组件模拟）
8. CSS 选择器仅支持 class 选择器
9. Android 端组件默认透明，需设置 background-color
10. class 绑定仅支持数组语法
11. 无 bounce 回弹效果（仅 list 等列表组件有）
12. TypeScript 暂不支持
13. 强烈建议使用原生导航栏

## render-whole

从 HBuilderX 3.1.0 起，nvue 新增 `render-whole` 属性（Boolean 类型）。

- **`true`** — 视图层将组件及其子组件的信息结构一次性与原生层通讯，提升排版渲染性能
- **`false`** — 以子节点逐个与原生层通讯再重绘

```html
<swiper :render-whole="true"></swiper>
```
