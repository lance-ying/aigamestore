// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const GRAVITY = 0.6;
export const FRICTION = 0.85;
export const PLAYER_SPEED = 5;
export const PLAYER_JUMP_POWER = -12;
export const PLAYER_DASH_POWER = 15;
export const PLAYER_DASH_COOLDOWN = 30; // frames
export const WALL_RUN_DURATION = 45; // frames
export const CHAINSAW_SLIDE_SPEED = 10;

// Enemy constants
export const ENEMY_SPAWN_RATE = 90; // frames
export const ENEMY_SPEED = 2;
export const ENEMY_HEALTH = 50;
export const ENEMY_DAMAGE = 10;
export const BOSS_HEALTH = 500;
export const BOSS_SPEED = 3;

// Weapon constants
export const ROCKET_SPEED = 8;
export const ROCKET_DAMAGE = 30;
export const ROCKET_COOLDOWN = 20; // frames
export const ROCKET_LIFETIME = 120; // frames

// Progression
export const ENEMIES_PER_WAVE = 15;
export const TOTAL_WAVES = 3;
export const CASH_PER_KILL = 10;

// Visual constants
export const NEON_PINK = [255, 20, 147];
export const NEON_CYAN = [0, 255, 255];
export const NEON_PURPLE = [138, 43, 226];
export const NEON_GREEN = [57, 255, 20];
export const NEON_ORANGE = [255, 165, 0];

// Game state object
export const gameState = {
  // Game phase
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Player reference
  player: null,
  
  // Entity arrays
  entities: [],
  enemies: [],
  projectiles: [],
  particles: [],
  platforms: [],
  collectibles: [],
  
  // Game progression
  score: 0,
  cash: 0,
  kills: 0,
  currentWave: 1,
  enemiesKilledThisWave: 0,
  waveComplete: false,
  bossSpawned: false,
  boss: null,
  
  // Timing
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  enemySpawnTimer: 0,
  
  // Physics
  gravity: GRAVITY,
  friction: FRICTION,
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  cameraShake: 0,
  
  // Background effects
  backgroundParticles: [],
  buildings: []
};

// Global function to get game state
export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}

// Helper function to reset game state
export function resetGameState() {
  gameState.player = null;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.platforms = [];
  gameState.collectibles = [];
  gameState.score = 0;
  gameState.cash = 0;
  gameState.kills = 0;
  gameState.currentWave = 1;
  gameState.enemiesKilledThisWave = 0;
  gameState.waveComplete = false;
  gameState.bossSpawned = false;
  gameState.boss = null;
  gameState.enemySpawnTimer = 0;
  gameState.cameraX = 0;
  gameState.cameraY = 0;
  gameState.cameraShake = 0;
  gameState.backgroundParticles = [];
}