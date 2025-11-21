// globals.js - Global state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRID_SIZE = 9;
export const BOX_SIZE = 3;

// Game state object
export const gameState = {
  player: null, // not used in Sudoku, but required by spec
  entities: [], // not used in Sudoku, but required by spec
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Sudoku-specific state
  grid: [], // 9x9 array of cell objects {value, given, pencilMarks}
  initialGrid: [], // copy of starting grid
  selectedRow: 4,
  selectedCol: 4,
  inputMode: "SOLUTION", // "SOLUTION" or "PENCIL"
  moveHistory: [], // for undo functionality
  mistakes: 0,
  hintsUsed: 0,
  timeElapsed: 0,
  startTime: null,
  
  // Puzzle tracking
  currentPuzzleIndex: 0,
  completedCells: 0,
  totalEmptyCells: 0
};

// Easy puzzle with solution for testing
export const PUZZLES = [
  {
    difficulty: "EASY",
    puzzle: [
      [5,3,0, 0,7,0, 0,0,0],
      [6,0,0, 1,9,5, 0,0,0],
      [0,9,8, 0,0,0, 0,6,0],
      
      [8,0,0, 0,6,0, 0,0,3],
      [4,0,0, 8,0,3, 0,0,1],
      [7,0,0, 0,2,0, 0,0,6],
      
      [0,6,0, 0,0,0, 2,8,0],
      [0,0,0, 4,1,9, 0,0,5],
      [0,0,0, 0,8,0, 0,7,9]
    ],
    solution: [
      [5,3,4, 6,7,8, 9,1,2],
      [6,7,2, 1,9,5, 3,4,8],
      [1,9,8, 3,4,2, 5,6,7],
      
      [8,5,9, 7,6,1, 4,2,3],
      [4,2,6, 8,5,3, 7,9,1],
      [7,1,3, 9,2,4, 8,5,6],
      
      [9,6,1, 5,3,7, 2,8,4],
      [2,8,7, 4,1,9, 6,3,5],
      [3,4,5, 2,8,6, 1,7,9]
    ]
  }
];

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function getGameState() {
  return gameState;
}