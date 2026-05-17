<template>
  <view class="page-game">
    <!-- Background blobs -->
    <view class="bg-blobs">
      <view class="bg-blob bg-blob--top-left" />
      <view class="bg-blob bg-blob--center" />
      <view class="bg-blob bg-blob--bottom-right" />
    </view>

    <!-- TopAppBar -->
    <GameAppBar
      :title="currentMapName"
      left-icon="menu_open"
      @left-click="sidebarVisible = true"
    />

    <!-- Sidebar drawer -->
    <SidebarDrawer
      :visible="sidebarVisible"
      :level-names="levelNames"
      :active-level-index="activeLevelIndex"
      @close="sidebarVisible = false"
      @select-level="selectLevel"
      @create-level="createNewLevel"
      @share-level="handleShareLevel"
      @delete-level="handleDeleteLevel"
      @import-level="handleImport"
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
          :board-visible="timerStarted"
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
            <text class="cover-layer__text">点击\n开始</text>
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

    <!-- Share dialog -->
    <view
      class="dialog-overlay"
      :class="{ 'dialog-overlay--visible': shareDialogVisible }"
      @tap="shareDialogVisible = false"
    >
      <view class="share-card" @tap.stop>
        <text class="share-title">{{ shareMapName }}</text>
        <view class="share-code-wrapper">
          <text class="share-code" selectable>{{ shareMapStr }}</text>
        </view>
        <view class="share-actions">
          <view class="share-btn share-btn--copy" @tap="copyShareMapStr">
            <text>{{ shareCopied ? '已复制' : '复制代码' }}</text>
          </view>
          <view class="share-btn share-btn--cancel" @tap="shareDialogVisible = false">
            <text>关闭</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Delete confirmation dialog -->
    <view
      class="dialog-overlay"
      :class="{ 'dialog-overlay--visible': deleteDialogVisible }"
      @tap="deleteDialogVisible = false"
    >
      <view class="delete-card" @tap.stop>
        <text class="delete-title">确认删除？</text>
        <text class="delete-subtitle">将永久删除「{{ deleteMapName }}」，不可恢复。</text>
        <view class="delete-actions">
          <view class="delete-btn delete-btn--yes" @tap="confirmDelete">
            <text>删除</text>
          </view>
          <view class="delete-btn delete-btn--no" @tap="deleteDialogVisible = false">
            <text>取消</text>
          </view>
        </view>
      </view>
    </view>

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
import { setupDefaultBoard, buildLevelData, loadLevelIntoBoard, importLevelFromBase64 } from '@/game-core/generator.js'
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
      localMaps: [],
      levelNames: [],
      activeLevelIndex: 0,
      maxHistorySize: 50,

      // Share dialog
      shareDialogVisible: false,
      shareMapStr: '',
      shareMapName: '',
      shareCopied: false,

      // Delete dialog
      deleteDialogVisible: false,
      deleteMapIndex: -1,
      deleteMapName: ''
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
    jumpTargetSet() {
      return new Set(this.jumpTargets.map(([r, c]) => `${r},${c}`))
    },

    currentMapName() {
      return this.levelNames[this.activeLevelIndex] || '棋盘'
    },

    scoreDisplayText() {
      if (this.currentDeductionDisplay !== null) {
        return `-${this.currentDeductionDisplay}`
      }
      return this.formattedScore
    }
  },

  created() {
    this.loadLevelsFromStorage()
    this.initGame()
  },

  onShow() {
    this.refreshLevelsFromStorage()
    this.checkPendingSwitch()
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

      if (this.localMaps.length > 0) {
        const map = this.localMaps[this.activeLevelIndex] || this.localMaps[0]
        const levelData = importLevelFromBase64(map.map_str)
        loadLevelIntoBoard(this.board, this.boardColors, levelData)
        this.playerPos = [...levelData.player]
        const mapping = createAxialMapping(this.board)
        this.indexToAxial = mapping.indexToAxial
        this.axialToIndex = mapping.axialToIndex
        if (!levelData.solutionPath || levelData.solutionPath.length === 0) {
          const solutionPath = solveGameBFS(this.board, this.playerPos, this.indexToAxial, this.axialToIndex)
          levelData.solutionPath = solutionPath || []
        }
        this.currentLevel = levelData
      } else {
        this.playerPos = setupDefaultBoard(this.board, this.boardColors)
        const mapping = createAxialMapping(this.board)
        this.indexToAxial = mapping.indexToAxial
        this.axialToIndex = mapping.axialToIndex
        this.currentLevel = buildLevelData(this.board, this.boardColors, this.playerPos, this.indexToAxial, this.axialToIndex)
      }

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
      this.clearScoreDeductionAnimation()
    },

    refreshJumpTargets() {
      if (!this.playerPos || this.gameWon) {
        this.jumpTargets = []
        return
      }
      const targets = findAllJumpsFrom(
        this.board, this.indexToAxial, this.axialToIndex,
        this.playerPos[0], this.playerPos[1]
      )
      this.jumpTargets = targets
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
      this.refreshJumpTargets()
    },

    // ── Game actions ──

    handleCellTap({ r, c }) {
      if (this.gameWon) return

      const cellValue = this.board[r][c]

      // Direct jump: tapping a jump target jumps immediately (like original game)
      if (cellValue === EMPTY && this.playerPos && this.jumpTargetSet.has(`${r},${c}`)) {
        this.executeJumpTo(r, c)
        return
      }

      // Tap player: toggle selection
      if (cellValue === PLAYER) {
        if (this.selected && this.selected[0] === r && this.selected[1] === c) {
          this.selected = null
        } else {
          this.selected = [r, c]
          this.refreshJumpTargets()
        }
        return
      }

      // Tap anything else: deselect
      this.selected = null
    },

    executeJumpTo(r, c) {
      if (!this.playerPos || !this.selected) {
        // Allow jump even without prior selection (direct tap on target)
        this.selected = [...this.playerPos]
      }

      const result = executeMove(
        this.board, this.boardColors, this.playerPos, r, c,
        this.indexToAxial, this.axialToIndex
      )

      if (!result) return

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

      this.refreshJumpTargets()
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
      this.refreshJumpTargets()
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
        this.refreshJumpTargets()
      }
    },

    handleHint() {
      if (this.hintPath) {
        this.hintPath = null
        return
      }
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

    loadLevelsFromStorage() {
      try {
        const stored = uni.getStorageSync('local_maps')
        if (stored && Array.isArray(stored) && stored.length > 0) {
          this.localMaps = stored
        } else {
          this.initDefaultLocalMaps()
        }
      } catch (e) {
        this.initDefaultLocalMaps()
      }
      this.syncDefaultMapStr()
      this.levelNames = this.localMaps.map(m => m.map_name)
    },

    syncDefaultMapStr() {
      const latest = this.buildDefaultMapStr()
      let changed = false
      for (let i = 0; i < this.localMaps.length; i++) {
        if (this.localMaps[i].map_name === '决赛地图' && this.localMaps[i].map_str !== latest) {
          this.localMaps[i].map_str = latest
          changed = true
        }
      }
      if (changed) {
        uni.setStorageSync('local_maps', this.localMaps)
      }
    },

    checkPendingSwitch() {
      try {
        const pending = uni.getStorageSync('pending_switch_to_last')
        if (pending && this.localMaps.length > 0) {
          uni.removeStorageSync('pending_switch_to_last')
          const newIndex = this.localMaps.length - 1
          this.selectLevel(newIndex)
        }
      } catch (e) { /* ignore */ }
    },

    refreshLevelsFromStorage() {
      try {
        const stored = uni.getStorageSync('local_maps')
        if (stored && Array.isArray(stored)) {
          this.localMaps = stored
          this.levelNames = this.localMaps.map(m => m.map_name)
        }
      } catch (e) { /* ignore */ }
    },

    buildDefaultMapStr() {
      return 'eyJvYnN0YWNsZXMiOltbNCw2LCIjRkZENzAwIl0sWzQsMTEsIiNGRjhDMDAiXSxbNSwxMywiI0ZGRDcwMCJdLFs2LDMsIiMzMjgyRkYiXSxbNiw1LCIjRkZENzAwIl0sWzYsOCwiI0EwMjBGMCJdLFs2LDEwLCIjRkY4QzAwIl0sWzcsNiwiI0RDMTQzQyJdLFs3LDgsIiNEQzE0M0MiXSxbOCw1LCIjRkY4QzAwIl0sWzgsNywiIzMyODJGRiJdLFs4LDEwLCIjRkZENzAwIl0sWzgsMTIsIiNEQzE0M0MiXSxbOSw1LCIjRkY4QzAwIl0sWzksOCwiI0RDMTQzQyJdLFsxMCwzLCIjRkZENzAwIl0sWzEwLDcsIiNGRkQ3MDAiXSxbMTAsMTEsIiNGRkQ3MDAiXSxbMTEsOCwiI0EwMjBGMCJdLFsxMSwxMiwiI0ZGOEMwMCJdLFsxMiwzLCIjRkZENzAwIl0sWzEyLDYsIiNBMDIwRjAiXSxbMTIsMTEsIiNGRkQ3MDAiXSxbMTMsNywiI0EwMjBGMCJdLFsxMyw5LCIjMzI4MkZGIl1dLCJwbGF5ZXIiOls4LDRdLCJzb2x1dGlvblBhdGgiOltbOCw0XSxbOCw2XSxbNiw3XSxbNiw5XSxbOCw4XSxbMTAsOV0sWzEwLDEzXSxbMTIsMTJdLFs0LDhdLFs0LDE0XSxbNiwxM10sWzYsN10sWzEyLDRdLFsxMiwyXSxbOCw0XSxbNCwyXSxbNCwxMF0sWzEyLDE0XSxbMTIsOF0sWzE0LDddLFs4LDEwXSxbOCw0XSxbMTYsOF0sWzEwLDExXSxbMTAsM10sWzIsN11dfQ=='
    },

    initDefaultLocalMaps() {

      this.localMaps = [
        { map_name: '决赛地图', map_str: this.buildDefaultMapStr() }
      ]
      uni.setStorageSync('local_maps', this.localMaps)
    },

    selectLevel(index) {
      if (index === this.activeLevelIndex) {
        this.sidebarVisible = false
        return
      }
      this.activeLevelIndex = index
      this.sidebarVisible = false

      this.stopTimers()
      this.clearScoreDeductionAnimation()

      const map = this.localMaps[index]
      if (!map) return

      this.board = createEmptyBoard()
      this.boardColors = createEmptyColorLayer()
      const levelData = importLevelFromBase64(map.map_str)
      loadLevelIntoBoard(this.board, this.boardColors, levelData)
      this.playerPos = [...levelData.player]
      const mapping = createAxialMapping(this.board)
      this.indexToAxial = mapping.indexToAxial
      this.axialToIndex = mapping.axialToIndex
      if (!levelData.solutionPath || levelData.solutionPath.length === 0) {
        const solutionPath = solveGameBFS(this.board, this.playerPos, this.indexToAxial, this.axialToIndex)
        levelData.solutionPath = solutionPath || []
      }
      this.currentLevel = levelData
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
      this.refreshJumpTargets()
    },

    createNewLevel() {
      this.sidebarVisible = false
      uni.navigateTo({ url: '/pages/create/create' })
    },

    configLevel(index) {
      uni.navigateTo({ url: `/pages/config/config?index=${index}` })
    },

    handleImport() {
      this.sidebarVisible = false
      uni.navigateTo({ url: '/pages/load/load' })
    },

    handleShareLevel(index) {
      const map = this.localMaps[index]
      if (!map) return
      this.shareMapName = map.map_name
      this.shareMapStr = map.map_str
      this.shareCopied = false
      this.shareDialogVisible = true
    },

    copyShareMapStr() {
      uni.setClipboardData({
        data: this.shareMapStr,
        success: () => {
          this.shareCopied = true
          setTimeout(() => { this.shareCopied = false }, 2000)
        }
      })
    },

    handleDeleteLevel(index) {
      const map = this.localMaps[index]
      if (!map) return
      this.deleteMapIndex = index
      this.deleteMapName = map.map_name
      this.deleteDialogVisible = true
    },

    confirmDelete() {
      if (this.deleteMapIndex < 0) return

      this.localMaps.splice(this.deleteMapIndex, 1)
      uni.setStorageSync('local_maps', this.localMaps)
      this.levelNames = this.localMaps.map(m => m.map_name)

      if (this.localMaps.length === 0) {
        this.initDefaultLocalMaps()
        this.levelNames = this.localMaps.map(m => m.map_name)
        this.activeLevelIndex = 0
        this.initGame()
      } else if (this.activeLevelIndex >= this.localMaps.length) {
        this.activeLevelIndex = this.localMaps.length - 1
        this.selectLevel(this.activeLevelIndex)
      } else if (this.deleteMapIndex === this.activeLevelIndex) {
        this.selectLevel(this.activeLevelIndex)
      } else if (this.deleteMapIndex < this.activeLevelIndex) {
        this.activeLevelIndex--
      }

      this.deleteDialogVisible = false
      this.deleteMapIndex = -1
    },

  }
}
</script>

<style lang="scss" scoped>
@import '../../common/design-tokens';
@import '../../common/glass-utilities';

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

// ── Blob animations ──

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
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  @include glass-surface(24px);
  @include glass-border;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  border-radius: 24rpx;
  padding: 48rpx 64rpx;
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
  right: 8rpx;
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

// ── Dialog overlay (share + delete) ──

.dialog-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease;

  &--visible {
    opacity: 1;
    pointer-events: auto;
  }
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

// ── Share dialog ──

.share-card {
  background: white;
  border-radius: 32rpx;
  padding: 48rpx;
  width: 560rpx;
  max-width: 90vw;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
}

.share-title {
  font-family: $font-headline;
  font-size: $fs-headline-lg-mobile;
  font-weight: 800;
  color: $color-primary;
  display: block;
  text-align: center;
  margin-bottom: 24rpx;
}

.share-code-wrapper {
  background: $color-surface-container-low;
  border-radius: 16rpx;
  padding: 24rpx;
  max-height: 240rpx;
  overflow-y: auto;
  margin-bottom: 24rpx;
}

.share-code {
  font-family: monospace;
  font-size: 12px;
  color: $color-on-surface-variant;
  word-break: break-all;
  line-height: 1.6;
  user-select: text;
  -webkit-user-select: text;
}

.share-actions {
  display: flex;
  gap: 16rpx;
  justify-content: center;
}

.share-btn {
  padding: 20rpx 48rpx;
  border-radius: 16rpx;
  font-family: $font-headline;
  font-size: $fs-body-md;
  font-weight: 700;
  text-align: center;

  &--copy {
    background: $color-primary;
    color: $color-on-primary;
    box-shadow: 0 4rpx 16rpx rgba(0, 108, 73, 0.3);
  }

  &--cancel {
    background: $color-surface-container-high;
    color: $color-on-surface-variant;
  }
}

// ── Delete confirmation dialog ──

.delete-card {
  background: white;
  border-radius: 32rpx;
  padding: 48rpx;
  width: 500rpx;
  max-width: 85vw;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
  text-align: center;
}

.delete-title {
  font-family: $font-headline;
  font-size: $fs-headline-lg-mobile;
  font-weight: 800;
  color: $color-error;
  display: block;
  margin-bottom: 16rpx;
}

.delete-subtitle {
  font-family: $font-body;
  font-size: $fs-body-sm;
  color: $color-on-surface-variant;
  display: block;
  margin-bottom: 32rpx;
  line-height: 1.5;
}

.delete-actions {
  display: flex;
  gap: 16rpx;
  justify-content: center;
}

.delete-btn {
  padding: 20rpx 48rpx;
  border-radius: 16rpx;
  font-family: $font-headline;
  font-size: $fs-body-md;
  font-weight: 700;
  text-align: center;

  &--yes {
    background: $color-error;
    color: $color-on-error;
    box-shadow: 0 4rpx 16rpx rgba(186, 26, 26, 0.3);
  }

  &--no {
    background: $color-surface-container-high;
    color: $color-on-surface-variant;
  }
}
</style>
