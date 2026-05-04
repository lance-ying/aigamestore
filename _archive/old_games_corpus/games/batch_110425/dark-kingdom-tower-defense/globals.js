// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Tower types
export const TOWER_TYPES = {
  ARROW: { name: "Arrow Tower", cost: 70, damage: 8, range: 100, fireRate: 30, color: [100, 200, 100] },
  MAGIC: { name: "Magic Tower", cost: 120, damage: 15, range: 80, fireRate: 45, color: [150, 100, 250] },
  CANNON: { name: "Cannon Tower", cost: 100, damage: 25, range: 90, fireRate: 60, color: [200, 100, 50] },
  FROST: { name: "Frost Tower", cost: 90, damage: 5, range: 110, fireRate: 40, color: [100, 200, 255] }
};

// Upgrade costs multiplier per tier
export const UPGRADE_COST_MULTIPLIER = 1.5;
export const MAX_TOWER_TIER = 3;

// Enemy configuration
export const ENEMY_TYPES = [
  { type: "SOLDIER", hp: 50, speed: 1.2, gold: 5, color: [200, 50, 50] },
  { type: "KNIGHT", hp: 100, speed: 0.8, gold: 10, color: [150, 150, 150] },
  { type: "MAGE", hp: 60, speed: 1.5, gold: 8, color: [100, 50, 200] },
  { type: "TANK", hp: 200, speed: 0.6, gold: 15, color: [80, 80, 80] },
  { type: "FAST", hp: 30, speed: 2.5, gold: 6, color: [255, 200, 50] }
];

// Wave configuration
export const TOTAL_WAVES = 10;
export const ENEMIES_PER_WAVE_BASE = 8;
export const WAVE_SCALING = 1.3;

// Hero configuration
export const HERO_BASE_DAMAGE = 20;
export const HERO_BASE_HP = 200;
export const HERO_SPEED = 2.5;
export const HERO_ATTACK_RANGE = 60;
export const HERO_ATTACK_COOLDOWN = 20;
export const HERO_XP_PER_LEVEL = 100;

// Game balance
export const STARTING_GOLD = 200;
export const STARTING_LIVES = 20;
export const STARS_PER_WAVE = 1;

// Meta upgrades
export const META_UPGRADES = {
  TOWER_DAMAGE: { name: "Tower Damage", cost: 3, maxLevel: 5, bonus: 0.15 },
  TOWER_RANGE: { name: "Tower Range", cost: 3, maxLevel: 5, bonus: 0.1 },
  STARTING_GOLD: { name: "Starting Gold", cost: 2, maxLevel: 10, bonus: 50 },
  HERO_DAMAGE: { name: "Hero Damage", cost: 4, maxLevel: 5, bonus: 0.2 }
};

// Game state - single source of truth
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Player resources
  gold: STARTING_GOLD,
  lives: STARTING_LIVES,
  stars: 0,
  totalStars: 0, // Persistent across restarts
  
  // Meta upgrades (persistent)
  metaUpgrades: {
    TOWER_DAMAGE: 0,
    TOWER_RANGE: 0,
    STARTING_GOLD: 0,
    HERO_DAMAGE: 0
  },
  
  // Wave management
  currentWave: 0,
  waveInProgress: false,
  waveStartDelay: 0,
  enemiesRemaining: 0,
  
  // Entities
  player: null, // Hero character
  towers: [],
  enemies: [],
  projectiles: [],
  particles: [],
  entities: [], // All entities combined
  
  // Tower placement
  selectedTowerType: "ARROW",
  selectedTower: null,
  validPlacementLocations: [],
  
  // Path waypoints
  path: [],
  
  // UI state
  showUpgradeMenu: false,
  
  // Testing
  framesSinceLastAction: 0,
  testingPositionHistory: []
};

// Export function to get game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}