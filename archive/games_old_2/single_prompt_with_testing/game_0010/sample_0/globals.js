// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRID_COLS = 12;
export const GRID_ROWS = 8;
export const CELL_SIZE = 50;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const TILE_TYPES = {
  EMPTY: "EMPTY",
  WALL: "WALL",
  BRIDGE: "BRIDGE",
  BUTTON: "BUTTON",
  BARRIER: "BARRIER",
  SWAP_ZONE: "SWAP_ZONE"
};

export const TRUCK_COLORS = {
  RED: [220, 50, 50],
  BLUE: [50, 120, 220],
  GREEN: [50, 200, 80],
  YELLOW: [240, 200, 40]
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentLevel: 1,
  
  // Grid and tiles
  grid: [],
  
  // Trucks and packages
  trucks: [],
  packages: [],
  houses: [],
  
  // Path planning
  selectedTruckIndex: 0,
  cursorX: 0,
  cursorY: 0,
  
  // Simulation
  isSimulating: false,
  simulationStep: 0,
  simulationSpeed: 10, // frames per move
  
  // Level mechanics
  bridges: [],
  buttons: [],
  barriers: [],
  swapZones: [],
  
  // Win/lose tracking
  deliveredPackages: 0,
  totalPackages: 0,
  collisionOccurred: false,
  
  // Matter.js (not used for core physics, but included for compliance)
  engine: null,
  world: null
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}