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

// Control modes
export const CONTROL_HUMAN = "HUMAN";
export const CONTROL_TEST_1 = "TEST_1";
export const CONTROL_TEST_2 = "TEST_2";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_R = 82;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;

// Game constants
export const MAX_ESCAPED_ENEMIES = 10;
export const INITIAL_GOLD = 150;

// Unit types
export const UNIT_BANDIT = "BANDIT";
export const UNIT_MEXICAN = "MEXICAN";
export const UNIT_INDIAN = "INDIAN";

// Enemy types
export const ENEMY_SETTLER = "SETTLER";
export const ENEMY_STAGECOACH = "STAGECOACH";
export const ENEMY_SPECIAL = "SPECIAL";

// Game state object
export const gameState = {
  player: null, // Not used in tower defense, but kept for consistency
  entities: [], // All game entities (units, enemies)
  units: [], // Player's deployed units
  enemies: [], // Active enemies
  paths: [], // Path points for enemies to follow
  selectedUnit: null, // Currently selected unit
  score: 0,
  gold: INITIAL_GOLD,
  level: 1,
  wave: 0,
  maxWaves: 5,
  escapedEnemies: 0,
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  menuOpen: false,
  menuSelection: 0,
  powerUps: [],
  region: "Alaska",
  waveTimer: 0,
  waveDelay: 180, // 3 seconds at 60 FPS
  enemiesSpawned: 0,
  enemiesPerWave: 10,
  frameCount: 0
};

// Unit definitions
export const UNIT_DEFINITIONS = {
  [UNIT_BANDIT]: {
    name: "Bandit",
    cost: 50,
    damage: 5,
    range: 60,
    attackSpeed: 30, // frames between attacks
    color: [180, 50, 50],
    description: "Basic ranged unit"
  },
  [UNIT_MEXICAN]: {
    name: "Crazy Mexican",
    cost: 80,
    damage: 8,
    range: 50,
    attackSpeed: 20,
    color: [200, 150, 50],
    description: "Fast attacker"
  },
  [UNIT_INDIAN]: {
    name: "Brave Indian",
    cost: 100,
    damage: 12,
    range: 70,
    attackSpeed: 40,
    color: [100, 150, 80],
    description: "Long range specialist"
  }
};

// Enemy definitions
export const ENEMY_DEFINITIONS = {
  [ENEMY_SETTLER]: {
    name: "Settler",
    health: 10,
    speed: 1.2,
    goldReward: 10,
    color: [100, 100, 200],
    size: 8
  },
  [ENEMY_STAGECOACH]: {
    name: "Stagecoach",
    health: 50,
    speed: 0.8,
    goldReward: 30,
    color: [150, 100, 50],
    size: 14
  },
  [ENEMY_SPECIAL]: {
    name: "Special",
    health: 30,
    speed: 1.5,
    goldReward: 20,
    color: [200, 200, 50],
    size: 10,
    dropsPowerUp: true
  }
};

// Upgrade costs
export const UPGRADE_DAMAGE_COST = 40;
export const UPGRADE_RANGE_COST = 30;
export const DAMAGE_UPGRADE_PERCENT = 0.15;
export const RANGE_UPGRADE_AMOUNT = 10;

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}