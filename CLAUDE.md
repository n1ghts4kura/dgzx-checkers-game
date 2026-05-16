# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UniApp (Vue 3) single-player puzzle game — **障碍跳棋 (Obstacle Checkers)**. The player piece jumps over colored obstacles on a 17-row hexagonal board, eating them one by one, to reach the top triangle. Targets: WeChat Mini Program (primary) and H5 web.

V1 reference prototype: `origin_game/障碍跳棋_新.html`. Design doc: **[structure.md](structure.md)**.

## Build & Development

No `package.json` — dependencies and builds are managed by HBuilderX IDE.

```bash
npm run dev:h5           # H5 dev server
npm run build:h5         # H5 production build
npm run dev:mp-weixin    # WeChat Mini Program dev
npm run build:mp-weixin  # WeChat Mini Program build
```

`.hbuilderx/` and `unpackage/` are IDE artifacts (in `.gitignore`).

## Architecture

### Rendering: CSS-Positioned Grid (No Canvas)

The board is rendered as absolutely-positioned `<view>` elements in **`components/BoardGrid.vue`**, not Canvas. Each valid cell is a DOM node positioned by row/column offset. This avoids Canvas API differences across platforms.

Cell positioning in `renderedCells` computed property:
```
cx = c * cellSize + (r % 2) * cellSize / 2   // odd rows shift right by half
cy = r * cellSize * 0.86                       // compressed row height
```

Cell size is computed responsively via `uni.createSelectorQuery()` + `ResizeObserver` (H5 only), fitting the board into the container.

Visual layers are CSS classes: empty cells (`#e8e8e8` circles), obstacles (colored via `--cell-bg-color`), player (green + white center dot via `::after`), selected (orange pulsing ring), jump targets (hollow green rings), hint path nodes (pink + numbered labels), win zone (radial green glow). Jump preview lines and hint connectors are rendered as additional absolutely-positioned `<view>` elements with calculated `transform: rotate()`.

### Pure-Function Game Logic (game-core/)

All game logic modules export stateless functions that receive board/mapping as parameters. The Vue page component owns the mutable state:

| Module | Purpose |
|--------|---------|
| `constants.js` | Board geometry (`ROWS_LAYOUT`), cell types, hex directions, jump factors, timing/scoring constants, rendering defaults, colors |
| `board.js` | `createEmptyBoard()`, `createAxialMapping()` (index↔axial coord maps), `countObstacles()` |
| `logic.js` | `canJumpTo()` (6-direction validation), `findAllJumpsFrom()`, `executeMove()` (immutable), `saveStateSnapshot()`, plus reverse-move functions for level generation |
| `solver.js` | `solveGameBFS()` (state-space BFS with dynamic obstacle sets), `findSolutionPath()` (simple BFS on current board), `verifyUniqueSolution()` |
| `generator.js` | `growPathElegant()` (recursive reverse-growth), `setupDefaultBoard()` (27-obstacle default level), `buildLevelData()`/`loadLevelIntoBoard()`, Base64 export/import |
| `penalties.js` | Penalty threshold calculation, settlement score (factor1 + factor2 → 0-100), score text formatting |
| `audio.js` | `playCaptureSound()` / `playVictorySound()` — Web Audio synthesis (H5) vs `uni.createInnerAudioContext()` (MP) |

### Hexagonal Board Model

17 rows, diamond-shaped. `ROWS_LAYOUT = [1, 2, 3, 4, 13, 12, 11, 10, 9, 10, 11, 12, 13, 4, 3, 2, 1]` gives the column count per row (max 17).

Two coordinate systems:
- **Grid (r, c)**: array indices `board[r][c]`
- **Axial (q, r)**: hex math — `q = c - floor(r/2)`. `createAxialMapping()` builds bidirectional `indexToAxial`/`axialToIndex` Maps

Cell values: `-1` (INVALID), `0` (EMPTY), `1` (OBSTACLE), `2` (PLAYER).

Colors are stored in a parallel `boardColors[row][col]` array (null or hex string).

### Jump Mechanics (`canJumpTo`)

1. Both positions must be valid cells; origin = PLAYER, target = EMPTY
2. The (origin→target) vector must align with one of 6 axial directions
3. Distance must be an even jump factor: 2, 4, 6, or 8
4. The midpoint (distance/2 along the direction) must be OBSTACLE
5. All other path cells must be EMPTY
6. Returns `{ valid, obstaclePos }`

Six directions (axial): `[1,0] [1,-1] [0,-1] [-1,0] [-1,1] [0,1]`

Win: player reaches row index ≤ 3 (the top 4 rows).

### Timing & Scoring

Two parallel timers managed in `pages/index/index.vue`:
- **Game total**: 10:00 countdown (100ms tick). Zero triggers settlement.
- **Move timer**: count-up per move (100ms tick). Resets after each jump.

Penalties: after 15s on a single move, -3 points per 10-second interval. Warning toast at 5s before next threshold. Score starts at 150, floor at 0, undo costs -5.

Settlement: `factor1` (completion) × `factor2` (score ratio) → final 0-100.

### Level Generation (`growPathElegant`)

Reverse growth from goal: start at a random top-triangle cell, grow backward by placing obstacles at midpoints of reverse jumps. Each candidate is heuristically scored (vertical push, distance, crowding penalty). Recursive with BFS validation every N steps. Final unique-solution check verifies no alternative path exists.

Level data: `{ obstacles: [[r,c,color],...], player: [r,c], solutionPath: [[r,c],...] }`

## Component & Page Inventory

### Components
- **`BoardGrid.vue`** — CSS-positioned board with cell rendering, jump targets, hint path, connectors. Computes responsive `cellSize` from container. Emits `cell-tap`.
- **`BottomDock.vue`** — Score display (with deduction animation), move timer (red gradient 15-30s), game timer, undo/hint/restart buttons. Props-only, emits actions.
- **`GameAppBar.vue`** — Glass-morphism header with left/right icon slots
- **`SidebarDrawer.vue`** — Slide-in drawer with level list (active state, per-level config button), "create new" button, backdrop
- **`IconSprite.vue`** — Local PNG icons from `static/icons/` (name→path map, supports @3x)
- **`LiquidCard.vue`** — Glass-morphism card wrapper with slot

### Pages
- **`pages/index/index.vue`** — Main game page. Owns all game state: board, timers, score, history, settlement. Orchestrates game loop: cover → play → victory → settlement. Handles cell tap routing (jump target → execute, player → toggle selection, other → deselect).
- **`pages/config/config.vue`** — Level config: step count input, fixed-start toggle, high-quality toggle. Emits config via `uni.$emit('board-config:generate', config)` then navigates back.
- **`pages/settings/settings.vue`** — Author info only

## Design System (`common/`)

Emerald glass-morphism theme. SCSS tokens in `design-tokens.scss`, mixins in `glass-utilities.scss`.

- **Primary**: `#006c49` emerald on `#f7f9fb` background
- **Glass surfaces**: `rgba(209, 250, 229, 0.4)` background + `blur()` backdrop + `rgba(255,255,255,0.6)` border
- **Fonts**: Manrope (headlines, weights 700/800) + Hanken Grotesk (body, weights 400/700). Self-hosted WOFF2 for H5 (`common/fonts.css`), `wx.loadFontFace` from Google Fonts CDN for MP (in `App.vue`).
- **Icons**: Local PNG files in `static/icons/` at @1x/@2x/@3x, no icon font or CDN dependency
- **Spacing**: 8px baseline, 24px gutter
- **Sizing**: Use `rpx` (750rpx = screen width)

## Platform Adaptation

Conditional compilation via uni-app preprocessor directives:
```js
// #ifdef H5        — Web only
// #ifdef MP-WEIXIN  — WeChat Mini Program only
// #ifndef H5       — All non-web platforms
```

Key platform differences:
- **Audio**: H5 uses Web Audio API synthesis; MP plays pre-recorded files via `uni.createInnerAudioContext()`
- **Fonts**: H5 uses self-hosted WOFF2 via `@font-face`; MP loads from Google Fonts CDN via `wx.loadFontFace`
- **Board sizing**: H5 uses `ResizeObserver`; MP relies on `uni.createSelectorQuery()` only
- **Base64**: H5 uses `btoa`/`atob`; MP uses `uni.arrayBufferToBase64`/`uni.base64ToArrayBuffer`

## Files Not to Modify

- `origin_game/` — V1 reference prototypes. Read-only for logic reference.
- `uni.promisify.adaptor.js` — Framework adapter, auto-loaded by uni-app
- `manifest.json` — Managed by HBuilderX IDE

## Key Implementation Notes

- **State immutability**: `executeMove()` returns new board/colors/playerPos — never mutates. The page component replaces its state with the returned values.
- **Axial mapping rebuild**: After each move, `createAxialMapping()` is called fresh. The Maps use string keys (`"q,r"` and `"r,c"`).
- **Jump target set**: Computed as a `Set` of `"r,c"` strings for O(1) lookup in `renderedCells`.
- **Board sizing**: `cellSize` is stored in component `data` and updated by `computeCellSize()`. The `boardStyle` computed property derives total width/height from cell bounds.
- **Level management is incomplete**: 2 hardcoded level names, no persistence, config page `uni.$emit` has no listener in index page. Level generation from config is the next major feature to wire up.
