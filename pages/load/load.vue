<template>
  <view class="page-load">
    <!-- Background blobs -->
    <view class="bg-blobs">
      <view class="bg-blob bg-blob--top-left" />
      <view class="bg-blob bg-blob--bottom-right" />
    </view>

    <!-- TopAppBar -->
    <GameAppBar
      title="导入地图"
      left-icon="arrow_back"
      @left-click="goBack"
    />

    <!-- Warning toast -->
    <view class="warning-toast" :class="{ 'warning-toast--visible': warningVisible }">
      <text class="warning-toast__text">请复制正确完整的地图代码字符串</text>
    </view>

    <!-- Content area -->
    <view class="load-content">
      <!-- Map Preview -->
      <view class="preview-section">
        <view class="preview-circle">
          <view class="preview-circle__glow" />
          <view v-if="parsedLevel" class="preview-board">
            <view
              v-for="cell in previewCells"
              :key="`${cell.r}-${cell.c}`"
              class="preview-cell"
              :class="cell.classes"
              :style="cell.style"
            />
          </view>
          <view v-else class="preview-circle__placeholder">
            <IconSprite name="apps" :size="48" />
          </view>
        </view>
      </view>

      <!-- Import Card -->
      <view class="load-card">
        <view class="load-card__glow" />

        <!-- Map name input -->
        <view class="load-row">
          <text class="load-label">地图名称</text>
          <view class="load-input-wrapper">
            <input
              class="load-input"
              type="text"
              v-model="mapName"
              placeholder="输入地图名称"
            />
          </view>
        </view>

        <view class="config-divider" />

        <!-- Map string input -->
        <view class="load-row load-row--col">
          <text class="load-label">地图代码</text>
          <textarea
            class="load-textarea"
            v-model="mapStr"
            placeholder="请粘贴 Base64 地图数据..."
            :maxlength="-1"
          />
        </view>

        <view class="config-divider" />

        <!-- Action buttons -->
        <view class="load-actions">
          <view class="btn-parse" @tap="onParse">
            <IconSprite name="hint" :size="20" />
            <text class="btn-parse__text">解析地图代码</text>
          </view>
          <view
            class="btn-confirm"
            :class="{ 'btn-confirm--disabled': !parseSuccess }"
            @tap="onConfirm"
          >
            <IconSprite name="add_circle" :size="20" />
            <text class="btn-confirm__text">确认导入</text>
          </view>
        </view>
      </view>
    </view>

  </view>
</template>

<script>
import GameAppBar from '@/components/GameAppBar.vue'
import IconSprite from '@/components/IconSprite.vue'
import { importLevelFromBase64 } from '@/game-core/generator.js'
import { ROWS_LAYOUT, BOARD_ROWS, BOARD_COLS, OBSTACLE, PLAYER, MAX_LOCAL_MAPS } from '@/game-core/constants.js'

export default {
  name: 'BoardLoad',
  components: { GameAppBar, IconSprite },
  data() {
    return {
      mapName: '',
      mapStr: '',
      parsedLevel: null,
      parseSuccess: false,
      warningVisible: false,
      warningTimer: null
    }
  },
  computed: {
    previewCells() {
      if (!this.parsedLevel) return []
      const cells = []
      const cellSize = 16
      const obstacleSet = new Set(
        (this.parsedLevel.obstacles || []).map(([r, c]) => `${r},${c}`)
      )
      const [pr, pc] = this.parsedLevel.player || [0, 0]

      for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          if (ROWS_LAYOUT[r] === undefined) continue
          const offset = Math.floor((BOARD_COLS - ROWS_LAYOUT[r]) / 2)
          if (c < offset || c >= offset + ROWS_LAYOUT[r]) continue

          const x = (c - 8) * cellSize + (r % 2) * cellSize / 2
          const y = (r - 8) * cellSize * 0.86

          const isObstacle = obstacleSet.has(`${r},${c}`)
          const isPlayer = r === pr && c === pc
          const color = isObstacle
            ? (this.parsedLevel.obstacles.find(([or, oc]) => or === r && oc === c) || [])[2] || '#A020F0'
            : null

          cells.push({
            r, c,
            style: {
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              width: cellSize + 'px',
              height: cellSize + 'px',
              '--preview-cell-color': color
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
    }
  },
  beforeDestroy() {
    if (this.warningTimer) clearTimeout(this.warningTimer)
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },

    onParse() {
      if (!this.mapStr.trim()) {
        this.showWarning()
        return
      }

      try {
        const levelData = importLevelFromBase64(this.mapStr.trim())
        if (levelData && levelData.obstacles && levelData.player) {
          this.parsedLevel = levelData
          this.parseSuccess = true
        } else {
          this.showWarning()
        }
      } catch (e) {
        console.error('Parse error:', e)
        this.showWarning()
      }
    },

    showWarning() {
      this.parseSuccess = false
      this.parsedLevel = null
      this.warningVisible = true
      if (this.warningTimer) clearTimeout(this.warningTimer)
      this.warningTimer = setTimeout(() => {
        this.warningVisible = false
        this.warningTimer = null
      }, 2500)
    },

    onConfirm() {
      if (!this.parseSuccess || !this.mapName.trim()) return

      const name = this.mapName.trim()
      let localMaps = []
      try {
        const stored = uni.getStorageSync('local_maps')
        if (stored && Array.isArray(stored)) {
          localMaps = stored
        }
      } catch (e) { /* ignore */ }

      localMaps.push({ map_name: name, map_str: this.mapStr.trim() })
      while (localMaps.length > MAX_LOCAL_MAPS) localMaps.shift()
      uni.setStorageSync('local_maps', localMaps)
      uni.setStorageSync('pending_switch_to_last', true)
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../common/design-tokens';
@import '../../common/glass-utilities';

.page-load {
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

.load-content {
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

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.3;
    color: $color-on-surface-variant;
  }
}

// ── Mini preview board ──

.preview-board {
  position: relative;
  width: 100%;
  height: 100%;
  transform: scale(0.8);
}

.preview-cell {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 50%;

  &--empty {
    background: #e8e8e8;
  }

  &--obstacle {
    background: var(--preview-cell-color);
  }

  &--player {
    background: #00C853;
    box-shadow: 0 0 0 2px white;
  }
}

// ── Import card ──

.load-card {
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

.load-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;

  &--col {
    flex-direction: column;
    align-items: flex-start;
    gap: 12rpx;
  }
}

.load-label {
  font-family: $font-headline;
  font-size: $fs-body-md;
  font-weight: 700;
  color: $color-on-surface;
  flex-shrink: 0;
}

.load-input-wrapper {
  width: 55%;
}

.load-input {
  width: 92%;
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
}

.load-textarea {
  width: 92%;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: none;
  border-bottom: 2px solid $color-outline-variant;
  padding: 12rpx 16rpx;
  border-radius: 8rpx 8rpx 0 0;
  font-family: $font-body;
  font-size: 12px;
  color: $color-on-surface;
  outline: none;
  resize: none;
  transition: border-color 0.2s;

  &:focus {
    border-bottom-color: $color-primary;
  }

  &::placeholder {
    color: rgba($color-on-surface-variant, 0.5);
    font-size: $fs-body-sm;
  }
}

.config-divider {
  height: 1px;
  background: rgba($color-glass-stroke, 0.5);
  margin: 8rpx 0;
}

// ── Action buttons ──

.load-actions {
  display: flex;
  gap: 16rpx;
  padding: 16rpx 0 8rpx;
}

.btn-parse {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 20rpx 0;
  border-radius: $radius-full;
  background: $color-primary-container;
  color: $color-on-primary-container;
  font-family: $font-headline;
  font-size: $fs-body-sm;
  font-weight: 700;
  transition: all 0.2s;

  &:active {
    transform: scale(0.97);
    background: darken($color-primary-container, 8%);
  }

  &__text {
    font-family: $font-headline;
    font-size: $fs-body-sm;
    font-weight: 700;
  }
}

.btn-confirm {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 20rpx 0;
  border-radius: $radius-full;
  background: $color-primary;
  color: $color-on-primary;
  font-family: $font-headline;
  font-size: $fs-body-sm;
  font-weight: 700;
  box-shadow: 0 4rpx 16rpx rgba(0, 108, 73, 0.3);
  transition: all 0.2s;

  &:active {
    transform: scale(0.97);
  }

  &--disabled {
    opacity: 0.4;
    pointer-events: none;
    box-shadow: none;
  }

  &__text {
    font-family: $font-headline;
    font-size: $fs-body-sm;
    font-weight: 700;
  }
}

// ── Warning toast ──

.warning-toast {
  margin: 16rpx 24rpx 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid $color-error;
  border-radius: 20rpx;
  padding: 20rpx 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(186, 26, 26, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 400ms cubic-bezier(0.09, 0.57, 0.30, 1.02),
              opacity 300ms ease,
              margin 300ms ease;
  pointer-events: none;
}

.warning-toast--visible {
  max-height: 80rpx;
  opacity: 1;
}

.warning-toast__text {
  font-family: $font-body;
  font-size: $fs-body-md;
  color: $color-error;
  font-weight: 700;
}
</style>
