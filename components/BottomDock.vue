<template>
  <footer class="bottom-dock">
    <!-- Stats (left 75%) -->
    <view class="dock-stats">
      <view class="stat-card">
        <text class="stat-label">当前得分</text>
        <text
          class="stat-value"
          :class="scoreDeducting ? 'stat-value--deduct' : 'stat-value--primary'"
        >{{ score }}</text>
      </view>
      <view class="stat-card">
        <text class="stat-label">落子耗时</text>
        <text
          class="stat-value stat-value--tertiary"
          :style="{
            color: moveTimerRedIntensity > 0
              ? `rgb(${Math.round(255 * (1 - moveTimerRedIntensity))}, 0, 0)`
              : undefined,
            transform: moveTimerBounce ? `scale(${1 + Math.sin(Date.now() / 200) * 0.2})` : undefined
          }"
        >
          {{ moveTimeFormatted }}s
        </text>
      </view>
      <view class="stat-card">
        <text class="stat-label">总剩余时间</text>
        <text class="stat-value stat-value--primary">{{ gameTimeFormatted }}</text>
      </view>
    </view>

    <!-- Actions (right 25%) -->
    <view class="dock-actions">
      <view class="action-btn action-btn--wide" :class="{ 'action-btn--disabled': !canUndo }" @tap="$emit('undo')">
        <IconSprite name="undo" :size="20" />
        <text class="action-label">悔棋</text>
      </view>
      <view class="dock-actions__row">
        <view class="action-btn" @tap="$emit('hint')">
          <IconSprite name="hint" :size="20" />
          <text class="action-label">提示</text>
        </view>
        <view class="action-btn" @tap="$emit('restart')">
          <IconSprite name="refresh" :size="20" />
          <text class="action-label">重开</text>
        </view>
      </view>
    </view>
  </footer>
</template>

<script>
import IconSprite from './IconSprite.vue'

export default {
  name: 'BottomDock',
  components: { IconSprite },
  props: {
    score: { type: [Number, String], default: '150分' },
    scoreDeducting: { type: Boolean, default: false },
    gameTimeFormatted: { type: String, default: '10:00' },
    moveTimeFormatted: { type: String, default: '0.00' },
    moveTimerWarning: { type: Boolean, default: false },
    moveTimerRedIntensity: { type: Number, default: 0 },
    moveTimerBounce: { type: Boolean, default: false },
    canUndo: { type: Boolean, default: false }
  },
  emits: ['undo', 'hint', 'restart']
}
</script>

<style lang="scss" scoped>
@import '../common/design-tokens';
@import '../common/glass-utilities';

.bottom-dock {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: transparent;
  border-top: 1px solid $color-glass-stroke;
  border-radius: 60rpx 60rpx 0 0;
  display: flex;
  padding: 12rpx $sp-gutter;
  padding-bottom: calc(12rpx + env(safe-area-inset-bottom));
  gap: 12rpx;
  height: 94px;
  min-height: 94px;
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
  font-family: $font-body;
  font-size: $fs-label-bold;
  line-height: $lh-label-bold;
  font-weight: 700;
  letter-spacing: $ls-label-bold;
  color: $color-on-surface-variant;
  margin-bottom: 4rpx;
}

.stat-value {
  font-family: $font-headline;
  font-size: $fs-headline-lg-mobile;
  line-height: $lh-headline-lg-mobile;
  font-weight: 700;

  &--primary { color: $color-primary; }
  &--tertiary { color: $color-tertiary; }
  &--deduct {
    color: $color-error;
    animation: score-deduction-fade 1.5s ease-in-out;
  }
}

.dock-actions {
  width: 25%;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  height: 100%;
}

.dock-actions__row {
  flex: 1;
  display: flex;
  gap: 12rpx;
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

  &--wide {
    flex: 1;
  }

  &:active {
    transform: scale(0.9);
  }

  &--disabled {
    opacity: 0.4;
    pointer-events: none;
  }
}

.action-label {
  font-family: $font-body;
  font-size: $fs-label-bold;
  line-height: $lh-label-bold;
  font-weight: 700;
  letter-spacing: $ls-label-bold;
  margin-top: 4rpx;
}

@keyframes score-deduction-fade {
  0%   { opacity: 0; transform: translateY(6px); }
  18%  { opacity: 1; transform: translateY(0); }
  78%  { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-6px); }
}
</style>
