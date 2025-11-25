// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

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
  TEST_3: "TEST_3",
  TEST_4: "TEST_4"
};

// Game constants
export const PLAYER_SIZE = 20;
export const PLAYER_SPEED = 2.5;
export const PLAYER_SPRINT_SPEED = 4.5;
export const GUARD_SIZE = 22;
export const GUARD_SPEED = 1.8;
export const GUARD_CHASE_SPEED = 3.0;
export const GUARD_DETECTION_RANGE = 100;
export const NPC_SIZE = 18;
export const ITEM_SIZE = 12;
export const GADGET_COOLDOWN = 60; // frames
export const ITEMS_NEEDED_TO_WIN = 5;
export const PLAYER_LIVES = 3;

// World layout
export const WALL_THICKNESS = 10;
export const ROOM_PADDING = 50;

export const gameState = {
  player: null,
  entities: [],
  npcs: [],
  guards: [],
  items: [],
  walls: [],
  doors: [],
  exitZone: null,
  score: 0,
  itemsCollected: 0,
  lives: PLAYER_LIVES,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  gadgetCooldown: 0,
  currentDialog: null,
  dialogTimer: 0,
  keysPressed: {},
  frameCount: 0
};

// Make gameState accessible globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}