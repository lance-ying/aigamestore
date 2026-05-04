// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";
export const PHASE_LEVEL_COMPLETE = "LEVEL_COMPLETE";

// Gem types
export const GEM_RED = 0;
export const GEM_GREEN = 1;
export const GEM_YELLOW = 2;
export const GEM_PURPLE = 3;
export const GEM_CYAN = 4;
export const GEM_ORANGE = 5;
export const GEM_BLUE_STAR = 6;  // Player booster charge
export const GEM_RED_CIRCLE = 7; // AI booster charge
export const GEM_OBSTACLE = 8;   // Unbreakable obstacle
export const GEM_EMPTY = -1;     // Empty cell

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Board state
  board: [],
  boardWidth: 8,
  boardHeight: 8,
  gridCellSize: 40,
  
  // Cursor and selection
  cursorX: 0,
  cursorY: 0,
  selectedGem: null, // {x, y} or null
  
  // Turn and score
  playerTurn: true,
  playerScore: 0,
  aiScore: 0,
  turnsRemaining: 20,
  
  // Booster system
  playerBoosterCharge: 0,
  playerBoosterMax: 10,
  aiBoosterCharge: 0,
  aiBoosterMax: 10,
  boosterActive: false,
  boosterState: null, // For multi-step booster activation
  
  // Level system
  currentLevel: 1,
  maxLevel: 4,
  
  // Animation state
  animatingSwap: false,
  animatingClear: false,
  animatingFall: false,
  swapAnimations: [],
  clearAnimations: [],
  fallAnimations: [],
  
  // AI state
  aiThinking: false,
  aiThinkTimer: 0,
  
  // Player reference (for logging)
  player: null,
  entities: [],
  
  // Match tracking
  currentComboMultiplier: 1,
  matchesThisTurn: 0,
  
  // Level config
  levelConfig: null
};

// Level configurations
export const LEVEL_CONFIGS = [
  {
    level: 1,
    name: "Training Grounds",
    boardWidth: 8,
    boardHeight: 8,
    gemTypes: [GEM_RED, GEM_GREEN, GEM_YELLOW, GEM_PURPLE, GEM_BLUE_STAR, GEM_RED_CIRCLE],
    turns: 20,
    aiDifficulty: "VERY_LOW",
    playerBooster: "GEM_BLAST",
    aiBooster: "RANDOM_SWAP",
    obstacles: 0
  },
  {
    level: 2,
    name: "Gem Gauntlet",
    boardWidth: 9,
    boardHeight: 9,
    gemTypes: [GEM_RED, GEM_GREEN, GEM_YELLOW, GEM_PURPLE, GEM_CYAN, GEM_BLUE_STAR, GEM_RED_CIRCLE],
    turns: 25,
    aiDifficulty: "LOW",
    playerBooster: "LINE_CLEAR",
    aiBooster: "BLOCK_GEM",
    obstacles: 0
  },
  {
    level: 3,
    name: "Strategic Studio",
    boardWidth: 10,
    boardHeight: 10,
    gemTypes: [GEM_RED, GEM_GREEN, GEM_YELLOW, GEM_PURPLE, GEM_CYAN, GEM_ORANGE, GEM_BLUE_STAR, GEM_RED_CIRCLE],
    turns: 30,
    aiDifficulty: "MEDIUM",
    playerBooster: "COLOR_CONVERSION",
    aiBooster: "BOARD_SHUFFLE",
    obstacles: 0
  },
  {
    level: 4,
    name: "Master's Arena",
    boardWidth: 10,
    boardHeight: 10,
    gemTypes: [GEM_RED, GEM_GREEN, GEM_YELLOW, GEM_PURPLE, GEM_CYAN, GEM_ORANGE, GEM_BLUE_STAR, GEM_RED_CIRCLE],
    turns: 30,
    aiDifficulty: "HIGH",
    playerBooster: "COLOR_ERADICATION",
    aiBooster: "BOOSTER_DRAIN",
    obstacles: 7
  }
];

export function getGameState() {
  // Return object with both 'gamePhase' and 'phase' fields for compatibility
  return {
    gamePhase: gameState.gamePhase,
    phase: gameState.gamePhase,
    controlMode: gameState.controlMode,
    playerTurn: gameState.playerTurn,
    playerScore: gameState.playerScore,
    aiScore: gameState.aiScore,
    turnsRemaining: gameState.turnsRemaining,
    currentLevel: gameState.currentLevel,
    cursorX: gameState.cursorX,
    cursorY: gameState.cursorY
  };
}