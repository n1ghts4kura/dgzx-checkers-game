<template>
  <view class="page-game">
    <BackgroundBlobs />

    <GameAppBar :title="currentMapName" left-icon="menu_open" @left-click="sidebarVisible = true" />

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
        <CoverLayer :visible="!timerStarted" @start="startGame" />
        <VictoryOverlay :visible="gameWon" />
        <WarningToast :visible="warningVisible" />
      </view>
    </main>

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

    <ShareDialog :visible="shareDialogVisible" :map-name="shareMapName" :map-str="shareMapStr" @close="shareDialogVisible = false" />
    <DeleteDialog :visible="deleteDialogVisible" :map-name="deleteMapName" @confirm="confirmDeleteAction" @close="deleteDialogVisible = false" />
    <SettlementModal :visible="settlementVisible" :settlement="settlement" @restart="handleRestart" @dismiss="dismissSettlement" />
  </view>
</template>

<script>
import GameAppBar from '@/components/GameAppBar.vue'
import SidebarDrawer from '@/components/SidebarDrawer.vue'
import BottomDock from '@/components/BottomDock.vue'
import BoardGrid from '@/components/BoardGrid.vue'
import BackgroundBlobs from '@/components/BackgroundBlobs.vue'
import CoverLayer from '@/components/CoverLayer.vue'
import VictoryOverlay from '@/components/VictoryOverlay.vue'
import WarningToast from '@/components/WarningToast.vue'
import SettlementModal from '@/components/SettlementModal.vue'
import ShareDialog from '@/components/ShareDialog.vue'
import DeleteDialog from '@/components/DeleteDialog.vue'

import { createAxialMapping } from '@/game-core/board.js'
import { executeMove, saveStateSnapshot } from '@/game-core/logic.js'
import { solveGameBFS } from '@/game-core/solver.js'
import { calculateSettlementScore } from '@/game-core/penalties.js'
import { playCaptureSound, playVictorySound } from '@/game-core/audio.js'
import { EMPTY, PLAYER } from '@/game-core/constants.js'

import { useTimers } from '@/index-logic/useTimers.js'
import { useScore } from '@/index-logic/useScore.js'
import { useLevels } from '@/index-logic/useLevels.js'
import { useGameBoard } from '@/index-logic/useGameBoard.js'

export default {
  components: {
    GameAppBar, SidebarDrawer, BottomDock, BoardGrid,
    BackgroundBlobs, CoverLayer, VictoryOverlay, WarningToast,
    SettlementModal, ShareDialog, DeleteDialog
  },

  setup() {
    const timers = useTimers()
    const scoreCtx = useScore()
    const levels = useLevels()
    const game = useGameBoard()

    return { ...timers, ...scoreCtx, ...levels, ...game }
  },

  data() {
    return {
      sidebarVisible: false,
      settlementVisible: false,
      settlement: { factor1: '0', factor2: '0', finalScore: 0, won: false },
      maxHistorySize: 50,
      shareDialogVisible: false,
      shareMapStr: '',
      shareMapName: '',
      deleteDialogVisible: false,
      deleteMapIndex: -1,
      deleteMapName: ''
    }
  },

  computed: {
    jumpTargetSet() {
      return new Set(this.jumpTargets.map(([r, c]) => `${r},${c}`))
    }
  },

  created() {
    this.loadLevelsFromStorage()
    this.initGame(this.localMaps)
  },

  onShow() {
    this.refreshLevelsFromStorage()
    this.checkPendingSwitch((newIndex) => { this.selectLevel(newIndex) })
  },

  methods: {
    startGame() {
      const self = this
      this.startTimers(
        () => { self.triggerSettlement() },
        (penalty) => { self.applyPenalty(penalty) }
      )
      this.refreshJumpTargets()
    },

    handleCellTap({ r, c }) {
      if (this.gameWon) return
      if (this.board[r][c] === EMPTY && this.playerPos && this.jumpTargetSet.has(`${r},${c}`)) {
        this.executeJumpTo(r, c)
      } else if (this.board[r][c] === PLAYER) {
        this.selected = this.selected && this.selected[0] === r && this.selected[1] === c ? null : [r, c]
        this.refreshJumpTargets()
      } else {
        this.selected = null
      }
    },

    executeJumpTo(r, c) {
      if (!this.playerPos || !this.selected) this.selected = [...this.playerPos]

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
        this.startTimers(
          () => { this.triggerSettlement() },
          (penalty) => { this.applyPenalty(penalty) }
        )
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
      Object.assign(this, {
        board: prevState.board, boardColors: prevState.boardColors,
        playerPos: prevState.playerPos, moveCount: prevState.moveCount,
        remainingPieces: prevState.remainingPieces, moveHistory: prevState.moveHistory,
        selected: null, jumpTargets: [], hintPath: null,
        gameWon: false, settlementVisible: false
      })
      const mapping = createAxialMapping(this.board)
      this.indexToAxial = mapping.indexToAxial
      this.axialToIndex = mapping.axialToIndex
      this.applyUndoPenalty()
      this.resetMoveTimer()
      this.refreshJumpTargets()
    },

    handleRestart() {
      this.reloadCurrentLevel()
      this.resetScore()
      this.resetGameTimer()
      this.settlementVisible = false
      this.refreshJumpTargets()
    },

    async handleHint() {
      if (this.hintPath) { this.hintPath = null; return }
      if (this.playerPos) {
        this.hintPath = await solveGameBFS(this.board, this.playerPos, this.indexToAxial, this.axialToIndex)
      }
    },

    triggerSettlement() {
      this.settlement = {
        ...calculateSettlementScore(this.moveHistory, this.gameTimeLeft, this.gameWon, this.score, this.currentLevel),
        won: this.gameWon
      }
      this.settlementVisible = true
    },

    dismissSettlement() {
      this.settlementVisible = false
      this.handleRestart()
    },

    async selectLevel(index) {
      if (index === this.activeLevelIndex) { this.sidebarVisible = false; return }
      this.switchToLevel(index)
      this.sidebarVisible = false
      this.stopTimers()
      this.clearScoreDeductionAnimation()
      await this.switchToLevelMap(this.localMaps[index])
      this.resetScore()
      this.resetGameTimer()
      this.refreshJumpTargets()
    },

    createNewLevel() {
      this.sidebarVisible = false
      uni.navigateTo({ url: '/pages/create/create' })
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
      this.shareDialogVisible = true
    },

    handleDeleteLevel(index) {
      const map = this.localMaps[index]
      if (!map) return
      this.deleteMapIndex = index
      this.deleteMapName = map.map_name
      this.deleteDialogVisible = true
    },

    async confirmDeleteAction() {
      this.confirmDelete(this.deleteMapIndex)
      this.deleteDialogVisible = false
      this.deleteMapIndex = -1
      if (this.localMaps.length === 0) {
        await this.initGame(this.localMaps)
      } else {
        await this.switchToLevelMap(this.localMaps[this.activeLevelIndex])
      }
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
</style>
