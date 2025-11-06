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

// Control modes
export const MODE_HUMAN = "HUMAN";
export const MODE_TEST_1 = "TEST_1";
export const MODE_TEST_2 = "TEST_2";

// Difficulty levels
export const DIFFICULTY_LEVELS = [
  { level: 1, scoreThreshold: 0, spawnInterval: 120, maxNumber: 20, fallSpeed: 1.0 },
  { level: 2, scoreThreshold: 100, spawnInterval: 90, maxNumber: 30, fallSpeed: 1.3 },
  { level: 3, scoreThreshold: 300, spawnInterval: 70, maxNumber: 50, fallSpeed: 1.6 },
  { level: 4, scoreThreshold: 600, spawnInterval: 55, maxNumber: 70, fallSpeed: 2.0 },
  { level: 5, scoreThreshold: 1000, spawnInterval: 48, maxNumber: 100, fallSpeed: 2.5 }
];

// Game state object
export const gameState = {
  player: null,
  entities: [],
  numbers: [],
  cursor: null,
  score: 0,
  gamePhase: PHASE_START,
  controlMode: MODE_HUMAN,
  timer: 90, // 90 seconds game time
  frameCount: 0,
  difficulty: 1,
  spawnCounter: 0,
  cutLine: null,
  keys: {}
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}