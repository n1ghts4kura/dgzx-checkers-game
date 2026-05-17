<template>
  <view class="page-create">
    <BackgroundBlobs />

    <GameAppBar title="创建棋盘" left-icon="arrow_back" @left-click="goBack" />

    <view class="create-content">
      <MiniBoardPreview :level-data="generatedLevel" />

      <GlassCard class="create-card">
        <view class="create-row">
          <text class="create-label create-label--flex">棋盘名称</text>
          <view class="create-control">
            <input class="create-input" type="text" v-model="mapName" placeholder="输入棋盘名称" />
          </view>
        </view>

        <view class="create-divider" />

        <view class="create-row">
          <text class="create-label create-label--flex">题解步数</text>
          <view class="create-control">
            <input class="create-input" type="text" :value="stepCount" placeholder="决赛使用的是20步!" @input="onStepInput" />
          </view>
        </view>

        <view class="create-divider" />

        <view class="create-row">
          <text class="create-label create-label--flex">固定起点到底部</text>
          <view class="create-control create-control--toggle">
            <ToggleSwitch v-model="fixedStart" />
          </view>
        </view>

        <view class="create-divider" />

        <view class="create-row">
          <text class="create-label create-label--flex">生成高质量地图</text>
          <view class="create-control create-control--toggle">
            <ToggleSwitch v-model="highQuality" />
          </view>
        </view>
      </GlassCard>

      <view class="create-actions">
        <view class="btn-generate" @tap="onGenerate">
          <text class="btn-generate__text">生成</text>
        </view>
        <view class="btn-save" @tap="onSave">
          <text class="btn-save__text">保存</text>
        </view>
      </view>
    </view>

    <CircleProgressDialog :visible="dialogVisible" :status="dialogStatus" @done="onDialogDone" />
  </view>
</template>

<script>
import GameAppBar from '@/components/GameAppBar.vue'
import CircleProgressDialog from '@/components/CircleProgressDialog.vue'
import BackgroundBlobs from '@/components/BackgroundBlobs.vue'
import GlassCard from '@/components/GlassCard.vue'
import ToggleSwitch from '@/components/ToggleSwitch.vue'
import MiniBoardPreview from '@/components/MiniBoardPreview.vue'
import { createEmptyBoard, createEmptyColorLayer, createAxialMapping } from '@/game-core/board.js'
import { growPathElegant, getRandomTopTrianglePos, buildLevelData, exportLevelToBase64 } from '@/game-core/generator.js'
import { fastSolver } from '@/game-core/solver.js'
import { BOARD_ROWS, PLAYER, MAX_LOCAL_MAPS } from '@/game-core/constants.js'
import { createScheduler } from '@/game-core/scheduler.js'

export default {
  name: 'BoardCreate',
  components: { GameAppBar, CircleProgressDialog, BackgroundBlobs, GlassCard, ToggleSwitch, MiniBoardPreview },
  data() {
    return {
      stepCount: '20',
      fixedStart: true,
      highQuality: true,
      mapName: '',
      dialogVisible: false,
      dialogStatus: 'loading',
      generating: false,
      generatedLevel: null,
      generatedBase64: null
    }
  },

  methods: {
    goBack() { uni.navigateBack() },
    onStepInput(e) {
      this.stepCount = e.detail.value.replace(/[^0-9]/g, '')
    },

    async onGenerate() {
      if (this.generating) return
      this.generating = true
      this.generatedLevel = null
      this.generatedBase64 = null
      this.dialogVisible = true
      this.dialogStatus = 'loading'

      await new Promise(resolve => setTimeout(resolve, 100))

      try {
        const targetDepth = Math.max(3, Math.min(50, parseInt(this.stepCount, 10) || 20))
        const isHighQuality = this.highQuality
        const fixedStart = this.fixedStart
        const timeout = Math.max(12000, targetDepth * 2000)
        const genStartTime = Date.now()
        const scheduler = createScheduler(120)

        while (Date.now() - genStartTime < timeout) {
          if (!this.generating) return
          await scheduler.yieldIfNeeded()

          const board = createEmptyBoard()
          const boardColors = createEmptyColorLayer()
          const { indexToAxial, axialToIndex } = createAxialMapping(board)
          const topPos = getRandomTopTrianglePos(board)
          if (!topPos) continue

          const [origR, origC] = topPos
          board[origR][origC] = PLAYER
          const playerPos = [origR, origC]

          const ok = await growPathElegant(
            board, boardColors, playerPos, indexToAxial, axialToIndex,
            0, targetDepth, Date.now(), topPos, isHighQuality, scheduler
          )
          if (!ok) continue

          if (fixedStart && playerPos[0] < BOARD_ROWS - 4) continue

          await scheduler.yieldIfNeeded()
          const mapping2 = createAxialMapping(board)
          const solveSteps = await fastSolver(board, playerPos, mapping2.indexToAxial, mapping2.axialToIndex, scheduler)
          if (solveSteps > 0 && solveSteps < targetDepth) continue

          const levelData = await buildLevelData(board, boardColors, playerPos, mapping2.indexToAxial, mapping2.axialToIndex)
          this.generatedLevel = levelData
          this.generatedBase64 = exportLevelToBase64(levelData)
          this.dialogStatus = 'success'
          this.generating = false
          return
        }
        this.dialogStatus = 'failure'
      } catch (err) {
        console.error('Generation error:', err)
        this.dialogStatus = 'failure'
      }
      this.generating = false
    },

    onSave() {
      if (!this.generatedBase64) {
        uni.showToast({ title: '请先生成棋盘', icon: 'none' })
        return
      }
      const name = this.mapName.trim() || `自 ${parseInt(this.stepCount, 10) || 20}步`
      const localMaps = uni.getStorageSync('local_maps') || []
      localMaps.push({ map_name: name, map_str: this.generatedBase64 })
      while (localMaps.length > MAX_LOCAL_MAPS) localMaps.shift()
      uni.setStorageSync('local_maps', localMaps)
      uni.setStorageSync('pending_switch_to_last', true)
      uni.navigateBack()
    },

    onDialogDone() {
      this.dialogVisible = false
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

.create-card {
  width: calc(100% - 48rpx);
  max-width: 600rpx;
  padding: 18rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  z-index: 10;
  margin-top: 48rpx;
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

  &--flex { flex: 1; }
}

.create-control {
  width: 45%;
  &--toggle { display: flex; justify-content: flex-end; }
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

  &:focus { border-bottom-color: $color-primary; }
  &::placeholder { color: rgba($color-on-surface-variant, 0.6); }
}

.create-divider {
  height: 1px;
  background: rgba($color-glass-stroke, 0.5);
  margin: 8rpx 0;
}

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
  &:active { transform: scale(0.97); }
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
  &:active { transform: scale(0.97); }
}

.btn-save__text {
  font-family: $font-headline;
  font-size: 20px;
  font-weight: 700;
}
</style>
