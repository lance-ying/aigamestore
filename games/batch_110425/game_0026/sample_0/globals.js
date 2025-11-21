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

// Grid configuration
export const GRID_SIZE = 20;
export const GRID_COLS = 10;
export const GRID_ROWS = 8;
export const GRID_OFFSET_X = 50;
export const GRID_OFFSET_Y = 80;

// Game modes
export const MODE_BUILD = "BUILD";
export const MODE_RESEARCH = "RESEARCH";
export const MODE_EXPAND = "EXPAND";

// Attraction types
export const ATTRACTIONS = {
  COFFEE_CUPS: {
    name: "Coffee Cups",
    cost: 100,
    size: 1,
    income: 5,
    satisfaction: 3,
    color: [255, 200, 100],
    unlocked: true
  },
  TRAMPOLINE: {
    name: "Trampoline",
    cost: 150,
    size: 1,
    income: 8,
    satisfaction: 5,
    color: [100, 200, 255],
    unlocked: true
  },
  CAROUSEL: {
    name: "Carousel",
    cost: 300,
    size: 2,
    income: 15,
    satisfaction: 10,
    color: [255, 150, 200],
    unlocked: false
  },
  BUMPER_CARS: {
    name: "Bumper Cars",
    cost: 400,
    size: 2,
    income: 20,
    satisfaction: 12,
    color: [200, 100, 255],
    unlocked: false
  },
  FERRIS_WHEEL: {
    name: "Ferris Wheel",
    cost: 800,
    size: 3,
    income: 40,
    satisfaction: 25,
    color: [100, 255, 150],
    unlocked: false
  },
  ROLLER_COASTER: {
    name: "Roller Coaster",
    cost: 1500,
    size: 4,
    income: 80,
    satisfaction: 50,
    color: [255, 100, 100],
    unlocked: false
  }
};

// Research tree
export const RESEARCH_TREE = {
  CAROUSEL: { cost: 200, prerequisite: null, unlocks: "CAROUSEL" },
  BUMPER_CARS: { cost: 300, prerequisite: "CAROUSEL", unlocks: "BUMPER_CARS" },
  FERRIS_WHEEL: { cost: 600, prerequisite: "BUMPER_CARS", unlocks: "FERRIS_WHEEL" },
  ROLLER_COASTER: { cost: 1200, prerequisite: "FERRIS_WHEEL", unlocks: "ROLLER_COASTER" },
  EFFICIENCY_1: { cost: 250, prerequisite: null, unlocks: "EFFICIENCY_1" },
  EFFICIENCY_2: { cost: 500, prerequisite: "EFFICIENCY_1", unlocks: "EFFICIENCY_2" },
  CAPACITY_1: { cost: 300, prerequisite: null, unlocks: "CAPACITY_1" },
  CAPACITY_2: { cost: 600, prerequisite: "CAPACITY_1", unlocks: "CAPACITY_2" }
};

// Mascot types
export const MASCOTS = [
  { name: "Happy Bear", popularityBoost: 50, theme: "Forest", cost: 500, color: [139, 69, 19] },
  { name: "Snow Bunny", popularityBoost: 60, theme: "Snow Country", cost: 700, color: [220, 240, 255] },
  { name: "Space Cat", popularityBoost: 80, theme: "Space Zone", cost: 1000, color: [100, 50, 200] },
  { name: "Aqua Dolphin", popularityBoost: 70, theme: "Ocean Park", cost: 800, color: [0, 150, 255] }
];

// Game state
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Park data
  money: 500,
  satisfaction: 0,
  popularity: 0,
  rank: 10,
  
  // Grid
  grid: [],
  gridWidth: 5,
  gridHeight: 5,
  
  // Attractions
  attractions: [],
  
  // Guests
  guests: [],
  maxGuests: 10,
  guestSpawnTimer: 0,
  guestSpawnInterval: 120,
  
  // UI state
  currentMode: MODE_BUILD,
  selectedAttractionType: "COFFEE_CUPS",
  selectedResearch: null,
  cursorX: 0,
  cursorY: 0,
  menuScroll: 0,
  
  // Research
  researchedItems: [],
  
  // Mascots
  mascots: [],
  year: 1,
  canScoutMascot: true,
  dayCounter: 0,
  
  // Upgrades
  efficiencyLevel: 0,
  capacityLevel: 0,
  
  // Input tracking
  lastKeyPressed: null,
  framesSinceLastAction: 0
};

// Initialize grid
export function initializeGrid() {
  gameState.grid = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    gameState.grid[y] = [];
    for (let x = 0; x < GRID_COLS; x++) {
      gameState.grid[y][x] = {
        occupied: false,
        unlocked: (x < gameState.gridWidth && y < gameState.gridHeight),
        attraction: null
      };
    }
  }
}

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}