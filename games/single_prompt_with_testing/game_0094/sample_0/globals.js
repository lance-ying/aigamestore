// globals.js - Game constants and global state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const GRAVITY = 0.6;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.98;
export const GROUND_Y = CANVAS_HEIGHT - 40;

// Player constants
export const PLAYER_SPEED = 4;
export const PLAYER_JUMP_POWER = -11;
export const PLAYER_DOUBLE_JUMP_POWER = -10;
export const PLAYER_SHOVEL_DROP_POWER = 12;
export const PLAYER_BOUNCE_POWER = -13;

// Level definitions - 9 levels with increasing difficulty
export const LEVELS = [
  // Easy levels (1-3)
  {
    id: 1,
    name: "Novice Ruins",
    difficulty: "EASY",
    worldWidth: 1200,
    enemyCount: 2,
    enemyTypes: { basic: 2, tough: 0 },
    gemCount: 10,
    platformCount: 8
  },
  {
    id: 2,
    name: "Ancient Path",
    difficulty: "EASY",
    worldWidth: 1400,
    enemyCount: 3,
    enemyTypes: { basic: 3, tough: 0 },
    gemCount: 12,
    platformCount: 10
  },
  {
    id: 3,
    name: "Hidden Grove",
    difficulty: "EASY",
    worldWidth: 1600,
    enemyCount: 3,
    enemyTypes: { basic: 2, tough: 1 },
    gemCount: 15,
    platformCount: 12
  },
  // Medium levels (4-6)
  {
    id: 4,
    name: "Forgotten Temple",
    difficulty: "MEDIUM",
    worldWidth: 1800,
    enemyCount: 5,
    enemyTypes: { basic: 3, tough: 2 },
    gemCount: 15,
    platformCount: 14
  },
  {
    id: 5,
    name: "Shadow Keep",
    difficulty: "MEDIUM",
    worldWidth: 2000,
    enemyCount: 6,
    enemyTypes: { basic: 3, tough: 3 },
    gemCount: 18,
    platformCount: 16
  },
  {
    id: 6,
    name: "Crystal Cavern",
    difficulty: "MEDIUM",
    worldWidth: 2200,
    enemyCount: 7,
    enemyTypes: { basic: 3, tough: 4 },
    gemCount: 20,
    platformCount: 18
  },
  // Hard levels (7-9)
  {
    id: 7,
    name: "Demon's Gate",
    difficulty: "HARD",
    worldWidth: 2400,
    enemyCount: 8,
    enemyTypes: { basic: 2, tough: 6 },
    gemCount: 20,
    platformCount: 20
  },
  {
    id: 8,
    name: "Infernal Depths",
    difficulty: "HARD",
    worldWidth: 2600,
    enemyCount: 9,
    enemyTypes: { basic: 2, tough: 7 },
    gemCount: 22,
    platformCount: 22
  },
  {
    id: 9,
    name: "Final Sanctum",
    difficulty: "HARD",
    worldWidth: 3000,
    enemyCount: 10,
    enemyTypes: { basic: 0, tough: 10 },
    gemCount: 25,
    platformCount: 25
  }
];

// Color palette (retro 8-bit inspired)
export const COLORS = {
  sky: [60, 120, 180],
  ground: [90, 70, 50],
  platform: [120, 100, 80],
  platformEdge: [80, 60, 40],
  player: [70, 160, 230],
  playerArmor: [180, 160, 140],
  playerShovel: [200, 200, 200],
  gem: [255, 220, 0],
  gemShine: [255, 255, 200],
  enemy: [200, 50, 50],
  enemyDetail: [150, 30, 30],
  enemyTough: [150, 50, 150],
  enemyToughDetail: [100, 30, 100],
  health: [220, 50, 50],
  healthBg: [80, 20, 20],
  ui: [255, 255, 255],
  uiShadow: [40, 40, 40]
};

// Game state object
export const gameState = {
  // Core game state
  gamePhase: "LEVEL_SELECT", // "LEVEL_SELECT", "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE", "LEVEL_COMPLETE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  
  // Level state
  currentLevel: 1,
  currentLevelData: null,
  levelsCompleted: [false, false, false, false, false, false, false, false, false],
  
  // Entities
  player: null,
  entities: [],
  platforms: [],
  enemies: [],
  gems: [],
  projectiles: [],
  particles: [],
  
  // Physics
  gravity: GRAVITY,
  friction: FRICTION,
  airResistance: AIR_RESISTANCE,
  
  // Game progress
  score: 0,
  gemsCollected: 0,
  enemiesDefeated: 0,
  totalGems: 0,
  
  // Performance tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  cameraShakeX: 0,
  cameraShakeY: 0,
  worldWidth: 1200,
  
  // Input tracking
  keys: {},
  lastAttackFrame: 0,
  attackCooldown: 20
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;