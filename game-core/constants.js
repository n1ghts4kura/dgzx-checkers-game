// ==========================================
// 游戏常量 — 平台无关，从 origin_game/shared/constants.js 移植
// ==========================================

// Board geometry
export const ROWS_LAYOUT = [1, 2, 3, 4, 13, 12, 11, 10, 9, 10, 11, 12, 13, 4, 3, 2, 1];
export const BOARD_ROWS = ROWS_LAYOUT.length;
export const BOARD_COLS = 17;

// Cell types
export const INVALID = -1;
export const EMPTY = 0;
export const OBSTACLE = 1;
export const PLAYER = 2;

// Hex directions (axial coordinates)
export const AXIAL_DIRS = [
  [1, 0], [1, -1], [0, -1],
  [-1, 0], [-1, 1], [0, 1]
];

// Jump factors
export const JUMP_FACTORS = [2, 4, 6, 8];

// Timing (from HTML prototype: 10-minute game)
export const GAME_TIME = 600000;
export const MOVE_TIME_INTERVAL = 15000;
export const MOVE_TIME_PENALTY_THRESHOLD = 15000;
export const MOVE_TIME_PENALTY_PER_INTERVAL = 3;
export const MOVE_TIME_WARNING_THRESHOLD = 10000;
export const PENALTY_INTERVAL = 10000;

// Scoring
export const UNDO_SCORE_PENALTY = 5;
export const INITIAL_SCORE = 150;
export const SCORE_FLOOR = 0;
export const SCORE_DEDUCTION_ANIMATION_MS = 1500;

// Win condition
export const WIN_ROW_THRESHOLD = 3;

// Generator limits
export const GENERATION_TIMEOUT_BASE = 18000;
export const GENERATION_TIMEOUT_LONG = 54000;
export const GENERATION_YIELD_INTERVAL = 120;
export const MAX_BFS_ITERATIONS = 100000;
export const SOLVER_STEP_LIMIT = 100;
export const MAX_LOCAL_MAPS = 100;

// Rendering
export const CELL_SIZE = 33;
export const CELL_RADIUS = 15;
export const SELECTED_RING_RADIUS = 17;
export const PLAYER_DOT_RADIUS = 5;
export const JUMP_TARGET_RING_RADIUS = 8;
export const JUMP_TARGET_STROKE_WIDTH = 3;
export const HINT_NODE_RADIUS = 10;
export const WIN_AREA_GRADIENT_RADIUS = 23;
export const HIT_TEST_RADIUS = 20;
export const CANVAS_WIDTH = 750;
export const CANVAS_HEIGHT = 600;

// Colors
export const COLORS = {
  BG: '#f0f0f0',
  EMPTY: '#e8e8e8',
  PLAYER: '#00C853',
  SELECTED: '#FFB350',
  HIGHLIGHT: '#78FF78',
  WIN_AREA: 'rgba(60, 179, 113, 0.3)',
  WIN_AREA_BG: 'rgba(144, 238, 144, 0.1)',
  WIN_AREA_BORDER: 'rgba(60, 179, 113, 0.6)',
  HINT_LINE: '#FF4081',
  HINT_NODE_FILL: '#FF4081',
  HINT_NODE_STROKE: 'white',
  ARROW_LINE: '#00A844',
  JUMP_TARGET_STROKE: '#00A844',
  PURPLE: '#A020F0',
  PINK: '#FF69B4',
  YELLOW: '#FFD700',
  ORANGE: '#FF8C00',
  RED: '#DC143C',
  BLUE: '#3282FF'
};

// Default obstacle colors for generation
export const OBSTACLE_COLORS = [COLORS.BLUE, COLORS.RED, COLORS.YELLOW, COLORS.PURPLE, COLORS.ORANGE];
