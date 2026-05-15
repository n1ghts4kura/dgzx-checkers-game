# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UniApp (Vue 3) WeChat Mini Program — **障碍跳棋 (Obstacle Checkers)**, a single-player puzzle game. The player piece jumps over colored obstacles on a hexagonal board, eating them one by one, to reach the top triangle. Target: WeChat Mini Program first; H5/native as secondary targets.

This is a port of the v1 HTML all-in-one prototype at `origin_game/障碍跳棋_新.html`. Full design doc: **[structure.md](structure.md)**.

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

Project scaffolding and builds are managed via HBuilderX IDE or the `@dcloudio/uni-cli` package. The `.hbuilderx/` and `unpackage/` directories are in `.gitignore` (IDE artifacts and build output). There is no `package.json` — dependencies are managed by HBuilderX.

## Game Rules

### Board

17-row hexagonal grid. Each row has a different number of valid cells forming a diamond shape:

```
ROWS_LAYOUT = [1, 2, 3, 4, 13, 12, 11, 10, 9, 10, 11, 12, 13, 4, 3, 2, 1]
```

- **Grid coords (r, c)**: array indices `board[r][c]`
- **Axial coords (q, r)**: hex math — `q = c - floor(r/2)`. Bidirectional maps `indexToAxial` / `axialToIndex`
- Cell values: `-1` (INVALID, outside board), `0` (EMPTY), `1` (OBSTACLE), `2` (PLAYER)

### Core Mechanic: Obstacle Jumping

The player moves by **jumping over obstacles** in one of 6 hex directions. Each jump:

- Must be an even distance: **2, 4, 6, or 8** cells in one direction
- The **midpoint** of the jump MUST contain an obstacle (the player "eats" it)
- All intermediate cells (except the midpoint) must be EMPTY
- After landing: origin becomes EMPTY, midpoint obstacle is removed, destination becomes PLAYER

Six direction vectors (axial): `[1,0] [1,-1] [0,-1] [-1,0] [-1,1] [0,1]`

### Win Condition

Player piece reaches row index ≤ 3 (the top triangle, first 4 rows).

### Move Validation (`canJumpTo`)

1. Both positions must be inside the valid board area
2. Origin must be PLAYER, target must be EMPTY
3. The (origin, target) vector must align with one of 6 axial directions
4. Vector magnitude must be an even number (2/4/6/8)
5. The midpoint (magnitude / 2) must be exactly an OBSTACLE
6. All path cells between origin and target (except midpoint) must be EMPTY

## Scoring & Timing

Two timers run in parallel:

| Timer | Direction | Tick | Behavior |
|-------|-----------|------|----------|
| Game total | Countdown 10:00 | 100ms | Reaching 0 → settlement |
| Move timer | Count-up per move | 10ms | Resets after each jump |

**Time penalties**: After 15s on a single move, -3 points per 10-second interval (cumulative: 15-25s → -3, 25-35s → -6, etc.). Warning bar at 5s before next threshold.

**Scoring**:
- Start at 150 points
- Undo: -5 points
- Move timeout: -3 points per 10s interval
- Floor at 0

**Settlement** (final score 0-100):
- `factor1` (completion): won → `timeRemaining / 600s`, lost → `correctSteps / targetSteps`
- `factor2` (score): `currentScore / 150`
- `finalScore = round((factor1 + factor2) × 50)`

## Level Generation

Algorithm: **reverse growth from the goal** (`growPathElegant`).

1. Pick random position in rows 0-3 as the goal
2. Place player there, find legal reverse moves (jumps where origin/midpoint are EMPTY → fill midpoint with obstacle)
3. Score each candidate heuristically: vertical push toward bottom, distance from origin, obstacle crowding penalty, plus high-quality mode bonuses (long jumps, horizontal spread)
4. Recursively grow until target step count is reached
5. Verify via `fastSolver` (BFS) every N steps
6. **Unique-solution check**: traverse the solution path step-by-step, check each branching point — if removing an alternative midpoint obstacle and re-solving reaches the goal, the level is rejected

Level data format:
```json
{
    "obstacles": [[row, col, "#hexcolor"], ...],
    "player": [row, col],
    "solutionPath": [[row, col], ...]
}
```

Levels can be Base64-encoded for export/import.

## Key UI Elements (from v1 HTML)

| Element | Description |
|---------|-------------|
| Canvas 750×600 | Main game board, renders board + pieces + highlights + hint paths |
| Cover layer + Start button | Hides board until player clicks to start (starts timers) |
| Victory overlay | Floating green "🎉 胜利！" message with pulse animation |
| Game timer display | MM:SS countdown |
| Move timer display | Seconds.hundredths count-up, turns red 15-30s, bounce animation 30s+ |
| Score display | "150分" with deduction animation (fade in/out per -N) |
| Warning bar | "快落子！要扣分啦！" when 5s from next penalty threshold |
| Collapsible control panel | Two sections: pre-game (difficulty, generation, export/import) and in-game (undo, restart, hint) |
| Hint path | BFS-computed solution drawn as pink dashed line with numbered step nodes (S→1→2→...) |
| Settlement modal | Semi-transparent overlay with final score breakdown |

## Canvas Rendering (for WeChat port reference)

```
CELL_SIZE = 33px, row height = CELL_SIZE × 0.85
x = canvasWidth/2 + (col - MAX_COLS/2) × CELL_SIZE + (row%2) × (CELL_SIZE/2)
y = topOffset + row × (CELL_SIZE × 0.85)
```

- Empty cells: 15px gray circles
- Obstacles: 15px colored circles (colors from `boardColors[r][c]`), gray border
- Player piece: 15px green circle with 5px white center dot
- Valid jump targets: 8px hollow green rings, 3px stroke
- Selected cell: 17px orange circle behind piece
- Hover preview: green arrow from player to target
- Win area (rows 0-3): radial gradient green highlight
- Hit testing: iterate all valid cells, distance < 20px = match

## Architecture (uni-app)

```
App.vue          # Root component, lifecycle hooks (onLaunch/onShow/onHide)
main.js          # Bootstrap — Vue 2 (#ifndef VUE3) and Vue 3 (#ifdef VUE3) paths
manifest.json    # App metadata, platform permissions, splash screen, SDK configs
pages.json       # Route table and global style (navigation bar, background)
pages/           # Page components — one .vue file per route
uni.scss         # Global SCSS variables (uni-app design tokens)
static/          # Static assets served at /static/
```

## Recommended Module Structure

```
game-core/           # Pure logic (platform-agnostic, ported from v1)
  constants.js       # ROWS_LAYOUT, cell types, directions, colors, scoring constants
  board.js           # createEmptyBoard, createAxialMapping, logicalToIndex
  logic.js           # canJumpTo, findAllJumpsFrom, executeMove/undo
  solver.js          # solveGameBFS (BFS pathfinding with obstacle state)
  generator.js       # growPathElegant, verifyUniqueSolution, level serialization
  renderer.js        # Canvas draw() — board, pieces, highlights, hints
  timer.js           # Dual timer management, penalty calculation
  audio.js           # Sound synthesis via uni.createInnerAudioContext
components/          # Vue components
  GameCanvas.vue     # Canvas wrapper with @tap handling
  GameControls.vue   # Button panel (undo, restart, hint, generate)
  ScoreBoard.vue     # Timer + score display
pages/
  index/index.vue    # Main game page
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

## WeChat Mini Program Migration Notes

Replacements from HTML version:
- `Canvas 2D context` → uni-app Canvas or Canvas 2D mode
- `addEventListener('click')` → `@tap`
- `mousemove` hover preview → omit or show on player tap
- `document.getElementById()` → data binding / `uni.createSelectorQuery()`
- `navigator.clipboard` → `uni.setClipboardData()`
- `alert()` → `uni.showToast()` / `uni.showModal()`
- Web Audio API → `uni.createInnerAudioContext()`
- CSS `@keyframes` → WXSS or `uni.createAnimation()`
- `setInterval` for timers → supported in mini programs (keep)
- DOM-based settlement overlay → Vue component with `v-if`

## Development Documentation

Offline development docs are available in `docs/dev_docs/`. Start with the index:

- **[docs/dev_docs/INDEX.md](docs/dev_docs/INDEX.md)** — Full index with topic descriptions and quick-reference lookup by problem type

The docs cover: project structure, pages & routing, Vue basics & Composition API, JS/CSS syntax, conditional compilation, TypeScript, JSX/TSX, nvue native rendering, renderjs, mini program integration, performance optimization, dark mode, dev productivity tips, and environment variables.

When working with any of these docs, always cross-reference the official documentation linked at the top of each file — the offline docs are AI-generated snapshots and the official docs are the authoritative source.
