> **原文链接**：[renderjs](https://uniapp.dcloud.net.cn/tutorial/renderjs.html)
>
> **提示**：本文档内容来源于 uni-app 官方开发文档，由 AI 整理生成。开发时请以官方实际文档为准，访问上述链接查阅最新、最完整的开发文档和 API 参考。

# renderjs

`renderjs` 是一个运行在视图层的 JavaScript。它比 WXS 更强大，但仅支持 **app-vue** 和 **web** 平台。

## 主要作用

1. 大幅降低逻辑层和视图层的通讯损耗，提供高性能视图交互能力
2. 在视图层操作 DOM，运行面向 Web 的 JavaScript 库

## 平台差异说明

| App | H5 | 微信小程序 | 支付宝小程序 | 百度小程序 | 抖音/飞书小程序 | QQ小程序 |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| √ | √ | × | × | × | × | × |

> nvue 的视图层是原生的，无法运行 JS，但提供了 bindingx 技术解决通信阻塞。微信小程序下替代方案是 WXS。

## 使用方式

通过将 `<script>` 节点的 `lang` 属性设为 `renderjs` 来声明：

```html
<script module="test" lang="renderjs">
    export default {
        mounted() {
            // ...
        },
        methods: {
            // ...
        }
    }
</script>
```

其中 `module` 属性用于指定模块名称，视图层与逻辑层通过该名称进行通信。

## 功能详解

### 1. 降低通信损耗

renderjs 运行在视图层，可直接操作视图层的元素，从而避免通信折损。在 hello uni-app 的 canvas 示例中，App 端使用 renderjs 由视图层直接操作 canvas，实现了远超微信小程序的流畅 canvas 动画。

### 2. 在视图层操作 DOM

在 app-vue 环境下，视图层由 WebView 渲染，renderjs 运行于视图层，因此可以正常操作 DOM 和 window。可运行如 echart、F2、Three.js 等 Web 库。

## 注意事项

1. 目前仅支持内联使用
2. 不要直接引用大型类库，推荐通过动态创建 `<script>` 方式引用
3. 可以使用 Vue 组件的生命周期（不支持 beforeDestroy、destroyed、beforeUnmount、unmounted），不可以使用 App、Page 的生命周期
4. 视图层和逻辑层的通讯方式与 WXS 一致，可通过 `this.$ownerInstance` 获取当前组件的 ComponentDescriptor 实例
5. `this.$ownerInstance.callMethod()` 仅支持调用逻辑层 Vue 选项式 methods 中定义的方法
6. 逻辑层给数据时最好一次性给到渲染层
7. **APP 端**：可使用 DOM、BOM API，不可直接访问逻辑层数据，不可以使用 uni 相关接口（如 uni.request）
8. **H5 端**：逻辑层和视图层实际运行在同一个 WebView 中，可以直接访问逻辑层数据
9. Vue 3 项目不支持 `setup script` 用法
