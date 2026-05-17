import { ref, computed, onBeforeUnmount } from 'vue'
import { INITIAL_SCORE, SCORE_FLOOR, UNDO_SCORE_PENALTY, SCORE_DEDUCTION_ANIMATION_MS } from '@/game-core/constants.js'
import { formatScoreText } from '@/game-core/penalties.js'

export function useScore() {
  const score = ref(INITIAL_SCORE)
  const scoreDeductionQueue = ref([])
  const scoreDeductionAnimating = ref(false)
  const currentDeductionDisplay = ref(null)

  let scoreDeductionTimer = null

  const formattedScore = computed(() => formatScoreText(score.value))

  const scoreDisplayText = computed(() => {
    if (currentDeductionDisplay.value !== null) {
      return `-${currentDeductionDisplay.value}`
    }
    return formattedScore.value
  })

  function clearScoreDeductionAnimation() {
    if (scoreDeductionTimer) {
      clearTimeout(scoreDeductionTimer)
      scoreDeductionTimer = null
    }
    scoreDeductionQueue.value = []
    scoreDeductionAnimating.value = false
    currentDeductionDisplay.value = null
  }

  function enqueueScoreDeduction(deduction) {
    if (deduction <= 0) return
    scoreDeductionQueue.value.push(deduction)
    if (!scoreDeductionAnimating.value) {
      playNextScoreDeduction()
    }
  }

  function playNextScoreDeduction() {
    if (scoreDeductionQueue.value.length === 0) {
      scoreDeductionAnimating.value = false
      currentDeductionDisplay.value = null
      return
    }

    const deduction = scoreDeductionQueue.value.shift()
    currentDeductionDisplay.value = deduction
    scoreDeductionAnimating.value = true

    scoreDeductionTimer = setTimeout(() => {
      scoreDeductionTimer = null
      playNextScoreDeduction()
    }, SCORE_DEDUCTION_ANIMATION_MS)
  }

  function applyPenalty(penalty) {
    score.value = Math.max(SCORE_FLOOR, score.value - penalty)
    enqueueScoreDeduction(penalty)
  }

  function applyUndoPenalty() {
    score.value = Math.max(SCORE_FLOOR, score.value - UNDO_SCORE_PENALTY)
    clearScoreDeductionAnimation()
  }

  function resetScore() {
    clearScoreDeductionAnimation()
    score.value = INITIAL_SCORE
  }

  onBeforeUnmount(() => {
    clearScoreDeductionAnimation()
  })

  return {
    score,
    scoreDeductionQueue,
    scoreDeductionAnimating,
    currentDeductionDisplay,
    formattedScore,
    scoreDisplayText,
    enqueueScoreDeduction,
    clearScoreDeductionAnimation,
    applyPenalty,
    applyUndoPenalty,
    resetScore
  }
}
