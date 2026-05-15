<template>
  <view class="sidebar-wrapper">
    <view
      class="sidebar-backdrop"
      :class="{ 'sidebar-backdrop--visible': visible }"
      @tap="$emit('close')"
    />

    <view
      class="sidebar-drawer"
      :class="{ 'sidebar-drawer--open': visible }"
    >
      <view class="sidebar-content">
        <!-- Create new board -->
        <view class="btn-create" @tap="$emit('create-level')">
          <IconSprite name="add_circle" :size="24" />
          <text class="btn-create__text">创建新棋盘</text>
        </view>

        <!-- Board list -->
        <nav class="nav-list">
          <view
            v-for="(name, idx) in levelNames"
            :key="idx"
            class="nav-item"
            :class="{ 'nav-item--active': idx === activeLevelIndex }"
            @tap="$emit('select-level', idx)"
          >
            <IconSprite :name="idx === activeLevelIndex ? 'grid_on' : 'apps'" :size="20" />
            <text class="nav-item__text">棋盘 - {{ name }}</text>
          </view>
        </nav>
      </view>
    </view>
  </view>
</template>

<script>
import IconSprite from './IconSprite.vue'

export default {
  name: 'SidebarDrawer',
  components: { IconSprite },
  props: {
    visible: { type: Boolean, default: false },
    levelNames: { type: Array, default: () => ['棋盘-1', '棋盘-2'] },
    activeLevelIndex: { type: Number, default: 0 }
  },
  emits: ['close', 'select-level', 'create-level']
}
</script>

<style lang="scss" scoped>
@import '../common/design-tokens';
@import '../common/glass-utilities';

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;

  &--visible {
    opacity: 1;
    pointer-events: auto;
  }
}

.sidebar-drawer {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 70;
  width: 65%;
  background: $color-glass-surface;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-right: 1px solid $color-glass-stroke;
  box-shadow: 4px 0 30px rgba(0, 0, 0, 0.15);
  transform: translateX(-100%);
  transition: transform 0.3s ease;

  &--open {
    transform: translateX(0);
  }
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  padding: 32rpx;
  gap: 32rpx;
  height: 100%;
}

.btn-create {
  height: 144rpx;
  width: 100%;
  background: $color-primary;
  color: $color-on-primary;
  border-radius: $radius-default;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  font-family: $font-headline;
  font-size: $fs-headline-lg-mobile;
  line-height: $lh-headline-lg-mobile;
  font-weight: 700;
  box-shadow: 0 8rpx 24rpx rgba(16, 185, 129, 0.2);
  transition: transform 0.15s;

  &:active {
    transform: scale(0.95);
  }
}

.btn-create__text {
  font-family: $font-headline;
  font-size: $fs-headline-lg-mobile;
  font-weight: 700;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 32rpx;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 32rpx;
  border-radius: $radius-default;
  color: $color-on-surface-variant;
  font-family: $font-body;
  font-size: $fs-body-md;
  transition: background-color 0.2s;

  &--active {
    background: rgba(0, 108, 73, 0.1);
    border-left: 8rpx solid $color-primary;
    border-radius: 0 $radius-default $radius-default 0;
    color: $color-primary;
    font-weight: 700;
  }
}

.nav-item__text {
  font-family: $font-body;
  font-size: $fs-body-md;
}
</style>
