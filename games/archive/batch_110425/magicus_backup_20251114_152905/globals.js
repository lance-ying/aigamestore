// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Rune colors
export const RUNE_RED = 0;
export const RUNE_BLUE = 1;
export const RUNE_GREEN = 2;
export const RUNE_YELLOW = 3;
export const RUNE_PURPLE = 4;

export const RUNE_COLORS = [
  [255, 80, 80],    // Red
  [80, 150, 255],   // Blue
  [80, 255, 120],   // Green
  [255, 220, 80],   // Yellow
  [200, 100, 255]   // Purple
];

export const RUNE_NAMES = ["Fire", "Ice", "Nature", "Light", "Shadow"];

// Grid settings
export const GRID_SIZE = 6;
export const GRID_START_X = 50;
export const GRID_START_Y = 100;
export const CELL_SIZE = 40;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  grid: [],
  cursor: { x: 0, y: 0 },
  selectedCell: null,
  score: 0,
  gold: 0,
  stage: 1,
  enemyHP: 100,
  enemyMaxHP: 100,
  playerHP: 100,
  playerMaxHP: 100,
  elementalMeters: [0, 0, 0, 0, 0], // One for each rune color
  meterMax: 10,
  isPlayerTurn: true,
  animating: false,
  matchedCells: [],
  animationTimer: 0,
  damageDealt: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  currentEnemy: null,
  level: 1,
  experience: 0,
  experienceToLevel: 100,
  totalEnemiesDefeated: 0,
  turnCount: 0,
  invalidSwap: false,
  invalidSwapTimer: 0,
  invalidSwapCells: null
};

// Initialize getGameState function
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}