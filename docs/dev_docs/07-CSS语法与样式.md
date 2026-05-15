> **原文链接**：[页面样式与布局](https://uniapp.dcloud.net.cn/tutorial/syntax-css.html)
>
> **提示**：本文档内容来源于 uni-app 官方开发文档，由 AI 整理生成。开发时请以官方实际文档为准，访问上述链接查阅最新、最完整的开发文档和 API 参考。

# CSS 语法与样式

## 概述

uni-app 支持三种页面类型：vue 页面（Webview 渲染）、nvue 页面（原生渲染）、uvue 页面（原生渲染）。

本文主要介绍 vue 页面（Webview 渲染）中的样式注意事项。uni-app 的 CSS 与 Web CSS 基本一致。

## CSS 预处理器支持

uni-app 支持 Less、Sass/SCSS、Stylus 等预处理器。

Vue3 默认使用 `dart-sass`。Vue2 项目从 HBuilderX 4.56+ 起也默认使用 `dart-sass`。

### 常见迁移问题

| 问题 | 解决方案 |
|------|---------|
| `SassError: expected selector. /deep/` | `/deep/` 替换为 `::v-deep` |
| `Using / for division is deprecated` | 使用 `math.div()` 替换除法运算符 |
| `xxx and xxx are incompatible` | calc 中带单位问题 |

## 尺寸单位

### rpx 详细说明

rpx 根据屏幕宽度自适应缩放。基准宽度为 **750rpx**。

**计算公式：** `750 × 元素在设计稿中的宽度 / 设计稿基准宽度`

**举例：**
1. 设计稿宽度 750px，元素宽 100px → 100rpx
2. 设计稿宽度 640px，元素宽 100px → 约 117rpx
3. 设计稿宽度 375px，元素宽 200px → 400rpx

| 单位 | 说明 |
|------|------|
| px | 屏幕像素 |
| rpx | 响应式 px，750rpx 等于屏幕宽度 |

Vue 页面额外支持：
| 单位 | 说明 |
|------|------|
| rem | 根字体大小 |
| vh | 视窗高度 |
| vw | 视窗宽度 |

nvue **不支持** rem、vh、vw 和百分比单位。

### rpx 使用要点

- rpx 与宽度相关，屏幕越宽实际像素越大。不想缩放则用 px
- 字体或高度中使用 rpx 会随屏幕变宽而放大，固定高度应使用 px
- rpx 不支持动态横竖屏切换计算，使用 rpx 建议锁定屏幕方向

## 样式导入

```css
<style>
    @import "../../common/uni.css";
    .uni-card { box-shadow: none; }
</style>
```

## 内联样式

```html
<view :style="{color:color}" />
<view class="normal_view" />
```

> 静态样式统一写到 class 中，style 接收动态样式。避免将静态样式写进 style，以免影响渲染速度。

## 选择器

| 选择器 | 样例 | 说明 |
|--------|------|------|
| .class | .intro | 选择所有 class="intro" 的组件 |
| #id | #firstname | 选择 id="firstname" 的组件 |
| element | view | 选择所有 view 组件 |
| element, element | view, checkbox | 选择多类组件 |
| ::after | view::after | 在组件后插入内容（仅 vue 页面） |
| ::before | view::before | 在组件前插入内容（仅 vue 页面） |

**注意：** 不能使用 `*` 选择器。微信小程序自定义组件中仅支持 class 选择器。

## 全局样式与局部样式

- **全局样式**：定义在 `App.vue` 中，作用于每一个页面
- **局部样式**：定义在 `pages` 目录下的 vue 文件中，只作用于对应页面，并会覆盖 App.vue 中相同的选择器

> nvue 页面暂不支持全局样式。

## CSS 变量

| CSS 变量 | 描述 | App | 小程序 | H5 |
|----------|------|-----|--------|-----|
| `--status-bar-height` | 系统状态栏高度 | 实际状态栏高度 | 25px | 0 |
| `--window-top` | 内容区域距顶部距离 | 0 | 0 | NavigationBar 高度 |
| `--window-bottom` | 内容区域距底部距离 | 0 | 0 | TabBar 高度 |

### 示例

```html
<template>
    <view>
        <view class="status_bar">
            <!-- 状态栏占位 -->
        </view>
        <view>状态栏下的文字</view>
    </view>
</template>
<style>
    .status_bar {
        height: var(--status-bar-height);
        width: 100%;
    }
</style>
```

## 固定值

| 组件 | 描述 | App | H5 |
|------|------|-----|-----|
| NavigationBar | 导航栏 | 44px | 44px |
| TabBar | 底部选项卡 | 50px | 50px |

## Flex 布局

为支持跨平台，框架建议使用 Flex 布局。

## 背景图片

- 支持 base64 格式图片
- 支持网络路径图片
- 小程序不支持在 CSS 中使用本地文件（包括背景图和字体文件），需以 base64 方式
- 图片小于 40KB 时编译到不支持本地背景图的平台会自动转为 base64
- 推荐使用 `~@` 开头的绝对路径：

```css
.test2 {
    background-image: url('~@/static/logo.png');
}
```

## 字体图标

- 支持 base64 格式字体图标
- 支持网络路径字体图标（必须加协议头 `https`）
- 字体文件小于 40KB 时自动转为 base64
- 推荐使用 `~@` 开头的绝对路径

### nvue 字体引入

nvue 中不可直接使用 CSS 引入字体文件，需通过 JS 方式：

```javascript
var domModule = weex.requireModule('dom');
domModule.addRule('fontFace', {
    fontFamily: 'fontFamilyName',
    src: "url('https://...')",
});
```
