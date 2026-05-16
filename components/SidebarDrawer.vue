<template>
  <view class="sidebar-wrapper">
    <view
      class="sidebar-backdrop"
      :class="{ 'sidebar-backdrop--visible': visible }"
      @tap="closeAll"
    />

    <view
      class="sidebar-drawer"
      :class="{ 'sidebar-drawer--open': visible }"
    >
      <view class="sidebar-content">
        <!-- Import map -->
        <view class="btn-import" @tap="$emit('import-level')">
          <IconSprite name="hint" :size="24" />
          <text class="btn-import__text">导入地图</text>
        </view>

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

            <!-- Three-dots button + popup menu -->
            <view class="nav-item__more-wrapper">
              <view
                class="nav-item__more-btn"
                :class="{ 'nav-item__more-btn--active': menuVisibleIndex === idx }"
                @tap.stop="toggleMenu(idx)"
              >
                <IconSprite name="more_vert" :size="18" />
              </view>

              <view
                v-if="menuVisibleIndex === idx"
                class="nav-item__popup"
              >
                <view class="popup-item" @tap.stop="onShare(idx)">
                  <text class="popup-item__text">分享</text>
                </view>
                <view class="popup-item popup-item--danger" @tap.stop="onDelete(idx)">
                  <text class="popup-item__text">删除</text>
                </view>
              </view>
            </view>
          </view>
        </nav>

        <view class="sidebar-spacer" />

        <!-- About us -->
        <view class="sidebar-about" @tap="goAbout">
          <text class="sidebar-about__text">关于我们...</text>
        </view>
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
  emits: ['close', 'select-level', 'create-level', 'share-level', 'delete-level', 'import-level'],
  data() {
    return {
      menuVisibleIndex: null
    }
  },
  watch: {
    visible(val) {
      if (!val) this.menuVisibleIndex = null
    }
  },
  methods: {
    toggleMenu(idx) {
      this.menuVisibleIndex = this.menuVisibleIndex === idx ? null : idx
    },
    closeAll() {
      this.menuVisibleIndex = null
      this.$emit('close')
    },
    onShare(idx) {
      this.menuVisibleIndex = null
      this.$emit('share-level', idx)
    },
    onDelete(idx) {
      this.menuVisibleIndex = null
      this.$emit('delete-level', idx)
    },
    goAbout() {
      this.menuVisibleIndex = null
      uni.navigateTo({ url: '/pages/info/info' })
    }
  }
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

.btn-import {
  margin-top: 64rpx;
  height: 144rpx;
  width: 100%;
  background: $color-primary;
  color: $color-on-primary;
  border-radius: $radius-default;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  font-family: $font-headline;
  font-size: 20px;
  font-weight: 700;
  box-shadow: 0 8rpx 24rpx rgba(16, 185, 129, 0.2);
  transition: transform 0.15s;

  &:active {
    transform: scale(0.95);
  }
}

.btn-import__text {
  font-family: $font-headline;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
}

.btn-create {
  margin-top: 14rpx;
  height: 144rpx;
  width: 100%;
  background: $color-primary;
  color: $color-on-primary;
  border-radius: $radius-default;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  font-family: $font-headline;
  font-size: 20px;
  font-weight: 700;
  box-shadow: 0 8rpx 24rpx rgba(16, 185, 129, 0.2);
  transition: transform 0.15s;

  &:active {
    transform: scale(0.95);
  }
}

.btn-create__text {
  font-family: $font-headline;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
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
  position: relative;

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
  line-height: 1;
}

// ── More button wrapper (anchor for popup) ──

.nav-item__more-wrapper {
  margin-left: auto;
  margin-right: 16rpx;
  position: relative;
  display: flex;
  align-items: center;
}

.nav-item__more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  border-radius: $radius-full;
  opacity: 0.5;
  transition: opacity 0.2s, background-color 0.2s;

  &:active {
    opacity: 1;
  }

  &--active {
    opacity: 1;
    background: rgba(0, 108, 73, 0.1);
  }
}

// ── Popup menu ──

.nav-item__popup {
  position: absolute;
  left: calc(100% + 12rpx);
  top: 50%;
  transform: translateY(-50%);
  z-index: 80;
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.18);
  padding: 8rpx;
  min-width: 140rpx;
  display: flex;
  flex-direction: column;
  animation: popup-fade-in 180ms ease-out;
}

@keyframes popup-fade-in {
  0% {
    opacity: 0;
    transform: translateY(-50%) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}

.popup-item {
  padding: 18rpx 28rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  transition: background-color 0.15s;

  &:active {
    background: $color-surface-container;
  }

  &--danger {
    &:active {
      background: $color-error-container;
    }
  }
}

.popup-item__text {
  font-family: $font-body;
  font-size: $fs-body-sm;
  color: $color-on-surface;

  .popup-item--danger & {
    color: $color-error;
  }
}

// ── Spacer ──

.sidebar-spacer {
  flex: 1;
}

// ── About us ──

.sidebar-about {
  margin-bottom: 100rpx;
  padding: 24rpx 32rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: transparent;
}

.sidebar-about__text {
  font-family: $font-body;
  font-size: $fs-body-sm;
  color: $color-on-surface-variant;
  opacity: 0.55;
}
</style>
