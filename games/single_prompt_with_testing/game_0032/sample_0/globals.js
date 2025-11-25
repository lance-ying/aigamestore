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

// Room constants
export const ROOM_WIDTH = 560;
export const ROOM_HEIGHT = 360;
export const ROOM_OFFSET_X = 20;
export const ROOM_OFFSET_Y = 20;

// Dungeon size
export const DUNGEON_WIDTH = 5;
export const DUNGEON_HEIGHT = 5;
export const FLOORS_COUNT = 4;

// Control modes
export const CONTROL_HUMAN = "HUMAN";
export const CONTROL_TEST_1 = "TEST_1";
export const CONTROL_TEST_2 = "TEST_2";
export const CONTROL_TEST_3 = "TEST_3";
export const CONTROL_TEST_4 = "TEST_4";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_R = 82;
export const KEY_Z = 90;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  rooms: [],
  currentRoom: { x: 2, y: 2 },
  currentFloor: 0,
  score: 0,
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  dungeon: null,
  tears: [],
  enemies: [],
  items: [],
  pickups: [],
  bossDefeated: false,
  roomsCleared: 0,
  keysPressed: new Set(),
  lastShootDir: { x: 0, y: -1 },
  particles: []
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}