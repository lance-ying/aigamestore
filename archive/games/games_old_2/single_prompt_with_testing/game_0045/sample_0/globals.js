// globals.js - Global constants and game state

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

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  engine: null,
  world: null,
  
  // Game-specific state
  currentLevel: 1,
  sugarParticles: [],
  cups: [],
  drawnLines: [],
  colorFilters: [],
  sugarSource: null,
  totalSugarProduced: 0,
  maxSugarPerLevel: 300,
  lineDrawingBudget: 200,
  lineDrawingUsed: 0,
  
  // Drawing state for keyboard control
  cursorX: CANVAS_WIDTH / 2,
  cursorY: CANVAS_HEIGHT / 2,
  drawingLine: false,
  lineStartX: 0,
  lineStartY: 0,
  
  // Test mode state
  testActions: [],
  testActionIndex: 0,
  testStartFrame: 0
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}