// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game area boundaries (playfield is smaller than canvas for UI)
export const PLAY_AREA_LEFT = 20;
export const PLAY_AREA_RIGHT = 420;
export const PLAY_AREA_TOP = 40;
export const PLAY_AREA_BOTTOM = 380;
export const PLAY_AREA_WIDTH = PLAY_AREA_RIGHT - PLAY_AREA_LEFT;
export const PLAY_AREA_HEIGHT = PLAY_AREA_BOTTOM - PLAY_AREA_TOP;

// Item collection boundary
export const ITEM_COLLECTION_LINE = PLAY_AREA_TOP + 30;

// Key codes
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;

// Bentler colors
export const BENTLER_RED = 'red';
export const BENTLER_BLUE = 'blue';
export const BENTLER_GREEN = 'green';

// UFO types
export const UFO_RED = 'RED';
export const UFO_BLUE = 'BLUE';
export const UFO_GREEN = 'GREEN';
export const UFO_RAINBOW = 'RAINBOW';

// Game state object
export const gameState = {
  // Core game state
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Entities
  player: null,
  entities: [],
  enemies: [],
  bullets: [], // Enemy bullets
  playerBullets: [],
  collectibles: [],
  bentlerItems: [],
  ufos: [],
  particles: [],
  explosions: [],
  
  // Physics
  gravity: 0,
  friction: 0.95,
  
  // Game stats
  score: 0,
  power: 0.00, // 0.00 to 4.00
  maxPower: 4.00,
  lives: 3,
  spellCards: 2,
  bentlerStock: [], // Array of colors
  maxPointValue: 10000, // Maximum value of point items
  
  // Stage progression
  currentStage: 1,
  stageProgress: 0, // 0.0 to 1.0
  waveTimer: 0,
  enemiesKilled: 0,
  
  // Boss battle
  boss: null,
  bossActive: false,
  bossHealthBar: 0,
  
  // Timing
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Spawn timers
  enemySpawnTimer: 0,
  enemySpawnInterval: 90, // Frames between enemy spawns
  
  // Item effects
  itemAutoCollect: false, // True when player is at top of screen
  
  // Win/lose conditions
  requiredKills: 50, // Enemies to kill to win stage
  
  // Camera (for future scrolling if needed)
  cameraX: 0,
  cameraY: 0
};

// Initialize game state function
export function initializeGameState() {
  gameState.gamePhase = "START";
  gameState.controlMode = "HUMAN";
  gameState.score = 0;
  gameState.power = 1.00;
  gameState.lives = 3;
  gameState.spellCards = 2;
  gameState.bentlerStock = [];
  gameState.maxPointValue = 10000;
  gameState.currentStage = 1;
  gameState.stageProgress = 0;
  gameState.waveTimer = 0;
  gameState.enemiesKilled = 0;
  gameState.enemySpawnTimer = 0;
  gameState.requiredKills = 50;
  
  // Clear all entity arrays
  gameState.player = null;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.bullets = [];
  gameState.playerBullets = [];
  gameState.collectibles = [];
  gameState.bentlerItems = [];
  gameState.ufos = [];
  gameState.particles = [];
  gameState.explosions = [];
  gameState.boss = null;
  gameState.bossActive = false;
}

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Utility functions
export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

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