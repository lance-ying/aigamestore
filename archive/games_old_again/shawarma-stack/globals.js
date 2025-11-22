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

export const INGREDIENTS = {
  MEAT: { name: "Meat", key: "Z", keyCode: 90, color: [139, 69, 19] },
  TOMATO: { name: "Tomato", key: "W", keyCode: 87, color: [220, 20, 60] },
  ONION: { name: "Onion", key: "A", keyCode: 65, color: [200, 150, 220] },
  LETTUCE: { name: "Lettuce", key: "S", keyCode: 83, color: [144, 238, 144] },
  PICKLE: { name: "Pickle", key: "D", keyCode: 68, color: [154, 205, 50] },
  GARLIC_SAUCE: { name: "Garlic", key: "↑", keyCode: 38, color: [255, 255, 224] },
  TAHINI_SAUCE: { name: "Tahini", key: "↓", keyCode: 40, color: [210, 180, 140] }
};

export const LEVEL_CONFIG = [
  {
    level: 1,
    objective: { coins: 200, customers: 5 },
    customerArrivalMin: 10000,
    customerArrivalMax: 15000,
    orderComplexity: 2,
    customerTimer: 25000,
    initialReputation: 0.8,
    availableIngredients: ["MEAT", "TOMATO", "ONION", "GARLIC_SAUCE"]
  },
  {
    level: 2,
    objective: { coins: 500, customers: 8 },
    customerArrivalMin: 8000,
    customerArrivalMax: 12000,
    orderComplexity: 3,
    customerTimer: 20000,
    initialReputation: 0.75,
    availableIngredients: ["MEAT", "TOMATO", "ONION", "LETTUCE", "GARLIC_SAUCE"]
  },
  {
    level: 3,
    objective: { coins: 800, customers: 12 },
    customerArrivalMin: 6000,
    customerArrivalMax: 10000,
    orderComplexity: 4,
    customerTimer: 18000,
    initialReputation: 0.7,
    availableIngredients: ["MEAT", "TOMATO", "ONION", "LETTUCE", "PICKLE", "GARLIC_SAUCE", "TAHINI_SAUCE"]
  },
  {
    level: 4,
    objective: { coins: 1200, customers: 15 },
    customerArrivalMin: 5000,
    customerArrivalMax: 8000,
    orderComplexity: 5,
    customerTimer: 15000,
    initialReputation: 0.6,
    availableIngredients: ["MEAT", "TOMATO", "ONION", "LETTUCE", "PICKLE", "GARLIC_SAUCE", "TAHINI_SAUCE"]
  },
  {
    level: 5,
    objective: { coins: 1800, customers: 20 },
    customerArrivalMin: 4000,
    customerArrivalMax: 7000,
    orderComplexity: 6,
    customerTimer: 12000,
    initialReputation: 0.5,
    availableIngredients: ["MEAT", "TOMATO", "ONION", "LETTUCE", "PICKLE", "GARLIC_SAUCE", "TAHINI_SAUCE"]
  }
];

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  coins: 0,
  reputation: 1.0,
  currentLevel: 1,
  customersServed: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentWrap: [],
  customerQueue: [],
  nextCustomerTime: 0,
  highScore: 0,
  totalCustomersThisLevel: 0,
  levelStartTime: 0,
  particles: [],
  lastAddedIngredient: null,
  lastAddedTime: 0
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}