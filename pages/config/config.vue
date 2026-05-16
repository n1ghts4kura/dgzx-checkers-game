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

    <!-- Board Preview -->
    <view class="preview-section">
      <view class="preview-circle">
        <view class="preview-circle__glow" />
        <view class="preview-circle__hex">
          <IconSprite name="grid_on" :size="48" />
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

    <!-- Generate Button -->
    <view class="generate-section">
      <view class="btn-generate" @tap="onGenerate">
        <view class="btn-generate__shine" />
        <IconSprite name="hint" :size="24" />
        <text class="btn-generate__text">生成地图</text>
      </view>
    </view>
  </view>
</template>

<script>
import GameAppBar from '@/components/GameAppBar.vue'
import IconSprite from '@/components/IconSprite.vue'

export default {
  name: 'BoardConfig',
  components: { GameAppBar, IconSprite },
  data() {
    return {
      stepCount: '20',
      fixedStart: true,
      highQuality: true
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
  align-items: center;
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

// ── Preview circle ──

.preview-section {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 200rpx;
  position: relative;
  z-index: 10;
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

  &__hex {
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    color: $color-primary;
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
  padding: 80rpx;
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
  width: 50%;
}

.config-input {
  width: 100%;
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

// ── Generate button ──

.generate-section {
  width: calc(100% - 48rpx);
  max-width: 500rpx;
  position: relative;
  z-index: 10;
  margin-top: 48rpx;
}

.btn-generate {
  width: 100%;
  background: transparent;
  border: none;
  border-radius: $radius-full;
  padding: 20rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  font-family: $font-headline;
  font-size: $fs-headline-lg-mobile;
  font-weight: 700;
  color: $color-primary;
  box-shadow:
    0 20rpx 50rpx rgba(16, 185, 129, 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  transition: all 0.3s;

  &:active {
    transform: scale(0.98);
  }

  &__shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 100%
    );
    transform: translateX(-100%);
  }

  &__text {
    letter-spacing: 0.05em;
  }
}
</style>
