// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE",
  LEVEL_TRANSITION: "LEVEL_TRANSITION"
};

export const SYMBOL_TYPES = {
  CIRCLE: "CIRCLE",
  SQUARE: "SQUARE",
  TRIANGLE: "TRIANGLE",
  STAR: "STAR",
  DECOY: "DECOY"
};

export const KEY_BINDINGS = {
  87: SYMBOL_TYPES.STAR,    // W
  65: SYMBOL_TYPES.CIRCLE,  // A
  83: SYMBOL_TYPES.SQUARE,  // S
  68: SYMBOL_TYPES.TRIANGLE // D
};

export const HIT_ZONE = {
  y: CANVAS_HEIGHT - 100,
  height: 80
};

export const LEVEL_CONFIG = [
  {
    level: 1,
    symbols: [SYMBOL_TYPES.CIRCLE, SYMBOL_TYPES.SQUARE],
    fallSpeed: 2,
    spawnRateMin: 1.8,
    spawnRateMax: 2.5,
    missLimit: 5,
    targetMatches: 15
  },
  {
    level: 2,
    symbols: [SYMBOL_TYPES.CIRCLE, SYMBOL_TYPES.SQUARE, SYMBOL_TYPES.TRIANGLE],
    fallSpeed: 3,
    spawnRateMin: 1.3,
    spawnRateMax: 2.0,
    missLimit: 4,
    targetMatches: 15
  },
  {
    level: 3,
    symbols: [SYMBOL_TYPES.CIRCLE, SYMBOL_TYPES.SQUARE, SYMBOL_TYPES.TRIANGLE, SYMBOL_TYPES.STAR],
    fallSpeed: 4,
    spawnRateMin: 0.9,
    spawnRateMax: 1.5,
    missLimit: 3,
    targetMatches: 15
  },
  {
    level: 4,
    symbols: [SYMBOL_TYPES.CIRCLE, SYMBOL_TYPES.SQUARE, SYMBOL_TYPES.TRIANGLE, SYMBOL_TYPES.STAR],
    fallSpeed: 5,
    spawnRateMin: 0.6,
    spawnRateMax: 1.2,
    missLimit: 3,
    targetMatches: 15
  },
  {
    level: 5,
    symbols: [SYMBOL_TYPES.CIRCLE, SYMBOL_TYPES.SQUARE, SYMBOL_TYPES.TRIANGLE, SYMBOL_TYPES.STAR, SYMBOL_TYPES.DECOY],
    fallSpeed: 6,
    spawnRateMin: 0.5,
    spawnRateMax: 1.0,
    missLimit: 2,
    targetMatches: 15
  }
];

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null, // Not used in this game but required by spec
  entities: [], // Falling symbols
  score: 0,
  highScore: 0,
  currentLevel: 0, // 0-indexed
  misses: 0,
  correctMatches: 0,
  combo: 0,
  spawnTimer: 0,
  nextSpawnTime: 0,
  levelTransitionTimer: 0,
  levelTransitionDuration: 180, // 3 seconds at 60fps
  feedbackEffect: null, // {type: 'correct'|'miss', timer: number}
  testingActionQueue: []
};

// Initialize high score from localStorage
if (typeof localStorage !== 'undefined') {
  const saved = localStorage.getItem('tentenHighScore');
  if (saved) {
    gameState.highScore = parseInt(saved, 10);
  }
}