> **原文链接**：[JSX/TSX 语法](https://uniapp.dcloud.net.cn/tutorial/syntax-jsx.html)
>
> **提示**：本文档内容来源于 uni-app 官方开发文档，由 AI 整理生成。开发时请以官方实际文档为准，访问上述链接查阅最新、最完整的开发文档和 API 参考。

# JSX/TSX 语法

uni-app 支持 JSX 开发。

**平台差异说明**

| App-vue3 | H5-vue3 | 小程序平台 |
| :---: | :---: | :---: |
| √ | √ | × |

## 安装插件

```bash
npm install @vitejs/plugin-vue-jsx@3.1.0 --save-dev
```

## 配置 vite.config.js

### HBuilderX 创建的项目

在项目根目录新建 `vite.config.js` 文件：

```javascript
import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [
    uni(),
    vueJsx({
      // options are passed on to @vitejs/plugin-vue-jsx
    })
  ],
});
```

### CLI 创建的项目

在项目根目录 `vite.config.js` 中增加相同配置。

## 注意事项

- `@vitejs/plugin-vue-jsx` 的版本最好和 uni-app 内部使用的版本保持一致，否则可能会出现兼容性问题
