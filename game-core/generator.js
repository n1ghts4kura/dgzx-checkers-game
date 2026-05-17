// ==========================================
// 关卡生成 — 逆向增长算法 & 序列化
// 从 origin_game/shared/game-logic.js 移植
// ==========================================
import {
  BOARD_ROWS, BOARD_COLS, INVALID, EMPTY, OBSTACLE, PLAYER,
  AXIAL_DIRS, JUMP_FACTORS, GENERATION_TIMEOUT_BASE, GENERATION_TIMEOUT_LONG, COLORS
} from './constants.js';
import { createEmptyBoard, createEmptyColorLayer, createAxialMapping, logicalToIndex, countObstacles } from './board.js';
import {
  getAllValidReverseMoves, executeReverseMove, undoReverseMove
} from './logic.js';
import { solveGameBFS, fastSolver, verifyUniqueSolution, solveFromObstacleSet, fastSolverAsync } from './solver.js';

// ── Random top-triangle position ─────────────

export function getRandomTopTrianglePos(board) {
  const candidates = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c] !== INVALID) {
        candidates.push([r, c]);
      }
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ── Recursive reverse-growth generator ───────

export function growPathElegant(
  board, boardColors, playerPos, indexToAxial, axialToIndex,
  currentDepth, targetDepth, startTime, originalTopPos, isHighQuality
) {
  if (currentDepth >= targetDepth) return true;

  const timeLimit = targetDepth > 20 ? GENERATION_TIMEOUT_LONG : GENERATION_TIMEOUT_BASE;
  if (Date.now() - startTime > timeLimit) return false;

  let moves = getAllValidReverseMoves(board, boardColors, playerPos, indexToAxial, axialToIndex);

  moves.forEach(move => {
    const [pr, pc] = move.prevPos;
    const [cr, cc] = move.currentPos;

    const isGoingUp = pr < cr;
    const progress = currentDepth / targetDepth;
    let score = 0;

    if (progress > 0.85) {
      if (isGoingUp) score = -50.0;
      else score = pr * 6.0;
    } else {
      score = pr * 1.5;
      if (isGoingUp && pr > 2) {
        score += 12.0;
      }
    }

    const dist = Math.sqrt((pr - originalTopPos[0]) ** 2 + (pc - originalTopPos[1]) ** 2);
    score += dist * 1.0;

    let neighborObstacles = 0;
    const posKey = `${pr},${pc}`;
    if (indexToAxial.has(posKey)) {
      const [q, r] = indexToAxial.get(posKey);
      for (const [dq, dr] of AXIAL_DIRS) {
        const nKey = `${q + dq},${r + dr}`;
        if (axialToIndex.has(nKey)) {
          const [nr, nc] = axialToIndex.get(nKey);
          if (board[nr][nc] === OBSTACLE) neighborObstacles++;
        }
      }
    }
    if (neighborObstacles > 1) score -= 5;
    if (neighborObstacles > 2) score -= 20;

    if (isHighQuality) {
      const jumpDist = Math.sqrt((pr - cr) ** 2 + (pc - cc) ** 2);
      score += jumpDist * 2.5;
      const colDiff = Math.abs(pc - cc);
      score += colDiff * 2.0;
    }

    const noise = Math.random() * (10 - currentDepth * 0.2);
    move.score = score + noise;
  });

  moves.sort((a, b) => b.score - a.score);

  let limit = 6;
  if (currentDepth > 5 && currentDepth < targetDepth - 5) {
    limit = 12;
  }
  if (targetDepth > 24) limit += 4;
  if (isHighQuality) limit += 4;

  const candidateLimit = Math.min(moves.length, limit);

  let failureCount = 0;
  for (let i = 0; i < candidateLimit; i++) {
    if (failureCount >= 4) break;

    const move = moves[i];
    executeReverseMove(board, boardColors, playerPos, move, PLAYER);

    let isValid = true;
    let checkFrequency = 2;
    if (currentDepth > targetDepth - 5) checkFrequency = 1;
    if (isHighQuality) checkFrequency = 1;

    if (currentDepth > 2 && currentDepth % checkFrequency === 0) {
      const solveSteps = fastSolver(board, playerPos, indexToAxial, axialToIndex);
      if (solveSteps < currentDepth) {
        isValid = false;
      }
    }

    if (isValid) {
      if (growPathElegant(
        board, boardColors, playerPos, indexToAxial, axialToIndex,
        currentDepth + 1, targetDepth, startTime, originalTopPos, isHighQuality
      )) {
        return true;
      }
      failureCount++;
    } else {
      failureCount++;
    }

    undoReverseMove(board, boardColors, playerPos, move);
  }

  return false;
}

// ── Async reverse-growth generator ──────────
// NOTE: Keep in sync with growPathElegant (sync version above).
// Differences: async function, scheduler param, await fastSolverAsync, await recursive call.

export async function growPathElegantAsync(
  board, boardColors, playerPos, indexToAxial, axialToIndex,
  currentDepth, targetDepth, startTime, originalTopPos, isHighQuality,
  scheduler
) {
  if (currentDepth >= targetDepth) return true;

  const timeLimit = targetDepth > 20 ? GENERATION_TIMEOUT_LONG : GENERATION_TIMEOUT_BASE;
  if (Date.now() - startTime > timeLimit) return false;

  let moves = getAllValidReverseMoves(board, boardColors, playerPos, indexToAxial, axialToIndex);

  moves.forEach(move => {
    const [pr, pc] = move.prevPos;
    const [cr, cc] = move.currentPos;

    const isGoingUp = pr < cr;
    const progress = currentDepth / targetDepth;
    let score = 0;

    if (progress > 0.85) {
      if (isGoingUp) score = -50.0;
      else score = pr * 6.0;
    } else {
      score = pr * 1.5;
      if (isGoingUp && pr > 2) {
        score += 12.0;
      }
    }

    const dist = Math.sqrt((pr - originalTopPos[0]) ** 2 + (pc - originalTopPos[1]) ** 2);
    score += dist * 1.0;

    let neighborObstacles = 0;
    const posKey = `${pr},${pc}`;
    if (indexToAxial.has(posKey)) {
      const [q, r] = indexToAxial.get(posKey);
      for (const [dq, dr] of AXIAL_DIRS) {
        const nKey = `${q + dq},${r + dr}`;
        if (axialToIndex.has(nKey)) {
          const [nr, nc] = axialToIndex.get(nKey);
          if (board[nr][nc] === OBSTACLE) neighborObstacles++;
        }
      }
    }
    if (neighborObstacles > 1) score -= 5;
    if (neighborObstacles > 2) score -= 20;

    if (isHighQuality) {
      const jumpDist = Math.sqrt((pr - cr) ** 2 + (pc - cc) ** 2);
      score += jumpDist * 2.5;
      const colDiff = Math.abs(pc - cc);
      score += colDiff * 2.0;
    }

    const noise = Math.random() * (10 - currentDepth * 0.2);
    move.score = score + noise;
  });

  moves.sort((a, b) => b.score - a.score);

  let limit = 6;
  if (currentDepth > 5 && currentDepth < targetDepth - 5) {
    limit = 12;
  }
  if (targetDepth > 24) limit += 4;
  if (isHighQuality) limit += 4;

  const candidateLimit = Math.min(moves.length, limit);

  let failureCount = 0;
  for (let i = 0; i < candidateLimit; i++) {
    if (failureCount >= 4) break;

    const move = moves[i];
    executeReverseMove(board, boardColors, playerPos, move, PLAYER);

    let isValid = true;
    let checkFrequency = 2;
    if (currentDepth > targetDepth - 5) checkFrequency = 1;
    if (isHighQuality) checkFrequency = 1;

    if (currentDepth > 2 && currentDepth % checkFrequency === 0) {
      const solveSteps = await fastSolverAsync(board, playerPos, indexToAxial, axialToIndex, scheduler);
      if (solveSteps < currentDepth) {
        isValid = false;
      }
    }

    if (isValid) {
      if (await growPathElegantAsync(
        board, boardColors, playerPos, indexToAxial, axialToIndex,
        currentDepth + 1, targetDepth, startTime, originalTopPos, isHighQuality,
        scheduler
      )) {
        return true;
      }
      failureCount++;
    } else {
      failureCount++;
    }

    undoReverseMove(board, boardColors, playerPos, move);
  }

  return false;
}

// ── Level builder/extractor ──────────────────

export function buildLevelData(board, boardColors, playerPos, indexToAxial, axialToIndex) {
  const solutionPath = solveGameBFS(board, playerPos, indexToAxial, axialToIndex);

  const levelData = {
    obstacles: [],
    player: [...playerPos],
    solutionPath: solutionPath ? solutionPath.map(p => [...p]) : []
  };

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c] === OBSTACLE) {
        levelData.obstacles.push([r, c, boardColors[r][c]]);
      }
    }
  }

  return levelData;
}

export function loadLevelIntoBoard(board, boardColors, levelData) {
  levelData.obstacles.forEach(([r, c, color]) => {
    board[r][c] = OBSTACLE;
    boardColors[r][c] = color;
  });

  if (levelData.player) {
    const [pr, pc] = levelData.player;
    board[pr][pc] = PLAYER;
  }
}

// ── Base64 export/import ─────────────────────

export function exportLevelToBase64(levelData) {
  // #ifdef H5
  return btoa(JSON.stringify(levelData));
  // #endif
  // #ifndef H5
  const jsonStr = JSON.stringify(levelData);
  const bytes = new Uint8Array(jsonStr.length);
  for (let i = 0; i < jsonStr.length; i++) {
    bytes[i] = jsonStr.charCodeAt(i);
  }
  return uni.arrayBufferToBase64(bytes.buffer);
  // #endif
}

export function importLevelFromBase64(code) {
  // #ifdef H5
  return JSON.parse(atob(code));
  // #endif
  // #ifndef H5
  const uint8Array = uni.base64ToArrayBuffer(code);
  const bytes = new Uint8Array(uint8Array);
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return JSON.parse(str);
  // #endif
}

// ── Default board setup ──────────────────────

export function setupDefaultBoard(board, boardColors) {
  const obstacles = [
    [5, 3, COLORS.PURPLE], [5, 11, COLORS.PURPLE],
    [6, 5, COLORS.PURPLE], [6, 7, COLORS.PURPLE], [6, 10, COLORS.PURPLE],
    [7, 1, COLORS.BLUE], [7, 4, COLORS.BLUE], [7, 7, COLORS.BLUE], [7, 11, COLORS.BLUE],
    [8, 5, COLORS.BLUE], [8, 7, COLORS.BLUE], [8, 8, COLORS.BLUE], [8, 9, COLORS.BLUE],
    [9, 5, COLORS.PINK], [9, 8, COLORS.PINK],
    [10, 2, COLORS.YELLOW], [10, 5, COLORS.YELLOW], [10, 6, COLORS.YELLOW], [10, 8, COLORS.YELLOW],
    [11, 1, COLORS.ORANGE], [11, 5, COLORS.ORANGE], [11, 9, COLORS.ORANGE], [11, 10, COLORS.ORANGE],
    [13, 3, COLORS.RED], [13, 5, COLORS.RED],
    [15, 2, COLORS.RED], [15, 3, COLORS.RED]
  ];

  const playerPos = logicalToIndex(17, 1);

  obstacles.forEach(([row, pos, color]) => {
    const posIdx = logicalToIndex(row, pos);
    if (posIdx) {
      const [r, c] = posIdx;
      board[r][c] = OBSTACLE;
      boardColors[r][c] = color;
    }
  });

  if (playerPos) {
    const [r, c] = playerPos;
    board[r][c] = PLAYER;
    return [r, c];
  }
  return null;
}
