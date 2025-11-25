// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Tile system
export const TILE_SIZE = 40;
export const FARM_WIDTH = 15;
export const FARM_HEIGHT = 10;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Tool types
export const TOOL_HOE = "hoe";
export const TOOL_WATERING_CAN = "wateringCan";
export const TOOL_SCYTHE = "scythe";

// Crop growth stages
export const CROP_STAGE_SEED = 0;
export const CROP_STAGE_SPROUT = 1;
export const CROP_STAGE_GROWING = 2;
export const CROP_STAGE_MATURE = 3;

// Day/Season system
export const DAYS_PER_SEASON = 28;
export const SEASONS = ["Spring", "Summer", "Fall", "Winter"];

// Crop data - unlocked by farming level
export const CROP_DATA = {
  turnip: {
    name: "Turnip",
    growthTime: 4,
    price: 10,
    sellPrice: 30,
    waterNeeded: true,
    requiredLevel: 0,
    expGain: 5
  },
  potato: {
    name: "Potato",
    growthTime: 6,
    price: 20,
    sellPrice: 60,
    waterNeeded: true,
    requiredLevel: 2,
    expGain: 10
  },
  corn: {
    name: "Corn",
    growthTime: 8,
    price: 40,
    sellPrice: 120,
    waterNeeded: true,
    requiredLevel: 4,
    expGain: 20
  },
  tomato: {
    name: "Tomato",
    growthTime: 10,
    price: 60,
    sellPrice: 200,
    waterNeeded: true,
    requiredLevel: 6,
    expGain: 35
  },
  melon: {
    name: "Melon",
    growthTime: 12,
    price: 100,
    sellPrice: 400,
    waterNeeded: true,
    requiredLevel: 8,
    expGain: 50
  }
};

// Game state object
export const gameState = {
  // Player data
  player: null,
  
  // Entities
  entities: [],
  crops: [],
  
  // Farm grid
  farmTiles: [],
  
  // Game phase
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Player stats
  money: 100,
  energy: 100,
  maxEnergy: 100,
  farmingLevel: 0,
  farmingExp: 0,
  
  // Experience thresholds for leveling
  expThresholds: [0, 50, 120, 220, 350, 520, 730, 980, 1270, 1600],
  
  // Time system
  currentDay: 1,
  currentSeason: 0,
  timeOfDay: 6, // 6 AM to 10 PM (6-22)
  
  // UI state
  showShop: false,
  selectedShopItem: null,
  selectedTool: TOOL_HOE,
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  
  // Score
  score: 0,
  
  // Performance
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Tutorial
  showTutorial: true
};

// Helper function to get available crops based on level
export function getAvailableCrops() {
  const available = [];
  for (const [key, data] of Object.entries(CROP_DATA)) {
    if (gameState.farmingLevel >= data.requiredLevel) {
      available.push({ type: key, ...data });
    }
  }
  return available;
}

// Expose game state globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;