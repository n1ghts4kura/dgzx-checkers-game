<template>
  <view class="page-game">
    <!-- Background blobs -->
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

    <!-- Sidebar drawer -->
    <SidebarDrawer
      :visible="sidebarVisible"
      :level-names="levelNames"
      :active-level-index="activeLevelIndex"
      @close="sidebarVisible = false"
      @select-level="selectLevel"
      @create-level="createNewLevel"
    />

    <!-- Board area -->
    <main class="board-area">
      <view id="canvas-wrapper">
        <canvas id="game-canvas" @tap="handleCanvasTap" />
      </view>
    </main>

    <!-- Bottom dock -->
    <BottomDock
      :score="score"
      :game-time-formatted="gameTimeFormatted"
      :move-time-formatted="moveTimeFormatted"
      :move-timer-warning="moveTimerWarning"
      :move-timer-red-intensity="moveTimerRedIntensity"
      :move-timer-bounce="moveTimerBounce"
      :can-undo="history.length > 0"
      @undo="handleUndo"
      @restart="handleRestart"
    />
  </view>
</template>

<script>
import GameAppBar from '@/components/GameAppBar.vue'
import SidebarDrawer from '@/components/SidebarDrawer.vue'
import BottomDock from '@/components/BottomDock.vue'

import { drawBoard } from '@/game-core/renderer.js'
import { getBoardPos } from '@/game-core/coordinates.js'
import { createEmptyBoard, createEmptyColorLayer, createAxialMapping, countObstacles } from '@/game-core/board.js'
import { executeMove, saveStateSnapshot, findAllJumpsFrom } from '@/game-core/logic.js'
import { solveGameBFS } from '@/game-core/solver.js'
import { setupDefaultBoard, buildLevelData, loadLevelIntoBoard } from '@/game-core/generator.js'
import { getPenaltyThresholdsCrossed, getNextThresholdTime, calculateSettlementScore, formatScoreText } from '@/game-core/penalties.js'
import { playCaptureSound, playVictorySound } from '@/game-core/audio.js'
import {
  EMPTY, PLAYER, OBSTACLE,
  GAME_TIME, INITIAL_SCORE, SCORE_FLOOR,
  UNDO_SCORE_PENALTY, MOVE_TIME_PENALTY_PER_INTERVAL,
  MOVE_TIME_WARNING_THRESHOLD, PENALTY_INTERVAL,
  BOARD_ROWS, BOARD_COLS
} from '@/game-core/constants.js'

export default {
  components: { GameAppBar, SidebarDrawer, BottomDock },

  data() {
    return {
      // Game state
      board: null,
      boardColors: null,
      playerPos: null,
      indexToAxial: new Map(),
      axialToIndex: new Map(),
      selected: null,
      moveCount: 0,
      remainingPieces: 0,
      moveHistory: [],
      history: [],
      currentLevel: null,

      // Timers
      gameTimeLeft: GAME_TIME,
      moveTimeElapsed: 0,
      gameTimerInterval: null,
      moveTimerInterval: null,
      timerStarted: false,
      gameWon: false,

      // Score
      score: INITIAL_SCORE,
      lastPenaltyThreshold: 0,
      moveTimerWarning: false,

      // Hint
      hintPath: null,

      // UI
      canvasEl: null,
      canvasCtx: null,
      canvasDpr: 1,
      canvasW: 0,
      canvasH: 0,
      drawVersion: 0,
      sidebarVisible: false,
      settlementVisible: false,
      settlement: { factor1: '0', factor2: '0', finalScore: 0, won: false },

      // Level management
      levelNames: ['棋盘-1', '棋盘-2'],
      activeLevelIndex: 0,
      maxHistorySize: 50
    }
  },

  computed: {
    boardState() {
      return {
        board: this.board,
        boardColors: this.boardColors,
        playerPos: this.playerPos,
        indexToAxial: this.indexToAxial,
        axialToIndex: this.axialToIndex,
        selected: this.selected,
        hoveredTarget: null,
        hintPath: this.hintPath
      }
    },
    gameTimeFormatted() {
      const totalSec = Math.max(0, Math.ceil(this.gameTimeLeft / 1000))
      const min = Math.floor(totalSec / 60)
      const sec = totalSec % 60
      return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    },
    moveTimeFormatted() {
      const totalMs = this.moveTimeElapsed
      const sec = Math.floor(totalMs / 1000)
      const cs = Math.floor((totalMs % 1000) / 10)
      return `${sec}.${String(cs).padStart(2, '0')}`
    },
    moveTimerRedIntensity() {
      if (this.moveTimeElapsed < 15000) return 0
      return Math.min(1, (this.moveTimeElapsed - 15000) / 15000)
    },
    moveTimerBounce() {
      return this.moveTimeElapsed >= 30000
    },
    formattedScore() {
      return formatScoreText(this.score)
    }
  },

  created() {
    this.initGame()
  },

  mounted() {
    // #ifdef H5
    this.$nextTick(() => {
      this.initCanvas()
    })
    // #endif
  },

  beforeDestroy() {
    // #ifdef H5
    this.stopLoop()
    if (this._resizeObserver) {
      this._resizeObserver.disconnect()
      this._resizeObserver = null
    }
    // #endif
    this.stopTimers()
  },

  methods: {
    // ── Canvas ──

    // #ifdef H5
    initCanvas() {
      const wrapper = document.getElementById('canvas-wrapper')
      let el = document.getElementById('game-canvas')
      if (!el || !wrapper) return

      // Penetrate uni-app <uni-canvas> wrapper
      if (el.tagName === 'UNI-CANVAS') {
        const inner = el.querySelector('canvas')
        if (inner) el = inner
      }
      if (!el.getContext) return

      this.canvasEl = el
      this.canvasDpr = window.devicePixelRatio || 1

      this.resizeCanvas()
      this.draw()
      this.startLoop()

      // Observe parent size changes
      if (window.ResizeObserver) {
        this._resizeObserver = new ResizeObserver(() => {
          this.resizeCanvas()
        })
        this._resizeObserver.observe(wrapper)
      }
    },

    resizeCanvas() {
      if (!this.canvasEl) return
      const wrapper = document.getElementById('canvas-wrapper')
      if (!wrapper) return
      const rect = wrapper.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      this.canvasW = rect.width
      this.canvasH = rect.height
      this.canvasEl.width = rect.width * this.canvasDpr
      this.canvasEl.height = rect.height * this.canvasDpr
      this.canvasCtx = this.canvasEl.getContext('2d')
      this.canvasCtx.scale(this.canvasDpr, this.canvasDpr)
    },

    draw() {
      if (!this.canvasCtx || !this.board) return
      drawBoard(this.canvasCtx, this.boardState, this.canvasW, this.canvasH)
    },

    startLoop() {
      if (this._rafId) return
      const loop = () => {
        this.draw()
        this._rafId = requestAnimationFrame(loop)
      }
      this._rafId = requestAnimationFrame(loop)
    },

    stopLoop() {
      if (this._rafId) {
        cancelAnimationFrame(this._rafId)
        this._rafId = null
      }
    },

    handleCanvasTap(e) {
      if (!this.canvasEl || !this.board) return
      // Get tap position relative to canvas display
      const rect = this.canvasEl.getBoundingClientRect()
      const px = e.detail.x - rect.left
      const py = e.detail.y - rect.top
      // Scale from display size to bitmap logical size
      const sx = px * (this.canvasW / rect.width)
      const sy = py * (this.canvasH / rect.height)
      const cell = getBoardPos(this.canvasW, this.canvasH, this.board, sx, sy)
      if (cell) {
        this.handleCellTap({ r: cell[0], c: cell[1] })
      }
    },
    // #endif

    // ── Initialization ──

    initGame() {
      this.stopTimers()

      this.board = createEmptyBoard()
      this.boardColors = createEmptyColorLayer()
      this.playerPos = setupDefaultBoard(this.board, this.boardColors)
      const mapping = createAxialMapping(this.board)
      this.indexToAxial = mapping.indexToAxial
      this.axialToIndex = mapping.axialToIndex
      this.remainingPieces = countObstacles(this.board)

      const solutionPath = solveGameBFS(this.board, this.playerPos, this.indexToAxial, this.axialToIndex)
      this.currentLevel = {
        obstacles: [],
        player: [...this.playerPos],
        solutionPath: solutionPath || []
      }
      for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          if (this.board[r][c] === OBSTACLE) {
            this.currentLevel.obstacles.push([r, c, this.boardColors[r][c]])
          }
        }
      }

      this.selected = null
      this.moveCount = 0
      this.moveHistory = []
      this.history = []
      this.score = INITIAL_SCORE
      this.gameTimeLeft = GAME_TIME
      this.moveTimeElapsed = 0
      this.lastPenaltyThreshold = 0
      this.gameWon = false
      this.timerStarted = false
      this.moveTimerWarning = false
      this.hintPath = null
      this.settlementVisible = false

      this.redraw()
    },

    // ── Timer management ──

    startTimers() {
      if (this.timerStarted) return
      this.timerStarted = true

      this.gameTimerInterval = setInterval(() => {
        this.gameTimeLeft -= 100
        if (this.gameTimeLeft <= 0) {
          this.gameTimeLeft = 0
          this.stopTimers()
          this.triggerSettlement()
        }
      }, 100)

      let lastMoveTick = Date.now()
      this.moveTimerInterval = setInterval(() => {
        const now = Date.now()
        this.moveTimeElapsed += now - lastMoveTick
        lastMoveTick = now
        this.checkMovePenalties()

        // Warning bar (5s before next threshold)
        const nextThreshold = getNextThresholdTime(this.moveTimeElapsed)
        this.moveTimerWarning = (nextThreshold - this.moveTimeElapsed <= 5000 && nextThreshold > this.moveTimeElapsed)
      }, 100)
    },

    stopTimers() {
      if (this.gameTimerInterval) {
        clearInterval(this.gameTimerInterval)
        this.gameTimerInterval = null
      }
      if (this.moveTimerInterval) {
        clearInterval(this.moveTimerInterval)
        this.moveTimerInterval = null
      }
    },

    resetMoveTimer() {
      this.moveTimeElapsed = 0
      this.lastPenaltyThreshold = 0
      this.moveTimerWarning = false
    },

    checkMovePenalties() {
      const thresholdsCrossed = getPenaltyThresholdsCrossed(this.moveTimeElapsed)
      if (thresholdsCrossed > this.lastPenaltyThreshold) {
        const newPenalties = thresholdsCrossed - this.lastPenaltyThreshold
        this.score = Math.max(SCORE_FLOOR, this.score - newPenalties * MOVE_TIME_PENALTY_PER_INTERVAL)
        this.lastPenaltyThreshold = thresholdsCrossed
      }
    },

    // ── Game actions ──

    handleCellTap({ r, c }) {
      if (this.gameWon) return

      const cellValue = this.board[r][c]

      // Tap player: toggle selection
      if (cellValue === PLAYER) {
        this.selected = this.selected ? null : [r, c]
        this.redraw()
        return
      }

      // Tap empty cell: try to jump
      if (cellValue === EMPTY && this.playerPos && this.selected) {
        const result = executeMove(
          this.board, this.boardColors, this.playerPos, r, c,
          this.indexToAxial, this.axialToIndex
        )

        if (result) {
          // Capture old position before mutation
          const oldPlayerPos = [...this.playerPos]

          // Save state for undo
          this.history.push(saveStateSnapshot(
            this.board, this.boardColors, oldPlayerPos,
            this.moveCount, this.remainingPieces, this.moveHistory
          ))
          if (this.history.length > this.maxHistorySize) this.history.shift()

          // Apply state
          this.board = result.newBoard
          this.boardColors = result.newBoardColors
          this.playerPos = result.newPlayerPos
          this.moveCount++
          this.remainingPieces--
          this.moveHistory.push([oldPlayerPos, [r, c]])

          // Rebuild axial mapping after obstacle removal
          const mapping = createAxialMapping(this.board)
          this.indexToAxial = mapping.indexToAxial
          this.axialToIndex = mapping.axialToIndex

          this.selected = null
          this.hintPath = null

          // Start timers on first move
          if (!this.timerStarted) {
            this.startTimers()
          }

          this.resetMoveTimer()
          playCaptureSound()

          // Check win
          if (this.playerPos[0] <= 3) {
            this.gameWon = true
            this.stopTimers()
            playVictorySound()
            this.triggerSettlement()
          }

          this.redraw()
          return
        }
      }

      // Deselect on invalid tap
      this.selected = null
      this.redraw()
    },

    handleUndo() {
      if (this.history.length === 0) return

      const prevState = this.history.pop()
      this.board = prevState.board
      this.boardColors = prevState.boardColors
      this.playerPos = prevState.playerPos
      this.moveCount = prevState.moveCount
      this.remainingPieces = prevState.remainingPieces
      this.moveHistory = prevState.moveHistory
      this.selected = null
      this.hintPath = null
      this.gameWon = false
      this.settlementVisible = false

      const mapping = createAxialMapping(this.board)
      this.indexToAxial = mapping.indexToAxial
      this.axialToIndex = mapping.axialToIndex

      this.score = Math.max(SCORE_FLOOR, this.score - UNDO_SCORE_PENALTY)
      this.resetMoveTimer()
      this.redraw()
    },

    handleRestart() {
      if (this.currentLevel) {
        this.stopTimers()
        this.board = createEmptyBoard()
        this.boardColors = createEmptyColorLayer()
        loadLevelIntoBoard(this.board, this.boardColors, this.currentLevel)
        this.playerPos = [...this.currentLevel.player]
        const mapping = createAxialMapping(this.board)
        this.indexToAxial = mapping.indexToAxial
        this.axialToIndex = mapping.axialToIndex
        this.remainingPieces = countObstacles(this.board)
        this.selected = null
        this.moveCount = 0
        this.moveHistory = []
        this.history = []
        this.score = INITIAL_SCORE
        this.gameTimeLeft = GAME_TIME
        this.moveTimeElapsed = 0
        this.lastPenaltyThreshold = 0
        this.gameWon = false
        this.timerStarted = false
        this.moveTimerWarning = false
        this.hintPath = null
        this.settlementVisible = false
        this.redraw()
      }
    },

    handleHint() {
      if (!this.playerPos) return
      const path = solveGameBFS(this.board, this.playerPos, this.indexToAxial, this.axialToIndex)
      this.hintPath = path
      this.redraw()
    },

    // ── Settlement ──

    triggerSettlement() {
      const currentTimeSpent = GAME_TIME - this.gameTimeLeft
      this.settlement = {
        ...calculateSettlementScore(
          this.moveHistory, this.gameTimeLeft, this.gameWon, this.score, this.currentLevel
        ),
        won: this.gameWon
      }
      this.settlementVisible = true
    },

    dismissSettlement() {
      this.settlementVisible = false
    },

    // ── Level management ──

    selectLevel(index) {
      this.activeLevelIndex = index
      this.sidebarVisible = false
      // TODO: Load level from storage
    },

    createNewLevel() {
      this.sidebarVisible = false
      // TODO: Generate new level
    },

    // ── Helpers ──

    redraw() {
      this.draw()
    },

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

// ── Background blobs ──

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

// ── Board area ──

.board-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 10;
  margin-top: 73px;
  margin-bottom: 94px;
}

#canvas-wrapper {
  width: 95%;
  height: 90%;
  margin: 40px 6px;
}

#game-canvas {
  width: 100%;
  height: 100%;
}

// ── Settlement overlay ──

.settlement-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.settlement-card {
  background: white;
  border-radius: 32rpx;
  padding: 48rpx;
  min-width: 420rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
}

.settlement-title {
  font-family: $font-headline;
  font-size: $fs-headline-lg-mobile;
  font-weight: 800;
  color: $color-primary;
  display: block;
  text-align: center;
  margin-bottom: 32rpx;
}

.settlement-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
}

.settlement-row--final {
  border-top: 1px solid $color-outline-variant;
  margin-top: 12rpx;
  padding-top: 24rpx;
}

.settlement-label {
  font-family: $font-body;
  font-size: $fs-body-md;
  color: $color-on-surface-variant;
}

.settlement-value {
  font-family: $font-headline;
  font-size: $fs-body-md;
  font-weight: 700;
  color: $color-on-surface;

  &--big {
    font-size: $fs-headline-lg-mobile;
    color: $color-primary;
  }
}

.settlement-hint {
  font-family: $font-body;
  font-size: $fs-body-sm;
  color: $color-outline;
  display: block;
  text-align: center;
  margin-top: 24rpx;
}
</style>
