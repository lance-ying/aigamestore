// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 40;

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
export const CONTROL_TEST_4 = "TEST_4";
export const CONTROL_TEST_5 = "TEST_5";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_R = 82;
export const KEY_Z = 90;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  switches: [],
  doors: [],
  lightbulb: null,
  sunChamber: null,
  
  score: 0,
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  
  // Player state
  hasLightbulb: false,
  switchesActivated: 0,
  roomsExplored: 0,
  
  // World state
  worldLayout: null,
  currentRoom: 0,
  
  // Timing
  frameCount: 0,
  startTime: 0,
  endTime: 0
};

// Expose getGameState globally
window.getGameState = function() {
  return gameState;
};

export function resetGameState() {
  gameState.player = null;
  gameState.entities = [];
  gameState.switches = [];
  gameState.doors = [];
  gameState.lightbulb = null;
  gameState.sunChamber = null;
  
  gameState.score = 0;
  gameState.hasLightbulb = false;
  gameState.switchesActivated = 0;
  gameState.roomsExplored = 0;
  gameState.currentRoom = 0;
  
  gameState.frameCount = 0;
  gameState.startTime = 0;
  gameState.endTime = 0;
}