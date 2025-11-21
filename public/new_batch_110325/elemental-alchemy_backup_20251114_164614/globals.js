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

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Element discovery tracking
  discoveredElements: new Set(),
  unlockedCategories: new Set(),
  
  // UI state
  selectedCategory: 0,
  selectedElementIndex: 0,
  firstSelectedElement: null,
  
  // Animation state
  animations: [],
  
  // Statistics
  totalCombinations: 0,
  successfulCombinations: 0,
  
  // Win condition
  totalElementsInGame: 0
};

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}