// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRAVITY = 0.8;
export const PLAYER_SPEED = 0.3;
export const JUMP_FORCE = 12;
export const SPIN_DASH_SPEED = 8;

export const GAME_PHASES = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER_WIN: 'GAME_OVER_WIN',
  GAME_OVER_LOSE: 'GAME_OVER_LOSE'
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: 'HUMAN',
  engine: null,
  world: null,
  player: null,
  entities: [],
  enemies: [],
  rings: [],
  platforms: [],
  goalPost: null,
  score: 0,
  lives: 3,
  ringCount: 0,
  camera: { x: 0, y: 0 },
  levelWidth: 3000,
  keys: {},
  invincibilityTimer: 0,
  act: 1,
  lastLoggedX: 0,
  lastLoggedY: 0
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}