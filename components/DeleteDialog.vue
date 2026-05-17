<template>
  <view
    class="dialog-overlay"
    :class="{ 'dialog-overlay--visible': visible }"
    @tap="$emit('close')"
  >
    <view class="delete-card" @tap.stop>
      <text class="delete-title">确认删除？</text>
      <text class="delete-subtitle">将永久删除「{{ mapName }}」，不可恢复。</text>
      <view class="delete-actions">
        <view class="delete-btn delete-btn--yes" @tap="$emit('confirm')">
          <text>删除</text>
        </view>
        <view class="delete-btn delete-btn--no" @tap="$emit('close')">
          <text>取消</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'DeleteDialog',
  props: {
    visible: { type: Boolean, default: false },
    mapName: { type: String, default: '' }
  },
  emits: ['confirm', 'close']
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

.delete-card {
  background: white;
  border-radius: 32rpx;
  padding: 48rpx;
  width: 500rpx;
  max-width: 85vw;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
  text-align: center;
}

.delete-title {
  font-family: $font-headline;
  font-size: $fs-headline-lg-mobile;
  font-weight: 800;
  color: $color-error;
  display: block;
  margin-bottom: 16rpx;
}

.delete-subtitle {
  font-family: $font-body;
  font-size: $fs-body-sm;
  color: $color-on-surface-variant;
  display: block;
  margin-bottom: 32rpx;
  line-height: 1.5;
}

.delete-actions {
  display: flex;
  gap: 16rpx;
  justify-content: center;
}

.delete-btn {
  padding: 20rpx 48rpx;
  border-radius: 16rpx;
  font-family: $font-headline;
  font-size: $fs-body-md;
  font-weight: 700;
  text-align: center;

  &--yes {
    background: $color-error;
    color: $color-on-error;
    box-shadow: 0 4rpx 16rpx rgba(186, 26, 26, 0.3);
  }

  &--no {
    background: $color-surface-container-high;
    color: $color-on-surface-variant;
  }
}
</style>
