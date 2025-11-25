// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = 0.5;
export const JUMP_FORCE = -10;
export const DOUBLE_JUMP_FORCE = -8;
export const MOVE_SPEED = 3;
export const SPRINT_MULTIPLIER = 1.8;
export const LADDER_CLIMB_SPEED = 3;

export const PHASE = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const HAT_TYPE = {
  NONE: "NONE",
  SPRINT: "SPRINT",
  BREWING: "BREWING",
  DIMENSION: "DIMENSION"
};

export const gameState = {
  player: null,
  entities: [],
  timePieces: [],
  yarn: [],
  ladders: [],
  platforms: [],
  spikes: [],
  pits: [],
  explosions: [],
  particles: [],
  score: 0,
  timePiecesCollected: 0,
  yarnCollected: 0,
  totalTimePieces: 5,
  gamePhase: PHASE.START,
  controlMode: "HUMAN",
  currentHat: HAT_TYPE.NONE,
  unlockedHats: [HAT_TYPE.NONE],
  dimensionActive: false,
  dimensionTimer: 0,
  frameCount: 0,
  camera: { x: 0, y: 0 },
  worldWidth: 2400,
  worldHeight: 400
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}