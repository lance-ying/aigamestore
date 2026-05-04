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

export const gameState = {
  player: null,
  entities: [],
  sushiPieces: [],
  obstacles: [],
  score: 0,
  bellyMeter: 0, // 0 to 100
  currentLevel: 1,
  dropsRemaining: 5,
  maxDrops: 5,
  catDropped: false,
  dropPositionX: CANVAS_WIDTH / 2,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  engine: null,
  world: null,
  totalSushiInLevel: 0,
  lastPlayerLogX: 0,
  lastPlayerLogY: 0,
  testTimer: 0,
  testState: 0
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}