<template>
  <view class="toggle" :class="{ 'toggle--active': value }" @tap="onToggle">
    <view class="toggle__thumb" :class="{ 'toggle__thumb--active': value }" />
  </view>
</template>

<script>
export default {
  name: 'ToggleSwitch',
  props: {
    value: { type: Boolean, default: false }
  },
  emits: ['update:value'],
  methods: {
    onToggle() {
      this.$emit('update:value', !this.value)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../common/design-tokens';

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
</style>
