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

// Jelly shape modes
export const SHAPE_TALL = "TALL";
export const SHAPE_SHORT = "SHORT";

// Game state object
export const gameState = {
  player: null,
  entities: [],
  obstacles: [],
  diamonds: [],
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  score: 0,
  level: 1,
  distance: 0,
  finishLineX: 0,
  baseSpeed: 2,
  currentSpeed: 2,
  combo: 0,
  jellyFeverActive: false,
  jellyFeverTimer: 0,
  levelComplete: false,
  cameraOffsetX: 0,
  backgroundOffset: 0,
  obstaclesPassed: 0,
  lastObstacleX: 0,
  framesSinceStart: 0
};

// Global function to get game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}