// Game constants
export const GRID_SIZE = 9;
export const CELL_SIZE = 30;
export const GRID_OFFSET_X = 150;
export const GRID_OFFSET_Y = 50;
export const BLOCK_PREVIEW_X = 50; // Adjusted to shift preview blocks slightly to the right
export const BLOCK_PREVIEW_Y = 120; // Adjusted for more vertical space
export const PREVIEW_SIZE = 20;
export const MIN_SCORE_TO_WIN = 1000;

// Game state
export const gameState = {
  player: {
    score: 0,
    highScore: 0,
    comboCount: 0,
    lastClearedLines: 0
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
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  framesSinceLastAction: 0,
  lastActionTaken: null,
  actionHistory: []
  ,
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
  [255, 0, 0],      // Red
  [0, 255, 0],      // Green
  [0, 0, 255],      // Blue
  [255, 255, 0],    // Yellow
  [255, 0, 255],    // Magenta
  [0, 255, 255],    // Cyan
  [255, 165, 0],    // Orange
  [128, 0, 128],    // Purple
  [255, 192, 203],  // Pink
  [0, 128, 0],      // Dark Green
  [0, 0, 128],      // Navy
  [128, 128, 0]     // Olive
];

// Function to get game state
export function getGameState() {
  return gameState;
}

// Expose the getGameState function globally
window.getGameState = getGameState;