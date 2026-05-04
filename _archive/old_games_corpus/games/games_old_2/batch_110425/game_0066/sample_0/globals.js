// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const BOARD_SIZE = 6; // 6x6 grid
export const CELL_SIZE = 50;
export const BOARD_OFFSET_X = 150;
export const BOARD_OFFSET_Y = 50;

export const FURBALL_RADIUS = 18;

// Game state object
export const gameState = {
  player: null, // Not used in puzzle game, but kept for compatibility
  entities: [], // All furballs
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "LEVEL_COMPLETE", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  engine: null,
  world: null,
  
  // Game specific state
  currentLevel: 1,
  maxLevel: 10,
  selectedFurballIndex: 0,
  moveHistory: [], // Array of game states for undo
  movesCount: 0,
  
  // Animation state
  isAnimating: false,
  animationQueue: [],
  
  // Test mode state
  testFrameCount: 0,
  testMoveSequence: [],
  testMoveIndex: 0
};

// Level configurations - each level has initial furball positions
export const LEVELS = [
  // Level 1 - Simple 3 furball tutorial
  [
    { gridX: 1, gridY: 2 },
    { gridX: 3, gridY: 2 },
    { gridX: 5, gridY: 2 }
  ],
  // Level 2 - 4 furballs in corners
  [
    { gridX: 1, gridY: 1 },
    { gridX: 5, gridY: 1 },
    { gridX: 1, gridY: 5 },
    { gridX: 5, gridY: 5 }
  ],
  // Level 3 - 5 furballs cross pattern
  [
    { gridX: 3, gridY: 1 },
    { gridX: 1, gridY: 3 },
    { gridX: 3, gridY: 3 },
    { gridX: 5, gridY: 3 },
    { gridX: 3, gridY: 5 }
  ],
  // Level 4 - 6 furballs L-shape
  [
    { gridX: 1, gridY: 1 },
    { gridX: 1, gridY: 2 },
    { gridX: 1, gridY: 3 },
    { gridX: 2, gridY: 3 },
    { gridX: 3, gridY: 3 },
    { gridX: 4, gridY: 3 }
  ],
  // Level 5 - 7 furballs diagonal
  [
    { gridX: 0, gridY: 0 },
    { gridX: 1, gridY: 1 },
    { gridX: 2, gridY: 2 },
    { gridX: 3, gridY: 3 },
    { gridX: 4, gridY: 4 },
    { gridX: 5, gridY: 5 },
    { gridX: 2, gridY: 4 }
  ],
  // Level 6 - 8 furballs ring
  [
    { gridX: 2, gridY: 1 },
    { gridX: 3, gridY: 1 },
    { gridX: 4, gridY: 2 },
    { gridX: 4, gridY: 3 },
    { gridX: 3, gridY: 4 },
    { gridX: 2, gridY: 4 },
    { gridX: 1, gridY: 3 },
    { gridX: 1, gridY: 2 }
  ],
  // Level 7 - 9 furballs dense
  [
    { gridX: 1, gridY: 1 },
    { gridX: 2, gridY: 1 },
    { gridX: 3, gridY: 1 },
    { gridX: 1, gridY: 2 },
    { gridX: 2, gridY: 2 },
    { gridX: 3, gridY: 2 },
    { gridX: 1, gridY: 3 },
    { gridX: 2, gridY: 3 },
    { gridX: 3, gridY: 3 }
  ],
  // Level 8 - 10 furballs scattered
  [
    { gridX: 0, gridY: 1 },
    { gridX: 2, gridY: 0 },
    { gridX: 4, gridY: 1 },
    { gridX: 5, gridY: 3 },
    { gridX: 4, gridY: 5 },
    { gridX: 2, gridY: 5 },
    { gridX: 0, gridY: 4 },
    { gridX: 1, gridY: 2 },
    { gridX: 3, gridY: 3 },
    { gridX: 2, gridY: 2 }
  ],
  // Level 9 - 11 furballs complex
  [
    { gridX: 0, gridY: 0 },
    { gridX: 2, gridY: 0 },
    { gridX: 4, gridY: 0 },
    { gridX: 5, gridY: 2 },
    { gridX: 5, gridY: 4 },
    { gridX: 3, gridY: 5 },
    { gridX: 1, gridY: 5 },
    { gridX: 0, gridY: 3 },
    { gridX: 2, gridY: 3 },
    { gridX: 3, gridY: 2 },
    { gridX: 2, gridY: 1 }
  ],
  // Level 10 - 12 furballs maximum
  [
    { gridX: 0, gridY: 0 },
    { gridX: 1, gridY: 0 },
    { gridX: 2, gridY: 0 },
    { gridX: 3, gridY: 0 },
    { gridX: 4, gridY: 0 },
    { gridX: 5, gridY: 0 },
    { gridX: 5, gridY: 3 },
    { gridX: 5, gridY: 5 },
    { gridX: 2, gridY: 5 },
    { gridX: 0, gridY: 5 },
    { gridX: 0, gridY: 2 },
    { gridX: 2, gridY: 3 }
  ]
];

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}