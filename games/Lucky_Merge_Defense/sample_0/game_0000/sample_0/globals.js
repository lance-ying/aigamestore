// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Grid configuration
export const GRID_SIZE = 40;
export const GRID_COLS = 15;
export const GRID_ROWS = 10;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Unit types
export const UNIT_ARCHER = "ARCHER";
export const UNIT_MAGE = "MAGE";
export const UNIT_CANNON = "CANNON";

// Unit rarities
export const RARITY_COMMON = "COMMON";
export const RARITY_UNCOMMON = "UNCOMMON";
export const RARITY_RARE = "RARE";
export const RARITY_EPIC = "EPIC";
export const RARITY_LEGENDARY = "LEGENDARY";

// Enemy types
export const ENEMY_BASIC = "BASIC";
export const ENEMY_FAST = "FAST";
export const ENEMY_TANKY = "TANKY";
export const ENEMY_BOSS = "BOSS";

// Roulette rewards
export const REWARD_CURRENCY = "CURRENCY";
export const REWARD_TEMP_UNIT = "TEMP_UNIT";
export const REWARD_BUFF = "BUFF";

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Player state
  currency: 50,
  baseHealth: 100,
  maxBaseHealth: 100,
  score: 0,
  
  // Level/Wave state
  currentLevel: 1,
  currentWave: 0,
  totalWavesInLevel: 5,
  waveState: "COUNTDOWN", // COUNTDOWN, ACTIVE, COMPLETE
  waveCountdownTimer: 0,
  waveCompleteTimer: 0,
  
  // Grid and units
  grid: [], // 2D array of grid cells
  units: [], // Array of placed units
  enemies: [], // Array of active enemies
  projectiles: [], // Array of active projectiles
  
  // Summoning/placement
  summonedUnit: null, // Unit waiting to be placed
  placementMode: false,
  cursorX: 7,
  cursorY: 5,
  
  // Merging
  selectedUnitForMerge: null,
  
  // Roulette
  rouletteSpinning: false,
  rouletteAngle: 0,
  rouletteTargetAngle: 0,
  rouletteSpeed: 0,
  rouletteReward: null,
  
  // Buffs
  activeBuffs: [],
  
  // Enemy spawning
  enemySpawnTimer: 0,
  enemiesSpawnedThisWave: 0,
  enemiesToSpawnThisWave: 0,
  
  // Path waypoints for enemies
  pathWaypoints: [],
  
  // Player reference (for compatibility)
  player: null,
  entities: []
};

// Level configurations
export const LEVEL_CONFIGS = [
  {
    level: 1,
    name: "The Rookie Road",
    waves: 5,
    baseHp: 100,
    startCurrency: 50,
    summonCost: 10,
    rouletteCost: 5,
    enemyTypes: [ENEMY_BASIC],
    enemiesPerWave: [5, 6, 7, 8, 10]
  },
  {
    level: 2,
    name: "The Winding Way",
    waves: 7,
    baseHp: 80,
    startCurrency: 75,
    summonCost: 12,
    rouletteCost: 7,
    enemyTypes: [ENEMY_BASIC, ENEMY_FAST],
    enemiesPerWave: [8, 10, 12, 14, 16, 18, 20]
  },
  {
    level: 3,
    name: "The Crossroads",
    waves: 10,
    baseHp: 60,
    startCurrency: 100,
    summonCost: 15,
    rouletteCost: 10,
    enemyTypes: [ENEMY_BASIC, ENEMY_FAST, ENEMY_TANKY, ENEMY_BOSS],
    enemiesPerWave: [12, 15, 18, 20, 22, 25, 28, 30, 35, 40]
  }
];

export function getCurrentLevelConfig() {
  return LEVEL_CONFIGS[gameState.currentLevel - 1] || LEVEL_CONFIGS[0];
}