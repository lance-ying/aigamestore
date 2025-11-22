// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GROUND_HEIGHT = 50;
export const GRAVITY = 0.4;
export const JUMP_FORCE = -6;
export const BIRD_SIZE = 20;
export const EGG_SIZE = 20;
export const BIRD_SPEED = 3;
export const OBSTACLE_MIN_GAP = 250;
export const OBSTACLE_MAX_GAP = 400;
export const FEATHER_SPAWN_CHANCE = 0.3;
export const FEVER_DURATION = 300; // 5 seconds at 60fps
export const PERFECT_LANDING_THRESHOLD = 3;

export const gameState = {
  player: null,
  entities: [],
  obstacles: [],
  feathers: [],
  eggs: [],
  score: 0,
  distance: 0,
  featherCount: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  birdSpeed: BIRD_SPEED,
  obstacleTimer: 0,
  perfectLandings: 0,
  feverMode: false,
  feverTimer: 0,
  lastObstacleX: CANVAS_WIDTH,
  difficultyLevel: 1,
  framesSinceLastJump: 0,
  lastGroundTouchY: -1,
  wasInAir: true
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;