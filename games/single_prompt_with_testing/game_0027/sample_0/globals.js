// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 40;
export const GRID_COLS = 15;
export const GRID_ROWS = 10;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Object types
export const TYPE_EMPTY = "EMPTY";
export const TYPE_BABA = "BABA";
export const TYPE_WALL = "WALL";
export const TYPE_ROCK = "ROCK";
export const TYPE_FLAG = "FLAG";
export const TYPE_GRASS = "GRASS";
export const TYPE_WATER = "WATER";

// Word types
export const WORD_NOUN = "NOUN";
export const WORD_IS = "IS";
export const WORD_PROPERTY = "PROPERTY";

// Properties
export const PROP_YOU = "YOU";
export const PROP_WIN = "WIN";
export const PROP_STOP = "STOP";
export const PROP_PUSH = "PUSH";
export const PROP_SINK = "SINK";
export const PROP_HOT = "HOT";
export const PROP_MELT = "MELT";

// Key codes
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;

// Game state
export const gameState = {
  player: null,
  entities: [],
  wordBlocks: [],
  activeRules: [],
  grid: [],
  score: 0,
  level: 1,
  maxLevel: 3,
  moves: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  playerControlledTypes: [],
  undoStack: [],
  lastMoveTime: 0
};

// Initialize grid
export function initializeGrid() {
  gameState.grid = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    gameState.grid[y] = [];
    for (let x = 0; x < GRID_COLS; x++) {
      gameState.grid[y][x] = [];
    }
  }
}

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}