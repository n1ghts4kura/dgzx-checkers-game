> **原文链接**：[组合式 API（Composition API）](https://uniapp.dcloud.net.cn/tutorial/vue3-composition-api.html)
>
> **提示**：本文档内容来源于 uni-app 官方开发文档，由 AI 整理生成。开发时请以官方实际文档为准，访问上述链接查阅最新、最完整的开发文档和 API 参考。

# 组合式 API（Composition API）

通过组合式 API，开发者可以使用导入的 API 函数来描述组件逻辑。在单文件组件中，组合式 API 通常搭配 `<script setup>` 使用。

> **注意**：在组合式 API 中，组件可以监听应用和页面的生命周期。但由于应用和页面都包含 `onShow` 和 `onHide`，存在重名问题。因此在组合式的组件中监听页面显示隐藏时，改为使用 `onPageShow` 和 `onPageHide`。

## 使用组合式 API

从 `vue` 包内导入基础的组合式 API，从 `@dcloudio/uni-app` 包内导入 uni-app 的应用生命周期及页面生命周期。

```javascript
import { defineComponent, ref } from 'vue'
import { onReady } from '@dcloudio/uni-app'
export default defineComponent({
  setup() {
    const title = ref('Hello')
    onReady(() => {
      console.log('onReady')
    })
    return {
      title
    }
  }
})
```

## 使用 Script Setup

```html
<script setup>
import { ref } from 'vue'
import { onReady } from '@dcloudio/uni-app'
const title = ref('Hello')
onReady(() => {
  console.log('onReady')
})
</script>
```

## 关键要点

| 导入来源 | 用途 |
|---------|------|
| `vue` | 基础的组合式 API，如 `ref`、`reactive`、`defineComponent` 等 |
| `@dcloudio/uni-app` | uni-app 应用生命周期及页面生命周期钩子 |

**生命周期命名差异：**
- 应用级：`onShow` / `onHide`
- 页面级（组合式中）：`onPageShow` / `onPageHide`（避免与应用级重名）

## 参考

- [Vue 官方组合式 API 文档](https://cn.vuejs.org/api/composition-api-setup.html)
