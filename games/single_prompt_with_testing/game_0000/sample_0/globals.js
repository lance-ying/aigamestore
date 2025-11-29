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
  TEST_3: "TEST_3",
  TEST_4: "TEST_4",
  TEST_5: "TEST_5"
};

export const KEYS = {
  ENTER: 13,
  ESC: 27,
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SHIFT: 16,
  Z: 90,
  R: 82
};

export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  projectiles: [],
  particles: [],
  platforms: [],
  abilities: [],
  bosses: [],
  exits: [],
  currentRoom: 0,
  rooms: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  cameraY: 0,
  defeatedBosses: [],
  unlockedAbilities: {
    dash: false,
    spell: false
  }
};

// Expose gameState globally
window.getGameState = function() {
  return gameState;
};