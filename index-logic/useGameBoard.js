import { ref } from 'vue'
import { createEmptyBoard, createEmptyColorLayer, createAxialMapping, countObstacles } from '@/game-core/board.js'
import { findAllJumpsFrom } from '@/game-core/logic.js'
import { solveGameBFS } from '@/game-core/solver.js'
import { setupDefaultBoard, buildLevelData, loadLevelIntoBoard, importLevelFromBase64 } from '@/game-core/generator.js'
import { EMPTY, PLAYER, BOARD_ROWS, BOARD_COLS } from '@/game-core/constants.js'

export function useGameBoard() {
  const board = ref(null)
  const boardColors = ref(null)
  const playerPos = ref(null)
  const indexToAxial = ref(new Map())
  const axialToIndex = ref(new Map())
  const selected = ref(null)
  const jumpTargets = ref([])
  const moveCount = ref(0)
  const remainingPieces = ref(0)
  const moveHistory = ref([])
  const history = ref([])
  const currentLevel = ref(null)
  const gameWon = ref(false)
  const hintPath = ref(null)

  function refreshJumpTargets() {
    if (!playerPos.value || gameWon.value) {
      jumpTargets.value = []
      return
    }
    jumpTargets.value = findAllJumpsFrom(
      board.value, indexToAxial.value, axialToIndex.value,
      playerPos.value[0], playerPos.value[1]
    )
  }

  async function loadLevelOntoBoard(levelData) {
    board.value = createEmptyBoard()
    boardColors.value = createEmptyColorLayer()
    loadLevelIntoBoard(board.value, boardColors.value, levelData)
    playerPos.value = [...levelData.player]
    const mapping = createAxialMapping(board.value)
    indexToAxial.value = mapping.indexToAxial
    axialToIndex.value = mapping.axialToIndex
    if (!levelData.solutionPath || levelData.solutionPath.length === 0) {
      levelData.solutionPath = await solveGameBFS(board.value, playerPos.value, indexToAxial.value, axialToIndex.value) || []
    }
    remainingPieces.value = countObstacles(board.value)
    return levelData
  }

  async function initGame(mapList) {
    if (mapList && mapList.length > 0) {
      const map = mapList[0]
      const levelData = importLevelFromBase64(map.map_str)
      currentLevel.value = await loadLevelOntoBoard(levelData)
    } else {
      board.value = createEmptyBoard()
      boardColors.value = createEmptyColorLayer()
      playerPos.value = setupDefaultBoard(board.value, boardColors.value)
      const mapping = createAxialMapping(board.value)
      indexToAxial.value = mapping.indexToAxial
      axialToIndex.value = mapping.axialToIndex
      currentLevel.value = await buildLevelData(board.value, boardColors.value, playerPos.value, indexToAxial.value, axialToIndex.value)
    }
    resetGameState()
  }

  function reloadCurrentLevel() {
    if (!currentLevel.value) return
    board.value = createEmptyBoard()
    boardColors.value = createEmptyColorLayer()
    loadLevelIntoBoard(board.value, boardColors.value, currentLevel.value)
    playerPos.value = [...currentLevel.value.player]
    const mapping = createAxialMapping(board.value)
    indexToAxial.value = mapping.indexToAxial
    axialToIndex.value = mapping.axialToIndex
    remainingPieces.value = countObstacles(board.value)
    resetGameState()
  }

  async function switchToLevelMap(map) {
    if (!map) return
    const levelData = importLevelFromBase64(map.map_str)
    currentLevel.value = await loadLevelOntoBoard(levelData)
    resetGameState()
  }

  function resetGameState() {
    selected.value = null
    jumpTargets.value = []
    moveCount.value = 0
    moveHistory.value = []
    history.value = []
    gameWon.value = false
    hintPath.value = null
  }

  return {
    board, boardColors, playerPos, indexToAxial, axialToIndex,
    selected, jumpTargets, moveCount, remainingPieces,
    moveHistory, history, currentLevel, gameWon, hintPath,
    refreshJumpTargets, loadLevelOntoBoard, initGame,
    reloadCurrentLevel, switchToLevelMap, resetGameState
  }
}
