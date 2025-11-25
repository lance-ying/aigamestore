// globals.js - Global constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 20;
export const GRID_COLS = 20;
export const GRID_ROWS = 15;
export const CELL_SIZE = CANVAS_WIDTH / GRID_COLS;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Entity types
export const TYPE_HOUSE = "HOUSE";
export const TYPE_DESTINATION = "DESTINATION";
export const TYPE_ROAD = "ROAD";
export const TYPE_HIGHWAY = "HIGHWAY";

// Colors for different house types
export const HOUSE_COLORS = [
  [255, 100, 100],  // Red
  [100, 100, 255],  // Blue
  [100, 255, 100],  // Green
  [255, 255, 100],  // Yellow
  [255, 100, 255],  // Magenta
];

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  score: 0,
  
  // Grid and entities
  grid: [],  // 2D array for the game grid
  buildings: [],  // Houses and destinations
  roads: [],  // Road tiles
  cars: [],  // Moving cars
  
  // Cursor for road placement
  cursorX: 10,
  cursorY: 7,
  
  // Resources
  roadTilesAvailable: 15,
  highwayTilesAvailable: 0,
  upgradeMode: false,
  
  // Spawn timing
  frameCount: 0,
  nextSpawnTime: 300,  // Frames until next building spawn
  spawnInterval: 300,
  difficulty: 1,
  
  // Game parameters
  maxQueueSize: 8,
  carSpeed: 0.8,
  highwaySpeedMultiplier: 2.5,
  
  // View mode
  showConnectionView: false,
  
  // Track for automation
  positionHistory: [],
  lastActionFrame: 0,
};

// Initialize grid
export function initializeGrid() {
  gameState.grid = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    gameState.grid[y] = [];
    for (let x = 0; x < GRID_COLS; x++) {
      gameState.grid[y][x] = { type: null, data: null };
    }
  }
}

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}