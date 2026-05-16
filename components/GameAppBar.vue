<template>
  <header class="app-bar">
    <view class="app-bar__btn" @click="$emit('left-click')">
      <slot name="left-icon">
        <IconSprite :name="leftIcon" :size="24" />
      </slot>
    </view>
    <h1 class="app-bar__title">{{ title }}</h1>
    <view class="app-bar__btn" @click="$emit('right-click')">
      <slot name="right-icon">
        <IconSprite v-if="rightIcon" :name="rightIcon" :size="24" />
      </slot>
    </view>
  </header>
</template>

<script>
import IconSprite from './IconSprite.vue'

export default {
  name: 'GameAppBar',
  components: { IconSprite },
  props: {
    title: { type: String, default: '' },
    leftIcon: { type: String, default: 'menu_open' },
    rightIcon: { type: String, default: 'settings' }
  },
  emits: ['left-click', 'right-click']
}
</script>

<style lang="scss" scoped>
@import '../common/design-tokens';
@import '../common/glass-utilities';

.app-bar {
  @include fixed-top;
  margin-top: 150rpx;
  margin-left: 4rpx;
  margin-right: 4rpx;
  @include glass-surface(16px);
  @include glass-border;
  border-bottom: none;
  border-radius: 0 0 32rpx 32rpx;
  @include emerald-shadow(4px, 30px, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 $sp-gutter;
  height: 73px;
}

.app-bar__btn {
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-full;
  color: $color-on-surface-variant;
  transition: background-color 0.2s;

  &:active {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.app-bar__title {
  @include text-headline-lg-mobile;
  color: $color-primary;
  font-weight: 800;
  letter-spacing: -0.01em;
}
</style>
