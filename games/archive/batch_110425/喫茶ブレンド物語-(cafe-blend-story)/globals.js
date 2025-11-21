// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 20;
export const GRID_COLS = 10;
export const GRID_ROWS = 8;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Player/Cafe data
  money: 100,
  reputation: 0,
  cafeRating: 1, // 1-5 stars
  day: 1,
  
  // Grid and furniture
  grid: [], // 10x8 grid for furniture placement
  furniture: [],
  selectedFurnitureType: null,
  
  // Recipes
  recipes: [],
  ingredients: [],
  selectedIngredients: [],
  
  // Customers
  customers: [],
  maxCustomers: 2,
  customerSpawnTimer: 0,
  customerSpawnDelay: 180, // frames
  
  // UI state
  menuOpen: false,
  menuType: null, // 'RECIPE', 'FURNITURE', 'STATS'
  cursorX: 0,
  cursorY: 0,
  selectedCustomer: null,
  
  // Progression
  totalCustomersServed: 0,
  totalRevenue: 0,
  upgradeTier: 1, // 1-5
  
  // Player entity (for logging)
  player: {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2
  },
  
  entities: []
};

// Ingredient types
export const INGREDIENTS = [
  { id: 'coffee', name: 'Coffee', cost: 5, unlocked: true, quality: 3 },
  { id: 'milk', name: 'Milk', cost: 3, unlocked: true, quality: 2 },
  { id: 'sugar', name: 'Sugar', cost: 2, unlocked: true, quality: 1 },
  { id: 'tea', name: 'Tea', cost: 4, unlocked: false, quality: 3, unlockCost: 50 },
  { id: 'chocolate', name: 'Chocolate', cost: 6, unlocked: false, quality: 4, unlockCost: 100 },
  { id: 'cream', name: 'Cream', cost: 5, unlocked: false, quality: 3, unlockCost: 80 },
  { id: 'vanilla', name: 'Vanilla', cost: 7, unlocked: false, quality: 4, unlockCost: 120 },
  { id: 'caramel', name: 'Caramel', cost: 8, unlocked: false, quality: 5, unlockCost: 150 }
];

// Furniture types
export const FURNITURE_TYPES = [
  { id: 'counter', name: 'Counter', cost: 30, width: 2, height: 1, color: [139, 90, 60], unlocked: true },
  { id: 'table', name: 'Table', cost: 40, width: 1, height: 1, color: [160, 100, 50], unlocked: true },
  { id: 'chair', name: 'Chair', cost: 20, width: 1, height: 1, color: [100, 70, 50], unlocked: true },
  { id: 'light', name: 'Light', cost: 60, width: 1, height: 1, color: [255, 220, 100], unlocked: false, unlockCost: 100 },
  { id: 'plant', name: 'Plant', cost: 50, width: 1, height: 1, color: [50, 150, 50], unlocked: false, unlockCost: 80 },
  { id: 'shelf', name: 'Shelf', cost: 70, width: 2, height: 1, color: [120, 80, 40], unlocked: false, unlockCost: 120 }
];

// Customer moods
export const MOODS = ['happy', 'neutral', 'sad', 'energetic', 'tired'];

// Initialize game state
export function initializeGameState() {
  gameState.money = 100;
  gameState.reputation = 0;
  gameState.cafeRating = 1;
  gameState.day = 1;
  gameState.grid = [];
  gameState.furniture = [];
  gameState.recipes = [];
  gameState.customers = [];
  gameState.selectedIngredients = [];
  gameState.menuOpen = false;
  gameState.menuType = null;
  gameState.cursorX = 0;
  gameState.cursorY = 0;
  gameState.selectedCustomer = null;
  gameState.totalCustomersServed = 0;
  gameState.totalRevenue = 0;
  gameState.upgradeTier = 1;
  gameState.customerSpawnTimer = 0;
  gameState.selectedFurnitureType = null;
  gameState.maxCustomers = 2;
  gameState.customerSpawnDelay = 180;
  
  // Initialize grid
  for (let i = 0; i < GRID_COLS; i++) {
    gameState.grid[i] = [];
    for (let j = 0; j < GRID_ROWS; j++) {
      gameState.grid[i][j] = null;
    }
  }
  
  // Initialize ingredients
  gameState.ingredients = INGREDIENTS.map(ing => ({...ing}));
  
  // Create a starter recipe
  gameState.recipes = [
    {
      id: 'basic_coffee',
      name: 'Basic Coffee',
      ingredients: ['coffee'],
      quality: 3,
      price: 15,
      cost: 5
    }
  ];
}

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}