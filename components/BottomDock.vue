<template>
  <footer class="bottom-dock">
    <!-- 状态栏 (左 75%) -->
    <view class="dock-stats">
      <view class="stat-card">
        <text class="stat-label">当前得分</text>
        <text class="stat-value stat-value--primary">2,450</text>
      </view>
      <view class="stat-card">
        <text class="stat-label">落子剩余时间</text>
        <text class="stat-value stat-value--tertiary">14s</text>
      </view>
      <view class="stat-card">
        <text class="stat-label">总剩余时间</text>
        <text class="stat-value stat-value--primary">08:30</text>
      </view>
    </view>

    <!-- 操作栏 (右 25%) -->
    <view class="dock-actions">
      <view class="action-btn">
        <IconSprite name="undo" :size="24" />
        <text class="action-label">悔棋</text>
      </view>
      <view class="action-btn">
        <IconSprite name="refresh" :size="24" />
        <text class="action-label">重新开始</text>
      </view>
    </view>
  </footer>
</template>

<script>
import IconSprite from './IconSprite.vue'

export default {
  name: 'BottomDock',
  components: { IconSprite }
}
</script>

<style lang="scss" scoped>
@import '../common/design-tokens';
@import '../common/glass-utilities';

.bottom-dock {
  @include fixed-bottom;
  @include glass-surface(24px);
  @include glass-border;
  border-bottom: none;
  @include emerald-shadow(-4px, 30px, 0.1);
  border-radius: 60rpx 60rpx 0 0;
  display: flex;
  padding: 12rpx $sp-gutter;
  padding-bottom: calc(12rpx + env(safe-area-inset-bottom));
  gap: 12rpx;
  height: 162rpx;
  min-height: 162rpx;
}

.dock-stats {
  width: 75%;
  display: flex;
  gap: 12rpx;
  height: 100%;
}

.stat-card {
  flex: 1;
  background: transparent;
  border-radius: 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rpx;
}

.stat-label {
  @include text-label-bold;
  color: $color-on-surface-variant;
  margin-bottom: 4rpx;
}

.stat-value {
  @include text-headline-lg-mobile;
  font-weight: 700;

  &--primary { color: $color-primary; }
  &--tertiary { color: $color-tertiary; }
}

.dock-actions {
  width: 25%;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  height: 100%;
}

.action-btn {
  flex: 1;
  background: transparent;
  border-radius: 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: $color-on-surface-variant;
  transition: transform 0.15s;
  padding: 6rpx;

  &:active {
    transform: scale(0.9);
  }
}

.action-label {
  @include text-label-bold;
  margin-top: 4rpx;
}
</style>
