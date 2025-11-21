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
  TEST_3: "TEST_3"
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  interactables: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  
  // Player state
  playerX: 300,
  playerY: 200,
  playerAngle: 0,
  playerSpeed: 2,
  isRunning: false,
  
  // Inventory and progression
  inventory: [],
  keysCollected: [],
  puzzlesSolved: [],
  secretsFound: [],
  narrativeFragments: [],
  currentZone: "hub",
  
  // Game progress
  doorsUnlocked: [],
  machineryActive: false,
  finalDoorOpen: false,
  endingReached: null,
  
  // Visual effects
  fadeAmount: 0,
  shakeAmount: 0,
  messageQueue: [],
  
  // Timers
  frameCount: 0,
  interactionCooldown: 0
};

// Zone definitions
export const ZONES = {
  hub: {
    name: "The Hub",
    color: [30, 30, 50],
    bounds: { minX: 0, maxX: 600, minY: 0, maxY: 400 }
  },
  redZone: {
    name: "Crimson Chamber",
    color: [60, 20, 20],
    bounds: { minX: -300, maxX: 0, minY: -200, maxY: 200 }
  },
  blueZone: {
    name: "Azure Depths",
    color: [20, 30, 60],
    bounds: { minX: 600, maxX: 1200, minY: 0, maxY: 400 }
  },
  machineryZone: {
    name: "Mechanical Void",
    color: [40, 40, 30],
    bounds: { minX: 0, maxX: 600, minY: 400, maxY: 800 }
  },
  finalZone: {
    name: "The Threshold",
    color: [50, 50, 50],
    bounds: { minX: 200, maxX: 400, minY: -400, maxY: 0 }
  }
};

export const KEY_CODES = {
  ENTER: 13,
  ESC: 27,
  SPACE: 32,
  LEFT_ARROW: 37,
  UP_ARROW: 38,
  RIGHT_ARROW: 39,
  DOWN_ARROW: 40,
  Z: 90,
  R: 82
};