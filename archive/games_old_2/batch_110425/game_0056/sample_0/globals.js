// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

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
  
  // Player resources
  money: 100,
  totalRevenue: 0,
  
  // Ingredients system
  availableIngredients: [],
  ownedIngredients: [],
  
  // Recipes system
  recipes: [],
  
  // Staff system
  staff: [],
  availableApplicants: [],
  
  // Customer system
  customers: [],
  customerSpawnTimer: 0,
  customerSpawnRate: 180, // frames between spawns
  totalCustomersServed: 0,
  satisfactionScore: 100,
  
  // UI state
  currentMenu: "MAIN", // MAIN, INGREDIENTS, RECIPES, STAFF, SERVE
  selectedIndex: 0,
  subMenu: null,
  selectedIngredients: [],
  
  // Game time
  gameTime: 0,
  day: 1,
  
  // Player reference (not used in this game but required by constraints)
  player: { x: 0, y: 0 },
  entities: []
};

// Ingredient database
export const INGREDIENT_DATABASE = [
  { id: "bun", name: "Bun", cost: 2, tier: 1, type: "base" },
  { id: "beef", name: "Beef Patty", cost: 5, tier: 1, type: "protein" },
  { id: "cheese", name: "Cheese", cost: 3, tier: 1, type: "topping" },
  { id: "lettuce", name: "Lettuce", cost: 2, tier: 1, type: "topping" },
  { id: "tomato", name: "Tomato", cost: 2, tier: 1, type: "topping" },
  { id: "onion", name: "Onion", cost: 1, tier: 1, type: "topping" },
  { id: "bacon", name: "Bacon", cost: 4, tier: 2, type: "protein" },
  { id: "egg", name: "Fried Egg", cost: 3, tier: 2, type: "protein" },
  { id: "fish", name: "Fish Fry", cost: 5, tier: 2, type: "protein" },
  { id: "tartar", name: "Tartar Sauce", cost: 3, tier: 2, type: "sauce" },
  { id: "bbq", name: "BBQ Sauce", cost: 2, tier: 2, type: "sauce" },
  { id: "pickle", name: "Pickle", cost: 2, tier: 2, type: "topping" },
  { id: "mushroom", name: "Mushroom", cost: 4, tier: 3, type: "topping" },
  { id: "avocado", name: "Avocado", cost: 5, tier: 3, type: "topping" },
  { id: "jalapeno", name: "Jalapeno", cost: 3, tier: 3, type: "topping" },
  { id: "truffle", name: "Truffle", cost: 10, tier: 3, type: "premium" }
];

export const WIN_REVENUE_TARGET = 10000;
export const MIN_SATISFACTION = 20;