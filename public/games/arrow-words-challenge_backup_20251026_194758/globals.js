// globals.js - Global state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null, // Not applicable for this puzzle game
  entities: [], // Grid cells and UI elements
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  
  // Game-specific state
  currentLevelIndex: 0,
  currentLevel: null,
  grid: [], // 2D array of cell data
  selectedCell: { row: -1, col: -1 },
  highlightedPath: [], // Array of {row, col} coordinates
  startTime: 0,
  elapsedTime: 0,
  hintsUsed: 0,
  incorrectAttempts: 0,
  completedWords: new Set(),
  
  // For testing
  testingActions: [],
  testingActionIndex: 0
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}