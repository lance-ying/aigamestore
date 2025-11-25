// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Game constants
export const MAX_HEALTH = 4;
export const SHELLS_PER_ROUND = 8;
export const ROUNDS_TO_WIN = 2;

// Item types
export const ITEM_MAGNIFYING_GLASS = "MAGNIFYING_GLASS";
export const ITEM_CIGARETTES = "CIGARETTES";
export const ITEM_HANDSAW = "HANDSAW";
export const ITEM_BEER = "BEER";

// Turn states
export const TURN_STATE_CHOOSE_ACTION = "CHOOSE_ACTION";
export const TURN_STATE_CHOOSE_TARGET = "CHOOSE_TARGET";
export const TURN_STATE_USE_ITEM = "USE_ITEM";
export const TURN_STATE_ANIMATING = "ANIMATING";

export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Players
  player: null,
  dealer: null,
  
  // Current turn
  currentTurn: "PLAYER", // "PLAYER" or "DEALER"
  turnState: TURN_STATE_CHOOSE_ACTION,
  
  // Shotgun
  shells: [], // Array of "LIVE" or "BLANK"
  currentShellIndex: 0,
  sawedOff: false, // If handsaw was used, next shot does double damage
  
  // Round tracking
  currentRound: 1,
  playerRoundsWon: 0,
  dealerRoundsWon: 0,
  
  // Items
  playerItems: [],
  dealerItems: [],
  selectedItemIndex: -1,
  
  // UI state
  menuSelection: 0, // For menu navigation
  targetSelection: 0, // 0 = self, 1 = opponent
  knownNextShell: null, // Result of magnifying glass
  
  // Animation
  animationFrame: 0,
  animationMaxFrames: 60,
  animationMessage: "",
  
  // Entities (for collision/rendering)
  entities: [],
  
  // Score (rounds won)
  score: 0
};

// Make gameState globally accessible
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}