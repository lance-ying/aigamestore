// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE",
  LEVEL_COMPLETE: "LEVEL_COMPLETE"
};

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2"
};

// Level configurations
export const LEVELS = [
  {
    id: 1,
    name: "Rolling Hills",
    length: 500,
    gravity: 1.0,
    fuelMultiplier: 1.0,
    itemDensity: 0.7,
    obstacles: 0,
    terrainDifficulty: "easy"
  },
  {
    id: 2,
    name: "Mountain Ascent",
    length: 800,
    gravity: 1.0,
    fuelMultiplier: 1.1,
    itemDensity: 0.5,
    obstacles: 3,
    terrainDifficulty: "medium"
  },
  {
    id: 3,
    name: "Lunar Craters",
    length: 1200,
    gravity: 0.5,
    fuelMultiplier: 1.2,
    itemDensity: 0.3,
    obstacles: 6,
    terrainDifficulty: "hard"
  }
];

// Game state object
export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  engine: null,
  world: null,
  player: null,
  entities: [],
  terrainSegments: [],
  
  // Vehicle state
  vehicleBody: null,
  frontWheel: null,
  rearWheel: null,
  driverHead: null,
  
  // Game metrics
  fuelLevel: 100,
  maxFuel: 100,
  currentDistance: 0,
  currentCoins: 0,
  currentScore: 0,
  highScore: 0,
  currentLevel: 1,
  
  // Camera
  cameraX: 0,
  
  // Level data
  levelEndX: 500,
  levelStartTime: 0,
  
  // Crash detection
  invertedStartTime: null,
  isCrashed: false,
  
  // Input state
  keys: {
    gas: false,
    brake: false
  },
  
  // Collectibles
  fuelCanisters: [],
  coins: [],
  obstacles: [],
  
  // Last logged position
  lastLoggedX: 0,
  lastLoggedY: 0
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}