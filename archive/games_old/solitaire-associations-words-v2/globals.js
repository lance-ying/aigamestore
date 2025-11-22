// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game state object
export const gameState = {
  player: null, // Not applicable for this game, but required
  entities: [], // All cards in the game
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Game-specific state
  level: 1,
  movesRemaining: 0,
  maxMoves: 0,
  deck: [], // Cards in the draw deck
  currentCard: null, // Card currently drawn/selected
  categoryStacks: [], // Array of category stacks on the board
  selectedStackIndex: 0, // Which stack is currently selected
  drawPhase: true, // true = draw phase, false = place phase
  moveHistory: [], // For undo functionality
  categories: [],
  words: [],
  cardAnimations: [],
  levelComplete: false,
  showingLevelComplete: false,
  levelCompleteTimer: 0,
  
  // Automated testing
  testActions: [],
  testActionIndex: 0,
  testFrameCounter: 0
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}

// Card dimensions
export const CARD_WIDTH = 80;
export const CARD_HEIGHT = 60;
export const CARD_SPACING = 10;

// Game colors
export const COLORS = {
  background: [30, 30, 40],
  cardBg: [240, 240, 250],
  cardBorder: [100, 100, 120],
  cardBorderSelected: [255, 200, 50],
  categoryCard: [100, 150, 255],
  wordCard: [255, 255, 255],
  text: [20, 20, 30],
  ui: [200, 200, 220],
  success: [100, 255, 100],
  danger: [255, 100, 100]
};