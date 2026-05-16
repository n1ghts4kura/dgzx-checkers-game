<template>
  <view class="dialog-overlay" :class="{ 'dialog-overlay--visible': localVisible }">
    <view class="dialog-card" :class="{ 'dialog-card--visible': localVisible }">
      <!-- Spinning ring — fades with dialog, not independently -->
      <view class="spinner-ring" />

      <!-- Text area: loading and result text stacked with absolute positioning -->
      <view class="dialog-text-area">
        <text class="dialog-text dialog-text--loading" :class="{ 'dialog-text--loading--hidden': status !== 'loading' }">生成中...</text>
        <text class="dialog-text dialog-text--result" :class="{ 'dialog-text--visible': status !== 'loading' }">{{ resultText }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CircleProgressDialog',
  props: {
    visible: { type: Boolean, default: false },
    status: {
      type: String,
      default: 'loading',
      validator: v => ['loading', 'success', 'failure'].includes(v)
    }
  },
  emits: ['done'],
  data() {
    return {
      localVisible: false,
      dismissTimer: null
    }
  },
  computed: {
    resultText() {
      return this.status === 'success' ? '生成成功！' : '生成失败了！再试一次！'
    }
  },
  watch: {
    visible(v) {
      if (v) {
        this.localVisible = true
      }
    },
    status(v) {
      if (v === 'loading') {
        if (this.dismissTimer) {
          clearTimeout(this.dismissTimer)
          this.dismissTimer = null
        }
        this.localVisible = true
      } else if (v === 'success' || v === 'failure') {
        if (this.dismissTimer) clearTimeout(this.dismissTimer)
        const textHold = v === 'success' ? 1500 : 2000
        this.dismissTimer = setTimeout(() => {
          this.localVisible = false
          this.dismissTimer = setTimeout(() => {
            this.$emit('done')
          }, 250)
        }, 200 + textHold)
      }
    }
  },
  beforeDestroy() {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer)
      this.dismissTimer = null
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../common/design-tokens';
@import '../common/glass-utilities';

.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 250ms ease;
  pointer-events: none;

  &--visible {
    opacity: 1;
    pointer-events: auto;
  }
}

.dialog-card {
  background: white;
  border-radius: $radius-default;
  padding: 80rpx 96rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48rpx;
  @include emerald-shadow(8px, 40px, 0.2);
  transform: scale(0.85);
  opacity: 0;
  transition: transform 250ms ease, opacity 250ms ease;

  &--visible {
    transform: scale(1);
    opacity: 1;
  }
}

// ── Spinning ring ──

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner-ring {
  width: 120rpx;
  height: 120rpx;
  border: 8rpx solid rgba($color-primary, 0.15);
  border-top-color: $color-primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

// ── Text area ──

.dialog-text-area {
  position: relative;
  min-height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-text {
  font-family: $font-headline;
  font-size: $fs-headline-lg-mobile;
  font-weight: 700;
  color: $color-on-surface;
  position: absolute;
  white-space: nowrap;
  transition: opacity 200ms ease;
}

.dialog-text--loading {
  opacity: 1;
}

.dialog-text--loading--hidden {
  opacity: 0;
}

.dialog-text--result {
  opacity: 0;
}

.dialog-text--result--visible {
  opacity: 1;
}
</style>
