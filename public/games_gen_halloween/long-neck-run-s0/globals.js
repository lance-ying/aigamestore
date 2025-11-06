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

// Lane configuration
export const NUM_LANES = 3;
export const LANE_WIDTH = 80;
export const LANE_Y = 300;

// Player configuration
export const PLAYER_SIZE = 30;
export const INITIAL_NECK_LENGTH = 5;
export const NECK_SEGMENT_HEIGHT = 10;
export const SEGMENT_WIDTH = 20;

// Game mechanics
export const BASE_SPEED = 3;
export const SPEED_INCREASE_INTERVAL = 15 * 60; // 15 seconds at 60 FPS
export const SPEED_INCREASE_FACTOR = 0.05;
export const RING_REWARD = 1;
export const WRONG_RING_PENALTY = 2;
export const OBSTACLE_PENALTY = 5;

// Colors
export const PLAYER_COLORS = [
  [255, 100, 100], // Red
  [100, 100, 255], // Blue
  [100, 255, 100], // Green
  [255, 255, 100]  // Yellow
];

// Game state object
export const gameState = {
  player: null,
  entities: [],
  obstacles: [],
  rings: [],
  score: 0,
  distance: 0,
  neckLength: INITIAL_NECK_LENGTH,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  currentSpeed: BASE_SPEED,
  playerColor: 0,
  keys: 0,
  gems: 0,
  framesSinceStart: 0,
  lastSpawnDistance: 0,
  groundY: LANE_Y
};

// Make getGameState globally accessible
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}