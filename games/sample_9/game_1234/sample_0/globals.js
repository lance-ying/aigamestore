// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER_WIN: 'GAME_OVER_WIN',
  GAME_OVER_LOSE: 'GAME_OVER_LOSE'
};

export const gameState = {
  player: null,
  entities: [],
  aiBlackHoles: [],
  consumableObjects: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: 'HUMAN',
  currentLevel: 1,
  levelTimer: 120,
  levelStartTime: 0,
  highScore: 0,
  totalLevels: 3
};

// Load high score from localStorage
if (typeof window !== 'undefined' && window.localStorage) {
  const savedHighScore = localStorage.getItem('holeio_highscore');
  if (savedHighScore) {
    gameState.highScore = parseInt(savedHighScore);
  }
}

export function getGameState() {
  return gameState;
}

// Expose to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}