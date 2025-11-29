// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2"
};

// Game state object
export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  
  // Player/Cafe data
  money: 100,
  reputation: 0,
  stars: 1,
  
  // Recipe system
  unlockedIngredients: ["coffee", "milk", "sugar", "water", "tea"],
  recipes: [], // {name, ingredients[], price, warmth, comfort, popularity}
  menuSlots: [null, null, null, null], // 4 menu slots
  
  // Customer system
  customers: [], // {id, name, preferences, satisfaction, isRegular, waitTime, servedItem}
  customersServed: 0,
  satisfactionHistory: [],
  
  // UI state
  currentView: "CAFE", // "CAFE", "RECIPE_LAB", "INGREDIENT_SHOP"
  selectedMenuIndex: 0,
  
  // Recipe creation state
  recipeInProgress: {
    ingredients: [],
    active: false
  },
  
  // Available ingredients for purchase
  availableIngredients: [
    {name: "chocolate", cost: 50, unlocked: false},
    {name: "vanilla", cost: 50, unlocked: false},
    {name: "cream", cost: 60, unlocked: false},
    {name: "honey", cost: 40, unlocked: false},
    {name: "cinnamon", cost: 45, unlocked: false},
    {name: "lemon", cost: 35, unlocked: false},
    {name: "strawberry", cost: 70, unlocked: false},
    {name: "caramel", cost: 65, unlocked: false}
  ],
  
  // Progression
  totalEarnings: 0,
  upgradePurchased: false,
  
  // Input tracking
  lastKeyPressed: null,
  framesSinceLastInput: 0,
  
  // Testing
  testingData: {
    recipesCreated: 0,
    customersServedCount: 0,
    timeElapsed: 0
  }
};

// Ingredient properties
export const INGREDIENT_DATA = {
  coffee: {warmth: 3, comfort: 1, color: [101, 67, 33]},
  milk: {warmth: 1, comfort: 2, color: [255, 253, 208]},
  sugar: {warmth: 1, comfort: 1, color: [255, 255, 255]},
  water: {warmth: 0, comfort: 1, color: [173, 216, 230]},
  tea: {warmth: 2, comfort: 2, color: [160, 82, 45]},
  chocolate: {warmth: 2, comfort: 3, color: [139, 69, 19]},
  vanilla: {warmth: 1, comfort: 3, color: [245, 222, 179]},
  cream: {warmth: 1, comfort: 3, color: [255, 253, 231]},
  honey: {warmth: 2, comfort: 2, color: [255, 185, 15]},
  cinnamon: {warmth: 3, comfort: 1, color: [123, 63, 0]},
  lemon: {warmth: 0, comfort: 2, color: [255, 247, 0]},
  strawberry: {warmth: 1, comfort: 3, color: [252, 90, 141]},
  caramel: {warmth: 2, comfort: 3, color: [175, 111, 9]}
};

// Customer name pool
export const CUSTOMER_NAMES = [
  "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry",
  "Iris", "Jack", "Kate", "Leo", "Mia", "Noah", "Olivia", "Paul"
];

// Win condition
export const WIN_STARS_REQUIRED = 5;
export const STAR_REPUTATION_THRESHOLDS = [0, 100, 250, 450, 700, 1000];

// Expose gameState getter
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}