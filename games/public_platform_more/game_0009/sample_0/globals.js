// Canvas and game constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Board configuration
export const BOARD_SIZE = 28; // Total spaces on the board
export const BOARD_MARGIN = 50;
export const SPACE_SIZE = 35;

// Property costs and rent multipliers
export const HOUSE_COST = 50;
export const HOTEL_COST = 100;

// Player starting values
export const STARTING_CASH = 1500;
export const PASS_GO_REWARD = 200;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Game-specific state
  currentPlayerIndex: 0,
  players: [],
  board: [],
  diceValues: [0, 0],
  diceRolled: false,
  turnPhase: "ROLL", // "ROLL", "MOVE", "ACTION", "END"
  animationProgress: 0,
  selectedProperty: null,
  pendingAction: null,
  messageQueue: [],
  messageTimer: 0,
  turnCount: 0,
  doublesCount: 0,
  
  // Card decks
  chanceCards: [],
  communityChestCards: [],
  
  // UI state
  actionPrompt: "",
  showingDice: false
};

// Property color groups
export const PROPERTY_GROUPS = {
  BROWN: [1, 3],
  LIGHT_BLUE: [6, 8, 9],
  PINK: [11, 13, 14],
  ORANGE: [16, 18, 19],
  RED: [21, 23, 24],
  YELLOW: [26, 27, 29],
  GREEN: [31, 32, 34],
  DARK_BLUE: [37, 39]
};

// Board space types
export const SPACE_TYPES = {
  GO: "GO",
  PROPERTY: "PROPERTY",
  RAILROAD: "RAILROAD",
  UTILITY: "UTILITY",
  CHANCE: "CHANCE",
  COMMUNITY_CHEST: "COMMUNITY_CHEST",
  TAX: "TAX",
  JAIL: "JAIL",
  FREE_PARKING: "FREE_PARKING",
  GO_TO_JAIL: "GO_TO_JAIL"
};

// Initialize the game state accessor
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}