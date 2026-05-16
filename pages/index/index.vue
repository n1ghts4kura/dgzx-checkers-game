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
      @config-level="configLevel"
    />

    <!-- Board area -->
    <main class="board-area">
      <view class="board-container">
        <BoardGrid
          :board="board"
          :board-colors="boardColors"
          :player-pos="playerPos"
          :selected="selected"
          :jump-targets="jumpTargets"
          :hint-path="hintPath"
          :disabled="gameWon"
          @cell-tap="handleCellTap"
        />

        <!-- Cover layer (before game starts) -->
        <view
          :class="{ 'cover-layer--hidden': timerStarted }"
          class="cover-layer"
          @tap="startGame"
        >
          <view class="cover-layer__inner">
            <text class="cover-layer__icon">▶</text>
            <text class="cover-layer__text">点击开始</text>
          </view>
        </view>

        <!-- Victory floating message -->
        <view v-if="gameWon" class="victory-overlay">
          <text class="victory-overlay__text">🎉 胜利！棋子已到达顶部！</text>
        </view>

        <!-- Warning toast -->
        <view class="warning-toast" :class="{ 'warning-toast--visible': warningVisible }">
          <text class="warning-toast__text">快落子！要扣分啦！</text>
        </view>
      </view>
    </main>

    <!-- Bottom dock -->
    <BottomDock
      :score="scoreDisplayText"
      :game-time-formatted="gameTimeFormatted"
      :move-time-formatted="moveTimeFormatted"
      :move-timer-warning="moveTimerWarning"
      :move-timer-red-intensity="moveTimerRedIntensity"
      :can-undo="history.length > 0"
      :score-deducting="scoreDeductionAnimating"
      @undo="handleUndo"
      @hint="handleHint"
      @restart="handleRestart"
    />

    <!-- Settlement modal -->
    <view v-if="settlementVisible" class="settlement-overlay" @tap="dismissSettlement">
      <view class="settlement-card" @tap.stop>
        <text
          class="settlement-title"
          :style="{ color: settlement.won ? '#27ae60' : '#e74c3c' }"
        >{{ settlement.won ? '🎉 恭喜通关！' : '⏰ 时间到！' }}</text>
        <view class="settlement-row">
          <text class="settlement-label">完成度因子</text>
          <text class="settlement-value">{{ settlement.factor1 }}</text>
        </view>
        <view class="settlement-row">
          <text class="settlement-label">积分因子</text>
          <text class="settlement-value">{{ settlement.factor2 }}</text>
        </view>
        <view class="settlement-row settlement-row--final">
          <text class="settlement-label">最终得分</text>
          <text class="settlement-value settlement-value--big">{{ settlement.finalScore }} / 100</text>
        </view>
        <view class="settlement-actions">
          <view class="settlement-btn settlement-btn--primary" @tap="handleRestart">
            <text>再来一局</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import GameAppBar from '@/components/GameAppBar.vue'
import SidebarDrawer from '@/components/SidebarDrawer.vue'
import BottomDock from '@/components/BottomDock.vue'
import BoardGrid from '@/components/BoardGrid.vue'

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
  components: { GameAppBar, SidebarDrawer, BottomDock, BoardGrid },

  data() {
    return {
      // Game state
      board: null,
      boardColors: null,
      playerPos: null,
      indexToAxial: new Map(),
      axialToIndex: new Map(),
      selected: null,
      jumpTargets: [],
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
      warningVisible: false,
      warningSuppressed: false,
      scoreDeductionQueue: [],
      scoreDeductionAnimating: false,
      scoreDeductionTimer: null,
      currentDeductionDisplay: null,

      // Hint
      hintPath: null,

      // UI
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
    },
    scoreDisplayText() {
      if (this.currentDeductionDisplay !== null) {
        return `-${this.currentDeductionDisplay}`
      }
      return this.formattedScore
    }
  },

  created() {
    this.initGame()
  },

  beforeDestroy() {
    this.stopTimers()
  },

  methods: {
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
      this.jumpTargets = []
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
      this.clearScoreDeductionAnimation()
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
      this.warningVisible = false
      this.warningSuppressed = false
    },

    checkMovePenalties() {
      const nextThreshold = getNextThresholdTime(this.moveTimeElapsed)
      const inWarning = (nextThreshold - this.moveTimeElapsed <= 5000 && nextThreshold > this.moveTimeElapsed)
      this.moveTimerWarning = inWarning
      this.warningVisible = inWarning && !this.warningSuppressed

      const thresholdsCrossed = getPenaltyThresholdsCrossed(this.moveTimeElapsed)
      if (thresholdsCrossed > this.lastPenaltyThreshold) {
        const newPenalties = thresholdsCrossed - this.lastPenaltyThreshold
        const penalty = newPenalties * MOVE_TIME_PENALTY_PER_INTERVAL
        this.score = Math.max(SCORE_FLOOR, this.score - penalty)
        this.lastPenaltyThreshold = thresholdsCrossed
        this.enqueueScoreDeduction(penalty)

        this.warningSuppressed = true
        this.warningVisible = false
        setTimeout(() => {
          this.warningSuppressed = false
          if (this.moveTimerWarning) {
            this.warningVisible = true
          }
        }, 500)
      }
    },

    // ── Score deduction animation ──

    clearScoreDeductionAnimation() {
      if (this.scoreDeductionTimer) {
        clearTimeout(this.scoreDeductionTimer)
        this.scoreDeductionTimer = null
      }
      this.scoreDeductionQueue = []
      this.scoreDeductionAnimating = false
      this.currentDeductionDisplay = null
    },

    enqueueScoreDeduction(deduction) {
      if (deduction <= 0) return
      this.scoreDeductionQueue.push(deduction)
      if (!this.scoreDeductionAnimating) {
        this.playNextScoreDeduction()
      }
    },

    playNextScoreDeduction() {
      if (this.scoreDeductionQueue.length === 0) {
        this.scoreDeductionAnimating = false
        this.currentDeductionDisplay = null
        return
      }

      const deduction = this.scoreDeductionQueue.shift()
      this.currentDeductionDisplay = deduction
      this.scoreDeductionAnimating = true

      this.scoreDeductionTimer = setTimeout(() => {
        this.scoreDeductionTimer = null
        this.playNextScoreDeduction()
      }, 1500)
    },

    // ── Start game ──

    startGame() {
      if (this.timerStarted) return
      this.startTimers()
    },

    // ── Game actions ──

    handleCellTap({ r, c }) {
      if (this.gameWon) return

      const cellValue = this.board[r][c]

      // Tap player: toggle selection and show jump targets
      if (cellValue === PLAYER) {
        if (this.selected) {
          this.selected = null
          this.jumpTargets = []
        } else {
          this.selected = [r, c]
          this.jumpTargets = findAllJumpsFrom(
            this.board, this.indexToAxial, this.axialToIndex, r, c
          )
        }
        return
      }

      // Tap empty cell: try to jump
      if (cellValue === EMPTY && this.playerPos && this.selected) {
        const result = executeMove(
          this.board, this.boardColors, this.playerPos, r, c,
          this.indexToAxial, this.axialToIndex
        )

        if (result) {
          const oldPlayerPos = [...this.playerPos]

          this.history.push(saveStateSnapshot(
            this.board, this.boardColors, oldPlayerPos,
            this.moveCount, this.remainingPieces, this.moveHistory
          ))
          if (this.history.length > this.maxHistorySize) this.history.shift()

          this.board = result.newBoard
          this.boardColors = result.newBoardColors
          this.playerPos = result.newPlayerPos
          this.moveCount++
          this.remainingPieces--
          this.moveHistory.push([oldPlayerPos, [r, c]])

          const mapping = createAxialMapping(this.board)
          this.indexToAxial = mapping.indexToAxial
          this.axialToIndex = mapping.axialToIndex

          this.selected = null
          this.jumpTargets = []
          this.hintPath = null

          if (!this.timerStarted) {
            this.startTimers()
          }

          this.resetMoveTimer()
          playCaptureSound()

          if (this.playerPos[0] <= 3) {
            this.gameWon = true
            this.stopTimers()
            playVictorySound()
            this.triggerSettlement()
          }

          return
        }
      }

      // Deselect on invalid tap
      this.selected = null
      this.jumpTargets = []
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
      this.jumpTargets = []
      this.hintPath = null
      this.gameWon = false
      this.settlementVisible = false

      const mapping = createAxialMapping(this.board)
      this.indexToAxial = mapping.indexToAxial
      this.axialToIndex = mapping.axialToIndex

      this.score = Math.max(SCORE_FLOOR, this.score - UNDO_SCORE_PENALTY)
      this.clearScoreDeductionAnimation()
      this.resetMoveTimer()
    },

    handleRestart() {
      if (this.currentLevel) {
        this.stopTimers()
        this.clearScoreDeductionAnimation()
        this.board = createEmptyBoard()
        this.boardColors = createEmptyColorLayer()
        loadLevelIntoBoard(this.board, this.boardColors, this.currentLevel)
        this.playerPos = [...this.currentLevel.player]
        const mapping = createAxialMapping(this.board)
        this.indexToAxial = mapping.indexToAxial
        this.axialToIndex = mapping.axialToIndex
        this.remainingPieces = countObstacles(this.board)
        this.selected = null
        this.jumpTargets = []
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
      }
    },

    handleHint() {
      if (!this.playerPos) return
      const path = solveGameBFS(this.board, this.playerPos, this.indexToAxial, this.axialToIndex)
      this.hintPath = path
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
      this.handleRestart()
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

    configLevel(index) {
      uni.navigateTo({ url: `/pages/config/config?index=${index}` })
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
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 10;
}

.board-container {
  width: 95%;
  height: 90%;
  margin: 40px 6px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

// ── Cover layer ──

.cover-layer {
  position: absolute;
  inset: 0;
  background: rgba(240, 240, 240, 0.97);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  border-radius: 12rpx;
  transition: opacity 250ms ease;
}

.cover-layer--hidden {
  opacity: 0;
  pointer-events: none;
}

.cover-layer__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.cover-layer__icon {
  font-size: 64rpx;
  color: $color-primary;
}

.cover-layer__text {
  font-family: $font-headline;
  font-size: $fs-headline-lg-mobile;
  font-weight: 700;
  color: $color-on-surface;
}

// ── Victory overlay ──

.victory-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(46, 204, 113, 0.92);
  padding: 32rpx 48rpx;
  border-radius: 20rpx;
  z-index: 30;
  box-shadow: 0 10rpx 50rpx rgba(0, 0, 0, 0.2);
  animation: victory-pulse 2s infinite;
}

.victory-overlay__text {
  font-family: $font-headline;
  font-size: $fs-headline-lg-mobile;
  font-weight: 800;
  color: white;
  text-align: center;
}

@keyframes victory-pulse {
  0% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.05); }
  100% { transform: translate(-50%, -50%) scale(1); }
}

// ── Warning toast ──

.warning-toast {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  z-index: 35;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid $color-error;
  border-radius: 16rpx;
  padding: 14rpx 28rpx;
  box-shadow: 0 4rpx 24rpx rgba(186, 26, 26, 0.15);
  transform: translateX(110%);
  transition: transform 400ms cubic-bezier(0.09, 0.57, 0.30, 1.02);
  pointer-events: none;
}

.warning-toast--visible {
  transform: translateX(0);
}

.warning-toast__text {
  font-family: $font-body;
  font-size: $fs-body-sm;
  color: $color-error;
  font-weight: 700;
  white-space: nowrap;
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

.settlement-actions {
  display: flex;
  justify-content: center;
  margin-top: 32rpx;
}

.settlement-btn {
  padding: 20rpx 48rpx;
  border-radius: 16rpx;
  font-family: $font-headline;
  font-size: $fs-body-md;
  font-weight: 700;
  text-align: center;

  &--primary {
    background: $color-primary;
    color: $color-on-primary;
    box-shadow: 0 4rpx 16rpx rgba(0, 108, 73, 0.3);
  }
}
</style>
