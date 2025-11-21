// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Game state object
export const gameState = {
  player: null,
  entities: [],
  traffic: [],
  score: 0,
  coins: 0,
  level: 1,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  engine: null,
  world: null,
  
  // Game-specific state
  playerCrossing: false,
  intersectionBounds: { start: 0, end: 0 },
  levelConfig: {
    lanes: 2,
    trafficSpeed: 3,
    trafficDensity: 0.02,
    laneWidth: 40
  },
  
  // Input tracking
  keys: {
    space: false
  },
  
  // Testing state
  testState: {
    timer: 0,
    phase: 0,
    waitTimer: 0
  }
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Control mode setter
export function setControlMode(mode) {
  gameState.controlMode = mode;
  console.log(`Control mode set to: ${mode}`);
  
  // Update UI
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
}

window.setControlMode = setControlMode;