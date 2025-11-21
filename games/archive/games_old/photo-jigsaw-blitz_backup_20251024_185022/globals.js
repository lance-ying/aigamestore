// globals.js - Global game state and constants

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
  TEST_2: "TEST_2"
};

export const SNAP_TOLERANCE = 18;
export const MOVE_SPEED = 10;
export const FINE_MOVE_SPEED = 2;

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  player: null, // Will store cursor position for selection reference
  entities: [], // All puzzle pieces
  groups: [], // Connected groups of pieces
  selectedPieceId: null,
  currentLevel: 1,
  score: 0,
  timeRemaining: 0,
  timeLimit: 0,
  lastSnapTime: 0,
  chainSnapCount: 0,
  completedLevels: [],
  // Input tracking
  keys: {
    up: false,
    down: false,
    left: false,
    right: false,
    shift: false,
    space: false,
    z: false
  }
};

// Virtual player/cursor for selection reference
export class VirtualCursor {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

// Initialize virtual cursor at center
gameState.player = new VirtualCursor(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

export function getGameState() {
  return gameState;
}

// Expose to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}