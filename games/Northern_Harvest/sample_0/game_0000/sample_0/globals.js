// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const VIEW_MODES = {
  FARM: "FARM",
  BUILD: "BUILD",
  INVENTORY: "INVENTORY",
  TASK_LIST: "TASK_LIST",
  WORLD_MAP: "WORLD_MAP",
  EXPEDITION: "EXPEDITION"
};

export const TILE_SIZE = 40;
export const FARM_GRID_WIDTH = 10;
export const FARM_GRID_HEIGHT = 10;

export const CROP_TYPES = {
  WHEAT: { name: "Wheat", cost: 10, growTime: 5, xp: 5, score: 5, icon: "🌾" },
  CORN: { name: "Corn", cost: 20, growTime: 8, xp: 8, score: 5, icon: "🌽" }
};

export const ANIMAL_TYPES = {
  CHICKEN: { name: "Chicken", productionTime: 7, product: "EGG", xp: 10, score: 10 },
  COW: { name: "Cow", productionTime: 15, product: "MILK", xp: 15, score: 10 }
};

export const BUILDING_TYPES = {
  BARN: { name: "Barn", cost: 100, woodCost: 10, stoneCost: 5, buildTime: 10, size: 2, xp: 50, score: 50 },
  MILL: { name: "Mill", cost: 150, woodCost: 15, stoneCost: 10, buildTime: 15, size: 2, xp: 50, score: 50 },
  BAKERY: { name: "Bakery", cost: 200, woodCost: 20, stoneCost: 15, buildTime: 20, size: 2, xp: 50, score: 50 },
  SAWMILL: { name: "Sawmill", cost: 250, woodCost: 25, stoneCost: 20, buildTime: 25, size: 2, xp: 50, score: 50 }
};

export const RECIPE_TYPES = {
  FLOUR: { name: "Flour", input: "WHEAT", inputAmount: 3, outputAmount: 1, productionTime: 5, xp: 20, score: 20 },
  BREAD: { name: "Bread", input: "FLOUR", inputAmount: 2, outputAmount: 1, productionTime: 8, xp: 20, score: 20 }
};

export const EXPEDITION_TYPES = {
  FOREST_PATH: { name: "Forest Path", energyCost: 20, duration: 10, rewards: { WOOD: 5, coins: 50 }, xp: 50, score: 50 },
  MOUNTAIN_PASS: { name: "Mountain Pass", energyCost: 30, duration: 15, rewards: { STONE: 5, coins: 75 }, xp: 50, score: 50 },
  GOLD_MINE: { name: "Gold Mine", energyCost: 40, duration: 20, rewards: { WOOD: 3, STONE: 3, coins: 100 }, xp: 50, score: 50 }
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  viewMode: VIEW_MODES.FARM,
  
  // Player progression
  playerLevel: 1,
  playerXP: 0,
  xpToNextLevel: 100,
  coins: 150,
  wood: 5,
  stone: 2,
  score: 0,
  highScore: 0,
  
  // Inventory
  inventory: {
    WHEAT: 0,
    CORN: 0,
    EGG: 0,
    MILK: 0,
    FLOUR: 0,
    BREAD: 0
  },
  
  // Farm state
  farmPlots: [],
  animals: [],
  buildings: [],
  
  // Quests
  activeQuests: [],
  completedQuests: [],
  
  // Unlocks
  unlockedCrops: ["WHEAT"],
  unlockedAnimals: [],
  unlockedBuildings: [],
  unlockedRecipes: [],
  unlockedExpeditions: [],
  
  // Time and energy
  gameTime: 0,
  expeditionEnergy: 100,
  maxExpeditionEnergy: 100,
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  
  // UI state
  selectedCrop: null,
  selectedBuilding: null,
  buildingBlueprint: null,
  multiSelectMode: false,
  
  // Game tracking
  bankruptTimer: 0,
  lastQuickHarvestTime: 0,
  
  // Player reference (for compatibility)
  player: null,
  entities: []
};

// Level requirements
export const LEVEL_REQUIREMENTS = [
  { level: 1, xpRequired: 0 },
  { level: 2, xpRequired: 100 },
  { level: 3, xpRequired: 250 },
  { level: 4, xpRequired: 500 },
  { level: 5, xpRequired: 1000 }
];

// Quest definitions
export const QUEST_DEFINITIONS = {
  FIRST_HARVEST: {
    id: "FIRST_HARVEST",
    name: "First Harvest",
    description: "Plant and harvest 3 wheat",
    requirements: { harvestWheat: 3 },
    rewards: { coins: 50, xp: 25 },
    unlocks: ["CHICKEN"]
  },
  BUILD_BARN: {
    id: "BUILD_BARN",
    name: "Build the Barn",
    description: "Construct a Barn",
    requirements: { buildBarn: 1 },
    rewards: { coins: 100, xp: 50 },
    unlocks: ["MILL"]
  },
  EXPAND_FARM: {
    id: "EXPAND_FARM",
    name: "Expanding the Farm",
    description: "Unlock corn and collect 5 eggs",
    requirements: { collectEggs: 5 },
    rewards: { coins: 150, xp: 75 },
    unlocks: ["CORN", "COW", "FOREST_PATH"]
  },
  BUILD_MILL: {
    id: "BUILD_MILL",
    name: "Build the Mill",
    description: "Construct a Mill",
    requirements: { buildMill: 1 },
    rewards: { coins: 200, xp: 100 },
    unlocks: ["FLOUR", "MOUNTAIN_PASS"]
  },
  CRAFT_FLOUR: {
    id: "CRAFT_FLOUR",
    name: "Craft Flour",
    description: "Produce 5 flour at the Mill",
    requirements: { craftFlour: 5 },
    rewards: { coins: 150, xp: 100 },
    unlocks: ["BAKERY"]
  },
  BUILD_BAKERY: {
    id: "BUILD_BAKERY",
    name: "Build the Bakery",
    description: "Construct a Bakery",
    requirements: { buildBakery: 1 },
    rewards: { coins: 300, xp: 150 },
    unlocks: ["BREAD", "GOLD_MINE"]
  },
  RESOURCE_GATHERING: {
    id: "RESOURCE_GATHERING",
    name: "Resource Gathering",
    description: "Collect 10 wood and 10 stone",
    requirements: { collectWood: 10, collectStone: 10 },
    rewards: { coins: 250, xp: 150 },
    unlocks: ["SAWMILL"]
  },
  BUILD_SAWMILL: {
    id: "BUILD_SAWMILL",
    name: "Build the Sawmill",
    description: "Construct a Sawmill",
    requirements: { buildSawmill: 1 },
    rewards: { coins: 400, xp: 200 },
    unlocks: []
  },
  PROSPERITY: {
    id: "PROSPERITY",
    name: "Prosperity & Adventure",
    description: "Reach Farm Level 5 and have 1000 coins",
    requirements: { reachLevel: 5, haveCoins: 1000 },
    rewards: { coins: 500, xp: 500 },
    unlocks: []
  }
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}