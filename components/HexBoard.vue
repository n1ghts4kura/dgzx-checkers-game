<template>
  <view class="board-wrapper">
    <svg
      class="board-svg"
      width="400"
      height="500"
      viewBox="0 0 400 500"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient cx="50%" cy="50%" fx="50%" fy="50%" id="victory-gradient" r="50%">
          <stop offset="0%" stop-color="rgba(16, 185, 129, 0.3)" />
          <stop offset="100%" stop-color="rgba(16, 185, 129, 0)" />
        </radialGradient>
        <marker id="arrowhead" markerHeight="4" markerWidth="6" orient="auto" refX="5" refY="2">
          <polygon fill="#10B981" points="0 0, 6 2, 0 4" />
        </marker>
      </defs>

      <!-- 胜利区域高亮 -->
      <circle cx="200" cy="80" fill="url(#victory-gradient)" r="80" />

      <g transform="translate(200, 25) scale(0.95)">
        <!-- R0: 1 cell -->
        <circle cx="0" cy="0" fill="#f0f0f0" r="15" />
        <!-- R1: 2 cells -->
        <circle cx="-16.5" cy="28.05" fill="#f0f0f0" r="15" />
        <circle cx="16.5" cy="28.05" fill="#f0f0f0" r="15" />
        <!-- R2: 3 cells -->
        <circle cx="-33" cy="56.1" fill="#f0f0f0" r="15" />
        <circle cx="0" cy="56.1" fill="#f0f0f0" r="15" />
        <circle cx="33" cy="56.1" fill="#f0f0f0" r="15" />
        <!-- R3: 4 cells -->
        <circle cx="-49.5" cy="84.15" fill="#f0f0f0" r="15" />
        <circle cx="-16.5" cy="84.15" fill="#f0f0f0" r="15" />
        <circle cx="16.5" cy="84.15" fill="#f0f0f0" r="15" />
        <circle cx="49.5" cy="84.15" fill="#f0f0f0" r="15" />

        <!-- R4: 13 cells -->
        <circle cx="-198" cy="112.2" fill="#f0f0f0" r="15" /><circle cx="-165" cy="112.2" fill="#f0f0f0" r="15" /><circle cx="-132" cy="112.2" fill="#f0f0f0" r="15" /><circle cx="-99" cy="112.2" fill="#f0f0f0" r="15" /><circle cx="-66" cy="112.2" fill="#f0f0f0" r="15" /><circle cx="-33" cy="112.2" fill="#f0f0f0" r="15" /><circle cx="0" cy="112.2" fill="#f0f0f0" r="15" /><circle cx="33" cy="112.2" fill="#f0f0f0" r="15" /><circle cx="66" cy="112.2" fill="#f0f0f0" r="15" /><circle cx="99" cy="112.2" fill="#f0f0f0" r="15" /><circle cx="132" cy="112.2" fill="#f0f0f0" r="15" /><circle cx="165" cy="112.2" fill="#f0f0f0" r="15" /><circle cx="198" cy="112.2" fill="#f0f0f0" r="15" />
        <!-- R5: 12 cells -->
        <circle cx="-181.5" cy="140.25" fill="#f0f0f0" r="15" /><circle cx="-148.5" cy="140.25" fill="#f0f0f0" r="15" /><circle cx="-115.5" cy="140.25" fill="#f0f0f0" r="15" /><circle cx="-82.5" cy="140.25" fill="#f0f0f0" r="15" /><circle cx="-49.5" cy="140.25" fill="#f0f0f0" r="15" /><circle cx="-16.5" cy="140.25" fill="#f0f0f0" r="15" /><circle cx="16.5" cy="140.25" fill="#f0f0f0" r="15" /><circle cx="49.5" cy="140.25" fill="#f0f0f0" r="15" /><circle cx="82.5" cy="140.25" fill="#f0f0f0" r="15" /><circle cx="115.5" cy="140.25" fill="#f0f0f0" r="15" /><circle cx="148.5" cy="140.25" fill="#f0f0f0" r="15" /><circle cx="181.5" cy="140.25" fill="#f0f0f0" r="15" />
        <!-- R6: 11 cells -->
        <circle cx="-165" cy="168.3" fill="#f0f0f0" r="15" /><circle cx="-132" cy="168.3" fill="#f0f0f0" r="15" /><circle cx="-99" cy="168.3" fill="#f0f0f0" r="15" /><circle cx="-66" cy="168.3" fill="#f0f0f0" r="15" /><circle cx="-33" cy="168.3" fill="#f0f0f0" r="15" /><circle cx="0" cy="168.3" fill="#f0f0f0" r="15" /><circle cx="33" cy="168.3" fill="#f0f0f0" r="15" /><circle cx="66" cy="168.3" fill="#f0f0f0" r="15" /><circle cx="99" cy="168.3" fill="#f0f0f0" r="15" /><circle cx="132" cy="168.3" fill="#f0f0f0" r="15" /><circle cx="165" cy="168.3" fill="#f0f0f0" r="15" />
        <!-- R7: 10 cells -->
        <circle cx="-148.5" cy="196.35" fill="#f0f0f0" r="15" /><circle cx="-115.5" cy="196.35" fill="#f0f0f0" r="15" /><circle cx="-82.5" cy="196.35" fill="#f0f0f0" r="15" /><circle cx="-49.5" cy="196.35" fill="#f0f0f0" r="15" /><circle cx="-16.5" cy="196.35" fill="#f0f0f0" r="15" /><circle cx="16.5" cy="196.35" fill="#f0f0f0" r="15" /><circle cx="49.5" cy="196.35" fill="#f0f0f0" r="15" /><circle cx="82.5" cy="196.35" fill="#f0f0f0" r="15" /><circle cx="115.5" cy="196.35" fill="#f0f0f0" r="15" /><circle cx="148.5" cy="196.35" fill="#f0f0f0" r="15" />
        <!-- R8: 9 cells (center row) -->
        <circle cx="-132" cy="224.4" fill="#f0f0f0" r="15" /><circle cx="-99" cy="224.4" fill="#f0f0f0" r="15" /><circle cx="-66" cy="224.4" fill="#f0f0f0" r="15" /><circle cx="-33" cy="224.4" fill="#f0f0f0" r="15" /><circle cx="0" cy="224.4" fill="#f0f0f0" r="15" /><circle cx="33" cy="224.4" fill="#f0f0f0" r="15" /><circle cx="66" cy="224.4" fill="#f0f0f0" r="15" /><circle cx="99" cy="224.4" fill="#f0f0f0" r="15" /><circle cx="132" cy="224.4" fill="#f0f0f0" r="15" />
        <!-- R9: 10 cells -->
        <circle cx="-148.5" cy="252.45" fill="#f0f0f0" r="15" /><circle cx="-115.5" cy="252.45" fill="#f0f0f0" r="15" /><circle cx="-82.5" cy="252.45" fill="#f0f0f0" r="15" /><circle cx="-49.5" cy="252.45" fill="#f0f0f0" r="15" /><circle cx="-16.5" cy="252.45" fill="#f0f0f0" r="15" /><circle cx="16.5" cy="252.45" fill="#f0f0f0" r="15" /><circle cx="49.5" cy="252.45" fill="#f0f0f0" r="15" /><circle cx="82.5" cy="252.45" fill="#f0f0f0" r="15" /><circle cx="115.5" cy="252.45" fill="#f0f0f0" r="15" /><circle cx="148.5" cy="252.45" fill="#f0f0f0" r="15" />
        <!-- R10: 11 cells -->
        <circle cx="-165" cy="280.5" fill="#f0f0f0" r="15" /><circle cx="-132" cy="280.5" fill="#f0f0f0" r="15" /><circle cx="-99" cy="280.5" fill="#f0f0f0" r="15" /><circle cx="-66" cy="280.5" fill="#f0f0f0" r="15" /><circle cx="-33" cy="280.5" fill="#f0f0f0" r="15" /><circle cx="0" cy="280.5" fill="#f0f0f0" r="15" /><circle cx="33" cy="280.5" fill="#f0f0f0" r="15" /><circle cx="66" cy="280.5" fill="#f0f0f0" r="15" /><circle cx="99" cy="280.5" fill="#f0f0f0" r="15" /><circle cx="132" cy="280.5" fill="#f0f0f0" r="15" /><circle cx="165" cy="280.5" fill="#f0f0f0" r="15" />
        <!-- R11: 12 cells -->
        <circle cx="-181.5" cy="308.55" fill="#f0f0f0" r="15" /><circle cx="-148.5" cy="308.55" fill="#f0f0f0" r="15" /><circle cx="-115.5" cy="308.55" fill="#f0f0f0" r="15" /><circle cx="-82.5" cy="308.55" fill="#f0f0f0" r="15" /><circle cx="-49.5" cy="308.55" fill="#f0f0f0" r="15" /><circle cx="-16.5" cy="308.55" fill="#f0f0f0" r="15" /><circle cx="16.5" cy="308.55" fill="#f0f0f0" r="15" /><circle cx="49.5" cy="308.55" fill="#f0f0f0" r="15" /><circle cx="82.5" cy="308.55" fill="#f0f0f0" r="15" /><circle cx="115.5" cy="308.55" fill="#f0f0f0" r="15" /><circle cx="148.5" cy="308.55" fill="#f0f0f0" r="15" /><circle cx="181.5" cy="308.55" fill="#f0f0f0" r="15" />
        <!-- R12: 13 cells -->
        <circle cx="-198" cy="336.6" fill="#f0f0f0" r="15" /><circle cx="-165" cy="336.6" fill="#f0f0f0" r="15" /><circle cx="-132" cy="336.6" fill="#f0f0f0" r="15" /><circle cx="-99" cy="336.6" fill="#f0f0f0" r="15" /><circle cx="-66" cy="336.6" fill="#f0f0f0" r="15" /><circle cx="-33" cy="336.6" fill="#f0f0f0" r="15" /><circle cx="0" cy="336.6" fill="#f0f0f0" r="15" /><circle cx="33" cy="336.6" fill="#f0f0f0" r="15" /><circle cx="66" cy="336.6" fill="#f0f0f0" r="15" /><circle cx="99" cy="336.6" fill="#f0f0f0" r="15" /><circle cx="132" cy="336.6" fill="#f0f0f0" r="15" /><circle cx="165" cy="336.6" fill="#f0f0f0" r="15" /><circle cx="198" cy="336.6" fill="#f0f0f0" r="15" />
        <!-- R13: 4 cells -->
        <circle cx="-49.5" cy="364.65" fill="#f0f0f0" r="15" />
        <circle cx="-16.5" cy="364.65" fill="#f0f0f0" r="15" />
        <circle cx="16.5" cy="364.65" fill="#f0f0f0" r="15" />
        <circle cx="49.5" cy="364.65" fill="#f0f0f0" r="15" />
        <!-- R14: 3 cells -->
        <circle cx="-33" cy="392.7" fill="#f0f0f0" r="15" />
        <circle cx="0" cy="392.7" fill="#f0f0f0" r="15" />
        <circle cx="33" cy="392.7" fill="#f0f0f0" r="15" />
        <!-- R15: 2 cells -->
        <circle cx="-16.5" cy="420.75" fill="#f0f0f0" r="15" />
        <circle cx="16.5" cy="420.75" fill="#f0f0f0" r="15" />
        <!-- R16: 1 cell -->
        <circle cx="0" cy="448.8" fill="#f0f0f0" r="15" />

        <!-- 可跳目标 -->
        <circle cx="-33" cy="280.5" fill="none" r="8" stroke="#10B981" stroke-width="3" />
        <circle cx="33" cy="224.4" fill="none" r="8" stroke="#10B981" stroke-width="3" />

        <!-- 绿色跳跃箭头 (R14 → R12) -->
        <line marker-end="url(#arrowhead)" stroke="#10B981" stroke-width="4" x1="0" x2="0" y1="392.7" y2="346.6" />

        <!-- 粉红提示路径 -->
        <polyline fill="none" points="0,392.7 -33,336.6 -66,280.5 -33,224.4" stroke="#FF4081" stroke-dasharray="4,4" stroke-width="2" />
        <circle cx="0" cy="392.7" fill="#FF4081" r="10" />
        <text fill="white" font-size="10" font-weight="bold" text-anchor="middle" x="0" y="396">S</text>
        <circle cx="-33" cy="336.6" fill="#FF4081" r="10" />
        <text fill="white" font-size="10" font-weight="bold" text-anchor="middle" x="-33" y="340">1</text>
        <circle cx="-66" cy="280.5" fill="#FF4081" r="10" />
        <text fill="white" font-size="10" font-weight="bold" text-anchor="middle" x="-66" y="284">2</text>
        <circle cx="-33" cy="224.4" fill="#FF4081" r="10" />
        <text fill="white" font-size="10" font-weight="bold" text-anchor="middle" x="-33" y="228">3</text>
      </g>
    </svg>
  </view>
</template>

<script>
export default {
  name: 'HexBoard'
}
</script>

<style lang="scss" scoped>
.board-wrapper {
  width: 100%;
  max-width: 640rpx;
  aspect-ratio: 4 / 5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.board-svg {
  width: 100%;
  height: 100%;
}
</style>
