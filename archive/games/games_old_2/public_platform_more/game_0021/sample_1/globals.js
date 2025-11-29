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

// Player constants
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 50;
export const PLAYER_SPEED = 5;

// Number ball constants
export const BALL_RADIUS = 25;
export const INITIAL_FALL_SPEED = 1.5;
export const MAX_FALL_SPEED = 5;

// Game timing
export const GAME_DURATION = 90; // 90 seconds
export const COMPOSITE_PENALTY = 5;

// Difficulty levels
export const DIFFICULTY_LEVELS = [
  { level: 1, scoreThreshold: 0, spawnInterval: 2.0, maxNumber: 20, fallSpeedMultiplier: 1.0 },
  { level: 2, scoreThreshold: 50, spawnInterval: 1.6, maxNumber: 30, fallSpeedMultiplier: 1.2 },
  { level: 3, scoreThreshold: 120, spawnInterval: 1.3, maxNumber: 50, fallSpeedMultiplier: 1.4 },
  { level: 4, scoreThreshold: 220, maxNumber: 70, spawnInterval: 1.0, fallSpeedMultiplier: 1.6 },
  { level: 5, scoreThreshold: 300, spawnInterval: 0.8, maxNumber: 100, fallSpeedMultiplier: 1.8 }
];

export const WIN_SCORE = 300;

// Game state - single source of truth
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  currentLevel: 1,
  timeRemaining: GAME_DURATION,
  gameStartTime: 0,
  lastSpawnTime: 0,
  slicingLine: null, // { x1, y1, x2, y2 } for visual feedback
  sliceStartPos: null,
  keysPressed: {} // Track which keys are currently pressed
};