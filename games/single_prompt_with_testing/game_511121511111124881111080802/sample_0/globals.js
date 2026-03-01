// globals.js - Game constants and global state management

// Canvas dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const SNAKE_BALL_RADIUS = 8;
export const SNAKE_BALL_SPACING = SNAKE_BALL_RADIUS * 2.5;
export const SNAKE_SPEED = 2;
export const SNAKE_HORIZONTAL_SPEED = 4;
export const BRICK_WIDTH = 50;
export const BRICK_HEIGHT = 30;
export const COLLECTIBLE_RADIUS = 10;
export const INITIAL_SNAKE_LENGTH = 5;
export const MIN_BRICK_VALUE = 1;
export const MAX_BRICK_VALUE_START = 10;
export const BRICK_VALUE_INCREASE_RATE = 0.01;
export const SPAWN_RATE_INITIAL = 90;
export const SPAWN_RATE_DECREASE = 0.5;
export const MIN_SPAWN_RATE = 30;
export const GAME_DIFFICULTY_INCREASE = 0.001;

// Colors
export const COLORS = {
  background: [20, 20, 35],
  snakeBall: [50, 255, 150],
  snakeBallOutline: [30, 200, 100],
  brick: [255, 70, 70],
  brickOutline: [200, 50, 50],
  collectible: [255, 220, 50],
  collectibleOutline: [200, 170, 30],
  text: [255, 255, 255],
  ui: [100, 100, 120],
  particle: [255, 200, 100],
  trail: [50, 255, 150, 100],
  grid: [40, 40, 60]
};

// Game state object
export const gameState = {
  // Core game state
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Player/Snake
  player: null,
  snakeBalls: [],
  
  // Game entities
  entities: [],
  bricks: [],
  collectibles: [],
  obstacles: [],
  particles: [],
  
  // Game metrics
  score: 0,
  highScore: 0,
  distance: 0,
  ballsCollected: 0,
  bricksDestroyed: 0,
  
  // Physics
  gravity: 0,
  friction: 0.95,
  
  // Spawning
  spawnCounter: 0,
  spawnRate: SPAWN_RATE_INITIAL,
  nextSpawnY: -BRICK_HEIGHT * 2,
  
  // Difficulty
  difficulty: 1.0,
  maxBrickValue: MAX_BRICK_VALUE_START,
  
  // Camera/Scrolling
  cameraY: 0,
  scrollSpeed: SNAKE_SPEED,
  
  // Performance tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Input tracking
  targetX: CANVAS_WIDTH / 2,
  
  // Visual effects
  screenShake: 0,
  flashAlpha: 0,
  
  // Collision tracking
  lastCollisionFrame: 0,
  invulnerabilityFrames: 10,
  
  // Game progression
  rowsPassed: 0,
  speedMultiplier: 1.0
};

// Expose gameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Reset game state to initial values
export function resetGameState() {
  gameState.gamePhase = "START";
  gameState.score = 0;
  gameState.distance = 0;
  gameState.ballsCollected = 0;
  gameState.bricksDestroyed = 0;
  gameState.spawnCounter = 0;
  gameState.spawnRate = SPAWN_RATE_INITIAL;
  gameState.nextSpawnY = -BRICK_HEIGHT * 2;
  gameState.difficulty = 1.0;
  gameState.maxBrickValue = MAX_BRICK_VALUE_START;
  gameState.cameraY = 0;
  gameState.scrollSpeed = SNAKE_SPEED;
  gameState.targetX = CANVAS_WIDTH / 2;
  gameState.screenShake = 0;
  gameState.flashAlpha = 0;
  gameState.lastCollisionFrame = 0;
  gameState.rowsPassed = 0;
  gameState.speedMultiplier = 1.0;
  
  // Clear arrays
  gameState.snakeBalls = [];
  gameState.bricks = [];
  gameState.collectibles = [];
  gameState.obstacles = [];
  gameState.particles = [];
  gameState.entities = [];
  
  // Reset player
  gameState.player = null;
}

// Utility functions
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(start, end, t) {
  return start + (end - start) * t;
}

export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Screen shake helper
export function addScreenShake(amount) {
  gameState.screenShake = Math.max(gameState.screenShake, amount);
}

// Flash effect helper
export function addFlash(amount) {
  gameState.flashAlpha = Math.max(gameState.flashAlpha, amount);
}