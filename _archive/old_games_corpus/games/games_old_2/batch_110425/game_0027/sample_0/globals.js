// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 40;
export const GRID_COLS = 12;
export const GRID_ROWS = 8;

export const FACILITY_TYPES = {
  BASIC_POOL: { name: 'Basic Pool', cost: 50, income: 5, satisfaction: 2, color: [100, 180, 255], symbol: '~' },
  SLIDE: { name: 'Water Slide', cost: 150, income: 15, satisfaction: 5, color: [255, 200, 100], symbol: 'S' },
  WAVE_POOL: { name: 'Wave Pool', cost: 200, income: 20, satisfaction: 8, color: [80, 160, 240], symbol: 'W' },
  LAZY_RIVER: { name: 'Lazy River', cost: 180, income: 18, satisfaction: 6, color: [120, 200, 255], symbol: 'R' },
  RESTAURANT: { name: 'Restaurant', cost: 100, income: 10, satisfaction: 4, color: [255, 150, 150], symbol: 'F' },
  GIFT_SHOP: { name: 'Gift Shop', cost: 80, income: 8, satisfaction: 3, color: [255, 220, 100], symbol: 'G' },
  OUTDOOR_POOL: { name: 'Outdoor Pool', cost: 250, income: 25, satisfaction: 10, color: [100, 220, 255], symbol: 'O' }
};

export const gameState = {
  player: null,
  entities: [],
  guests: [],
  facilities: [],
  score: 0,
  money: 200,
  satisfaction: 0,
  snsFriends: 0,
  parkRating: 1.0,
  gamePhase: "START",
  controlMode: "HUMAN",
  selectedFacility: null,
  selectedTile: { x: 0, y: 0 },
  menuOpen: false,
  menuIndex: 0,
  gridOccupied: [],
  guestSpawnTimer: 0,
  frameCount: 0,
  unlockedFacilities: ['BASIC_POOL', 'RESTAURANT'],
  positionHistory: []
};

// Initialize grid
for (let i = 0; i < GRID_ROWS; i++) {
  gameState.gridOccupied[i] = [];
  for (let j = 0; j < GRID_COLS; j++) {
    gameState.gridOccupied[i][j] = null;
  }
}

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;