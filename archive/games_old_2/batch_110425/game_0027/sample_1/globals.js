// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Grid settings
export const GRID_SIZE = 20;
export const GRID_COLS = 20;
export const GRID_ROWS = 12;
export const GRID_OFFSET_X = 200;
export const GRID_OFFSET_Y = 50;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Building types
export const BUILDING_TYPES = {
  SMALL_POOL: { name: "Small Pool", cost: 100, width: 2, height: 2, color: [100, 180, 255], income: 20, satisfaction: 15 },
  LARGE_POOL: { name: "Large Pool", cost: 250, width: 3, height: 3, color: [80, 160, 240], income: 50, satisfaction: 30 },
  WATER_SLIDE: { name: "Water Slide", cost: 300, width: 2, height: 3, color: [255, 200, 100], income: 40, satisfaction: 40 },
  RESTAURANT: { name: "Restaurant", cost: 150, width: 2, height: 2, color: [255, 150, 150], income: 30, satisfaction: 20 },
  GIFT_SHOP: { name: "Gift Shop", cost: 120, width: 1, height: 2, color: [255, 220, 180], income: 25, satisfaction: 10 },
  OUTDOOR_POOL: { name: "Outdoor Pool", cost: 400, width: 4, height: 3, color: [120, 200, 255], income: 80, satisfaction: 50, unlockFollowers: 200 },
  LAZY_RIVER: { name: "Lazy River", cost: 500, width: 5, height: 2, color: [150, 220, 255], income: 90, satisfaction: 60, unlockFollowers: 500 }
};

// Gift items
export const GIFT_ITEMS = {
  TUBE: { name: "Tube", cost: 20, satisfaction: 10 },
  SWIMSUIT: { name: "Swimsuit", cost: 30, satisfaction: 15 },
  SUNGLASSES: { name: "Sunglasses", cost: 25, satisfaction: 12 },
  TOWEL: { name: "Towel", cost: 15, satisfaction: 8 }
};

// Control modes
export const CONTROL_MODE_HUMAN = "HUMAN";
export const CONTROL_MODE_BUILD = "BUILD";
export const CONTROL_MODE_GIFT = "GIFT";
export const CONTROL_MODE_DELETE = "DELETE";

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: CONTROL_MODE_HUMAN,
  
  // Player resources
  money: 500,
  snsFollowers: 0,
  parkRating: 0,
  
  // Grid and buildings
  grid: [],
  buildings: [],
  
  // Guests
  guests: [],
  totalGuestsServed: 0,
  
  // Menu and selection
  selectedBuildingType: null,
  selectedGiftType: null,
  cursorGridX: 0,
  cursorGridY: 0,
  buildMode: CONTROL_MODE_BUILD,
  
  // Time management
  gameTime: 0,
  lastGuestSpawn: 0,
  
  // Player entity (for logging purposes)
  player: null,
  
  // Statistics
  averageSatisfaction: 50,
  totalIncome: 0,
  
  // Entities for collision detection
  entities: []
};

// Initialize grid
export function initializeGrid() {
  gameState.grid = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    const row = [];
    for (let x = 0; x < GRID_COLS; x++) {
      row.push(null);
    }
    gameState.grid.push(row);
  }
}

// Get game state function
export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}