> **原文链接**：[TypeScript 专题](https://uniapp.dcloud.net.cn/tutorial/typescript-subject.html)
>
> **提示**：本文档内容来源于 uni-app 官方开发文档，由 AI 整理生成。开发时请以官方实际文档为准，访问上述链接查阅最新、最完整的开发文档和 API 参考。

# TypeScript 专题

uni-app 支持使用 TypeScript 进行开发。

类型定义由 `@dcloudio/types` 模块提供。安装后需在 `tsconfig.json` 中配置 `compilerOptions > types` 部分。

## HBuilderX 创建的项目

在 vue 或 nvue 页面的 `<script>` 标签上添加 `lang="ts"` 属性即可：

```html
<script lang="ts">
    let s: string = "123"
    console.log(s)
</script>
```

## CLI 创建的项目

创建项目时需指定 TypeScript。

## tsconfig.json 推荐配置

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "strict": true,
    "jsx": "preserve",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "importHelpers": true,
    "allowSyntheticDefaultImports": true,
    "useDefineForClassFields": true,
    "resolveJsonModule": true,
    "lib": ["esnext", "dom"],
    "types": ["@dcloudio/types"]
  },
  "exclude": ["node_modules", "unpackage", "src/**/*.nvue"]
}
```

## 兼容性说明

| 模式 | Vue 文件 | NVue 文件 |
|------|---------|----------|
| uni-app Vue2 模式 | 支持 TS | 从 HBuilderX 3.99 起支持 |
| uni-app Vue3 模式 | 支持最新版 TS | 支持最新版 TS |

## ts 组件

声明 `lang="ts"` 后，该 vue/nvue 文件内通过 `import` 引入的所有 Vue 组件，均需使用 TypeScript 编写。

### 改造组件示例

```html
<script lang="ts">
    import Vue from 'vue';
    export default Vue.extend({
        props: {
            type: {
                type: String,
                default: 'default'
            },
            inverted: {
                type: Boolean,
                default: false
            },
            text: {
                type: [String, Number],
                default: ''
            },
            size: {
                type: String,
                default: 'normal'
            }
        },
        computed: {
            setClass(): string {
                const classList: string[] = ['uni-badge-' + this.type, 'uni-badge-size-' + this.size];
                if (this.inverted === true) {
                    classList.push('uni-badge-inverted')
                }
                return classList.join(" ")
            }
        },
        methods: {
            onClick() {
                this.$emit('click')
            }
        }
    })
</script>
```

### 在页面中引用 ts 组件

```html
<script lang="ts">
    import Vue from 'vue';
    import uniBadge from '../../components/uni-badge.vue';
    export default Vue.extend({
        data() {
            return { title: 'Hello' }
        },
        components: { uniBadge }
    });
</script>
```
