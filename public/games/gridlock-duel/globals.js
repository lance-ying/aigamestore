// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const GAME_STATES = {
  TITLE_SCREEN: "TITLE_SCREEN",
  PLAYING: "PLAYING",
  LEVEL_COMPLETE: "LEVEL_COMPLETE",
  GAME_OVER: "GAME_OVER"
};

export const TURN = {
  PLAYER: "PLAYER",
  AI: "AI"
};

export const CELL_STATE = {
  EMPTY: null,
  PLAYER: "X",
  AI: "O"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  gameStatus: GAME_STATES.TITLE_SCREEN,
  controlMode: "HUMAN",
  
  // Game data
  board: null,
  boardSize: 3,
  winLength: 3,
  currentTurn: TURN.PLAYER,
  selectedCell: [0, 0],
  
  // Score and level
  score: 0,
  currentLevel: 1,
  highScore: 0,
  
  // Win/lose tracking
  winner: null,
  winningLine: null,
  
  // Timing
  gameTimer: 0,
  levelCompleteTimer: 0,
  aiMoveDelay: 0,
  
  // Player info for logging
  player: {
    x: 0,
    y: 0,
    selectedRow: 0,
    selectedCol: 0
  },
  
  entities: []
};

// Level configurations - Progressive grid size increase with balanced win conditions
export const LEVELS = [
  { level: 1, boardSize: 3, winLength: 3, aiDifficulty: "EASY", name: "Novice Grid" },
  { level: 2, boardSize: 4, winLength: 3, aiDifficulty: "EASY", name: "Apprentice Grid" },
  { level: 3, boardSize: 5, winLength: 3, aiDifficulty: "MEDIUM", name: "Master Grid" },
  { level: 4, boardSize: 6, winLength: 4, aiDifficulty: "MEDIUM", name: "Grand Grid" },
  { level: 5, boardSize: 7, winLength: 4, aiDifficulty: "HARD", name: "Ultimate Grid" }
];

// Scoring constants
export const SCORES = {
  WIN_ROUND: 500,
  DRAW_ROUND: 100,
  LEVEL_COMPLETE: 200
};

// Export getGameState function
export function getGameState() {
  return gameState;
}
// Expose gameState to window for debugging and recording scripts
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}
