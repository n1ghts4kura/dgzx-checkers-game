<template>
  <view class="bg-blobs">
    <view class="bg-blob bg-blob--top-left" />
    <view class="bg-blob bg-blob--center" />
    <view class="bg-blob bg-blob--bottom-right" />
  </view>
</template>

<script>
export default {
  name: 'BackgroundBlobs'
}
</script>

<style lang="scss" scoped>
@import '../common/design-tokens';

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
  filter: blur(60rpx);
  will-change: transform, border-radius, opacity;
  animation-duration: 17s;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

.bg-blob--top-left {
  top: -10%;
  left: -10%;
  width: 100vw;
  height: 100vw;
  background: $color-liquid-accent;
  animation-name: blob-wander-top-left;
}

.bg-blob--center {
  top: 30%;
  right: -20%;
  width: 80vw;
  height: 80vw;
  background: $color-primary-container;
  animation-name: blob-wander-center;
  animation-duration: 23s;
}

.bg-blob--bottom-right {
  bottom: -10%;
  right: -10%;
  width: 120vw;
  height: 120vw;
  background: $color-primary-container;
  animation-name: blob-wander-bottom-right;
  animation-duration: 29s;
}

@keyframes blob-wander-top-left {
  0%   { transform: translate(0, 0) rotate(0deg) scale(1);    opacity: 0.35; border-radius: 50% 50% 50% 50%; }
  25%  { transform: translate(6%, -4%) rotate(3deg) scale(1.1);  opacity: 0.45; border-radius: 58% 42% 54% 46%; }
  50%  { transform: translate(-2%, 7%) rotate(-2deg) scale(1.15); opacity: 0.38; border-radius: 44% 56% 48% 52%; }
  75%  { transform: translate(-6%, 2%) rotate(4deg) scale(1.05);  opacity: 0.42; border-radius: 53% 47% 58% 42%; }
  100% { transform: translate(3%, -5%) rotate(-3deg) scale(1);    opacity: 0.35; border-radius: 50% 50% 50% 50%; }
}

@keyframes blob-wander-center {
  0%   { transform: translate(0, 0) rotate(0deg) scale(1);    opacity: 0.25; border-radius: 42% 58% 48% 52%; }
  25%  { transform: translate(-8%, 5%) rotate(-4deg) scale(1.2);  opacity: 0.35; border-radius: 55% 45% 60% 40%; }
  50%  { transform: translate(4%, -7%) rotate(2deg) scale(0.95);  opacity: 0.28; border-radius: 48% 52% 42% 58%; }
  75%  { transform: translate(8%, -3%) rotate(5deg) scale(1.15);  opacity: 0.32; border-radius: 60% 40% 55% 45%; }
  100% { transform: translate(-3%, 6%) rotate(-2deg) scale(1);    opacity: 0.25; border-radius: 42% 58% 48% 52%; }
}

@keyframes blob-wander-bottom-right {
  0%   { transform: translate(0, 0) rotate(0deg) scale(1);    opacity: 0.25; border-radius: 50% 50% 50% 50%; }
  25%  { transform: translate(-5%, -3%) rotate(3deg) scale(1.1);  opacity: 0.33; border-radius: 38% 62% 42% 58%; }
  50%  { transform: translate(4%, -6%) rotate(-4deg) scale(0.85); opacity: 0.22; border-radius: 56% 44% 62% 38%; }
  75%  { transform: translate(-2%, 5%) rotate(2deg) scale(1.05);  opacity: 0.30; border-radius: 45% 55% 38% 62%; }
  100% { transform: translate(3%, -2%) rotate(-1deg) scale(1);    opacity: 0.25; border-radius: 50% 50% 50% 50%; }
}
</style>
