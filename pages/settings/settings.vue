<template>
  <view class="page-settings">
    <!-- TopAppBar -->
    <GameAppBar
      title="设置"
      left-icon="arrow_back"
      :right-icon="null"
      @left-click="goBack"
    />

    <!-- 内容区 -->
    <view class="settings-main">
      <LiquidCard>
        <view class="author-info">
          <text class="author-text">作者：27届208夜樱</text>
        </view>
      </LiquidCard>
    </view>
  </view>
</template>

<script>
import GameAppBar from '@/components/GameAppBar.vue'
import LiquidCard from '@/components/LiquidCard.vue'

export default {
  name: 'Settings',
  components: { GameAppBar, LiquidCard },
  methods: {
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../common/design-tokens';

.page-settings {
  min-height: 100vh;
  background-color: $color-background;
}

.page-settings::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    radial-gradient(circle at 15% 50%, rgba(16, 185, 129, 0.08), transparent 25%),
    radial-gradient(circle at 85% 30%, rgba(167, 243, 208, 0.12), transparent 25%);
  background-attachment: fixed;
  z-index: 0;
  pointer-events: none;
}

.settings-main {
  position: relative;
  z-index: 1;
  padding: 214rpx $sp-container-padding-mobile 0;
}

.author-info {
  display: flex;
  align-items: center;
}

.author-text {
  font-family: $font-headline;
  font-size: $fs-headline-lg-mobile;
  font-weight: 500;
  color: $color-primary;
  letter-spacing: -0.01em;
}
</style>
