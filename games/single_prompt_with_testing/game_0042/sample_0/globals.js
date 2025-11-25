// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 20;
export const GRAVITY = 0.6;
export const MAX_FALL_SPEED = 12;
export const PLAYER_SPEED = 3;
export const PLAYER_JUMP_FORCE = -11;

export const gameState = {
  player: null,
  entities: [],
  terrain: [],
  enemies: [],
  prisoners: [],
  explosions: [],
  projectiles: [],
  particles: [],
  helicopter: null,
  score: 0,
  rescuedCount: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  levelComplete: false,
  cameraX: 0,
  framesSinceStart: 0,
  broTypes: ['RAMBO', 'COMMANDO', 'TERMINATOR'],
  currentBroIndex: 0
};

// Expose gameState globally
window.getGameState = function() {
  return gameState;
};