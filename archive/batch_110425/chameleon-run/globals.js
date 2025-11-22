// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GROUND_Y = 350;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Colors
export const COLOR_PINK = "PINK";
export const COLOR_YELLOW = "YELLOW";

// Player constants
export const PLAYER_SIZE = 30;
export const PLAYER_JUMP_FORCE = -12;
export const GRAVITY = 0.6;
export const INITIAL_SPEED = 3;
export const MAX_SPEED = 8;
export const SPEED_INCREMENT = 0.002;

// Platform constants
export const PLATFORM_HEIGHT = 20;
export const MIN_PLATFORM_WIDTH = 80;
export const MAX_PLATFORM_WIDTH = 150;
export const MIN_GAP = 50;
export const MAX_GAP = 180;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  platforms: [],
  obstacles: [],
  tokens: [],
  score: 0,
  tokensCollected: 0,
  totalTokens: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  levelTime: 0,
  levelStartTime: 0,
  gameSpeed: INITIAL_SPEED,
  cameraX: 0,
  levelLength: 3000,
  levelComplete: false,
  deathReason: ""
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}