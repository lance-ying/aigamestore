// globals.js - Global game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRID_SIZE = 8; // Will vary by level
export const TILE_SIZE = 40;
export const GRID_OFFSET_X = 150;
export const GRID_OFFSET_Y = 50;

export const COLORS = {
  RED: [220, 50, 50],
  BLUE: [50, 120, 220],
  GREEN: [50, 200, 80],
  YELLOW: [240, 220, 50],
  PURPLE: [180, 50, 200],
  ORANGE: [255, 140, 50]
};

export const COLOR_NAMES = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE'];

export const gameState = {
  player: null, // Not used in match-3, but required by spec
  entities: [], // All tiles
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN",
  currentLevel: 1,
  movesRemaining: 0,
  cursorX: 0,
  cursorY: 0,
  selectedTile: null,
  board: [],
  objectives: [],
  isAnimating: false,
  animationQueue: [],
  comboCounting: 0,
  comboMultiplier: 1.0,
  totalScore: 0
};

// Level definitions
export const LEVELS = [
  {
    level: 1,
    gridSize: 8,
    colors: 4,
    moves: 25,
    objectives: [
      { type: 'CLEAR_COLOR', color: 'RED', target: 20, current: 0, display: 'Clear 20 Red tiles' },
      { type: 'CLEAR_COLOR', color: 'BLUE', target: 15, current: 0, display: 'Clear 15 Blue tiles' }
    ],
    iceBlocks: 0,
    chainedTiles: 0,
    targetItems: 0
  },
  {
    level: 2,
    gridSize: 8,
    colors: 5,
    moves: 30,
    objectives: [
      { type: 'CLEAR_ICE', target: 15, current: 0, display: 'Clear 15 Ice Blocks' },
      { type: 'CLEAR_COLOR', color: 'GREEN', target: 25, current: 0, display: 'Clear 25 Green tiles' }
    ],
    iceBlocks: 15,
    chainedTiles: 0,
    targetItems: 0
  },
  {
    level: 3,
    gridSize: 9,
    colors: 5,
    moves: 35,
    objectives: [
      { type: 'COLLECT_ITEMS', target: 3, current: 0, display: 'Collect 3 Keys' },
      { type: 'CLEAR_CHAINS', target: 10, current: 0, display: 'Clear 10 Chained Tiles' },
      { type: 'CLEAR_ICE', target: 10, current: 0, display: 'Clear 10 Ice Blocks' }
    ],
    iceBlocks: 12,
    chainedTiles: 10,
    targetItems: 3
  },
  {
    level: 4,
    gridSize: 9,
    colors: 6,
    moves: 40,
    objectives: [
      { type: 'ACTIVATE_ROCKET', target: 4, current: 0, display: 'Activate 4 Rockets' },
      { type: 'ACTIVATE_BOMB', target: 2, current: 0, display: 'Activate 2 Bombs' },
      { type: 'CLEAR_COLOR', color: 'YELLOW', target: 30, current: 0, display: 'Clear 30 Yellow tiles' }
    ],
    iceBlocks: 5,
    chainedTiles: 0,
    targetItems: 0
  },
  {
    level: 5,
    gridSize: 10,
    colors: 6,
    moves: 40,
    objectives: [
      { type: 'CLEAR_ICE', target: 20, current: 0, display: 'Clear 20 Ice Blocks' },
      { type: 'CLEAR_CHAINS', target: 15, current: 0, display: 'Clear 15 Chained Tiles' },
      { type: 'COLLECT_ITEMS', target: 4, current: 0, display: 'Collect 4 Crowns' },
      { type: 'SCORE', target: 15000, current: 0, display: 'Score 15,000 points' }
    ],
    iceBlocks: 20,
    chainedTiles: 15,
    targetItems: 4
  }
];