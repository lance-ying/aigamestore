// globals.js - Global game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const PANEL_COLS = 2;
export const PANEL_ROWS = 2;
export const PANEL_GAP = 10;
export const PANEL_SIZE = (CANVAS_WIDTH - PANEL_GAP * 3) / 2;

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
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  selectedPanel: 0, // 0-3 for 2x2 grid
  panels: [], // Array of panel objects
  currentLevel: 0,
  totalLevels: 5,
  orbsCollected: 0,
  undoStack: [],
  maxUndos: 3,
  undosRemaining: 3,
  swapMode: false,
  swapFrom: -1,
  levelComplete: false,
  transitionTimer: 0
};

// Initialize function to set up game state
export function initGameState() {
  gameState.selectedPanel = 0;
  gameState.panels = [];
  gameState.currentLevel = 0;
  gameState.orbsCollected = 0;
  gameState.undoStack = [];
  gameState.undosRemaining = 3;
  gameState.swapMode = false;
  gameState.swapFrom = -1;
  gameState.levelComplete = false;
  gameState.transitionTimer = 0;
  gameState.score = 0;
}

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;