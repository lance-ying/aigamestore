// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const KEYS = {
  ENTER: 13,
  ESC: 27,
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SHIFT: 16,
  Z: 90,
  X: 88,
  R: 82
};

// Game state - single source of truth
export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  projectiles: [],
  particles: [],
  currentLevel: 0,
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  levelComplete: false,
  totalLevels: 3,
  timeSlowActive: false,
  timeSlowCharge: 100,
  frameCounter: 0
};

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}