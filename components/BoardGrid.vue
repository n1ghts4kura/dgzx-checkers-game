<template>
  <view class="board-grid-wrapper">
    <view class="board-grid" :style="boardStyle">
      <view
        v-for="cell in renderedCells"
        :key="`${cell.r}-${cell.c}`"
        class="board-cell"
        :class="cell.classes"
        :style="cell.style"
        @tap="onCellTap(cell.r, cell.c)"
      >
        <text v-if="cell.hintLabel !== null" class="cell-hint-label">{{ cell.hintLabel }}</text>
      </view>

      <view
        v-for="(conn, i) in hintConnectors"
        :key="'hc-' + i"
        class="hint-connector"
        :style="conn.style"
      />

      <view
        v-for="(conn, i) in jumpPreviewConnectors"
        :key="'jpc-' + i"
        class="jump-preview-connector"
        :style="conn.style"
      />
    </view>
  </view>
</template>

<script>
import { ROWS_LAYOUT, BOARD_ROWS, BOARD_COLS, INVALID, EMPTY, OBSTACLE, PLAYER, WIN_ROW_THRESHOLD } from '@/game-core/constants.js'

export default {
  name: 'BoardGrid',
  props: {
    board: { type: Array, required: true },
    boardColors: { type: Array, required: true },
    playerPos: { type: Array, default: null },
    selected: { type: Array, default: null },
    jumpTargets: { type: Array, default: () => [] },
    hintPath: { type: Array, default: null },
    disabled: { type: Boolean, default: false },
    boardVisible: { type: Boolean, default: true }
  },
  emits: ['cell-tap'],
  data() {
    return {
      cellSize: 28
    }
  },
  computed: {
    cellBounds() {
      const S = this.cellSize
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          if (this.board[r][c] === INVALID) continue
          const cx = c * S + (r % 2) * S / 2
          const cy = r * S * 0.86
          if (cx < minX) minX = cx
          if (cx > maxX) maxX = cx
          if (cy < minY) minY = cy
          if (cy > maxY) maxY = cy
        }
      }
      return { minX, maxX, minY, maxY }
    },

    boardStyle() {
      const S = this.cellSize
      const b = this.cellBounds
      return {
        position: 'relative',
        width: (b.maxX - b.minX + S) + 'px',
        height: (b.maxY - b.minY + S) + 'px',
        opacity: this.boardVisible ? 1 : 0,
        transition: 'opacity 250ms ease'
      }
    },

    jumpTargetSet() {
      return new Set(this.jumpTargets.map(([r, c]) => `${r},${c}`))
    },

    hintIndexMap() {
      if (!this.hintPath || this.hintPath.length === 0) return new Map()
      const m = new Map()
      this.hintPath.forEach(([r, c], i) => {
        m.set(`${r},${c}`, i)
      })
      return m
    },

    renderedCells() {
      const S = this.cellSize
      const b = this.cellBounds
      const pad = S / 2
      const cells = []
      for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          if (this.board[r][c] === INVALID) continue
          const cx = c * S + (r % 2) * S / 2 - b.minX + pad
          const cy = r * S * 0.86 - b.minY + pad
          cells.push({
            r,
            c,
            style: {
              left: cx + 'px',
              top: cy + 'px',
              width: S + 'px',
              height: S + 'px',
              '--cell-bg-color': this.boardColors[r][c] || '#A020F0'
            },
            classes: this.renderClasses(r, c),
            hintLabel: this.getHintLabel(r, c)
          })
        }
      }
      return cells
    },

    hintConnectors() {
      if (!this.hintPath || this.hintPath.length < 2) return []
      const S = this.cellSize
      const b = this.cellBounds
      const pad = S / 2
      const result = []
      for (let i = 0; i < this.hintPath.length - 1; i++) {
        const [r1, c1] = this.hintPath[i]
        const [r2, c2] = this.hintPath[i + 1]
        const x1 = c1 * S + (r1 % 2) * S / 2 - b.minX + pad
        const y1 = r1 * S * 0.86 - b.minY + pad
        const x2 = c2 * S + (r2 % 2) * S / 2 - b.minX + pad
        const y2 = r2 * S * 0.86 - b.minY + pad

        const dx = x2 - x1
        const dy = y2 - y1
        const length = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx) * 180 / Math.PI

        result.push({
          style: {
            left: x1 + 'px',
            top: (y1 - 1.5) + 'px',
            width: length + 'px',
            transform: `rotate(${angle}deg)`,
            transformOrigin: 'left center'
          }
        })
      }
      return result
    },

    jumpPreviewConnectors() {
      if (!this.selected || !this.playerPos || this.jumpTargets.length === 0) return []
      const S = this.cellSize
      const b = this.cellBounds
      const pad = S / 2
      const [pr, pc] = this.playerPos
      const x1 = pc * S + (pr % 2) * S / 2 - b.minX + pad
      const y1 = pr * S * 0.86 - b.minY + pad

      const result = []
      for (const [tr, tc] of this.jumpTargets) {
        const x2 = tc * S + (tr % 2) * S / 2 - b.minX + pad
        const y2 = tr * S * 0.86 - b.minY + pad

        const dx = x2 - x1
        const dy = y2 - y1
        const length = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx) * 180 / Math.PI

        result.push({
          style: {
            left: x1 + 'px',
            top: y1 + 'px',
            width: length + 'px',
            transform: `rotate(${angle}deg)`,
            transformOrigin: 'left center'
          }
        })
      }
      return result
    }
  },
  mounted() {
    this.computeCellSize()
    // #ifdef H5
    if (window.ResizeObserver) {
      this._ro = new ResizeObserver(() => {
        this.computeCellSize()
      })
      const el = this.$el && this.$el.querySelector
        ? this.$el.querySelector('.board-grid-wrapper') || this.$el
        : this.$el
      if (el && el.nodeType === 1) {
        this._ro.observe(el)
      }
    }
    // #endif
  },
  beforeDestroy() {
    // #ifdef H5
    if (this._ro) {
      this._ro.disconnect()
      this._ro = null
    }
    // #endif
  },
  methods: {
    computeCellSize() {
      const query = uni.createSelectorQuery().in(this)
      query.select('.board-grid-wrapper').boundingClientRect((rect) => {
        if (!rect || rect.width === 0 || rect.height === 0) return
        const maxCols = Math.max(...ROWS_LAYOUT)
        const sw = rect.width / (maxCols + 0.5)
        const sh = rect.height / (BOARD_ROWS * 0.86 + 1)
        this.cellSize = Math.max(20, Math.floor(Math.min(sw, sh)))
      }).exec()
    },

    renderClasses(r, c) {
      const val = this.board[r][c]
      const key = `${r},${c}`
      const isSelected = this.selected && this.selected[0] === r && this.selected[1] === c
      const isPlayerPos = this.playerPos && this.playerPos[0] === r && this.playerPos[1] === c

      return {
        'board-cell--empty': val === EMPTY && !isPlayerPos,
        'board-cell--obstacle': val === OBSTACLE && !isPlayerPos,
        'board-cell--player': val === PLAYER || isPlayerPos,
        'board-cell--selected': isSelected,
        'board-cell--jump-target': this.jumpTargetSet.has(key),
        'board-cell--win-zone': r <= WIN_ROW_THRESHOLD,
        'board-cell--hint': this.hintIndexMap.has(key),
        'board-cell--hint-start': this.hintIndexMap.get(key) === 0
      }
    },

    getHintLabel(r, c) {
      const idx = this.hintIndexMap.get(`${r},${c}`)
      if (idx === undefined) return null
      return idx === 0 ? 'S' : String(idx)
    },

    onCellTap(r, c) {
      if (this.disabled) return
      this.$emit('cell-tap', { r, c })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../common/design-tokens';

// ── Wrapper ──
.board-grid-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

// ── Base cell ──
.board-cell {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-sizing: border-box;
  transition: background-color 150ms ease, box-shadow 150ms ease;
  pointer-events: auto;

  // Visible circle = 80% of cell box
  &::before {
    content: '';
    position: absolute;
    inset: 10%;
    border-radius: 50%;
    z-index: 0;
    pointer-events: none;
  }

  // Empty cell default
  &::before {
    background: #e8e8e8;
    border: 1px solid rgba(0, 0, 0, 0.08);
  }
}

// ── Obstacle ──
.board-cell--obstacle {
  &::before {
    background: var(--cell-bg-color);
    border: 1px solid rgba(0, 0, 0, 0.15);
  }
}

// ── Player ──
.board-cell--player {
  z-index: 3;
  &::before {
    background: #00C853;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
}

// Player center dot
.board-cell--player::after {
  content: '';
  width: 32%;
  height: 32%;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}

// ── Selected ──
.board-cell--selected {
  z-index: 4;
  animation: selected-pulse 1.2s ease-in-out infinite;

  &::before {
    box-shadow: 0 0 0 4px #FFB350, 0 0 12px rgba(255, 179, 80, 0.5);
  }
}

@keyframes selected-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.06); }
}

// ── Jump target ──
.board-cell--jump-target {
  z-index: 3;
  &::before {
    background: transparent;
    border: 3px solid #00A844;
  }
}

// ── Win zone ──
.board-cell--win-zone {
  // Radial glow behind cell
  background: radial-gradient(circle, rgba(144, 238, 144, 0.35), transparent 65%);
  border-radius: 50%;
}

// ── Hint path ──
.board-cell--hint {
  z-index: 5;
  &::before {
    background: #FF4081;
    border-color: #FF4081;
  }

  &.board-cell--hint-start::before {
    box-shadow: 0 0 0 2px white;
  }
}

// ── Hint label ──
.cell-hint-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: $font-headline;
  font-weight: 800;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  z-index: 6;
  text-align: center;
  line-height: 1;
  pointer-events: none;
}

// ── Hint connector lines ──
.hint-connector {
  position: absolute;
  height: 3px;
  background: #FF4081;
  opacity: 0.45;
  pointer-events: none;
  z-index: 4;
  border-radius: 2px;
}

// ── Jump preview connectors ──
.jump-preview-connector {
  position: absolute;
  height: 2px;
  background: #00A844;
  opacity: 0.35;
  pointer-events: none;
  z-index: 3;
  border-radius: 1px;
}
</style>
