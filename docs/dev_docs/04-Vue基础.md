> **原文链接**：[uni-app 中 Vue.js 基础](https://uniapp.dcloud.net.cn/tutorial/vue-basics.html)
>
> **提示**：本文档内容来源于 uni-app 官方开发文档，由 AI 整理生成。开发时请以官方实际文档为准，访问上述链接查阅最新、最完整的开发文档和 API 参考。

# uni-app 中 Vue.js 基础

## Vue 相比传统 JS 的开发优势

Vue 作为单页面应用，使页面局部刷新，无需每次跳转都请求所有数据和 DOM。

**Vue 的优势：**
- 轻量级渐进式框架
- 视图、数据和结构的分离
- 响应式双向数据绑定
- 组件化
- 虚拟 DOM

### 文件内代码架构的变化

`template`、`script`、`style` 是并列的一级节点（Vue 单文件组件规范 SFC）：

```vue
<template>
    <view>
        注意必须有一个 view，且只能有一个根 view。
    </view>
</template>
<script>
    export default {}
</script>
<style>
</style>
```

## 模板语法

### 插值

```vue
<template>
    <view>
        <view>Message: {{ msg }}</view>
    </view>
</template>
<script>
    export default {
        data() {
            return { msg: 'Hello Vue!' }
        }
    }
</script>
```

#### 使用 JavaScript 表达式

```vue
<view>{{ number + 1 }}</view>
<view>{{ ok ? 'YES' : 'NO' }}</view>
<view>{{ message.split('').reverse().join('') }}</view>
```

每个绑定只能包含**单个表达式**，不能是语句或流控制。

### 指令

#### v-bind

动态绑定属性或组件 prop。缩写为 `:`。

```vue
<image :src="imgUrl"></image>
<button :disabled="isButtonDisabled">Button</button>
```

#### v-on

监听 DOM 事件。缩写为 `@`。

```vue
<view @click="doSomething">点击</view>
```

#### v-html

更新元素的 innerHTML。App 端和 H5 端支持，微信小程序会转为 rich-text。

```vue
<view v-html="rawHtml"></view>
```

## data 属性

data 必须声明为返回一个初始数据对象的**函数**：

```javascript
// 正确
data() {
    return { title: 'Hello' }
}

// 错误 - 页面关闭时数据不会自动销毁
data: { title: 'Hello' }
```

## Class 与 Style 绑定

### 对象语法

```vue
<view class="static" :class="{ active: isActive, 'text-danger': hasError }">222</view>
<view :style="{ color: activeColor, fontSize: fontSize + 'px' }">333</view>
```

### 数组语法

```vue
<view :class="[activeClass, errorClass]">111</view>
<view :class="[{ active: isActive }, errorClass]">333</view>
```

> 小程序端不支持 classObject 和 styleObject 语法。

也可用 computed 方法生成 class 或 style 字符串。

## 条件渲染

### v-if 和 v-else

```vue
<view v-if="seen">现在你看到我了</view>
<view v-else>你看不到我了</view>
```

### 条件渲染分组

用 `<template>` 作为不可见包裹元素：

```vue
<template v-if="seen">
    <view>标题</view>
    <view>内容</view>
</template>
```

### v-show

元素始终被渲染，只是切换 CSS 的 display 属性。nvue 页面不支持 v-show。

| 特性 | v-if | v-show |
|------|------|--------|
| 切换开销 | 更高 | 较低 |
| 初始渲染 | 惰性 | 始终渲染 |
| 适用场景 | 条件很少改变 | 频繁切换 |

## 列表渲染

### v-for

```vue
<view v-for="(item, index) in items" :key="item.id">
    {{ index }} - {{ item.message }}
</view>
```

- 必须提供 `:key` 指定唯一标识符
- 不推荐同时使用 v-if 和 v-for

## 事件处理器

### 事件修饰符

- `.stop`：各平台均支持，阻止事件冒泡
- `.native`：监听原生事件
- `.prevent`、`.capture`、`.self`、`.once`、`.passive`：仅 H5 平台支持

### 事件映射表

| WEB 事件 | uni-app 对应事件 |
|----------|-----------------|
| click | tap |
| touchstart | touchstart |
| touchmove | touchmove |
| touchend | touchend |
| input | input |
| change | change |
| submit | submit |
| blur | blur |
| focus | focus |

## 表单控件绑定

### v-model

```vue
<input v-model="message" placeholder="edit me">
<text>Message is: {{ message }}</text>
```

> v-model 会忽略表单元素的初始值，应通过 data 选项声明初始值。

**uni-app 表单组件**：建议直接使用 uni-app 的表单组件（picker、radio-group 等）。

## 计算属性和侦听器

### computed

```vue
<script>
    export default {
        data() {
            return { message: 'Hello' }
        },
        computed: {
            reversedMessage() {
                return this.message.split('').reverse().join('')
            }
        }
    }
</script>
```

计算属性基于响应式依赖缓存，只在相关依赖改变时才重新求值。

### computed vs methods

计算属性有缓存，方法每次调用都会执行。

### watch

```javascript
export default {
    data() {
        return { word: 'word' }
    },
    watch: {
        word(newVal, oldVal) {
            console.log('最新值是：' + newVal, "原来的值是：" + oldVal);
        }
    }
}
```

高级用法：

```javascript
watch: {
    a: function(val, oldVal) { /* ... */ },
    b: 'someMethod',  // 方法名
    c: {
        handler: function(val, oldVal) { /* ... */ },
        deep: true  // 深度侦听
    },
    d: {
        handler: 'someMethod',
        immediate: true  // 立即调用
    },
    'e.f': function(val, oldVal) { /* 侦听嵌套路径 */ }
}
```
