<template>
  <view class="board-wrapper">
    <!-- #ifdef H5 -->
    <canvas
      ref="gameCanvas"
      :style="canvasStyle"
    />
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <canvas
      id="game-canvas"
      type="2d"
      :style="canvasStyle"
    />
    <!-- #endif -->
  </view>
</template>

<script>
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/game-core/constants.js'

export default {
  name: 'HexBoard',
  data() {
    return {
      ctx: null,
      dpr: 1
    }
  },
  computed: {
    canvasStyle() {
      return {
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`
      }
    }
  },
  mounted() {
    // #ifdef H5
    this.initCanvasH5()
    // #endif
    // #ifndef H5
    this.initCanvasMP()
    // #endif
  },
  methods: {
    // #ifdef H5
    initCanvasH5() {
      this.$nextTick(() => {
        let el = this.$refs.gameCanvas
        if (!el) return
        if (el.$el) el = el.$el
        if (el.tagName === 'UNI-CANVAS' || !el.getContext) {
          const inner = el.querySelector('canvas')
          if (inner) el = inner
        }
        if (!el.getContext) return

        this.dpr = window.devicePixelRatio || 1
        el.width = CANVAS_WIDTH * this.dpr
        el.height = CANVAS_HEIGHT * this.dpr
        this.ctx = el.getContext('2d')
        this.ctx.scale(this.dpr, this.dpr)

        // Clear canvas to confirm it works
        this.ctx.fillStyle = '#f0f0f0'
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      })
    },
    // #endif

    // #ifndef H5
    initCanvasMP() {
      this.$nextTick(() => {
        const query = uni.createSelectorQuery().in(this)
        query.select('#game-canvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (!res || !res[0] || !res[0].node) return
            const canvas = res[0].node
            this.dpr = uni.getSystemInfoSync().pixelRatio || 1
            canvas.width = CANVAS_WIDTH * this.dpr
            canvas.height = CANVAS_HEIGHT * this.dpr
            const ctx = canvas.getContext('2d')
            ctx.scale(this.dpr, this.dpr)
            this.ctx = ctx

            ctx.fillStyle = '#f0f0f0'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
          })
      })
    }
    // #endif
  }
}
</script>

<style lang="scss" scoped>
.board-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

// #ifdef H5
canvas {
  width: 100%;
  height: 100%;
}
// #endif

// #ifndef H5
#game-canvas {
  width: 100%;
  height: 100%;
}
// #endif
</style>
