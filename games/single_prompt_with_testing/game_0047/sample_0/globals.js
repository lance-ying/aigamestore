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
export const PLAYER_HEIGHT = 1.6; // meters, eye level
export const PLAYER_RADIUS = 0.3;
export const PLAYER_MOVE_SPEED = 2.5; // meters per second
export const PLAYER_SPRINT_SPEED = 4.5;
export const PLAYER_TURN_SPEED = 2.0; // radians per second
export const PLAYER_INTERACT_RANGE = 2.0; // meters

// Ship deck dimensions (in meters)
export const DECK_WIDTH = 20;
export const DECK_LENGTH = 30;
export const DECK_MIN_X = -DECK_WIDTH / 2;
export const DECK_MAX_X = DECK_WIDTH / 2;
export const DECK_MIN_Z = -DECK_LENGTH / 2;
export const DECK_MAX_Z = DECK_LENGTH / 2;

// Spirit constants
export const SPIRIT_RADIUS = 0.4;
export const SPIRIT_MOVE_SPEED = 2.0;
export const SPIRIT_CHASE_SPEED = 3.5;
export const SPIRIT_VISION_RANGE = 8.0;
export const SPIRIT_VISION_ANGLE = Math.PI / 3; // 60 degrees
export const SPIRIT_CATCH_DISTANCE = 0.6;

// Clue constants
export const TOTAL_CLUES = 8;

// Global game state
export const gameState = {
  player: null,
  entities: [],
  clues: [],
  spirits: [],
  exitPortal: null,
  score: 0,
  cluesFound: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  framesSinceStart: 0,
  startTime: 0,
  gameOverMessage: "",
  // For testing
  lastPlayerX: 0,
  lastPlayerZ: 0,
  stuckFrames: 0
};

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}