// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const ARENA_WIDTH = 2000;
export const ARENA_HEIGHT = 1400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Worm configuration
export const INITIAL_WORM_LENGTH = 15;
export const SEGMENT_SIZE = 8;
export const WORM_SPEED = 2.5;
export const SPEED_BOOST_MULTIPLIER = 2.0;
export const TURN_SPEED = 0.08;
export const MIN_WORM_SIZE = 10;
export const WIN_SIZE_THRESHOLD = 150;

// Food configuration
export const FOOD_COUNT = 150;
export const FOOD_SIZE = 5;
export const FOOD_VALUE = 1;

// Power-up configuration
export const POWERUP_SPAWN_INTERVAL = 300; // frames
export const MAGNET_DURATION = 180; // frames
export const MAGNET_RANGE = 100;
export const SPEED_BOOST_DRAIN = 0.05; // mass per frame

// AI configuration
export const AI_WORM_COUNT = 5;
export const AI_DECISION_INTERVAL = 15; // frames

// Game state object
export const gameState = {
  player: null,
  aiWorms: [],
  food: [],
  powerups: [],
  entities: [],
  score: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  frameCount: 0,
  camera: { x: 0, y: 0 },
  leaderboard: [],
  powerupTimer: 0,
  highScore: 0
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}