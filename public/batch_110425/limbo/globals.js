// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = 0.6;
export const PLAYER_SPEED = 3;
export const PLAYER_JUMP_FORCE = -12;
export const FRICTION = 0.8;

export const gameState = {
  player: null,
  entities: [],
  platforms: [],
  hazards: [],
  interactables: [],
  checkpoints: [],
  currentCheckpoint: 0,
  cameraOffsetX: 0,
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  deathCount: 0,
  levelWidth: 3000,
  inputHistory: [],
  framesSinceLastInput: 0
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;