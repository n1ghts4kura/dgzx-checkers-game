<template>
  <view class="page-config">
    <!-- Background blobs -->
    <view class="bg-blobs">
      <view class="bg-blob bg-blob--top-left" />
      <view class="bg-blob bg-blob--bottom-right" />
    </view>

    <!-- TopAppBar -->
    <GameAppBar
      title="棋盘配置"
      left-icon="arrow_back"
      @left-click="goBack"
    />

    <!-- Content area -->
    <view class="config-content">
      <!-- Board Preview -->
      <view class="preview-section">
        <view class="preview-circle">
          <view class="preview-circle__glow" />
          <view class="preview-board" :style="previewBoardStyle">
            <view
              v-for="cell in miniBoardCells"
              :key="`p-${cell.r}-${cell.c}`"
              class="preview-cell"
              :class="cell.classes"
              :style="cell.style"
            />
          </view>
        </view>
      </view>

      <!-- Configuration Card -->
      <view class="config-card">
        <view class="config-card__glow" />

        <!-- Row 1: Solution Steps -->
        <view class="config-row">
          <text class="config-label">题解步数</text>
          <view class="config-input-wrapper">
            <input
              class="config-input"
              type="text"
              :value="stepCount"
              placeholder="决赛使用的是20步!"
              @input="onStepInput"
            />
          </view>
        </view>

        <view class="config-divider" />

        <!-- Row 2: Fixed Starting Point -->
        <view class="config-row" @tap="toggleFixedStart">
          <text class="config-label config-label--flex">固定起点到底部</text>
          <view class="toggle" :class="{ 'toggle--active': fixedStart }">
            <view class="toggle__thumb" :class="{ 'toggle__thumb--active': fixedStart }" />
          </view>
        </view>

        <view class="config-divider" />

        <!-- Row 3: High Quality Map -->
        <view class="config-row" @tap="toggleHighQuality">
          <text class="config-label config-label--flex">生成高质量地图</text>
          <view class="toggle" :class="{ 'toggle--active': highQuality }">
            <view class="toggle__thumb" :class="{ 'toggle__thumb--active': highQuality }" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import GameAppBar from '@/components/GameAppBar.vue'
import { ROWS_LAYOUT, BOARD_ROWS, BOARD_COLS, COLORS } from '@/game-core/constants.js'

const SAMPLE_OBSTACLES = [
  [5, 5, COLORS.PURPLE], [6, 7, COLORS.PURPLE],
  [7, 3, COLORS.BLUE], [8, 6, COLORS.BLUE],
  [9, 5, COLORS.PINK],
  [10, 3, COLORS.YELLOW], [10, 8, COLORS.YELLOW],
  [11, 6, COLORS.ORANGE],
  [13, 7, COLORS.RED], [15, 7, COLORS.RED]
]

export default {
  name: 'BoardConfig',
  components: { GameAppBar },
  data() {
    return {
      stepCount: '20',
      fixedStart: true,
      highQuality: true,
      miniCellSize: 16
    }
  },
  computed: {
    previewBoardBounds() {
      const S = this.miniCellSize
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

    miniBoardCells() {
      const S = this.miniCellSize
      const b = this.previewBoardBounds
      const cells = []
      const obstacleMap = new Map()
      SAMPLE_OBSTACLES.forEach(([r, c, color]) => {
        obstacleMap.set(`${r},${c}`, color)
      })

      for (let r = 0; r < BOARD_ROWS; r++) {
        const count = ROWS_LAYOUT[r]
        const offset = Math.floor((BOARD_COLS - count) / 2)
        for (let c = 0; c < BOARD_COLS; c++) {
          if (c < offset || c >= offset + count) continue

          const cx = c * S + (r % 2) * S / 2 - b.minX + S / 2
          const cy = r * S * 0.86 - b.minY + S / 2
          const key = `${r},${c}`
          const color = obstacleMap.get(key)

          cells.push({
            r, c,
            style: {
              left: cx + 'px',
              top: cy + 'px',
              width: S + 'px',
              height: S + 'px',
              '--preview-cell-color': color || 'transparent'
            },
            classes: {
              'preview-cell--obstacle': color != null,
              'preview-cell--player': r === 16 && c === 8,
              'preview-cell--empty': color == null && !(r === 16 && c === 8)
            }
          })
        }
      }
      return cells
    },

    previewBoardStyle() {
      const b = this.previewBoardBounds
      const S = this.miniCellSize
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
  },

  onLoad(options) {
    if (options.index != null) {
      this.levelIndex = Number(options.index)
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    onStepInput(e) {
      this.stepCount = e.detail.value
    },
    toggleFixedStart() {
      this.fixedStart = !this.fixedStart
    },
    toggleHighQuality() {
      this.highQuality = !this.highQuality
    },
    onGenerate() {
      const config = {
        stepCount: Number(this.stepCount) || 20,
        fixedStart: this.fixedStart,
        highQuality: this.highQuality
      }
      // Pass config back via global event or store
      uni.$emit('board-config:generate', config)
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../common/design-tokens';
@import '../../common/glass-utilities';

.page-config {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: $color-background;
  font-family: $font-body;
  font-size: $fs-body-md;
  color: $color-on-surface;
  position: relative;
}

// ── Background blobs ──

.bg-blobs {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(160rpx);
}

.bg-blob--top-left {
  top: -10%;
  left: -10%;
  width: 100vw;
  height: 100vw;
  background: $color-liquid-accent;
  opacity: 0.4;
}

.bg-blob--bottom-right {
  bottom: -10%;
  right: -10%;
  width: 120vw;
  height: 120vw;
  background: $color-primary-container;
  opacity: 0.3;
}

// ── Content area ──

.config-content {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-left: 12rpx;
  margin-right: 12rpx;
  padding-top: 32rpx;
  padding-bottom: 16rpx;
}

// ── Preview circle ──

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

.preview-board {
  position: relative;
  flex-shrink: 0;
}

.preview-cell {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  box-sizing: border-box;
}

.preview-cell--empty {
  background: #e8e8e8;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.preview-cell--obstacle {
  background: var(--preview-cell-color);
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.preview-cell--player {
  background: #00C853;
  border: 1px solid rgba(0, 0, 0, 0.08);
}
}

// ── Configuration card ──

.config-card {
  width: calc(100% - 48rpx);
  max-width: 600rpx;
  @include glass-surface(24px);
  @include glass-border;
  @include emerald-shadow(4px, 30px, 0.1);
  border-radius: $radius-default;
  padding: 18rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  z-index: 10;
  margin-top: 48rpx;

  &__glow {
    position: absolute;
    inset: 0;
    border-radius: $radius-default;
    border-top: 1px solid rgba(255, 255, 255, 0.6);
    border-left: 1px solid rgba(255, 255, 255, 0.6);
    pointer-events: none;
  }
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
}

.config-label {
  font-family: $font-headline;
  font-size: $fs-body-md;
  font-weight: 700;
  color: $color-on-surface;

  &--flex {
    flex: 1;
  }
}

.config-input-wrapper {
  width: 15%;
}

.config-input {
  width: 80%;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: none;
  border-bottom: 2px solid $color-outline-variant;
  padding: 12rpx 16rpx;
  border-radius: 8rpx 8rpx 0 0;
  font-family: $font-body;
  font-size: $fs-body-md;
  color: $color-on-surface;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-bottom-color: $color-primary;
  }

  &::placeholder {
    color: rgba($color-on-surface-variant, 0.6);
  }
}

.config-divider {
  height: 1px;
  background: rgba($color-glass-stroke, 0.5);
  margin: 8rpx 0;
}

// ── Toggle switch ──

.toggle {
  width: 84rpx;
  height: 48rpx;
  border-radius: $radius-full;
  background: $color-surface-variant;
  display: flex;
  align-items: center;
  padding: 2px;
  transition: background-color 0.2s;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;

  &--active {
    background: $color-primary-container;
  }
}

.toggle__thumb {
  width: 40rpx;
  height: 40rpx;
  border-radius: $radius-full;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;

  &--active {
    transform: translateX(36rpx);
  }
}

</style>
