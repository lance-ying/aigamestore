// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  WATER_FLOW: "WATER_FLOW",
  LEVEL_COMPLETE: "LEVEL_COMPLETE",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const PIPE_TYPES = {
  EMPTY: "EMPTY",
  STRAIGHT: "STRAIGHT",
  BEND: "BEND",
  T_JUNCTION: "T_JUNCTION",
  CROSS: "CROSS",
  START: "START",
  END: "END",
  BLOCKED: "BLOCKED"
};

export const CELL_SIZE = 50;

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentLevel: 1,
  maxLevel: 3,
  timeRemaining: 0,
  grid: [],
  gridWidth: 0,
  gridHeight: 0,
  cursorX: 0,
  cursorY: 0,
  waterPath: [],
  waterAnimProgress: 0,
  startPos: { x: 0, y: 0 },
  endPos: { x: 0, y: 0 },
  levelStartTime: 0
};

// Expose getGameState globally
window.getGameState = function() {
  return gameState;
};