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

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Player/Shop data
  player: null,
  money: 100,
  reputation: 50,
  branches: 1,
  
  // Inventory and ingredients
  ingredients: [],
  unlockedIngredients: [],
  
  // Customer management
  customers: [],
  customersSatisfied: 0,
  customersAngry: 0,
  
  // Current burger being created
  currentBurger: {
    ingredients: [],
    quality: 0
  },
  
  // Game state
  currentDay: 1,
  currentTime: 0,
  maxTime: 180, // seconds per day
  
  // UI state
  menuState: "MAIN", // MAIN, CREATE_BURGER, SERVE, SHOP, EXPAND
  selectedIndex: 0,
  
  // Staff
  staff: [],
  
  // Rivals
  rivals: [],
  
  // Entities
  entities: [],
  
  // Frame tracking
  frameCount: 0,
  lastActionFrame: 0
};

// Ingredient database
export const INGREDIENT_DATA = {
  BUN: { name: "Bun", cost: 2, quality: 5, category: "base" },
  PATTY: { name: "Beef Patty", cost: 8, quality: 15, category: "protein" },
  CHEESE: { name: "Cheese", cost: 3, quality: 8, category: "topping" },
  LETTUCE: { name: "Lettuce", cost: 2, quality: 6, category: "vegetable" },
  TOMATO: { name: "Tomato", cost: 2, quality: 6, category: "vegetable" },
  BACON: { name: "Bacon", cost: 5, quality: 12, category: "protein" },
  EGG: { name: "Fried Egg", cost: 4, quality: 10, category: "protein" },
  FISH: { name: "Fish Fry", cost: 6, quality: 11, category: "protein" },
  TARTAR: { name: "Tartar Sauce", cost: 3, quality: 7, category: "sauce" },
  KETCHUP: { name: "Ketchup", cost: 1, quality: 4, category: "sauce" },
  MAYO: { name: "Mayo", cost: 1, quality: 4, category: "sauce" },
  PICKLE: { name: "Pickle", cost: 2, quality: 5, category: "vegetable" },
  ONION: { name: "Onion", cost: 2, quality: 5, category: "vegetable" },
  MUSHROOM: { name: "Mushroom", cost: 4, quality: 9, category: "vegetable" },
  AVOCADO: { name: "Avocado", cost: 6, quality: 11, category: "vegetable" }
};

// Combo bonuses for ingredient combinations
export const COMBO_BONUSES = [
  { ingredients: ["FISH", "TARTAR"], bonus: 20, name: "Fish Deluxe" },
  { ingredients: ["BACON", "LETTUCE", "EGG"], bonus: 25, name: "BLE Special" },
  { ingredients: ["PATTY", "CHEESE", "BACON"], bonus: 22, name: "Meat Lover" },
  { ingredients: ["MUSHROOM", "CHEESE"], bonus: 15, name: "Fungi Fusion" },
  { ingredients: ["AVOCADO", "TOMATO", "LETTUCE"], bonus: 18, name: "Garden Fresh" }
];

window.getGameState = function() {
  return gameState;
};