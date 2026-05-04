// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_GAME_OVER = "GAME_OVER";
export const PHASE_PAUSED = "PAUSED";

// Game states within PLAYING
export const STATE_MENU = "MENU";
export const STATE_BASE_BUILDING = "BASE_BUILDING";
export const STATE_COMBAT = "COMBAT";
export const STATE_LEVEL_TRANSITION = "LEVEL_TRANSITION";
export const STATE_GAME_OVER_LOSE = "GAME_OVER_LOSE";
export const STATE_GAME_OVER_WIN = "GAME_OVER_WIN";

// Lane configuration
export const NUM_LANES = 3;
export const LANE_HEIGHT = 100;
export const LANE_START_Y = 50;
export const BASE_ZONE_WIDTH = 60;

// Hero types
export const HERO_INFANTRY = "INFANTRY";
export const HERO_ENGINEER = "ENGINEER";
export const HERO_MEDIC = "MEDIC";

// Zombie types
export const ZOMBIE_WALKER = "WALKER";
export const ZOMBIE_RUNNER = "RUNNER";
export const ZOMBIE_TANK = "TANK";
export const ZOMBIE_BOSS = "BOSS";

// Obstacle types
export const OBSTACLE_BARRICADE = "BARRICADE";
export const OBSTACLE_CAR = "CAR";

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  gameSubState: STATE_MENU,
  controlMode: "HUMAN",
  
  // Player resources
  gold: 150,
  supplies: 50,
  baseHP: 100,
  maxBaseHP: 100,
  currentLevel: 1,
  score: 0,
  highScore: 0,
  
  // Combat state
  currentWave: 0,
  totalWaves: 0,
  zombiesSpawnedThisWave: 0,
  zombiesToSpawnThisWave: 0,
  waveCompleted: false,
  levelCompleted: false,
  transitionTimer: 0,
  
  // Entities
  player: null, // Not used in this game but kept for compatibility
  entities: [],
  heroes: [],
  zombies: [],
  obstacles: [],
  projectiles: [],
  effects: [],
  
  // Hero deployment
  selectedHeroType: null,
  selectedLane: 1, // 0, 1, or 2
  heroCooldowns: {},
  
  // Base structures
  structures: {
    resourceGenerator: { level: 1, maxLevel: 5 },
    trainingFacility: { level: 1, maxLevel: 5 },
    commandCenter: { level: 1, maxLevel: 5 }
  },
  
  // Resource accumulation
  accumulatedGold: 0,
  accumulatedSupplies: 0,
  resourceTimer: 0,
  
  // Hero roster
  unlockedHeroes: [HERO_INFANTRY, HERO_MEDIC],
  heroLevels: {},
  
  // UI state
  selectedStructure: null,
  
  // Automation testing
  testActions: []
};

// Initialize hero levels and cooldowns
gameState.heroLevels[HERO_INFANTRY] = 1;
gameState.heroLevels[HERO_ENGINEER] = 0; // Unlocked at level 2
gameState.heroLevels[HERO_MEDIC] = 1;

gameState.heroCooldowns[HERO_INFANTRY] = 0;
gameState.heroCooldowns[HERO_ENGINEER] = 0;
gameState.heroCooldowns[HERO_MEDIC] = 0;