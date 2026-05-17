<template>
  <view class="glass-card">
    <view class="glass-card__glow" />
    <slot />
  </view>
</template>

<script>
export default {
  name: 'GlassCard'
}
</script>

<style lang="scss" scoped>
@import '../common/design-tokens';
@import '../common/glass-utilities';

.glass-card {
  @include glass-surface(24px);
  @include glass-border;
  @include emerald-shadow(4px, 30px, 0.1);
  border-radius: $radius-default;
  position: relative;

  &__glow {
    position: absolute;
    inset: 0;
    border-radius: $radius-default;
    border-top: 1px solid rgba(255, 255, 255, 0.6);
    border-left: 1px solid rgba(255, 255, 255, 0.6);
    pointer-events: none;
  }
}
</style>
