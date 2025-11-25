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
export const CONTROL_TEST_3 = "TEST_3";
export const CONTROL_TEST_4 = "TEST_4";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;
export const KEY_SPACE = 32;
export const KEY_Z = 90;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_SHIFT = 16;

// Game constants
export const GRAVITY = 0.5;
export const PLAYER_SPEED = 3;
export const PLAYER_JUMP_FORCE = -10;
export const BOAT_SPEED = 2;

// Spirit states
export const SPIRIT_STATE_WAITING = "WAITING";
export const SPIRIT_STATE_ON_BOAT = "ON_BOAT";
export const SPIRIT_STATE_RELEASED = "RELEASED";

// Game state object
export const gameState = {
  player: null,
  boat: null,
  entities: [],
  spirits: [],
  islands: [],
  resources: {
    fish: 0,
    plants: 0,
    meals: 0
  },
  score: 0,
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  boatX: CANVAS_WIDTH / 2,
  everdoorReached: false,
  spiritsReleased: 0,
  totalSpirits: 3,
  frameCount: 0,
  lastIslandSpawn: 0,
  interactionCooldown: 0,
  cookingCooldown: 0
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}