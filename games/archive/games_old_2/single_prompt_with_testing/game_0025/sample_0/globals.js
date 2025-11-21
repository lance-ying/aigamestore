// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game difficulty presets
export const DIFFICULTY_PRESETS = {
  BEGINNER: { rows: 9, cols: 9, mines: 10, name: "Beginner" },
  INTERMEDIATE: { rows: 13, cols: 15, mines: 40, name: "Intermediate" },
  EXPERT: { rows: 16, cols: 30, mines: 99, name: "Expert" }
};

// For 600x400 canvas, we'll use a smaller grid to fit
export const GAME_CONFIG = {
  rows: 10,
  cols: 12,
  mines: 15,
  cellSize: 30,
  gridOffsetX: 90,
  gridOffsetY: 80
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Minesweeper specific state
  grid: [],
  revealed: [],
  flagged: [],
  cursorX: 0,
  cursorY: 0,
  mineCount: GAME_CONFIG.mines,
  flagCount: 0,
  revealedCount: 0,
  startTime: 0,
  elapsedTime: 0,
  quickFlagMode: false,
  firstClick: true,
  gameResult: null, // "WIN" or "LOSE"
  
  // Test tracking
  moveHistory: [],
  lastActionFrame: 0
};

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}