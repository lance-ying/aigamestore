// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 40;
export const GRID_COLS = 12;
export const GRID_ROWS = 8;
export const OFFSET_X = (CANVAS_WIDTH - GRID_COLS * GRID_SIZE) / 2;
export const OFFSET_Y = (CANVAS_HEIGHT - GRID_ROWS * GRID_SIZE) / 2;

export const PHASE = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const ENTITY_TYPE = {
  PLAYER: "PLAYER",
  GUARD: "GUARD",
  TURRET: "TURRET",
  DRONE: "DRONE",
  TERMINAL: "TERMINAL",
  EXIT: "EXIT",
  WALL: "WALL"
};

export const DIRECTION = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
  NONE: { x: 0, y: 0 }
};

export const gameState = {
  player: null,
  entities: [],
  grid: [],
  score: 0,
  turnCount: 0,
  level: 1,
  gamePhase: PHASE.START,
  controlMode: "HUMAN",
  invisibilityCharges: 3,
  isInvisible: false,
  invisibilityTurnsLeft: 0,
  detectedBy: null,
  exitReached: false,
  lastPlayerMove: null,
  moveHistory: []
};

// Helper function to get gameState
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}