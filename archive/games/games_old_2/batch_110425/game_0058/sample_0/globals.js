// globals.js - Global constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRID_SIZE = 20;
export const GRID_COLS = 12;
export const GRID_ROWS = 10;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const UI_MODES = {
  NORMAL: "NORMAL",
  PLACE_SHELF: "PLACE_SHELF",
  STOCK_PRODUCT: "STOCK_PRODUCT",
  HIRE_STAFF: "HIRE_STAFF",
  EXPAND_STORE: "EXPAND_STORE"
};

export const PRODUCT_TYPES = {
  ONIGIRI: { name: "Onigiri", price: 3, cost: 1, color: [255, 230, 200], unlockCost: 0 },
  BENTO: { name: "Bento", price: 8, cost: 3, color: [255, 200, 100], unlockCost: 0 },
  SWEETS: { name: "Sweets", price: 5, cost: 2, color: [255, 150, 200], unlockCost: 500 },
  MAGAZINES: { name: "Magazines", price: 6, cost: 2, color: [200, 200, 255], unlockCost: 1000 },
  DRINKS: { name: "Drinks", price: 4, cost: 1, color: [100, 200, 255], unlockCost: 1500 },
  SNACKS: { name: "Snacks", price: 5, cost: 2, color: [255, 220, 100], unlockCost: 2000 }
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  totalRevenue: 0,
  money: 100,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  uiMode: UI_MODES.NORMAL,
  cursorX: 0,
  cursorY: 0,
  selectedShelf: null,
  selectedProductType: null,
  grid: [],
  shelves: [],
  customers: [],
  staff: [],
  products: [],
  customerSatisfaction: 100,
  dayCounter: 0,
  frameCounter: 0,
  timeScale: 1,
  unlockedProducts: ["ONIGIRI", "BENTO"],
  expandedTiles: [],
  nextCustomerSpawn: 0,
  cashRegisterPos: { x: 11, y: 5 },
  entrancePos: { x: 0, y: 5 },
  menuSelection: 0,
  staffHireCount: 0
};

// Initialize grid
for (let y = 0; y < GRID_ROWS; y++) {
  gameState.grid[y] = [];
  for (let x = 0; x < GRID_COLS; x++) {
    gameState.grid[y][x] = {
      type: "empty",
      shelf: null,
      occupied: false,
      expanded: false
    };
  }
}

// Mark entrance and cash register
gameState.grid[5][0].type = "entrance";
gameState.grid[5][0].occupied = true;
gameState.grid[5][11].type = "cashRegister";
gameState.grid[5][11].occupied = true;

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;