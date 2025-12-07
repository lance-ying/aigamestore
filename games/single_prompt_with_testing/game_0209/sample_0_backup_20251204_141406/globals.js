// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Tile system
export const TILE_SIZE = 20;
export const GRID_WIDTH = Math.floor(CANVAS_WIDTH / TILE_SIZE);
export const GRID_HEIGHT = Math.floor(CANVAS_HEIGHT / TILE_SIZE);

// Game constants
export const PLAYER_SPEED = 3;
export const PLAYER_JUMP_POWER = -8;
export const GRAVITY = 0.4;
export const MAX_FALL_SPEED = 10;
export const BOMB_TIMER = 90; // frames
export const BOMB_RADIUS = 40;
export const STARTING_BOMBS = 4;
export const STARTING_ROPES = 4;
export const STARTING_HEALTH = 4;

// Tile types
export const TILE_EMPTY = 0;
export const TILE_SOLID = 1;
export const TILE_DESTRUCTIBLE = 2;
export const TILE_LADDER = 3;
export const TILE_PLATFORM = 4; // One-way platform

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
  controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
  
  // Level data
  tiles: [],
  levelWidth: GRID_WIDTH,
  levelHeight: GRID_HEIGHT,
  
  // Entity arrays
  gems: [],
  enemies: [],
  bombs: [],
  ropes: [],
  particles: [],
  explosions: [],
  
  // Exit door
  exitDoor: null,
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  
  // Physics
  gravity: GRAVITY,
  
  // Frame tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Level generation
  currentLevel: 1,
  gemsCollected: 0,
  totalGems: 0,
  
  // Animation frame counter
  animationFrame: 0
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;