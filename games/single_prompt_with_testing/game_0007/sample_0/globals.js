// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_Z = 90;
export const KEY_R = 82;
export const KEY_SHIFT = 16;

// Game state object
export const gameState = {
  player: null,
  boss: null,
  entities: [],
  projectiles: [],
  bossProjectiles: [],
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  score: 0,
  frameCount: 0,
  bossDefeated: false,
  playerDied: false,
  groundY: 320,
  // Animation frame counter for visual effects
  animationFrame: 0
};

// Expose gameState getter
window.getGameState = function() {
  return gameState;
};