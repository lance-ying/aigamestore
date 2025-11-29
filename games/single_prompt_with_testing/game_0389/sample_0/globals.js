// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2",
  TEST_3: "TEST_3"
};

// Physics constants
export const GRAVITY = 0.6;
export const PLAYER_SPEED = 4;
export const PLAYER_JUMP_FORCE = -12;
export const MAX_FALL_SPEED = 15;
export const FRICTION = 0.8;
export const PLAYER_SIZE = 30;

// Gravity gun constants
export const GRAVITY_GUN_RANGE = 150;
export const GRAVITY_GUN_FORCE = 0.8;
export const MAX_ENERGY = 100;
export const ENERGY_DRAIN_RATE = 0.5;
export const ENERGY_RECHARGE_RATE = 0.3;
export const THROW_FORCE = 12;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  blocks: [],
  enemies: [],
  platforms: [],
  hazards: [],
  movableObjects: [],
  exitPortal: null,
  goal: null,
  score: 0,
  health: 100,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  energy: MAX_ENERGY,
  gravityGunMode: "ATTRACT", // "ATTRACT" or "REPEL"
  gravityGunActive: false,
  grabbedObject: null,
  pullMode: true,
  level: 1,
  cameraX: 0,
  levelWidth: 2500,
  targetedObject: null,
  keys: {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
    shift: false
  }
};

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}