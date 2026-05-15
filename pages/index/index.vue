<template>
  <view class="page-game">
    <!-- 液态背景光斑 -->
    <view class="bg-blobs">
      <view class="bg-blob bg-blob--top-left" />
      <view class="bg-blob bg-blob--bottom-right" />
    </view>

    <!-- TopAppBar -->
    <GameAppBar
      title="棋盘-1"
      left-icon="menu_open"
      right-icon="settings"
      @left-click="sidebarVisible = true"
      @right-click="goSettings"
    />

    <!-- 侧边抽屉 -->
    <SidebarDrawer
      :visible="sidebarVisible"
      @close="sidebarVisible = false"
    />

    <!-- 棋盘区域 -->
    <main class="board-area">
      <HexBoard />
    </main>

    <!-- 底部操作 Dock -->
    <BottomDock />
  </view>
</template>

<script>
import GameAppBar from '@/components/GameAppBar.vue'
import SidebarDrawer from '@/components/SidebarDrawer.vue'
import HexBoard from '@/components/HexBoard.vue'
import BottomDock from '@/components/BottomDock.vue'

export default {
  components: { GameAppBar, SidebarDrawer, HexBoard, BottomDock },
  data() {
    return {
      sidebarVisible: false
    }
  },
  methods: {
    goSettings() {
      uni.navigateTo({ url: '/pages/settings/settings' })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../common/design-tokens';

.page-game {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: $color-background;
  font-family: $font-body;
  font-size: $fs-body-md;
  color: $color-on-surface;
  position: relative;
}

// ── 背景光斑 ──

.bg-blobs {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(160rpx);
}

.bg-blob--top-left {
  top: -10%;
  left: -10%;
  width: 100vw;
  height: 100vw;
  background: $color-liquid-accent;
  opacity: 0.4;
}

.bg-blob--bottom-right {
  bottom: -10%;
  right: -10%;
  width: 120vw;
  height: 120vw;
  background: $color-primary-container;
  opacity: 0.3;
}

// ── 棋盘区域 ──

.board-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 10;
  margin-top: 158rpx;
  margin-bottom: 178rpx;
  padding: 0 16rpx;
}
</style>
