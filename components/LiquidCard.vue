<template>
  <view class="liquid-card">
    <slot />
  </view>
</template>

<script>
export default {
  name: 'LiquidCard'
}
</script>

<style lang="scss" scoped>
@import '../common/design-tokens';
@import '../common/glass-utilities';

.liquid-card {
  @include glass-surface(16px);
  @include glass-border;
  @include inner-glow;
  @include emerald-shadow(8px, 40px, 0.1);
  border-radius: $radius-default;
  padding: 120rpx;
}
</style>
