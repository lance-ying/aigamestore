// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Grid configuration
export const GRID_SIZE = 6;
export const TILE_SIZE = 50;
export const GRID_OFFSET_X = 50;
export const GRID_OFFSET_Y = 80;

// Tile types
export const TILE_TYPES = {
  RED: 'RED',       // Attack
  BLUE: 'BLUE',     // Defense
  GREEN: 'GREEN',   // Healing
  YELLOW: 'YELLOW'  // Mana
};

export const TILE_COLORS = {
  RED: [220, 60, 60],
  BLUE: [60, 120, 220],
  GREEN: [60, 200, 80],
  YELLOW: [240, 200, 60]
};

// Game phases
export const GAME_PHASES = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER_WIN: 'GAME_OVER_WIN',
  GAME_OVER_LOSE: 'GAME_OVER_LOSE',
  SHOP: 'SHOP'
};

// Game state
export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: 'HUMAN',
  
  // Player stats
  player: null,
  
  // Grid
  grid: [],
  selectedTiles: [],
  matchingTiles: [],
  
  // Combat
  enemies: [],
  currentFloor: 1,
  
  // UI
  shopOpen: false,
  shopItems: [],
  
  // Timing
  animationTimer: 0,
  turnDelay: 0,
  
  // Entities for logging
  entities: [],
  
  // Score tracking
  score: 0,
  totalGold: 0,
  enemiesDefeated: 0
};

// Helper to expose game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}