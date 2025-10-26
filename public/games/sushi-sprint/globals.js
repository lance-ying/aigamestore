// globals.js - Global state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null, // Not used in this game type, but required by spec
  entities: [], // All game entities
  score: 0,
  gold: 300,
  reputation: 100,
  currentLevel: 1,
  gameTime: 0, // In-game seconds
  gameDay: 1,
  maxGameDays: 3,
  
  // Level objectives
  levelObjectives: {
    goldTarget: 500,
    customersTarget: 10,
    reputationTarget: 200
  },
  
  customersServed: 0,
  customersLeft: 0,
  consecutiveServicesCombo: 0,
  
  // Ingredients inventory
  ingredients: {
    rice: 50,
    tuna: 30,
    cucumber: 20,
    salmon: 0,
    avocado: 0,
    crabStick: 0,
    shrimp: 0,
    nori: 30
  },
  
  // Unlocked recipes
  unlockedRecipes: ["tunaNigiri", "cucumberMaki"],
  
  // Game entities
  customers: [],
  tables: [],
  kitchenStations: [],
  
  // Camera offset for scrolling
  cameraX: 0,
  cameraY: 0,
  
  // UI state
  selectedStation: null,
  showShopMenu: false,
  
  // Customer spawn timer
  customerSpawnTimer: 0,
  customerSpawnInterval: 180, // frames (3 seconds at 60fps)
  
  // Performance tracking
  dailySatisfactionTotal: 0,
  dailyCustomersServed: 0,
  
  // Level completion
  levelComplete: false,
  levelFailed: false,
  failureReason: ""
};

// Recipe definitions
export const RECIPES = {
  tunaNigiri: {
    id: "tunaNigiri",
    name: "Tuna Nigiri",
    ingredients: { rice: 2, tuna: 1 },
    prepTime: 120, // frames (2 seconds)
    price: 30,
    unlockCost: 0
  },
  cucumberMaki: {
    id: "cucumberMaki",
    name: "Cucumber Maki",
    ingredients: { rice: 2, cucumber: 1, nori: 1 },
    prepTime: 150,
    price: 25,
    unlockCost: 0
  },
  salmonRoll: {
    id: "salmonRoll",
    name: "Salmon Roll",
    ingredients: { rice: 3, salmon: 2, nori: 1 },
    prepTime: 180,
    price: 45,
    unlockCost: 200
  },
  californiaRoll: {
    id: "californiaRoll",
    name: "California Roll",
    ingredients: { rice: 3, crabStick: 2, avocado: 1, nori: 1 },
    prepTime: 200,
    price: 50,
    unlockCost: 250
  },
  shrimpNigiri: {
    id: "shrimpNigiri",
    name: "Shrimp Nigiri",
    ingredients: { rice: 2, shrimp: 1 },
    prepTime: 130,
    price: 35,
    unlockCost: 150
  }
};

// Level configurations
export const LEVEL_CONFIGS = {
  1: {
    goldTarget: 500,
    customersTarget: 10,
    reputationTarget: 200,
    maxDays: 3,
    customerPatienceMultiplier: 1.5,
    startingGold: 300,
    unlockedRecipes: ["tunaNigiri", "cucumberMaki"],
    availableRecipes: ["salmonRoll", "shrimpNigiri"]
  },
  2: {
    goldTarget: 1500,
    customersTarget: 25,
    reputationTarget: 400,
    maxDays: 5,
    customerPatienceMultiplier: 1.2,
    startingGold: 500,
    unlockedRecipes: ["tunaNigiri", "cucumberMaki"],
    availableRecipes: ["salmonRoll", "californiaRoll", "shrimpNigiri"]
  },
  3: {
    goldTarget: 3000,
    customersTarget: 40,
    reputationTarget: 800,
    maxDays: 7,
    customerPatienceMultiplier: 1.0,
    startingGold: 700,
    unlockedRecipes: ["tunaNigiri", "cucumberMaki", "salmonRoll"],
    availableRecipes: ["californiaRoll", "shrimpNigiri"]
  },
  4: {
    goldTarget: 5000,
    customersTarget: 60,
    reputationTarget: 1200,
    maxDays: 8,
    customerPatienceMultiplier: 0.8,
    startingGold: 1000,
    unlockedRecipes: ["tunaNigiri", "cucumberMaki", "salmonRoll", "californiaRoll"],
    availableRecipes: ["shrimpNigiri"]
  },
  5: {
    goldTarget: 10000,
    customersTarget: 100,
    reputationTarget: 2000,
    maxDays: 10,
    customerPatienceMultiplier: 0.7,
    startingGold: 1500,
    unlockedRecipes: Object.keys(RECIPES),
    availableRecipes: []
  }
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}