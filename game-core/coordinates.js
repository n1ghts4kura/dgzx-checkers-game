// ==========================================
// 六边形棋盘坐标 — 网格坐标 ↔ 像素坐标
// 从 origin_game/障碍跳棋_新.html getPixelPos/getBoardPos 移植
// ==========================================
import { BOARD_ROWS, BOARD_COLS, CELL_SIZE, HIT_TEST_RADIUS, INVALID } from './constants.js';

export function getPixelPos(canvasWidth, canvasHeight, row, col) {
  const xOffset = canvasWidth / 2;
  const boardHeight = BOARD_ROWS * CELL_SIZE * 0.85;
  const yOffset = (canvasHeight - boardHeight) / 2;
  const x = xOffset + (col - BOARD_COLS / 2) * CELL_SIZE + (row % 2) * (CELL_SIZE / 2);
  const y = yOffset + row * (CELL_SIZE * 0.85);
  return [x, y];
}

export function getBoardPos(canvasWidth, canvasHeight, board, px, py) {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c] === INVALID) continue;
      const [x, y] = getPixelPos(canvasWidth, canvasHeight, r, c);
      if ((px - x) ** 2 + (py - y) ** 2 < HIT_TEST_RADIUS ** 2) {
        return [r, c];
      }
    }
  }
  return null;
}
