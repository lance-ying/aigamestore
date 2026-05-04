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
  TEST_5: "TEST_5",
  TEST_6: "TEST_6",
  TEST_7: "TEST_7"
};

// Track configuration
export const NUM_LANES = 5;
export const LANE_WIDTH = 80;
export const TRACK_START_Y = 50;
export const PLAYER_START_X = CANVAS_WIDTH / 2;
export const PLAYER_START_Y = CANVAS_HEIGHT - 60;

// Physics constants
export const FORWARD_SPEED = 3;
export const LANE_CHANGE_SPEED = 0.15;
export const COLLISION_FORCE = 0.5;
export const BLOCK_DROP_COUNT = 5;

// Game constants
export const BLOCKS_PER_BRIDGE = 10;
export const TRACK_LENGTH = 2000;
export const FINISH_LINE_OFFSET = 100;

// Colors
export const COLORS = {
  PLAYER: [0, 200, 255],
  AI_1: [255, 100, 100],
  AI_2: [100, 255, 100],
  AI_3: [255, 200, 0],
  BLOCK_RED: [255, 50, 50],
  BLOCK_BLUE: [50, 100, 255],
  BLOCK_GREEN: [50, 255, 100],
  BLOCK_YELLOW: [255, 255, 50],
  WATER: [50, 150, 255],
  GROUND: [180, 150, 100],
  BRIDGE: [150, 100, 50]
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  player: null,
  aiRacers: [],
  blocks: [],
  bridges: [],
  droppedBlocks: [],
  entities: [],
  engine: null,
  world: null,
  level: 1,
  camera: { y: 0 },
  raceFinished: false,
  finishResults: [],
  inputState: {
    left: false,
    right: false
  }
};

// Expose globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;