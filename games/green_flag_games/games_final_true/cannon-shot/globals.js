// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN"
  engine: null,
  world: null,
  
  // Cannon Shot specific state
  cannon: null,
  balls: [],
  buckets: [],
  movableObjects: [],
  selectedObjectIndex: -1,
  isGrabbing: false,
  ballsRemaining: 0,
  ballsFired: 0,
  currentLevel: 1,
  bucketsFilledCount: 0,
  
  // Testing state - Removed
};

// Game constants
export const BALL_RADIUS = 8;
export const CANNON_SIZE = 40;
export const BUCKET_WIDTH = 60;
export const BUCKET_HEIGHT = 50;
export const MAX_BALLS_PER_LEVEL = 15;
export const TOTAL_LEVELS = 6;

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}