// globals.js - Global constants and state management

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
export const CONTROL_TEST_3 = "TEST_3";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_Z = 90;
export const KEY_R = 82;

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  player: null,
  entities: [],
  currentLocation: 0,
  selectedHotspot: 0,
  inventory: [],
  selectedInventoryItem: -1,
  inventoryOpen: false,
  score: 0,
  puzzlesSolved: [],
  dialogueState: null,
  message: "",
  messageTimer: 0,
  actionHistory: [],
  framesSinceAction: 0
};

// Export function to get game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}