// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRID_SIZE = 6;
export const CELL_SIZE = 50;
export const BOARD_OFFSET_X = 50;
export const BOARD_OFFSET_Y = 50;

export const NUM_TILES_IN_HAND = 3;
export const NUM_AI_PLAYERS = 2;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Tile path definitions (8 directions: 0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW)
// Each tile has 4 paths connecting pairs of edges
export const TILE_TYPES = [
  [[0, 4], [2, 6]], // Straight cross
  [[0, 2], [4, 6]], // Perpendicular
  [[0, 6], [2, 4]], // Curves
  [[0, 2], [4, 6]], // Another variant
  [[0, 6], [2, 4]], // Mirror
  [[2, 4], [0, 6]], // Different orientation
];

export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  board: null, // 6x6 grid of tiles
  players: [], // Array of player objects
  currentPlayerIndex: 0,
  
  selectedTileIndex: 0, // Index in player's hand
  hoveredBoardPos: null, // {x, y} of hovered board position
  
  score: 0,
  turnCount: 0,
  
  animatingMove: false,
  animationQueue: [], // Queue of stone movements to animate
  
  tileHand: [], // Current player's tiles in hand
};

// Expose game state getter
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}