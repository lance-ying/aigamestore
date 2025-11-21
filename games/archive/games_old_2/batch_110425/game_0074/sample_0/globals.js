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
export const CONTROL_TEST_3 = "TEST_3";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_R = 82;
export const KEY_Z = 90;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;

// Game constants
export const GRID_SIZE = 40;
export const CAFE_GRID_WIDTH = 10;
export const CAFE_GRID_HEIGHT = 8;
export const CAFE_OFFSET_X = 20;
export const CAFE_OFFSET_Y = 60;

// Customer types
export const CUSTOMER_TYPES = [
  { name: "Student", color: [100, 150, 255], minPopularity: 0, orderDelay: 180, patience: 300, tip: 5 },
  { name: "Worker", color: [150, 100, 200], minPopularity: 500, orderDelay: 120, patience: 240, tip: 10 },
  { name: "Artist", color: [255, 150, 100], minPopularity: 1000, orderDelay: 150, patience: 360, tip: 15 },
  { name: "Executive", color: [200, 200, 50], minPopularity: 2000, orderDelay: 90, patience: 180, tip: 25 },
  { name: "Celebrity", color: [255, 100, 200], minPopularity: 3500, orderDelay: 100, patience: 200, tip: 50 }
];

// Furniture types
export const FURNITURE_TYPES = [
  { name: "Table", cost: 100, atmosphere: 10, width: 2, height: 2, color: [139, 90, 43] },
  { name: "Counter", cost: 150, atmosphere: 15, width: 1, height: 3, color: [101, 67, 33] },
  { name: "Magazine Rack", cost: 200, atmosphere: 20, width: 1, height: 1, color: [180, 120, 80] },
  { name: "Plant", cost: 250, atmosphere: 25, width: 1, height: 1, color: [50, 150, 50] },
  { name: "Art Piece", cost: 500, atmosphere: 40, width: 2, height: 1, color: [200, 50, 150] },
  { name: "Bookshelf", cost: 400, atmosphere: 35, width: 1, height: 2, color: [120, 80, 40] }
];

// Ingredients
export const INGREDIENTS = {
  bases: [
    { name: "Coffee", cost: 20, unlockPopularity: 0 },
    { name: "Tea", cost: 15, unlockPopularity: 0 },
    { name: "Espresso", cost: 30, unlockPopularity: 500 },
    { name: "Smoothie", cost: 35, unlockPopularity: 1000 }
  ],
  additions: [
    { name: "Milk", cost: 5, unlockPopularity: 0 },
    { name: "Sugar", cost: 3, unlockPopularity: 0 },
    { name: "Honey", cost: 8, unlockPopularity: 200 },
    { name: "Vanilla", cost: 10, unlockPopularity: 400 },
    { name: "Chocolate", cost: 12, unlockPopularity: 600 },
    { name: "Caramel", cost: 15, unlockPopularity: 800 },
    { name: "Cinnamon", cost: 10, unlockPopularity: 300 },
    { name: "Mint", cost: 10, unlockPopularity: 500 }
  ]
};

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  player: null,
  entities: [],
  score: 0,
  popularity: 0,
  money: 500,
  atmosphere: 0,
  
  // Cafe management
  cafeGrid: null,
  furniture: [],
  menu: [],
  customers: [],
  regulars: 0,
  
  // Game progression
  fiveStarAchieved: false,
  currentTown: 0,
  towns: [
    { name: "Starter Town", popularityThreshold: 5000 },
    { name: "Metro City", popularityThreshold: 10000 },
    { name: "Resort Beach", popularityThreshold: 15000 }
  ],
  
  // UI state
  menuOpen: false,
  selectedMenuTab: 0, // 0: Research, 1: Furniture, 2: Contests
  selectedRecipeBase: null,
  selectedRecipeAdditions: [],
  selectedFurniture: null,
  placementMode: false,
  placementX: 0,
  placementY: 0,
  cursorX: 0,
  cursorY: 0,
  
  // Contest
  contestActive: false,
  contestDrink: null,
  contestFood: null,
  
  // Frame counters
  frameCount: 0,
  lastCustomerSpawn: 0,
  customerSpawnRate: 240,
  
  // Automated testing
  testFrameCount: 0,
  testActionQueue: []
};

// Initialize cafe grid
export function initializeCafeGrid() {
  gameState.cafeGrid = [];
  for (let y = 0; y < CAFE_GRID_HEIGHT; y++) {
    gameState.cafeGrid[y] = [];
    for (let x = 0; x < CAFE_GRID_WIDTH; x++) {
      gameState.cafeGrid[y][x] = null;
    }
  }
}

// Global getGameState function
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}