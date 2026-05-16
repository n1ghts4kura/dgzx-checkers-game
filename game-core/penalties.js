// ==========================================
// 计分与扣罚计算 — 纯函数，平台无关
// 从 origin_game/shared/game-logic.js 移植
// ==========================================
import {
  MOVE_TIME_PENALTY_THRESHOLD, MOVE_TIME_PENALTY_PER_INTERVAL,
  PENALTY_INTERVAL, GAME_TIME, INITIAL_SCORE
} from './constants.js';

export function getPenaltyThresholdsCrossed(moveTimeElapsed) {
  if (moveTimeElapsed < MOVE_TIME_PENALTY_THRESHOLD) return 0;
  return 1 + Math.floor((moveTimeElapsed - MOVE_TIME_PENALTY_THRESHOLD) / PENALTY_INTERVAL);
}

export function getNextThresholdTime(moveTimeElapsed) {
  let nextThreshold = MOVE_TIME_PENALTY_THRESHOLD;
  while (nextThreshold <= moveTimeElapsed && nextThreshold < GAME_TIME) {
    nextThreshold += PENALTY_INTERVAL;
  }
  return nextThreshold;
}

export function calculateCorrectSteps(moveHistory, solutionPath) {
  if (!solutionPath || solutionPath.length < 2) return 0;

  let correctCount = 0;

  for (let i = 0; i < moveHistory.length; i++) {
    const playerMove = moveHistory[i];
    const expectedFrom = solutionPath[i];
    const expectedTo = solutionPath[i + 1];

    if (!expectedFrom || !expectedTo) break;

    const fromMatch = playerMove[0][0] === expectedFrom[0] && playerMove[0][1] === expectedFrom[1];
    const toMatch = playerMove[1][0] === expectedTo[0] && playerMove[1][1] === expectedTo[1];

    if (fromMatch && toMatch) {
      correctCount++;
    }
  }

  return correctCount;
}

export function calculateSettlementScore(moveHistory, gameTimeLeft, gameWon, score, currentLevel) {
  const solutionPath = currentLevel?.solutionPath || [];
  const finalCorrectSteps = solutionPath.length > 0 ? solutionPath.length - 1 : 0;
  const currentSpentTime = GAME_TIME - gameTimeLeft;

  let factor1 = 0;
  if (gameWon) {
    factor1 = Math.max(0, Math.min(1, (GAME_TIME - currentSpentTime) / GAME_TIME));
  } else {
    if (finalCorrectSteps > 0) {
      const correctSteps = calculateCorrectSteps(moveHistory, solutionPath);
      factor1 = Math.max(0, Math.min(1, correctSteps / finalCorrectSteps));
    }
  }

  const scoreMax = INITIAL_SCORE;
  const factor2 = Math.max(0, Math.min(1, score / scoreMax));
  const finalScore = parseFloat(((factor1 + factor2) * 50).toFixed(1));

  return {
    factor1: parseFloat(factor1.toFixed(3)),
    factor2: parseFloat(factor2.toFixed(3)),
    finalScore,
    gameWon
  };
}

export function formatScoreText(scoreValue) {
  return `${scoreValue.toString().padStart(3, '0')}`;
}
