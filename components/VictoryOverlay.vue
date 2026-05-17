<template>
  <view v-if="visible" class="victory-overlay">
    <text class="victory-overlay__text">🎉 胜利！棋子已到达顶部！</text>
  </view>
</template>

<script>
export default {
  name: 'VictoryOverlay',
  props: {
    visible: { type: Boolean, default: false }
  }
}
</script>

<style lang="scss" scoped>
@import '../common/design-tokens';

.victory-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(46, 204, 113, 0.92);
  padding: 32rpx 48rpx;
  border-radius: 20rpx;
  z-index: 30;
  box-shadow: 0 10rpx 50rpx rgba(0, 0, 0, 0.2);
  animation: victory-pulse 2s infinite;
}

.victory-overlay__text {
  font-family: $font-headline;
  font-size: $fs-headline-lg-mobile;
  font-weight: 800;
  color: white;
  text-align: center;
}

@keyframes victory-pulse {
  0% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.05); }
  100% { transform: translate(-50%, -50%) scale(1); }
}
</style>
