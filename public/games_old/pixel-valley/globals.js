// Game constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 40;
export const GRID_WIDTH = 15;
export const GRID_HEIGHT = 10;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  tiles: [],
  crops: [],
  gamePhase: "START",
  controlMode: "HUMAN",
  gold: 100,
  day: 1,
  energy: 100,
  maxEnergy: 100,
  currentTool: 0, // 0: hoe, 1: seeds, 2: watering can
  tools: ["HOE", "SEEDS", "WATERING_CAN"],
  seedPrice: 10,
  cropValue: 40,
  growthDays: 3,
  lastInteractedTile: null,
  // New properties for highlighting and energy management
  hoveredTile: null,
  isExhausted: false,
  autoSleepTimer: 0,
  autoSleepDelay: 180 // 3 seconds at 60fps
};

// Function to get game state (exposed globally)
export function getGameState() {
  return gameState;
}

// Tool constants
export const TOOLS = {
  HOE: 0,
  SEEDS: 1,
  WATERING_CAN: 2
};

// Tile types
export const TILE_TYPES = {
  GRASS: 0,
  TILLED: 1,
  PLANTED: 2,
  WATERED: 3
};

// Crop growth stages
export const CROP_STAGES = {
  SEED: 0,
  SPROUT: 1,
  GROWING: 2,
  READY: 3
};