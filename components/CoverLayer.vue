<template>
  <view
    :class="{ 'cover-layer--hidden': !visible }"
    class="cover-layer"
    @tap="$emit('start')"
  >
    <view class="cover-layer__inner">
      <text class="cover-layer__icon">▶</text>
      <text class="cover-layer__text">点击开始</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CoverLayer',
  props: {
    visible: { type: Boolean, default: true }
  },
  emits: ['start']
}
</script>

<style lang="scss" scoped>
@import '../common/design-tokens';
@import '../common/glass-utilities';

.cover-layer {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  @include glass-surface(24px);
  @include glass-border;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  border-radius: 24rpx;
  padding: 48rpx 64rpx;
  transition: opacity 250ms ease;

  &--hidden {
    opacity: 0;
    pointer-events: none;
  }
}

.cover-layer__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.cover-layer__icon {
  font-size: 64rpx;
  color: $color-primary;
}

.cover-layer__text {
  font-family: $font-headline;
  font-size: $fs-headline-lg-mobile;
  font-weight: 700;
  color: $color-on-surface;
}
</style>
