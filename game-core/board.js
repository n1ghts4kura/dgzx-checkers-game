// ==========================================
// 棋盘操作 — 纯函数，平台无关
// 从 origin_game/shared/game-logic.js 移植
// ==========================================
import { ROWS_LAYOUT, BOARD_ROWS, BOARD_COLS, INVALID, EMPTY, OBSTACLE } from './constants.js';

export function createEmptyBoard() {
  const board = Array(BOARD_ROWS).fill().map(() => Array(BOARD_COLS).fill(INVALID));
  for (let r = 0; r < BOARD_ROWS; r++) {
    const count = ROWS_LAYOUT[r];
    const offset = Math.floor((BOARD_COLS - count) / 2);
    for (let i = 0; i < count; i++) {
      board[r][offset + i] = EMPTY;
    }
  }
  return board;
}

export function createEmptyColorLayer() {
  return Array(BOARD_ROWS).fill().map(() => Array(BOARD_COLS).fill(null));
}

export function logicalToIndex(rowNo, posNo) {
  const r = rowNo - 1;
  if (r < 0 || r >= BOARD_ROWS) return null;
  const count = ROWS_LAYOUT[r];
  const offset = Math.floor((BOARD_COLS - count) / 2);
  const c = offset + (posNo - 1);
  if (c < 0 || c >= BOARD_COLS) return null;
  return [r, c];
}

export function isInside(board, r, c) {
  return r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLS && board[r][c] !== INVALID;
}

export function createAxialMapping(board) {
  const indexToAxial = new Map();
  const axialToIndex = new Map();

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c] !== INVALID) {
        const q = c - Math.floor(r / 2);
        indexToAxial.set(`${r},${c}`, [q, r]);
        axialToIndex.set(`${q},${r}`, [r, c]);
      }
    }
  }

  return { indexToAxial, axialToIndex };
}

export function countObstacles(board) {
  let count = 0;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c] === OBSTACLE) count++;
    }
  }
  return count;
}
