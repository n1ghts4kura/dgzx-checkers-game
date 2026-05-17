<template>
  <view
    class="dialog-overlay"
    :class="{ 'dialog-overlay--visible': visible }"
    @tap="$emit('close')"
  >
    <view class="share-card" @tap.stop>
      <text class="share-title">{{ mapName }}</text>
      <view class="share-code-wrapper">
        <text class="share-code" selectable>{{ mapStr }}</text>
      </view>
      <view class="share-actions">
        <view class="share-btn share-btn--copy" @tap="onCopy">
          <text>{{ copied ? '已复制' : '复制代码' }}</text>
        </view>
        <view class="share-btn share-btn--cancel" @tap="$emit('close')">
          <text>关闭</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ShareDialog',
  props: {
    visible: { type: Boolean, default: false },
    mapName: { type: String, default: '' },
    mapStr: { type: String, default: '' }
  },
  emits: ['close'],
  data() {
    return { copied: false }
  },
  watch: {
    visible(v) {
      if (!v) this.copied = false
    }
  },
  methods: {
    onCopy() {
      uni.setClipboardData({
        data: this.mapStr,
        success: () => {
          this.copied = true
          setTimeout(() => { this.copied = false }, 2000)
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../common/design-tokens';

.dialog-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease;

  &--visible {
    opacity: 1;
    pointer-events: auto;
  }
}

.share-card {
  background: white;
  border-radius: 32rpx;
  padding: 48rpx;
  width: 560rpx;
  max-width: 90vw;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
}

.share-title {
  font-family: $font-headline;
  font-size: $fs-headline-lg-mobile;
  font-weight: 800;
  color: $color-primary;
  display: block;
  text-align: center;
  margin-bottom: 24rpx;
}

.share-code-wrapper {
  background: $color-surface-container-low;
  border-radius: 16rpx;
  padding: 24rpx;
  max-height: 240rpx;
  overflow-y: auto;
  margin-bottom: 24rpx;
}

.share-code {
  font-family: monospace;
  font-size: 12px;
  color: $color-on-surface-variant;
  word-break: break-all;
  line-height: 1.6;
  user-select: text;
  -webkit-user-select: text;
}

.share-actions {
  display: flex;
  gap: 16rpx;
  justify-content: center;
}

.share-btn {
  padding: 20rpx 48rpx;
  border-radius: 16rpx;
  font-family: $font-headline;
  font-size: $fs-body-md;
  font-weight: 700;
  text-align: center;

  &--copy {
    background: $color-primary;
    color: $color-on-primary;
    box-shadow: 0 4rpx 16rpx rgba(0, 108, 73, 0.3);
  }

  &--cancel {
    background: $color-surface-container-high;
    color: $color-on-surface-variant;
  }
}
</style>
