// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASE = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const TILE_TYPES = {
  SWORD: "SWORD",
  SHIELD: "SHIELD",
  POTION: "POTION",
  EMPTY: "EMPTY"
};

export const GRID_COLS = 8;
export const GRID_ROWS = 6;
export const TILE_SIZE = 45;
export const GRID_OFFSET_X = 20;
export const GRID_OFFSET_Y = 80;

export const gameState = {
  gamePhase: GAME_PHASE.START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  enemies: [],
  grid: [],
  selectedPath: [],
  score: 0,
  level: 1,
  experience: 0,
  expToNextLevel: 100,
  gold: 0,
  waveNumber: 1,
  enemiesDefeatedThisWave: 0,
  enemiesPerWave: 3,
  difficulty: 1,
  framesSinceLastAction: 0,
  combos: 0,
  maxCombo: 0,
  isDrawingPath: false,
  lastMatchType: null,
  defenseBonus: 0,
  turnCount: 0
};

// For automated testing to prevent getting stuck
export const testingState = {
  positionHistory: [],
  stuckFrames: 0,
  lastAction: null,
  actionRepeatCount: 0
};