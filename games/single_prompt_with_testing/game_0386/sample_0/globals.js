// globals.js - Global constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const SHAPE_TYPES = {
  CIRCLE: "CIRCLE",
  SQUARE: "SQUARE",
  TRIANGLE: "TRIANGLE",
  DIAMOND: "DIAMOND"
};

export const COLORS = {
  background: [25, 25, 35],
  grid: [45, 45, 55],
  cursor: [255, 200, 100],
  path: [100, 150, 255],
  pathActive: [150, 200, 255],
  text: [220, 220, 230],
  shapes: {
    CIRCLE: [255, 100, 100],
    SQUARE: [100, 255, 100],
    TRIANGLE: [255, 255, 100],
    DIAMOND: [255, 100, 255]
  }
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentLevel: 0,
  score: 0,
  moves: 0,
  
  // Puzzle state
  nodes: [],
  paths: [],
  currentPath: null,
  cursor: { nodeIndex: 0 },
  
  // Level progression
  levelsCompleted: 0,
  totalMoves: 0,
  
  // For automated testing
  positionHistory: [],
  lastAction: null,
  actionCount: 0
};

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}