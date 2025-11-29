// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Control modes
export const CONTROL_HUMAN = "HUMAN";
export const CONTROL_TEST_1 = "TEST_1";
export const CONTROL_TEST_2 = "TEST_2";

// Grid settings
export const GRID_COLS = 10;
export const GRID_ROWS = 8;
export const TILE_SIZE = 30;
export const GRID_OFFSET_X = 20;
export const GRID_OFFSET_Y = 60;

// View modes
export const VIEW_STORE = "STORE";
export const VIEW_INVENTORY = "INVENTORY";
export const VIEW_EMPLOYEES = "EMPLOYEES";
export const VIEW_STATS = "STATS";

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  viewMode: VIEW_STORE,
  
  // Store management
  money: 500,
  storeRating: 1.0,
  customerSatisfaction: 50,
  marketShare: 10,
  
  // Grid system
  grid: [],
  gridWidth: 6,
  gridHeight: 5,
  
  // Products and inventory
  products: [],
  inventory: [],
  shelves: [],
  
  // Employees
  employees: [],
  maxEmployees: 10,
  
  // Customers
  customers: [],
  
  // Time and progression
  gameTime: 0,
  day: 1,
  hour: 8,
  
  // Rivals
  rivalStores: [],
  
  // UI state
  selectedTile: null,
  cursorX: 0,
  cursorY: 0,
  menuState: "main",
  selectedProduct: null,
  selectedEmployee: null,
  messageQueue: [],
  
  // Win conditions
  targetRating: 5.0,
  targetMarketShare: 60,
  targetProfit: 10000,
  totalProfit: 0,
  
  // Player reference (for compatibility)
  player: null,
  entities: []
};

// Initialize game state
export function initGameState() {
  gameState.money = 500;
  gameState.storeRating = 1.0;
  gameState.customerSatisfaction = 50;
  gameState.marketShare = 10;
  gameState.gridWidth = 6;
  gameState.gridHeight = 5;
  gameState.grid = [];
  gameState.products = [];
  gameState.inventory = [];
  gameState.shelves = [];
  gameState.employees = [];
  gameState.customers = [];
  gameState.gameTime = 0;
  gameState.day = 1;
  gameState.hour = 8;
  gameState.rivalStores = [];
  gameState.selectedTile = null;
  gameState.cursorX = 0;
  gameState.cursorY = 0;
  gameState.menuState = "main";
  gameState.selectedProduct = null;
  gameState.selectedEmployee = null;
  gameState.messageQueue = [];
  gameState.totalProfit = 0;
  gameState.viewMode = VIEW_STORE;
  
  // Initialize grid
  for (let y = 0; y < GRID_ROWS; y++) {
    gameState.grid[y] = [];
    for (let x = 0; x < GRID_COLS; x++) {
      gameState.grid[y][x] = {
        type: (x < gameState.gridWidth && y < gameState.gridHeight) ? "floor" : "locked",
        occupied: false,
        entity: null
      };
    }
  }
  
  // Initialize player object for compatibility
  gameState.player = {
    x: GRID_OFFSET_X + TILE_SIZE * 2,
    y: GRID_OFFSET_Y + TILE_SIZE * 2
  };
  
  gameState.entities = [];
}

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}