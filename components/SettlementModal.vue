<template>
  <view v-if="visible" class="settlement-overlay" @tap="$emit('dismiss')">
    <view class="settlement-card" @tap.stop>
      <text
        class="settlement-title"
        :style="{ color: settlement.won ? '#27ae60' : '#e74c3c' }"
      >{{ settlement.won ? '🎉 恭喜通关！' : '⏰ 时间到！' }}</text>
      <view class="settlement-row">
        <text class="settlement-label">完成度因子</text>
        <text class="settlement-value">{{ settlement.factor1 }}</text>
      </view>
      <view class="settlement-row">
        <text class="settlement-label">积分因子</text>
        <text class="settlement-value">{{ settlement.factor2 }}</text>
      </view>
      <view class="settlement-row settlement-row--final">
        <text class="settlement-label">最终得分</text>
        <text class="settlement-value settlement-value--big">{{ settlement.finalScore }} / 100</text>
      </view>
      <view class="settlement-actions">
        <view class="settlement-btn settlement-btn--primary" @tap="$emit('restart')">
          <text>再来一局</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'SettlementModal',
  props: {
    visible: { type: Boolean, default: false },
    settlement: {
      type: Object,
      default: () => ({ won: false, factor1: 0, factor2: 0, finalScore: 0 })
    }
  },
  emits: ['restart', 'dismiss']
}
</script>

<style lang="scss" scoped>
@import '../common/design-tokens';

.settlement-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.settlement-card {
  background: white;
  border-radius: 32rpx;
  padding: 48rpx;
  min-width: 420rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
}

.settlement-title {
  font-family: $font-headline;
  font-size: $fs-headline-lg-mobile;
  font-weight: 800;
  color: $color-primary;
  display: block;
  text-align: center;
  margin-bottom: 32rpx;
}

.settlement-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;

  &--final {
    border-top: 1px solid $color-outline-variant;
    margin-top: 12rpx;
    padding-top: 24rpx;
  }
}

.settlement-label {
  font-family: $font-body;
  font-size: $fs-body-md;
  color: $color-on-surface-variant;
}

.settlement-value {
  font-family: $font-headline;
  font-size: $fs-body-md;
  font-weight: 700;
  color: $color-on-surface;

  &--big {
    font-size: $fs-headline-lg-mobile;
    color: $color-primary;
  }
}

.settlement-actions {
  display: flex;
  justify-content: center;
  margin-top: 32rpx;
}

.settlement-btn {
  padding: 20rpx 48rpx;
  border-radius: 16rpx;
  font-family: $font-headline;
  font-size: $fs-body-md;
  font-weight: 700;
  text-align: center;

  &--primary {
    background: $color-primary;
    color: $color-on-primary;
    box-shadow: 0 4rpx 16rpx rgba(0, 108, 73, 0.3);
  }
}
</style>
