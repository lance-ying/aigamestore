// globals.js - Global constants and game state

export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 600;
export const TARGET_FPS = 60;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
};

// Player constants
export const PLAYER_SIZE = 12;
export const PLAYER_SPEED = 3;
export const JUMP_STRENGTH = -8;
export const GRAVITY = 0.4;
export const MAX_FALL_SPEED = 10;
export const DASH_SPEED = 8;
export const DASH_DURATION = 10;
export const WALL_SLIDE_SPEED = 2;
export const WALL_JUMP_X = 5;
export const WALL_JUMP_Y = -7;

// Game constants
export const TILE_SIZE = 20;
export const SCREEN_COLS = CANVAS_WIDTH / TILE_SIZE;
export const SCREEN_ROWS = CANVAS_HEIGHT / TILE_SIZE;
export const STARTING_LIVES = 5;

// Game state
export const gameState = {
  player: null,
  entities: [],
  currentLevel: 0,
  score: 0,
  lives: STARTING_LIVES,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  collectedStrawberries: new Set(),
  levelStartPosition: { x: 0, y: 0 }
};

// Make getGameState available globally
window.getGameState = function() {
  return gameState;
};