// ==========================================
// Canvas 渲染 — 接收 ctx + state，纯绘制函数
// 从 origin_game/障碍跳棋_新.html draw() 移植
// ==========================================
import {
  CELL_RADIUS, SELECTED_RING_RADIUS, PLAYER_DOT_RADIUS,
  JUMP_TARGET_RING_RADIUS, JUMP_TARGET_STROKE_WIDTH, WIN_AREA_GRADIENT_RADIUS,
  HINT_NODE_RADIUS, WIN_ROW_THRESHOLD, BOARD_ROWS, BOARD_COLS,
  INVALID, EMPTY, OBSTACLE, PLAYER, COLORS
} from './constants.js';
import { getPixelPos } from './coordinates.js';
import { findAllJumpsFrom } from './logic.js';

export function drawBoard(ctx, state, canvasW, canvasH) {
  const {
    board, boardColors, playerPos, indexToAxial, axialToIndex,
    selected, hoveredTarget, hintPath
  } = state;

  ctx.clearRect(0, 0, canvasW, canvasH);

  // 1. Win zone highlight
  drawWinZone(ctx, board, canvasW, canvasH);

  // 2. All cells
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c] === INVALID) continue;
      const [x, y] = getPixelPos(canvasW, canvasH, r, c);
      drawCell(ctx, x, y, board[r][c], boardColors[r][c], selected, r, c);
    }
  }

  // 3. Jump targets
  if (playerPos) {
    const jumps = findAllJumpsFrom(board, indexToAxial, axialToIndex, playerPos[0], playerPos[1]);
    for (const [tr, tc] of jumps) {
      const [tx, ty] = getPixelPos(canvasW, canvasH, tr, tc);
      drawJumpTarget(ctx, tx, ty);
    }
  }

  // 4. Hover/tap preview arrow
  if (hoveredTarget && playerPos) {
    drawHoverArrow(ctx, playerPos, hoveredTarget, canvasW, canvasH);
  }

  // 5. Hint path
  if (hintPath && hintPath.length > 1) {
    drawHintPath(ctx, hintPath, canvasW, canvasH);
  }
}

// ── Internal helpers ──

function drawWinZone(ctx, board, canvasW, canvasH) {
  for (let r = 0; r <= WIN_ROW_THRESHOLD; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c] === INVALID) continue;
      const [x, y] = getPixelPos(canvasW, canvasH, r, c);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, WIN_AREA_GRADIENT_RADIUS);
      gradient.addColorStop(0, 'rgba(144, 238, 144, 0.6)');
      gradient.addColorStop(1, 'rgba(144, 238, 144, 0.1)');
      ctx.beginPath();
      ctx.arc(x, y, WIN_AREA_GRADIENT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }
}

function drawCell(ctx, x, y, cellType, cellColor, selected, r, c) {
  // Selected ring
  if (selected && selected[0] === r && selected[1] === c) {
    ctx.beginPath();
    ctx.arc(x, y, SELECTED_RING_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.SELECTED;
    ctx.fill();
  }

  // Main circle
  const radius = CELL_RADIUS;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);

  let fillColor = COLORS.EMPTY;
  if (cellType === OBSTACLE) {
    fillColor = cellColor || COLORS.PURPLE;
  } else if (cellType === PLAYER) {
    fillColor = COLORS.PLAYER;
  } else {
    fillColor = COLORS.EMPTY;
  }
  ctx.fillStyle = fillColor;
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Player center dot
  if (cellType === PLAYER) {
    ctx.beginPath();
    ctx.arc(x, y, PLAYER_DOT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
  }
}

function drawJumpTarget(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, JUMP_TARGET_RING_RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.JUMP_TARGET_STROKE;
  ctx.lineWidth = JUMP_TARGET_STROKE_WIDTH;
  ctx.stroke();
}

function drawHoverArrow(ctx, fromPos, toPos, canvasW, canvasH) {
  const [fx, fy] = getPixelPos(canvasW, canvasH, fromPos[0], fromPos[1]);
  const [tx, ty] = getPixelPos(canvasW, canvasH, toPos[0], toPos[1]);

  const angle = Math.atan2(ty - fy, tx - fx);
  const headLen = 15;
  const ax = tx - Math.cos(angle) * CELL_RADIUS;
  const ay = ty - Math.sin(angle) * CELL_RADIUS;

  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(ax, ay);
  ctx.strokeStyle = COLORS.ARROW_LINE;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(
    ax - headLen * Math.cos(angle - Math.PI / 6),
    ay - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    ax - headLen * Math.cos(angle + Math.PI / 6),
    ay - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = COLORS.ARROW_LINE;
  ctx.fill();
}

function drawHintPath(ctx, path, canvasW, canvasH) {
  // Dashed line
  ctx.beginPath();
  const [sx, sy] = getPixelPos(canvasW, canvasH, path[0][0], path[0][1]);
  ctx.moveTo(sx, sy);
  for (let i = 1; i < path.length; i++) {
    const [px, py] = getPixelPos(canvasW, canvasH, path[i][0], path[i][1]);
    ctx.lineTo(px, py);
  }
  ctx.strokeStyle = COLORS.HINT_LINE;
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Numbered nodes
  for (let i = 0; i < path.length; i++) {
    const [nx, ny] = getPixelPos(canvasW, canvasH, path[i][0], path[i][1]);

    ctx.beginPath();
    ctx.arc(nx, ny, HINT_NODE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.HINT_NODE_FILL;
    ctx.fill();
    ctx.strokeStyle = COLORS.HINT_NODE_STROKE;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i === 0 ? 'S' : String(i), nx, ny);
  }
}
