# uni-app 开发文档索引

本目录包含从 [uni-app 官方教程](https://uniapp.dcloud.net.cn/tutorial/) 整理的开发文档。文档按主题有序编排，建议按顺序阅读前 4 篇了解核心概念后，按需查阅其他专题。

> **通用提示**：本文档内容来源于 uni-app 官方开发文档，由 AI 整理生成。开发时请以官方实际文档为准，访问原文链接查阅最新、最完整的开发文档和 API 参考。

## 文档目录

### 基础入门（推荐按顺序阅读）

| 序号 | 文档 | 原文链接 | 内容简介 |
|------|------|---------|---------|
| 01 | [概念简介](./01-概念简介.md) | [链接](https://uniapp.dcloud.net.cn/tutorial/) | uni-app 组成：编译器 + 运行时，逻辑层与渲染层分离原理 |
| 02 | [工程简介](./02-工程简介.md) | [链接](https://uniapp.dcloud.net.cn/tutorial/project.html) | 目录结构、static 目录用途、各配置文件职责 |
| 03 | [页面](./03-页面.md) | [链接](https://uniapp.dcloud.net.cn/tutorial/page.html) | 页面生命周期、路由、页面栈、页面通讯（uni.$emit/$on） |
| 04 | [Vue 基础](./04-Vue基础.md) | [链接](https://uniapp.dcloud.net.cn/tutorial/vue-basics.html) | 模板语法、指令、data、class/style 绑定、条件/列表渲染、computed/watch |

### Vue 进阶

| 序号 | 文档 | 原文链接 | 内容简介 |
|------|------|---------|---------|
| 05 | [Vue3 组合式 API](./05-Vue3组合式API.md) | [链接](https://uniapp.dcloud.net.cn/tutorial/vue3-composition-api.html) | setup()、ref/reactive、script setup、生命周期导入方式 |

### 语言与样式

| 序号 | 文档 | 原文链接 | 内容简介 |
|------|------|---------|---------|
| 06 | [JS 语法](./06-JS语法.md) | [链接](https://uniapp.dcloud.net.cn/tutorial/syntax-js.html) | 各端 JS 引擎差异、ES6 兼容性表、非 H5 端与浏览器 JS 区别 |
| 07 | [CSS 语法与样式](./07-CSS语法与样式.md) | [链接](https://uniapp.dcloud.net.cn/tutorial/syntax-css.html) | rpx 响应式单位、CSS 变量（--status-bar-height 等）、Flex 布局、字体图标 |
| 08 | [条件编译](./08-条件编译.md) | [链接1](https://uniapp.dcloud.net.cn/tutorial/platform.html) [链接2](https://uniapp.dcloud.net.cn/tutorial/compiler.html) | #ifdef/#ifndef 语法、全平台标识表、static/pages.json 条件编译 |
| 09 | [TypeScript 专题](./09-TypeScript专题.md) | [链接](https://uniapp.dcloud.net.cn/tutorial/typescript-subject.html) | tsconfig.json 配置、Vue.extend 写法、兼容性说明 |
| 10 | [JSX/TSX 语法](./10-JSX-TSX语法.md) | [链接](https://uniapp.dcloud.net.cn/tutorial/syntax-jsx.html) | @vitejs/plugin-vue-jsx 安装与配置（仅 app-vue3 和 H5-vue3） |

### App 原生专题

| 序号 | 文档 | 原文链接 | 内容简介 |
|------|------|---------|---------|
| 11 | [nvue 介绍](./11-nvue介绍.md) | [链接](https://uniapp.dcloud.net.cn/tutorial/nvue-outline.html) | 原生渲染引擎、适用场景、编译模式、与 vue 页面区别 |
| 12 | [renderjs](./12-renderjs.md) | [链接](https://uniapp.dcloud.net.cn/tutorial/renderjs.html) | 视图层 JS 运行、降低通信损耗、操作 DOM/Web 库（仅 app-vue 和 H5） |

### 跨平台专题

| 序号 | 文档 | 原文链接 | 内容简介 |
|------|------|---------|---------|
| 13 | [小程序专题](./13-小程序专题.md) | [链接](https://uniapp.dcloud.net.cn/tutorial/miniprogram-subject.html) | 各平台自定义组件目录、WXS/SJS/Filter 视图层脚本、usingComponents 配置 |

### 优化与适配

| 序号 | 文档 | 原文链接 | 内容简介 |
|------|------|---------|---------|
| 14 | [性能优化](./14-性能优化.md) | [链接](https://uniapp.dcloud.net.cn/tutorial/performance.html) | 逻辑层视图层通信原理、长列表、包体积、启动速度、动画优化 |
| 15 | [暗黑模式](./15-暗黑模式.md) | [链接](https://uniapp.dcloud.net.cn/tutorial/darkmode.html) | theme.json 配置、@变量引用、CSS prefers-color-scheme、主题切换监听 |

### 工具与环境

| 序号 | 文档 | 原文链接 | 内容简介 |
|------|------|---------|---------|
| 16 | [高效开发技巧](./16-高效开发技巧.md) | [链接](https://uniapp.dcloud.net.cn/tutorial/snippet.html) | HBuilderX 代码块（u 开头）、Vue/uni API 快捷输入 |
| 17 | [环境变量](./17-环境变量.md) | [链接](https://uniapp.dcloud.net.cn/tutorial/env.html) | .env 文件、vue-config.js、package.json env 配置方式 |

## 快速查询索引

### 按问题类型查找

| 问题 | 查阅文档 |
|------|---------|
| 如何注册新页面？ | [03-页面](./03-页面.md#页面管理) |
| onLoad 和 onReady 的区别？ | [03-页面](./03-页面.md#页面加载时序介绍) |
| 页面间如何传参和通信？ | [03-页面](./03-页面.md#页面通讯) |
| 路由如何跳转？ | [03-页面](./03-页面.md#路由) |
| rpx 和 px 怎么换算？ | [07-CSS语法与样式](./07-CSS语法与样式.md#尺寸单位) |
| 如何写平台特定代码？ | [08-条件编译](./08-条件编译.md) |
| 如何在非 H5 端使用 window/DOM？ | [12-renderjs](./12-renderjs.md) |
| App 端如何用原生渲染？ | [11-nvue介绍](./11-nvue介绍.md) |
| 如何接入微信自定义组件？ | [13-小程序专题](./13-小程序专题.md) |
| 如何配置暗黑模式？ | [15-暗黑模式](./15-暗黑模式.md) |
| 长列表性能差怎么办？ | [14-性能优化](./14-性能优化.md#优化建议) |
| TypeScript 怎么配置？ | [09-TypeScript专题](./09-TypeScript专题.md) |
| Vue2 和 Vue3 代码如何共存？ | [08-条件编译](./08-条件编译.md) |
| 如何配置环境变量？ | [17-环境变量](./17-环境变量.md) |
| 如何提升开发效率？ | [16-高效开发技巧](./16-高效开发技巧.md) |
| 小程序和 App 的 JS 有何限制？ | [06-JS语法](./06-JS语法.md) |
| 状态栏高度如何获取？ | [07-CSS语法与样式](./07-CSS语法与样式.md#css-变量) |
| nvue 有什么限制？ | [11-nvue介绍](./11-nvue介绍.md#nvue-开发与-vue-开发的主要区别) |
