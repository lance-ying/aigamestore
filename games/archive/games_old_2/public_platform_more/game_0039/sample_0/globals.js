// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

export const GRID_SIZE = 30;
export const BOARD_ROWS = 8;
export const BOARD_COLS = 10;
export const BOARD_OFFSET_X = 50;
export const BOARD_OFFSET_Y = 80;

export const PIECE_PREVIEW_X = 450;
export const PIECE_PREVIEW_Y = 120;

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gems: 0,
  level: 1,
  gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
  controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
  
  // Puzzle state
  puzzleBoard: [],
  targetCells: [],
  pieces: [],
  selectedPieceIndex: 0,
  placedPieces: [],
  
  // Timing
  startTime: 0,
  elapsedTime: 0,
  timeLimit: 120000, // 2 minutes per puzzle
  
  // Input tracking
  lastMoveTime: 0,
  moveDelay: 100,
};

// Make getGameState available globally
export function getGameState() {
  return gameState;
}

if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}