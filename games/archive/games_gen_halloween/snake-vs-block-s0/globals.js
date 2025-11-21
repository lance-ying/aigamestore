// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const LANE_WIDTH = 60;
export const NUM_LANES = 7;
export const SNAKE_BALL_RADIUS = 8;
export const COLLECTIBLE_BALL_RADIUS = 6;
export const BLOCK_WIDTH = 50;
export const BLOCK_HEIGHT = 40;
export const INITIAL_SNAKE_LENGTH = 10;
export const SNAKE_SPEED = 3;
export const SPAWN_DISTANCE = 100;

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  distance: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  engine: null,
  world: null,
  snakeBalls: [],
  blocks: [],
  collectibles: [],
  snakeLength: INITIAL_SNAKE_LENGTH,
  snakeX: CANVAS_WIDTH / 2,
  nextSpawnY: -SPAWN_DISTANCE,
  difficulty: 1,
  framesSinceLastLog: 0,
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