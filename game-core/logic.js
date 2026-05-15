// ==========================================
// 移动验证与执行 — 纯函数，平台无关
// 从 origin_game/shared/game-logic.js 移植
// 所有函数接收 board/mapping 作为参数，不依赖实例状态
// ==========================================
import { EMPTY, OBSTACLE, PLAYER, AXIAL_DIRS, JUMP_FACTORS, OBSTACLE_COLORS } from './constants.js';
import { isInside } from './board.js';

// ── canJumpTo ─────────────────────────────────

export function canJumpTo(board, indexToAxial, axialToIndex, startR, startC, targetR, targetC) {
  if (!isInside(board, startR, startC) || !isInside(board, targetR, targetC)) {
    return { valid: false, obstaclePos: null };
  }

  if (board[startR][startC] !== PLAYER) {
    return { valid: false, obstaclePos: null };
  }

  if (board[targetR][targetC] !== EMPTY) {
    return { valid: false, obstaclePos: null };
  }

  const startKey = `${startR},${startC}`;
  const targetKey = `${targetR},${targetC}`;

  if (!indexToAxial.has(startKey) || !indexToAxial.has(targetKey)) {
    return { valid: false, obstaclePos: null };
  }

  const [q1, r1] = indexToAxial.get(startKey);
  const [q2, r2] = indexToAxial.get(targetKey);

  const dq = q2 - q1;
  const dr = r2 - r1;

  let directionFound = false;
  let dirQ = 0, dirR = 0;
  let factor = 0;

  for (const [testDirQ, testDirR] of AXIAL_DIRS) {
    if (dq === 0 && testDirQ === 0) {
      if (dr !== 0 && dr % testDirR === 0) {
        factor = dr / testDirR;
        if (factor > 0) {
          directionFound = true;
          dirQ = testDirQ;
          dirR = testDirR;
          break;
        }
      }
    } else if (dr === 0 && testDirR === 0) {
      if (dq !== 0 && dq % testDirQ === 0) {
        factor = dq / testDirQ;
        if (factor > 0) {
          directionFound = true;
          dirQ = testDirQ;
          dirR = testDirR;
          break;
        }
      }
    } else if (dq !== 0 && dr !== 0) {
      if (dq * testDirR === dr * testDirQ) {
        if (testDirQ !== 0 && dq % testDirQ === 0) {
          const testFactor = dq / testDirQ;
          if (testFactor > 0 && dr === testDirR * testFactor) {
            directionFound = true;
            dirQ = testDirQ;
            dirR = testDirR;
            factor = testFactor;
            break;
          }
        }
      }
    }
  }

  if (!directionFound) {
    return { valid: false, obstaclePos: null };
  }

  if (factor % 2 !== 0 || factor < 2 || factor > 8) {
    return { valid: false, obstaclePos: null };
  }

  // Obstacle must be at midpoint
  const obstacleFactor = factor / 2;
  const obstacleQ = q1 + dirQ * obstacleFactor;
  const obstacleR = r1 + dirR * obstacleFactor;
  const obstacleKey = `${obstacleQ},${obstacleR}`;

  if (!axialToIndex.has(obstacleKey)) {
    return { valid: false, obstaclePos: null };
  }

  const [obstacleRIdx, obstacleCIdx] = axialToIndex.get(obstacleKey);

  if (board[obstacleRIdx][obstacleCIdx] !== OBSTACLE) {
    return { valid: false, obstaclePos: null };
  }

  // Path must be clear (except midpoint)
  for (let i = 1; i < factor; i++) {
    if (i === obstacleFactor) continue;

    const pathQ = q1 + dirQ * i;
    const pathR = r1 + dirR * i;
    const pathKey = `${pathQ},${pathR}`;

    if (!axialToIndex.has(pathKey)) {
      return { valid: false, obstaclePos: null };
    }

    const [pathRIdx, pathCIdx] = axialToIndex.get(pathKey);

    if (board[pathRIdx][pathCIdx] !== EMPTY) {
      return { valid: false, obstaclePos: null };
    }
  }

  return { valid: true, obstaclePos: [obstacleRIdx, obstacleCIdx] };
}

// ── findAllJumpsFrom ──────────────────────────

export function findAllJumpsFrom(board, indexToAxial, axialToIndex, startR, startC) {
  if (!isInside(board, startR, startC) || board[startR][startC] !== PLAYER) {
    return [];
  }

  const possibleJumps = [];

  for (const [dirQ, dirR] of AXIAL_DIRS) {
    for (const factor of JUMP_FACTORS) {
      const startKey = `${startR},${startC}`;
      const [q1, r1] = indexToAxial.get(startKey);
      const targetQ = q1 + dirQ * factor;
      const targetR = r1 + dirR * factor;
      const targetKey = `${targetQ},${targetR}`;

      if (!axialToIndex.has(targetKey)) continue;

      const [targetRIdx, targetCIdx] = axialToIndex.get(targetKey);

      const { valid } = canJumpTo(board, indexToAxial, axialToIndex, startR, startC, targetRIdx, targetCIdx);
      if (valid) {
        possibleJumps.push([targetRIdx, targetCIdx]);
      }
    }
  }

  return possibleJumps;
}

// ── executeMove ───────────────────────────────

/**
 * Execute a jump. Returns new state objects (immutable).
 */
export function executeMove(board, boardColors, playerPos, targetR, targetC, indexToAxial, axialToIndex) {
  const [fr, fc] = playerPos;
  const { valid, obstaclePos } = canJumpTo(board, indexToAxial, axialToIndex, fr, fc, targetR, targetC);

  if (!valid || !obstaclePos) return null;

  const [mr, mc] = obstaclePos;
  const newBoard = board.map(row => [...row]);
  const newColors = boardColors.map(row => [...row]);

  newBoard[fr][fc] = EMPTY;
  newBoard[mr][mc] = EMPTY;
  newColors[mr][mc] = null;
  newBoard[targetR][targetC] = PLAYER;

  return {
    newBoard,
    newBoardColors: newColors,
    newPlayerPos: [targetR, targetC],
    obstacleEaten: [mr, mc]
  };
}

// ── saveStateSnapshot ─────────────────────────

export function saveStateSnapshot(board, boardColors, playerPos, moveCount, remainingPieces, moveHistory) {
  return {
    board: board.map(row => [...row]),
    boardColors: boardColors.map(row => [...row]),
    playerPos: playerPos ? [...playerPos] : null,
    moveCount,
    remainingPieces,
    moveHistory: moveHistory.map(m => [[m[0][0], m[0][1]], [m[1][0], m[1][1]]])
  };
}

// ── Reverse move functions (for level generation) ──

export function getAllReverseJumps(board, indexToAxial, axialToIndex, r, c, reservedCells = new Set()) {
  const jumps = [];
  const startKey = `${r},${c}`;
  if (!indexToAxial.has(startKey)) return [];
  const [q1, r1] = indexToAxial.get(startKey);

  for (const [dq, dr] of AXIAL_DIRS) {
    for (const factor of JUMP_FACTORS) {
      const targetQ = q1 + dq * factor;
      const targetR = r1 + dr * factor;
      const targetKey = `${targetQ},${targetR}`;

      const midQ = q1 + dq * (factor / 2);
      const midR = r1 + dr * (factor / 2);
      const midKey = `${midQ},${midR}`;

      if (!axialToIndex.has(targetKey) || !axialToIndex.has(midKey)) continue;

      const [targetRIdx, targetCIdx] = axialToIndex.get(targetKey);
      const [midRIdx, midCIdx] = axialToIndex.get(midKey);

      if (reservedCells.has(`${midRIdx},${midCIdx}`)) continue;

      if (board[targetRIdx][targetCIdx] !== EMPTY ||
          board[midRIdx][midCIdx] !== EMPTY) continue;

      let pathClear = true;
      for (let i = 1; i < factor; i++) {
        const pathQ = q1 + dq * i;
        const pathR = r1 + dr * i;
        const pathKey = `${pathQ},${pathR}`;
        if (!axialToIndex.has(pathKey)) {
          pathClear = false;
          break;
        }
        const [pR, pC] = axialToIndex.get(pathKey);
        if (board[pR][pC] !== EMPTY) {
          pathClear = false;
          break;
        }
      }

      if (pathClear) {
        jumps.push([targetRIdx, targetCIdx, midRIdx, midCIdx, factor]);
      }
    }
  }
  return jumps;
}

export function getAllValidReverseMoves(board, boardColors, playerPos, indexToAxial, axialToIndex) {
  const moves = [];
  const currKey = `${playerPos[0]},${playerPos[1]}`;
  if (!indexToAxial.has(currKey)) return [];

  const [currQ, currR] = indexToAxial.get(currKey);

  for (const [dirQ, dirR] of AXIAL_DIRS) {
    for (const factor of JUMP_FACTORS) {
      const prevQ = currQ + dirQ * factor;
      const prevR = currR + dirR * factor;
      const prevKey = `${prevQ},${prevR}`;

      const midQ = currQ + dirQ * (factor / 2);
      const midR = currR + dirR * (factor / 2);
      const midKey = `${midQ},${midR}`;

      if (!axialToIndex.has(prevKey) || !axialToIndex.has(midKey)) continue;

      const [pr, pc] = axialToIndex.get(prevKey);
      const [mr, mc] = axialToIndex.get(midKey);

      if (board[pr][pc] === EMPTY && board[mr][mc] === EMPTY) {
        moves.push({
          prevPos: [pr, pc],
          midPos: [mr, mc],
          currentPos: [...playerPos],
          color: OBSTACLE_COLORS[Math.floor(Math.random() * OBSTACLE_COLORS.length)]
        });
      }
    }
  }
  return moves;
}

export function executeReverseMove(board, boardColors, playerPos, move, playerVal = PLAYER) {
  const [pr, pc] = move.prevPos;
  const [mr, mc] = move.midPos;
  const [cr, cc] = move.currentPos;
  board[cr][cc] = EMPTY;
  board[pr][pc] = playerVal;
  board[mr][mc] = OBSTACLE;
  boardColors[mr][mc] = move.color;
  // Mutate playerPos in place for generator recursion
  playerPos[0] = pr;
  playerPos[1] = pc;
}

export function undoReverseMove(board, boardColors, playerPos, move) {
  const [pr, pc] = move.prevPos;
  const [mr, mc] = move.midPos;
  const [cr, cc] = move.currentPos;
  board[pr][pc] = EMPTY;
  board[mr][mc] = EMPTY;
  boardColors[mr][mc] = null;
  board[cr][cc] = PLAYER;
  playerPos[0] = cr;
  playerPos[1] = cc;
}
