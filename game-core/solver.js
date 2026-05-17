// ==========================================
// BFS 求解器 & 唯一解校验 — 纯函数，平台无关
// 从 origin_game/shared/game-logic.js 移植
// ==========================================
import {
  BOARD_ROWS, BOARD_COLS, INVALID, EMPTY, OBSTACLE, PLAYER,
  AXIAL_DIRS, JUMP_FACTORS, WIN_ROW_THRESHOLD, MAX_BFS_ITERATIONS
} from './constants.js';
import { createEmptyBoard } from './board.js';
import { findAllJumpsFrom } from './logic.js';

// ── Obstacle hash utilities ──────────────────

export function getBoardObsHash(board) {
  let obsStr = '|';
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c] === OBSTACLE) {
        obsStr += `${r},${c}|`;
      }
    }
  }
  return obsStr;
}

// ── Dynamic jumps from obstacle set ──────────

export function getDynamicJumpsFromSet(indexToAxial, axialToIndex, r, c, obstacleSet) {
  const jumps = [];
  const startKey = `${r},${c}`;
  if (!indexToAxial.has(startKey)) return [];
  const [q1, r1] = indexToAxial.get(startKey);

  for (const [dirQ, dirR] of AXIAL_DIRS) {
    for (const factor of JUMP_FACTORS) {
      const targetQ = q1 + dirQ * factor;
      const targetR = r1 + dirR * factor;
      const targetKey = `${targetQ},${targetR}`;
      const midQ = q1 + dirQ * (factor / 2);
      const midR = r1 + dirR * (factor / 2);
      const midKey = `${midQ},${midR}`;

      if (!axialToIndex.has(targetKey) || !axialToIndex.has(midKey)) continue;

      const [tr, tc] = axialToIndex.get(targetKey);
      const [mr, mc] = axialToIndex.get(midKey);

      if (!obstacleSet.has(`${mr},${mc}`)) continue;
      if (obstacleSet.has(`${tr},${tc}`)) continue;

      let pathClear = true;
      for (let i = 1; i < factor; i++) {
        if (i === factor / 2) continue;
        const pathQ = q1 + dirQ * i;
        const pathR = r1 + dirR * i;
        const pathKey = `${pathQ},${pathR}`;

        if (!axialToIndex.has(pathKey)) {
          pathClear = false;
          break;
        }

        const [pR, pC] = axialToIndex.get(pathKey);
        if (obstacleSet.has(`${pR},${pC}`)) {
          pathClear = false;
          break;
        }
      }

      if (pathClear) {
        jumps.push([tr, tc, mr, mc]);
      }
    }
  }
  return jumps;
}

// ── BFS solver (state-space search) ──────────

export async function solveGameBFS(board, playerPos, indexToAxial, axialToIndex, scheduler) {
  const schedule = scheduler || { yieldIfNeeded: () => Promise.resolve() }
  const startObsStr = getBoardObsHash(board);
  const startHash = `${playerPos[0]},${playerPos[1]}${startObsStr}`;

  const queue = [{
    r: playerPos[0],
    c: playerPos[1],
    obsStr: startObsStr,
    path: [[playerPos[0], playerPos[1]]]
  }];

  const visited = new Set();
  visited.add(startHash);

  let iterations = 0;

  while (queue.length > 0) {
    iterations++;
    if (iterations > MAX_BFS_ITERATIONS) return null;

    await schedule.yieldIfNeeded();

    const current = queue.shift();

    if (current.r <= WIN_ROW_THRESHOLD) {
      return current.path;
    }

    const currentObstacles = new Set(current.obsStr.split('|').filter(s => s !== ''));

    const jumps = getDynamicJumpsFromSet(indexToAxial, axialToIndex, current.r, current.c, currentObstacles);

    for (const [tr, tc, mr, mc] of jumps) {
      const midKey = `${mr},${mc}`;
      if (!currentObstacles.has(midKey)) continue;

      const newObsStr = current.obsStr.replace(`|${midKey}|`, '|');
      const nextHash = `${tr},${tc}${newObsStr}`;

      if (!visited.has(nextHash)) {
        visited.add(nextHash);
        queue.push({
          r: tr,
          c: tc,
          obsStr: newObsStr,
          path: [...current.path, [tr, tc]]
        });
      }
    }
  }

  return null;
}

export async function fastSolver(board, playerPos, indexToAxial, axialToIndex, scheduler) {
  const path = await solveGameBFS(board, playerPos, indexToAxial, axialToIndex, scheduler);
  return path ? path.length - 1 : 0;
}

// ── Simple BFS on current board (no obstacle removal) ──

export function findSolutionPath(board, playerPos, indexToAxial, axialToIndex) {
  if (!playerPos) return null;
  const startPos = [...playerPos];
  const queue = [[startPos[0], startPos[1]]];
  const visited = new Set();
  const startKey = `${startPos[0]},${startPos[1]}`;
  visited.add(startKey);
  const parent = new Map();

  let foundGoalKey = null;

  while (queue.length > 0) {
    const [r, c] = queue.shift();

    if (r <= WIN_ROW_THRESHOLD) {
      foundGoalKey = `${r},${c}`;
      break;
    }

    const jumps = findAllJumpsFrom(board, indexToAxial, axialToIndex, r, c);
    for (const [nr, nc] of jumps) {
      const key = `${nr},${nc}`;
      if (!visited.has(key)) {
        visited.add(key);
        parent.set(key, `${r},${c}`);
        queue.push([nr, nc]);
      }
    }
  }

  if (foundGoalKey) {
    const path = [];
    let curr = foundGoalKey;
    while (curr !== startKey) {
      const [r, c] = curr.split(',').map(Number);
      path.unshift([r, c]);
      curr = parent.get(curr);
    }
    path.unshift(startPos);
    return path;
  }
  return null;
}

// ── Unique-solution verification ─────────────

export async function solveFromObstacleSet(playerPos, obstacleSet, indexToAxial, axialToIndex) {
  const tempBoard = createEmptyBoard();
  for (const key of obstacleSet) {
    const [r, c] = key.split(',').map(Number);
    tempBoard[r][c] = OBSTACLE;
  }
  tempBoard[playerPos[0]][playerPos[1]] = PLAYER;
  return await solveGameBFS(tempBoard, playerPos, indexToAxial, axialToIndex);
}

export async function verifyUniqueSolution(board, playerPos, indexToAxial, axialToIndex) {
  if (!playerPos) return false;

  const solutionPath = await solveGameBFS(board, playerPos, indexToAxial, axialToIndex);
  if (!solutionPath) return false;

  const pathLen = solutionPath.length - 1;

  const currentObs = new Set();
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c] === OBSTACLE) {
        currentObs.add(`${r},${c}`);
      }
    }
  }

  for (let i = 0; i < solutionPath.length - 1; i++) {
    const [r, c] = solutionPath[i];
    const [nextR, nextC] = solutionPath[i + 1];

    const jumps = getDynamicJumpsFromSet(indexToAxial, axialToIndex, r, c, currentObs);

    let correctMidKey = null;

    for (const [tr, tc, mr, mc] of jumps) {
      if (tr === nextR && tc === nextC) {
        correctMidKey = `${mr},${mc}`;
      } else {
        // Branch check: if removing this obstacle still reaches goal, solution is not unique
        const altObs = new Set(currentObs);
        altObs.delete(`${mr},${mc}`);
        const altPath = solveFromObstacleSet([tr, tc], altObs, indexToAxial, axialToIndex);
        if (altPath !== null) {
          return false;
        }
      }
    }

    if (correctMidKey) {
      currentObs.delete(correctMidKey);
    }
  }

  return true;
}
