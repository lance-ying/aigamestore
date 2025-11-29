// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2",
  TEST_3: "TEST_3",
  TEST_4: "TEST_4",
  TEST_5: "TEST_5",
  TEST_6: "TEST_6",
  TEST_7: "TEST_7"
};

// Game state object
export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  
  // Physics
  engine: null,
  world: null,
  
  // Entities
  player: null,  // Current bird being aimed
  entities: [],
  birds: [],
  pigs: [],
  blocks: [],
  ground: null,
  slingshot: null,
  
  // Gameplay
  score: 0,
  level: 1,
  birdsRemaining: 3,
  currentBird: null,
  birdLaunched: false,
  slingshotPower: 0.5,
  slingshotAngle: -45,
  
  // UI
  stars: 0,
  
  // Test automation
  testState: {
    framesSinceLaunch: 0,
    testStep: 0,
    testSubStep: 0,
    birdsFired: 0,
    pauseTestActive: false,
    pauseCount: 0
  }
};

// Constants for gameplay
export const SLINGSHOT_X = 100;
export const SLINGSHOT_Y = 300;
export const MIN_POWER = 0.2;
export const MAX_POWER = 1.0;
export const POWER_STEP = 0.05;
export const MIN_ANGLE = -80;
export const MAX_ANGLE = -10;
export const ANGLE_STEP = 2;
export const LAUNCH_FORCE_MULTIPLIER = 0.015;

// Scoring
export const BLOCK_POINTS = 100;
export const PIG_POINTS = 500;
export const BIRD_BONUS = 1000;
export const STAR_THRESHOLDS = [0, 2000, 4000]; // 1, 2, 3 stars

// Physics constants
export const GRAVITY = 1.0;
export const BIRD_RADIUS = 12;
export const PIG_RADIUS = 15;
export const BLOCK_WIDTH = 40;
export const BLOCK_HEIGHT = 80;

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}