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

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  distance: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Snake specific
  snakeLength: 20,
  snakeSegments: [],
  
  // Scrolling and spawning
  scrollSpeed: 2,
  scrollOffset: 0,
  
  // Entities arrays
  blocks: [],
  orbs: [],
  
  // Spawn control
  lastSpawnY: -100,
  spawnInterval: 150,
  
  // Difficulty
  minBlockValue: 5,
  maxBlockValue: 15,
  
  // Performance tracking
  framesSurvived: 0,
  orbsCollected: 0,
  blocksHit: 0
};

// Expose game state globally
window.getGameState = function() {
  return gameState;
};