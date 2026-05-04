// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 8;
export const TILE_SIZE = 40;
export const FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Facility types
export const FACILITY_TYPES = {
  CLASSROOM: { name: "Classroom", cost: 50, color: [100, 150, 255], symbol: "C", rep: 5 },
  CAFETERIA: { name: "Cafeteria", cost: 80, color: [255, 200, 100], symbol: "F", rep: 8 },
  CLUB_ROOM: { name: "Club Room", cost: 100, color: [150, 255, 150], symbol: "R", rep: 10 },
  GYM: { name: "Gym", cost: 120, color: [255, 150, 150], symbol: "G", rep: 12 },
  LIBRARY: { name: "Library", cost: 90, color: [200, 180, 255], symbol: "L", rep: 9 },
  LAB: { name: "Lab", cost: 110, color: [150, 255, 255], symbol: "S", rep: 11 }
};

// Synergy bonuses - facilities that work well together
export const SYNERGIES = [
  { types: ["CLASSROOM", "LIBRARY"], bonus: 10 },
  { types: ["CLASSROOM", "LAB"], bonus: 12 },
  { types: ["CLUB_ROOM", "GYM"], bonus: 15 },
  { types: ["CAFETERIA", "CLUB_ROOM"], bonus: 8 },
  { types: ["GYM", "CAFETERIA"], bonus: 10 },
  { types: ["LIBRARY", "LAB"], bonus: 13 }
];

// Game state object
export const gameState = {
  player: null,
  entities: [],
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Game data
  grid: null, // 2D array of facilities
  cursorX: 0,
  cursorY: 0,
  cameraX: 0,
  cameraY: 0,
  
  budget: 500,
  reputation: 0,
  students: 100,
  year: 1,
  month: 4, // April (school year start)
  
  // UI state
  buildMenuOpen: false,
  selectedFacilityType: null,
  selectedFacilityIndex: 0,
  
  // Club and tournament data
  clubs: [],
  tournaments: 0,
  graduations: 0,
  
  // Progression
  yearProgress: 0,
  monthsPerYear: 12,
  framesPerMonth: 180, // 3 seconds per month at 60 FPS
  frameCounter: 0,
  
  // Win/Lose conditions
  targetReputation: 1000,
  maxYears: 20,
  
  // History for testing
  positionHistory: [],
  lastActionFrame: 0
};

// Initialize the grid
export function initializeGrid() {
  gameState.grid = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    gameState.grid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      gameState.grid[y][x] = null;
    }
  }
}

// Get game state for external access
export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}