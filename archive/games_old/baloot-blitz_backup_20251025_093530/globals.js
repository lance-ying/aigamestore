// globals.js - Global constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Card dimensions
export const CARD_WIDTH = 50;
export const CARD_HEIGHT = 70;

// Grid configuration
export const GRID_COLS = 10;
export const GRID_ROWS = 5;
export const GRID_X = 50;
export const GRID_Y = 100;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Card suits and ranks
export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['A', 'K', 'Q', 'J', '10', '9', '8', '7'];

// Combination types
export const COMBO_SARY = "SARY"; // Four of a kind
export const COMBO_KHAMSA = "KHAMSA"; // Five consecutive ranks
export const COMBO_BALOOT = "BALOOT"; // King + Queen of same suit
export const COMBO_ACE_TEN = "ACE_TEN"; // Ace + Ten of same suit

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  level: 1,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  grid: [],
  fallingCard: null,
  nextCards: [],
  combosCleared: 0,
  timeRemaining: 120,
  lastFrameTime: 0,
  particleEffects: [],
  clearingAnimation: [],
  levelProgress: 0,
  requiredCombos: 5,
  fallSpeed: 1,
  scoreMultiplier: 1
};

// Initialize grid
export function initializeGrid() {
  gameState.grid = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    gameState.grid[row] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      gameState.grid[row][col] = null;
    }
  }
}

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}