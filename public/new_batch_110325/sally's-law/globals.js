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
export const CONTROL_HUMAN = "HUMAN";
export const CONTROL_TEST_1 = "TEST_1";
export const CONTROL_TEST_2 = "TEST_2";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_R = 82;
export const KEY_Z = 90;

// Game play modes
export const MODE_SALLY = "SALLY";
export const MODE_FATHER = "FATHER";
export const MODE_TRANSITION = "TRANSITION";

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  currentLevel: 0,
  playMode: MODE_SALLY,
  sallyRecording: [],
  currentRecordingFrame: 0,
  interactableObjects: [],
  selectedObjectIndex: 0,
  levelComplete: false,
  transitionTimer: 0,
  timeScale: 1.0,
  sallyPosHistory: [],
  lastActionFrame: 0
};

// Expose game state getter
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}