<template>
  <view class="preview-section">
    <view class="preview-circle">
      <view class="preview-circle__glow" />
      <view v-if="levelData" class="preview-board" :style="boardStyle">
        <view
          v-for="cell in cells"
          :key="`${cell.r}-${cell.c}`"
          class="preview-cell"
          :class="cell.classes"
          :style="cell.style"
        />
      </view>
      <view v-else-if="placeholderOnEmpty" class="preview-circle__placeholder">
        <IconSprite name="apps" :size="48" />
      </view>
    </view>
  </view>
</template>

<script>
import { ROWS_LAYOUT, BOARD_ROWS, BOARD_COLS } from '@/game-core/constants.js'
import IconSprite from './IconSprite.vue'

export default {
  name: 'MiniBoardPreview',
  components: { IconSprite },
  props: {
    levelData: { type: Object, default: null },
    placeholderOnEmpty: { type: Boolean, default: true }
  },
  data() {
    return { cellSize: 16 }
  },
  computed: {
    bounds() {
      const S = this.cellSize
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      for (let r = 0; r < BOARD_ROWS; r++) {
        const count = ROWS_LAYOUT[r]
        const offset = Math.floor((BOARD_COLS - count) / 2)
        for (let c = offset; c < offset + count; c++) {
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
    cells() {
      const S = this.cellSize
      const b = this.bounds
      const level = this.levelData
      if (!level) return []
      const cells = []
      const obstacleMap = new Map()
      ;(level.obstacles || []).forEach(([r, c, color]) => {
        obstacleMap.set(`${r},${c}`, color)
      })
      const [pr, pc] = level.player || [-1, -1]

      for (let r = 0; r < BOARD_ROWS; r++) {
        const count = ROWS_LAYOUT[r]
        const offset = Math.floor((BOARD_COLS - count) / 2)
        for (let c = 0; c < BOARD_COLS; c++) {
          if (c < offset || c >= offset + count) continue
          const cx = c * S + (r % 2) * S / 2 - b.minX + S / 2
          const cy = r * S * 0.86 - b.minY + S / 2
          const key = `${r},${c}`
          const isObstacle = obstacleMap.has(key)
          const isPlayer = r === pr && c === pc
          cells.push({
            r, c,
            style: {
              left: cx + 'px',
              top: cy + 'px',
              width: S + 'px',
              height: S + 'px',
              ...(isObstacle ? { '--preview-cell-color': obstacleMap.get(key) } : {})
            },
            classes: {
              'preview-cell--obstacle': isObstacle,
              'preview-cell--player': isPlayer,
              'preview-cell--empty': !isObstacle && !isPlayer
            }
          })
        }
      }
      return cells
    },
    boardStyle() {
      const b = this.bounds
      const S = this.cellSize
      const boardW = b.maxX - b.minX + S
      const boardH = b.maxY - b.minY + S
      const available = 260
      const scale = Math.min(1, available / Math.max(boardW, boardH))
      return {
        width: boardW + 'px',
        height: boardH + 'px',
        transform: `scale(${scale})`,
        transformOrigin: 'center center'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../common/design-tokens';
@import '../common/glass-utilities';

.preview-section {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 20rpx;
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.preview-circle {
  width: 384rpx;
  height: 384rpx;
  border-radius: $radius-full;
  @include glass-surface(24px);
  @include glass-border;
  @include emerald-shadow(8px, 40px, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  &__glow {
    position: absolute;
    inset: 0;
    border-radius: $radius-full;
    border: 1px solid rgba(255, 255, 255, 0.6);
    pointer-events: none;
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.3;
    color: $color-on-surface-variant;
  }
}

.preview-board {
  position: relative;
  flex-shrink: 0;
}

.preview-cell {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  box-sizing: border-box;

  &--empty {
    background: #e8e8e8;
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  &--obstacle {
    background: var(--preview-cell-color);
    border: 1px solid rgba(0, 0, 0, 0.12);
  }

  &--player {
    background: #00C853;
    border: 1px solid rgba(0, 0, 0, 0.08);
  }
}
</style>
