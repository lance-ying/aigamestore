// globals.js - Global state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASE = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  LEVEL_COMPLETE: "LEVEL_COMPLETE",
  GAME_OVER: "GAME_OVER",
  WIN: "WIN"
};

export const gameState = {
  gamePhase: GAME_PHASE.START,
  controlMode: "HUMAN",
  currentLevel: 0,
  score: 0,
  levelScore: 0,
  highScore: 0,
  
  // Grid and gameplay
  gridSize: 10,
  cellSize: 0,
  gridOffsetX: 0,
  gridOffsetY: 0,
  
  // Items
  inventory: [],
  placedItems: [],
  heldItem: null,
  heldItemGridX: 0,
  heldItemGridY: 0,
  selectedInventoryIndex: -1,
  
  // Timer
  levelTimeLimit: 90,
  levelStartTime: 0,
  timeRemaining: 90,
  
  // Player reference for logging
  player: null,
  
  // Entities for compatibility
  entities: []
};

// Make gameState accessible globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}