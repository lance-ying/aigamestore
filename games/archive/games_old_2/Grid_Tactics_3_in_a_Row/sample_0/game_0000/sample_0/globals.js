// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "GAME_OVER_DRAW", "PAUSED", "LEVEL_SELECT", "INSTRUCTIONS", "HIGH_SCORES"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  
  // Game board
  gameBoard: [],
  currentGridSize: 3,
  currentLevel: 1,
  selectedCell: { row: 0, col: 0 },
  
  // Players
  currentPlayer: 1, // 1 = X (human), 2 = O (AI)
  
  // Score
  score: 0,
  roundScore: 0,
  highScores: [],
  
  // Game tracking
  turnCount: 0,
  lastWinningLine: null,
  winner: null, // null, 1 (X), 2 (O), or 'draw'
  
  // Levels
  unlockedLevels: 1,
  maxTurnsForLevel: 5,
  
  // Menu
  menuSelection: 0,
  
  // Animation
  cellAnimations: [],
  winningLineFlash: 0,
  
  // Player position tracking
  player: {
    screen_x: 0,
    screen_y: 0,
    game_x: 0,
    game_y: 0
  }
};

// Initialize high scores from localStorage
if (typeof window !== 'undefined' && window.localStorage) {
  const stored = localStorage.getItem('gridTacticsHighScores');
  if (stored) {
    try {
      gameState.highScores = JSON.parse(stored);
    } catch (e) {
      gameState.highScores = [];
    }
  }
}

// Game constants
export const CELL_EMPTY = 0;
export const CELL_X = 1;
export const CELL_O = 2;

export const LEVEL_CONFIGS = [
  { level: 1, gridSize: 3, maxTurns: 5, aiDifficulty: 'random' },
  { level: 2, gridSize: 6, maxTurns: 10, aiDifficulty: 'easy' },
  { level: 3, gridSize: 9, maxTurns: 15, aiDifficulty: 'medium' },
  { level: 4, gridSize: 11, maxTurns: 20, aiDifficulty: 'hard' },
  { level: 5, gridSize: 3, maxTurns: 5, aiDifficulty: 'impossible' }
];

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}