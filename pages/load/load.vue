<template>
  <view class="page-load">
    <BackgroundBlobs />

    <GameAppBar title="导入地图" left-icon="arrow_back" @left-click="goBack" />

    <WarningToast :visible="warningVisible" message="请复制正确完整的地图代码字符串" />

    <view class="load-content">
      <MiniBoardPreview :level-data="parsedLevel" />

      <GlassCard class="load-card">
        <view class="load-row">
          <text class="load-label">地图名称</text>
          <view class="load-input-wrapper">
            <input class="load-input" type="text" v-model="mapName" placeholder="输入地图名称" />
          </view>
        </view>

        <view class="config-divider" />

        <view class="load-row load-row--col">
          <text class="load-label">地图代码</text>
          <textarea class="load-textarea" v-model="mapStr" placeholder="请粘贴 Base64 地图数据..." :maxlength="-1" />
        </view>

        <view class="config-divider" />

        <view class="load-actions">
          <view class="btn-parse" @tap="onParse">
            <IconSprite name="hint" :size="20" />
            <text class="btn-parse__text">解析地图代码</text>
          </view>
          <view class="btn-confirm" :class="{ 'btn-confirm--disabled': !parseSuccess }" @tap="onConfirm">
            <IconSprite name="add_circle" :size="20" />
            <text class="btn-confirm__text">确认导入</text>
          </view>
        </view>
      </GlassCard>
    </view>
  </view>
</template>

<script>
import GameAppBar from '@/components/GameAppBar.vue'
import IconSprite from '@/components/IconSprite.vue'
import BackgroundBlobs from '@/components/BackgroundBlobs.vue'
import GlassCard from '@/components/GlassCard.vue'
import MiniBoardPreview from '@/components/MiniBoardPreview.vue'
import WarningToast from '@/components/WarningToast.vue'
import { importLevelFromBase64 } from '@/game-core/generator.js'
import { MAX_LOCAL_MAPS } from '@/game-core/constants.js'

export default {
  name: 'BoardLoad',
  components: { GameAppBar, IconSprite, BackgroundBlobs, GlassCard, MiniBoardPreview, WarningToast },
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
  beforeDestroy() {
    if (this.warningTimer) clearTimeout(this.warningTimer)
  },
  methods: {
    goBack() { uni.navigateBack() },

    onParse() {
      if (!this.mapStr.trim()) { this.showWarning(); return }
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
        if (stored && Array.isArray(stored)) localMaps = stored
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

.load-card {
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

.load-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;

  &--col { flex-direction: column; align-items: flex-start; gap: 12rpx; }
}

.load-label {
  font-family: $font-headline;
  font-size: $fs-body-md;
  font-weight: 700;
  color: $color-on-surface;
  flex-shrink: 0;
}

.load-input-wrapper { width: 55%; }

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
  &:focus { border-bottom-color: $color-primary; }
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
  &:focus { border-bottom-color: $color-primary; }
  &::placeholder { color: rgba($color-on-surface-variant, 0.5); font-size: $fs-body-sm; }
}

.config-divider {
  height: 1px;
  background: rgba($color-glass-stroke, 0.5);
  margin: 8rpx 0;
}

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
  &:active { transform: scale(0.97); background: darken($color-primary-container, 8%); }

  &__text { font-family: $font-headline; font-size: $fs-body-sm; font-weight: 700; }
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
  &:active { transform: scale(0.97); }

  &--disabled { opacity: 0.4; pointer-events: none; box-shadow: none; }
  &__text { font-family: $font-headline; font-size: $fs-body-sm; font-weight: 700; }
}
</style>
