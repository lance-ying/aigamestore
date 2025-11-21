// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GROUND_Y = 350;
export const GRAVITY = 0.6;
export const JUMP_STRENGTH = -12;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  projectiles: [],
  particles: [],
  drops: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  wave: 1,
  maxWaves: 5,
  enemiesInWave: 0,
  enemiesDefeated: 0,
  bossActive: false,
  waveComplete: false,
  gameStartTime: 0,
  elapsedTime: 0
};

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}