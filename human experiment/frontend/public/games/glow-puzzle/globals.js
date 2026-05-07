// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_PADDING = 60;
export const DOT_RADIUS = 8;
export const LINE_WIDTH = 4;
export const GLOW_INTENSITY = 20;

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  currentPuzzle: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  puzzleData: null,
  selectedDot: null,
  currentPath: [],
  completedConnections: new Set(),
  cursorPosition: { row: 0, col: 0 },
  showCursor: true,
  puzzleComplete: false,
  totalPuzzles: 0,
  gridSize: { rows: 0, cols: 0 },
  requiredConnections: new Set(),
  lastMoveTime: 0
};

// Expose gameState getter
window.getGameState = function() {
  return gameState;
};