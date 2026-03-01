// Game constants
export const GRID_SIZE = 9;
export const CELL_SIZE = 30;
export const GRID_OFFSET_X = 180; // Shifted right to make room for left UI
export const GRID_OFFSET_Y = 50;
export const BLOCK_PREVIEW_X = 50; // Adjusted to shift preview blocks slightly to the right
export const BLOCK_PREVIEW_Y = 50; // Moved upward
export const PREVIEW_SIZE = 20;
export const MIN_SCORE_TO_WIN = 999999; // Effectively disabled in favor of level progression

// Level Configuration
export const LEVELS = [
  // Easy Levels
  { 
    id: 1, 
    name: "Easy I", 
    linesTarget: 2, 
    maxBlocks: 15, 
    bgColor: [30, 30, 50] // Dark Blue
  },
  { 
    id: 2, 
    name: "Easy II", 
    linesTarget: 4, 
    maxBlocks: 20, 
    bgColor: [30, 50, 30] // Dark Green
  },
  // Medium Levels
  { 
    id: 3, 
    name: "Medium I", 
    linesTarget: 6, 
    maxBlocks: 25, 
    bgColor: [50, 30, 50] // Dark Purple
  },
  { 
    id: 4, 
    name: "Medium II", 
    linesTarget: 8, 
    maxBlocks: 30, 
    bgColor: [50, 30, 30] // Dark Red
  },
  // Hard Levels
  { 
    id: 5, 
    name: "Hard I", 
    linesTarget: 10, 
    maxBlocks: 30, 
    bgColor: [50, 50, 30] // Dark Yellow/Olive
  },
  { 
    id: 6, 
    name: "Hard II", 
    linesTarget: 12, 
    maxBlocks: 35, 
    bgColor: [30, 50, 50] // Dark Teal
  }
];

// Game state
export const gameState = {
  player: {
    score: 0,
    highScore: 0,
    comboCount: 0,
    lastClearedLines: 0
  },
  level: {
    currentIndex: 0,
    linesCleared: 0,
    blocksPlaced: 0
  },
  grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0)),
  availableBlocks: [],
  selectedBlockIndex: 0,
  currentBlock: {
    shape: [],
    x: Math.floor(GRID_SIZE / 2),
    y: Math.floor(GRID_SIZE / 2)
  },
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // Only "HUMAN" mode will be used
  // framesSinceLastAction: 0, // Removed: Only used for automated testing
  // lastActionTaken: null,    // Removed: Only used for automated testing
  // actionHistory: []         // Removed: Only used for automated testing
  // Visual animations queue
  animations: []
};

// Block shapes definition
export const BLOCK_SHAPES = [
  // Single square
  [
    [1]
  ],
  // Horizontal line of 2
  [
    [1, 1]
  ],
  // Vertical line of 2
  [
    [1],
    [1]
  ],
  // Horizontal line of 3
  [
    [1, 1, 1]
  ],
  // Vertical line of 3
  [
    [1],
    [1],
    [1]
  ],
  // L shape
  [
    [1, 0],
    [1, 1]
  ],
  // Reversed L shape
  [
    [0, 1],
    [1, 1]
  ],
  // T shape
  [
    [1, 1, 1],
    [0, 1, 0]
  ],
  // Square (2x2)
  [
    [1, 1],
    [1, 1]
  ],
  // Cross shape
  [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0]
  ],
  // Z shape
  [
    [1, 1, 0],
    [0, 1, 1]
  ],
  // S shape
  [
    [0, 1, 1],
    [1, 1, 0]
  ]
];

// Block colors
export const BLOCK_COLORS = [
  [255, 50, 50],    // Red
  [50, 255, 50],    // Green
  [50, 50, 255],    // Blue
  [255, 255, 50],   // Yellow
  [255, 50, 255],   // Magenta
  [50, 255, 255],   // Cyan
  [255, 165, 50],   // Orange
  [150, 50, 200],   // Purple
  [255, 150, 180],  // Pink
  [50, 180, 50],    // Dark Green
  [50, 80, 200],    // Navy
  [180, 180, 50]    // Olive
];

// Function to get game state
export function getGameState() {
  return gameState;
}

// Expose the getGameState function globally
window.getGameState = getGameState;