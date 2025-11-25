// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Physics constants
export const GRAVITY = 0.6;
export const JUMP_FORCE = -12;
export const MOVE_SPEED = 4;
export const SPRINT_MULTIPLIER = 1.6;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.95;

// World constants
export const GROUND_LEVEL = 350;
export const WORLD_WIDTH = 2000;
export const WORLD_HEIGHT = 400;

// Game constants
export const PACKAGES_TO_DELIVER = 3;
export const TREASURES_TO_WIN = 5;
export const DELIVERY_REWARD = 50;
export const TREASURE_VALUE = 20;

// Key codes
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  packages: [],
  customers: [],
  treasures: [],
  buildings: [],
  obstacles: [],
  
  score: 0,
  money: 0,
  deliveriesCompleted: 0,
  treasuresCollected: 0,
  
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  camera: {
    x: 0,
    y: 0
  },
  
  worldTime: 0,
  lastUpdateTime: 0
};

// Expose gameState getter
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}