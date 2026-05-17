<template>
  <view class="page-create">
    <!-- Background blobs -->
    <view class="bg-blobs">
      <view class="bg-blob bg-blob--top-left" />
      <view class="bg-blob bg-blob--bottom-right" />
    </view>

    <!-- TopAppBar -->
    <GameAppBar
      title="创建棋盘"
      left-icon="arrow_back"
      @left-click="goBack"
    />

    <!-- Content area -->
    <view class="create-content">
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
      <view class="create-card">
        <view class="create-card__glow" />

        <!-- Row 1: Board Name -->
        <view class="create-row">
          <text class="create-label create-label--flex">棋盘名称</text>
          <view class="create-control">
            <input
              class="create-input"
              type="text"
              v-model="mapName"
              placeholder="名称不要重复哦"
            />
          </view>
        </view>

        <view class="create-divider" />

        <!-- Row 2: Solution Steps -->
        <view class="create-row">
          <text class="create-label create-label--flex">题解步数</text>
          <view class="create-control">
            <input
              class="create-input"
              type="text"
              :value="stepCount"
              placeholder="[1,50) 比赛是20步!"
              @input="onStepInput"
            />
          </view>
        </view>

        <view class="create-divider" />

        <!-- Row 3: Fixed Starting Point -->
        <view class="create-row">
          <text class="create-label create-label--flex">固定起点到底部</text>
          <view class="create-control create-control--toggle" @tap="toggleFixedStart">
            <view class="toggle" :class="{ 'toggle--active': fixedStart }">
              <view class="toggle__thumb" :class="{ 'toggle__thumb--active': fixedStart }" />
            </view>
          </view>
        </view>

        <view class="create-divider" />

        <!-- Row 4: High Quality Map -->
        <view class="create-row">
          <text class="create-label create-label--flex">生成高质量地图</text>
          <view class="create-control create-control--toggle" @tap="toggleHighQuality">
            <view class="toggle" :class="{ 'toggle--active': highQuality }">
              <view class="toggle__thumb" :class="{ 'toggle__thumb--active': highQuality }" />
            </view>
          </view>
        </view>
      </view>

      <!-- Action Buttons -->
      <view class="create-actions">
        <view class="btn-generate" @tap="onGenerate">
          <text class="btn-generate__text">生成</text>
        </view>
        <view class="btn-save" @tap="onSave">
          <text class="btn-save__text">保存</text>
        </view>
      </view>
    </view>

    <CircleProgressDialog
      :visible="dialogVisible"
      :status="dialogStatus"
      @done="onDialogDone"
    />
  </view>
</template>

<script>
import GameAppBar from '@/components/GameAppBar.vue'
import CircleProgressDialog from '@/components/CircleProgressDialog.vue'
import { createEmptyBoard, createEmptyColorLayer, createAxialMapping } from '@/game-core/board.js'
import { growPathElegant, growPathElegantAsync, getRandomTopTrianglePos, buildLevelData, exportLevelToBase64 } from '@/game-core/generator.js'
import { fastSolverAsync } from '@/game-core/solver.js'
import { ROWS_LAYOUT, BOARD_ROWS, BOARD_COLS, PLAYER, MAX_LOCAL_MAPS } from '@/game-core/constants.js'
import { createScheduler } from '@/game-core/scheduler.js'


export default {
  name: 'BoardCreate',
  components: { GameAppBar, CircleProgressDialog },
  data() {
    return {
      stepCount: '',
      fixedStart: true,
      highQuality: true,
      mapName: '',
      miniCellSize: 16,
      dialogVisible: false,
      dialogStatus: 'loading',
      generating: false,
      generatedLevel: null,
      generatedBase64: null,
      failReason: '',
      attemptCount: 0
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
      const level = this.generatedLevel
      const cells = []

      const obstacleMap = new Map()
      let playerR = -1, playerC = -1
      if (level) {
        ;(level.obstacles || []).forEach(([r, c, color]) => {
          obstacleMap.set(`${r},${c}`, color)
        })
        if (level.player) {
          playerR = level.player[0]
          playerC = level.player[1]
        }
      }

      for (let r = 0; r < BOARD_ROWS; r++) {
        const count = ROWS_LAYOUT[r]
        const offset = Math.floor((BOARD_COLS - count) / 2)
        for (let c = 0; c < BOARD_COLS; c++) {
          if (c < offset || c >= offset + count) continue

          const cx = c * S + (r % 2) * S / 2 - b.minX + S / 2
          const cy = r * S * 0.86 - b.minY + S / 2
          const key = `${r},${c}`
          const isObstacle = obstacleMap.has(key)
          const isPlayer = r === playerR && c === playerC

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
              'preview-cell--empty': !level || (!isObstacle && !isPlayer),
              'preview-cell--obstacle': isObstacle,
              'preview-cell--player': isPlayer
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
        transform: `scale(${scale * 0.8})`,
        transformOrigin: 'center center'
      }
    }
  },

  methods: {
    goBack() {
      uni.navigateBack()
    },
    onStepInput(e) {
      const v = e.detail.value.replace(/[^0-9]/g, '')
      this.stepCount = v
    },
    toggleFixedStart() {
      this.fixedStart = !this.fixedStart
    },
    toggleHighQuality() {
      this.highQuality = !this.highQuality
    },
    async onGenerate() {
      if (this.generating) return
      this.generating = true
      this.generatedLevel = null
      this.generatedBase64 = null
      this.failReason = ''
      this.attemptCount = 0
      this.dialogVisible = true
      this.dialogStatus = 'loading'

      await new Promise(resolve => setTimeout(resolve, 100))

      try {
        const rawDepth = parseInt(this.stepCount, 10) || 20
        const targetDepth = Math.min(50, rawDepth)
        const isHighQuality = this.highQuality
        const fixedStart = this.fixedStart
        const timeout = Math.max(12000, targetDepth * 2000)
        const genStartTime = Date.now()
        const scheduler = createScheduler(120)
        let attempt = 0

        while (Date.now() - genStartTime < timeout) {
          if (!this.generating) return

          attempt++
          await scheduler.yieldIfNeeded()

          const board = createEmptyBoard()
          const boardColors = createEmptyColorLayer()
          const { indexToAxial, axialToIndex } = createAxialMapping(board)

          const topPos = getRandomTopTrianglePos(board)
          if (!topPos) continue

          const [origR, origC] = topPos
          board[origR][origC] = PLAYER
          const playerPos = [origR, origC]

          const ok = await growPathElegantAsync(
            board, boardColors, playerPos,
            indexToAxial, axialToIndex,
            0, targetDepth, Date.now(),
            topPos, isHighQuality,
            scheduler
          )
          if (!ok) continue

          if (fixedStart && playerPos[0] < BOARD_ROWS - 4) continue

          await scheduler.yieldIfNeeded()
          const mapping2 = createAxialMapping(board)
          const solveSteps = await fastSolverAsync(board, playerPos, mapping2.indexToAxial, mapping2.axialToIndex, scheduler)
          if (solveSteps > 0 && solveSteps < targetDepth) continue

          const levelData = buildLevelData(board, boardColors, playerPos, mapping2.indexToAxial, mapping2.axialToIndex)
          const base64Str = exportLevelToBase64(levelData)

          this.generatedLevel = levelData
          this.generatedBase64 = base64Str
          this.dialogStatus = 'success'
          this.generating = false
          return
        }

        this.attemptCount = attempt
        this.failReason = 'timeout'
        this.dialogStatus = 'failure'
      } catch (err) {
        console.error('Generation error:', err)
        this.failReason = err && err.message ? err.message : String(err || 'unknown')
        this.dialogStatus = 'failure'
      }
      this.generating = false
    },

    onSave() {
      if (!this.generatedBase64) {
        uni.showToast({ title: '请先生成棋盘', icon: 'none' })
        return
      }
      const name = this.mapName.trim() || `${this.generatedLevel.solutionPath.length - 1}步棋盘`

      const localMaps = uni.getStorageSync('local_maps') || []
      localMaps.push({ map_name: name, map_str: this.generatedBase64 })
      while (localMaps.length > MAX_LOCAL_MAPS) localMaps.shift()
      uni.setStorageSync('local_maps', localMaps)
      uni.setStorageSync('pending_switch_to_last', true)
      uni.navigateBack()
    },

    onDialogDone() {
      this.dialogVisible = false
      if (this.failReason === 'timeout') {
        const tips = []
        if (parseInt(this.stepCount, 10) > 20) tips.push('降低题解步数')
        if (this.highQuality) tips.push('关闭"高质量地图"')
        const advice = tips.length > 0 ? `建议：${tips.join('，')}` : ''
        uni.showToast({
          title: advice || '生成超时，请重试',
          icon: 'none',
          duration: 3000
        })
      } else if (this.failReason) {
        uni.showToast({
          title: `错误：${this.failReason}`,
          icon: 'none',
          duration: 4000
        })
      }
    }
  },

  beforeDestroy() {
    this.generating = false
  }
}
</script>

<style lang="scss" scoped>
@import '../../common/design-tokens';
@import '../../common/glass-utilities';

.page-create {
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

.create-content {
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

.create-card {
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

.create-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 54rpx;
  margin: 20rpx 0;
}

.create-label {
  font-family: $font-headline;
  font-size: $fs-body-md;
  font-weight: 700;
  color: $color-on-surface;

  &--flex {
    flex: 1;
  }
}

.create-control {
  width: 45%;

  &--toggle {
    display: flex;
    justify-content: flex-end;
  }
}

.create-input {
  width: 100%;
  box-sizing: border-box;
  height: 64rpx;
  line-height: 40rpx;
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

.create-divider {
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

// ── Action buttons ──

.create-actions {
  width: calc(100% - 48rpx);
  max-width: 600rpx;
  display: flex;
  gap: 24rpx;
  margin-top: 48rpx;
  position: relative;
  z-index: 10;
}

.btn-generate {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx 0;
  border-radius: $radius-default;
  background: $color-primary;
  color: $color-on-primary;
  font-family: $font-headline;
  font-size: 20px;
  font-weight: 700;
  box-shadow: 0 8rpx 24rpx rgba(0, 108, 73, 0.3);
  transition: transform 0.15s;

  &:active {
    transform: scale(0.97);
  }
}

.btn-generate__text {
  font-family: $font-headline;
  font-size: 20px;
  font-weight: 700;
}

.btn-save {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx 0;
  border-radius: $radius-default;
  background: $color-primary-container;
  color: $color-on-primary-container;
  font-family: $font-headline;
  font-size: 20px;
  font-weight: 700;
  transition: transform 0.15s;

  &:active {
    transform: scale(0.97);
  }
}

.btn-save__text {
  font-family: $font-headline;
  font-size: 20px;
  font-weight: 700;
}
</style>
