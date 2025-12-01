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

// Control keys
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;
export const KEY_SPACE = 32;
export const KEY_Z = 90;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_SHIFT = 16;

// Game constants
export const PLAYER_SIZE = 20;
export const PLAYER_SPEED = 3;
export const PLAYER_MAX_HEALTH = 100;
export const BULLET_SPEED = 8;
export const BULLET_SIZE = 4;
export const ENEMY_SIZE = 18;
export const ENEMY_SPEED = 0.9; // Reduced from 1.2 for easier difficulty
export const XP_ORB_SIZE = 8;
export const XP_ORB_PICKUP_RANGE = 30;

// Stage Configuration
// Reduced kills required and increased spawn rate intervals (slower spawns) to lower difficulty
export const STAGE_CONFIG = [
  { name: "Easy I", killsRequired: 10, spawnRate: 150, enemyTypes: ['basic'] },
  { name: "Easy II", killsRequired: 15, spawnRate: 130, enemyTypes: ['basic', 'fast'] },
  { name: "Medium I", killsRequired: 25, spawnRate: 110, enemyTypes: ['basic', 'fast', 'tank'] },
  { name: "Medium II", killsRequired: 35, spawnRate: 100, enemyTypes: ['basic', 'fast', 'tank'] },
  { name: "Hard I", killsRequired: 50, spawnRate: 80, enemyTypes: ['basic', 'fast', 'tank', 'elite'] },
  { name: "Hard II", killsRequired: 70, spawnRate: 60, enemyTypes: ['basic', 'fast', 'tank', 'elite'] }
];

// Upgrade types
export const UPGRADE_TYPES = {
  FIRE_RATE: 'fire_rate',
  DAMAGE: 'damage',
  BULLET_SPEED: 'bullet_speed',
  MOVE_SPEED: 'move_speed',
  MAX_HEALTH: 'max_health',
  HEALTH_REGEN: 'health_regen',
  PIERCE: 'pierce',
  MULTISHOT: 'multishot',
  AREA_DAMAGE: 'area_damage',
  LIGHTNING: 'lightning',
  SHIELD: 'shield',
  SPEED_BOOST: 'speed_boost'
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  bullets: [],
  enemies: [],
  xpOrbs: [],
  particles: [],
  score: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  level: 1,
  experience: 0,
  experienceToNextLevel: 10,
  upgradeChoices: [],
  showingUpgradeScreen: false,
  gameStartTime: 0,
  elapsedTime: 0,
  enemySpawnTimer: 0,
  enemySpawnRate: 120, // frames between spawns
  waveNumber: 1,
  kills: 0,
  lastFireTime: 0,
  positionHistory: [],
  stage: 1,
  stageKills: 0,
  stageMessageTimer: 0
};

// Player stats that can be upgraded
export const playerStats = {
  fireRate: 15, // frames between shots
  damage: 10,
  bulletSpeed: BULLET_SPEED,
  moveSpeed: PLAYER_SPEED,
  maxHealth: PLAYER_MAX_HEALTH,
  healthRegen: 0,
  pierce: 0,
  multishot: 1,
  areaDamage: 0,
  hasLightning: false,
  lightningCooldown: 0,
  hasShield: false,
  shieldHealth: 0
};