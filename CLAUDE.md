# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UniApp cross-platform project (Vue 3) for a checkers game. Targets HTML5 web, WeChat/Alipay/Baidu/Toutiao mini programs, and native Android/iOS from a single codebase.

## Build & Development

```bash
# Development (H5 web)
npm run dev:h5

# Build for production (H5 web)
npm run build:h5

# Development for WeChat Mini Program
npm run dev:mp-weixin

# Build for WeChat Mini Program
npm run build:mp-weixin

# Development for native app (requires HBuilderX or uni-app CLI)
npm run dev:app-plus

# Build for native app
npm run build:app-plus
```

Project scaffolding and builds are managed via HBuilderX IDE or the `@dcloudio/uni-cli` package. The `.hbuilderx/` and `unpackage/` directories are in `.gitignore` (IDE artifacts and build output).

## Architecture

```
App.vue          # Root component, lifecycle hooks (onLaunch/onShow/onHide)
main.js          # Bootstrap — Vue 2 (#ifndef VUE3) and Vue 3 (#ifdef VUE3) paths
manifest.json    # App metadata, platform permissions, splash screen, SDK configs
pages.json       # Route table and global style (navigation bar, background)
pages/           # Page components — one .vue file per route
uni.scss         # Global SCSS variables (uni-app design tokens)
static/          # Static assets served at /static/
```

## Key Patterns

### Conditional Compilation

UniApp uses preprocessor directives to isolate platform-specific code:

```js
// #ifdef VUE3
// Vue 3 code here
// #endif

// #ifndef VUE3
// Vue 2 code here
// #endif

// #ifdef MP-WEIXIN
// WeChat Mini Program only
// #endif

// #ifdef APP-PLUS
// Native app only
// #endif
```

### Page Routing

Pages are registered in `pages.json` — the first entry is the app entry page. Each page maps a `path` to a `.vue` file under `pages/`.

### Styling

- Use `rpx` (responsive pixels) for sizing — 750rpx = screen width on all devices
- SCSS preprocessing is enabled by default
- `uni.scss` provides design tokens consumed by uni-app ecosystem plugins

### Promise Adapter

`uni.promisify.adaptor.js` intercepts uni API calls so `success`/`fail` callback-style APIs return promises instead (resolve with `res[1]`, reject with `res[0]`).

## Platform Targets

| Target | Config Key |
|--------|-----------|
| H5 (Web) | default |
| WeChat Mini Program | `mp-weixin` |
| Alipay Mini Program | `mp-alipay` |
| Baidu Mini Program | `mp-baidu` |
| Toutiao Mini Program | `mp-toutiao` |
| Native App (Android/iOS) | `app-plus` |
| Quick App | `quickapp` |

## Development Documentation

Offline development docs are available in `docs/dev_docs/`. Start with the index:

- **[docs/dev_docs/INDEX.md](docs/dev_docs/INDEX.md)** — Full index with topic descriptions and quick-reference lookup by problem type

The docs cover: project structure, pages & routing, Vue basics & Composition API, JS/CSS syntax, conditional compilation, TypeScript, JSX/TSX, nvue native rendering, renderjs, mini program integration, performance optimization, dark mode, dev productivity tips, and environment variables.

When working with any of these docs, always cross-reference the official documentation linked at the top of each file — the offline docs are AI-generated snapshots and the official docs are the authoritative source.
