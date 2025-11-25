// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Tile system
export const TILE_SIZE = 20;
export const FARM_WIDTH = 30;  // 600 / 20
export const FARM_HEIGHT = 20; // 400 / 20

// Time constants
export const DAY_LENGTH = 3600; // 60 seconds in frames (60 fps)
export const MORNING_START = 0;
export const EVENING_START = 2400; // 40 seconds
export const NIGHT_START = 3000; // 50 seconds

// Player constants
export const PLAYER_SPEED = 2;
export const MAX_ENERGY = 100;
export const MAX_HEALTH = 100;

// Action costs
export const TILL_ENERGY_COST = 5;
export const PLANT_ENERGY_COST = 3;
export const WATER_ENERGY_COST = 2;
export const HARVEST_ENERGY_COST = 1;

// Crop data
export const CROP_TYPES = {
  WHEAT: {
    name: 'Wheat',
    seedCost: 10,
    sellPrice: 25,
    growthTime: 600, // 10 seconds
    waterBonus: 0.3, // 30% faster when watered
    color: [255, 220, 100],
    unlockLevel: 0
  },
  CARROT: {
    name: 'Carrot',
    seedCost: 15,
    sellPrice: 40,
    growthTime: 900, // 15 seconds
    waterBonus: 0.3,
    color: [255, 140, 50],
    unlockLevel: 1
  },
  TOMATO: {
    name: 'Tomato',
    seedCost: 25,
    sellPrice: 70,
    growthTime: 1200, // 20 seconds
    waterBonus: 0.3,
    color: [255, 50, 50],
    unlockLevel: 2
  },
  CORN: {
    name: 'Corn',
    seedCost: 35,
    sellPrice: 100,
    growthTime: 1500, // 25 seconds
    waterBonus: 0.3,
    color: [255, 230, 80],
    unlockLevel: 3
  }
};

// Game state object
export const gameState = {
  // Core state
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Entities
  player: null,
  entities: [],
  tiles: [], // 2D array of farm tiles
  crops: [],
  particles: [],
  
  // Player stats
  gold: 50,
  energy: MAX_ENERGY,
  health: MAX_HEALTH,
  farmingLevel: 0,
  farmingXP: 0,
  xpToNextLevel: 100,
  
  // Time system
  dayCount: 1,
  timeOfDay: 0, // 0 to DAY_LENGTH
  season: 'Spring',
  
  // UI state
  shopOpen: false,
  selectedCropType: 'WHEAT',
  message: '',
  messageTimer: 0,
  
  // Performance tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Score tracking
  totalCropsHarvested: 0,
  totalGoldEarned: 0,
  score: 0
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;