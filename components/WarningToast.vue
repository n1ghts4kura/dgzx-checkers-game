<template>
  <view class="warning-toast" :class="{ 'warning-toast--visible': visible }">
    <text class="warning-toast__text">{{ message }}</text>
  </view>
</template>

<script>
export default {
  name: 'WarningToast',
  props: {
    visible: { type: Boolean, default: false },
    message: { type: String, default: '快落子！要扣分啦！' }
  }
}
</script>

<style lang="scss" scoped>
@import '../common/design-tokens';

.warning-toast {
  position: absolute;
  top: 16rpx;
  right: 8rpx;
  z-index: 35;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid $color-error;
  border-radius: 16rpx;
  padding: 14rpx 28rpx;
  box-shadow: 0 4rpx 24rpx rgba(186, 26, 26, 0.15);
  transform: translateX(110%);
  transition: transform 400ms cubic-bezier(0.09, 0.57, 0.30, 1.02);
  pointer-events: none;

  &--visible {
    transform: translateX(0);
  }
}

.warning-toast__text {
  font-family: $font-body;
  font-size: $fs-body-sm;
  color: $color-error;
  font-weight: 700;
  white-space: nowrap;
}
</style>
