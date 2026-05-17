import { ref, computed, onBeforeUnmount } from 'vue'
import {
  GAME_TIME, SCORE_FLOOR, UNDO_SCORE_PENALTY,
  MOVE_TIME_PENALTY_PER_INTERVAL, MOVE_TIME_WARNING_THRESHOLD,
  PENALTY_INTERVAL
} from '@/game-core/constants.js'
import { getPenaltyThresholdsCrossed, getNextThresholdTime } from '@/game-core/penalties.js'

export function useTimers() {
  const gameTimeLeft = ref(GAME_TIME)
  const moveTimeElapsed = ref(0)
  const timerStarted = ref(false)
  const lastPenaltyThreshold = ref(0)
  const moveTimerWarning = ref(false)
  const warningVisible = ref(false)
  const warningSuppressed = ref(false)

  let gameTimerInterval = null
  let moveTimerInterval = null

  const gameTimeFormatted = computed(() => {
    const totalSec = Math.max(0, Math.ceil(gameTimeLeft.value / 1000))
    const min = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  })

  const moveTimeFormatted = computed(() => {
    const totalMs = moveTimeElapsed.value
    const sec = Math.floor(totalMs / 1000)
    const cs = Math.floor((totalMs % 1000) / 10)
    return `${sec}.${String(cs).padStart(2, '0')}`
  })

  const moveTimerRedIntensity = computed(() => {
    if (moveTimeElapsed.value < 15000) return 0
    return Math.min(1, (moveTimeElapsed.value - 15000) / 15000)
  })

  function startTimers(onTimerExpired, onPenalty) {
    if (timerStarted.value) return
    timerStarted.value = true

    gameTimerInterval = setInterval(() => {
      gameTimeLeft.value -= 100
      if (gameTimeLeft.value <= 0) {
        gameTimeLeft.value = 0
        stopTimers()
        if (onTimerExpired) onTimerExpired()
      }
    }, 100)

    let lastMoveTick = Date.now()
    moveTimerInterval = setInterval(() => {
      const now = Date.now()
      moveTimeElapsed.value += now - lastMoveTick
      lastMoveTick = now
      if (onPenalty) checkMovePenalties(onPenalty)
    }, 100)
  }

  function stopTimers() {
    if (gameTimerInterval) {
      clearInterval(gameTimerInterval)
      gameTimerInterval = null
    }
    if (moveTimerInterval) {
      clearInterval(moveTimerInterval)
      moveTimerInterval = null
    }
  }

  function resetMoveTimer() {
    moveTimeElapsed.value = 0
    lastPenaltyThreshold.value = 0
    moveTimerWarning.value = false
    warningVisible.value = false
    warningSuppressed.value = false
  }

  function checkMovePenalties(onPenalty) {
    const elapsed = moveTimeElapsed.value
    const nextThreshold = getNextThresholdTime(elapsed)
    const inWarning = (nextThreshold - elapsed <= 5000 && nextThreshold > elapsed)
    moveTimerWarning.value = inWarning
    warningVisible.value = inWarning && !warningSuppressed.value

    const thresholdsCrossed = getPenaltyThresholdsCrossed(elapsed)
    if (thresholdsCrossed > lastPenaltyThreshold.value) {
      const newPenalties = thresholdsCrossed - lastPenaltyThreshold.value
      const penalty = newPenalties * MOVE_TIME_PENALTY_PER_INTERVAL
      lastPenaltyThreshold.value = thresholdsCrossed
      if (onPenalty) onPenalty(penalty)

      warningSuppressed.value = true
      warningVisible.value = false
      setTimeout(() => {
        warningSuppressed.value = false
        if (moveTimerWarning.value) {
          warningVisible.value = true
        }
      }, 500)
    }
  }

  function resetGameTimer() {
    gameTimeLeft.value = GAME_TIME
    moveTimeElapsed.value = 0
    lastPenaltyThreshold.value = 0
    timerStarted.value = false
    moveTimerWarning.value = false
    warningVisible.value = false
    warningSuppressed.value = false
    stopTimers()
  }

  onBeforeUnmount(() => {
    stopTimers()
  })

  return {
    gameTimeLeft,
    moveTimeElapsed,
    timerStarted,
    lastPenaltyThreshold,
    moveTimerWarning,
    warningVisible,
    warningSuppressed,
    gameTimeFormatted,
    moveTimeFormatted,
    moveTimerRedIntensity,
    startTimers,
    stopTimers,
    resetMoveTimer,
    checkMovePenalties,
    resetGameTimer
  }
}
