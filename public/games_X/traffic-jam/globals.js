// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRID_SIZE = 6;
export const CELL_SIZE = 50;
export const GRID_OFFSET_X = 150;
export const GRID_OFFSET_Y = 75;

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
  currentLevel: 0,
  selectedVehicle: null,
  isGrabbing: false,
  moveCount: 0,
  levelComplete: false,
  particles: [],
  cursorX: 0,
  cursorY: 0
};

// Expose getGameState function
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}