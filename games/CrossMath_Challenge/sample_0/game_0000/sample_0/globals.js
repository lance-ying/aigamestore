// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  score: 0,
  currentLevel: 1,
  totalLevels: 4,
  incorrectSubmissions: 0,
  maxIncorrectSubmissions: 2,
  hintsUsed: 0,
  levelStartTime: 0,
  highScore: 0,
  currentGridData: [],
  selectedCell: { row: -1, col: -1 },
  gridSize: 3,
  cellSize: 50,
  gridOffsetX: 0,
  gridOffsetY: 0,
  lastValidationResult: null,
  levelCompleted: false
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}