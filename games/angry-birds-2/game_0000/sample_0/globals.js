// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const BIRD_TYPES = {
  RED: 'RED',    // Speed boost ability
  BLUE: 'BLUE',  // Split into 3 birds ability
  YELLOW: 'YELLOW' // Dive ability
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  engine: null,
  world: null,
  
  // Slingshot state
  slingshotAngle: -45, // degrees
  slingshotPower: 50, // 0-100
  
  // Current bird
  currentBird: null,
  availableBirds: [],
  launchedBird: null,
  birdInFlight: false,
  abilityUsed: false,
  
  // Level data
  pigs: [],
  structures: [],
  ground: null,
  
  // Level progress
  currentLevel: 1,
  pigsDestroyed: 0,
  totalPigs: 0,
  starsEarned: 0,
  
  // Camera
  cameraX: 0,
  
  // Testing
  testCounter: 0,
  testTimer: 0,
  testBirdsLaunched: 0
};

export function getGameState() {
  return gameState;
}

// Expose the getGameState function globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}