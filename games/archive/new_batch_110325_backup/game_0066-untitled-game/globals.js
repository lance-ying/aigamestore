// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Game sub-states during PLAYING
export const STATE_CLIENT_SELECT = "CLIENT_SELECT";
export const STATE_DATE_SELECT = "DATE_SELECT";
export const STATE_DATE_VENUE = "DATE_VENUE";
export const STATE_MINIGAME = "MINIGAME";
export const STATE_DATE_RESULT = "DATE_RESULT";

// Mini-game types
export const MINIGAME_DIALOGUE = "DIALOGUE";
export const MINIGAME_GIFT = "GIFT";
export const MINIGAME_COMPLIMENT = "COMPLIMENT";

// Personality traits
export const TRAITS = ["Adventurous", "Romantic", "Intellectual", "Humorous", "Athletic", "Creative"];

// Color palette
export const COLORS = {
  background: [245, 240, 255],
  primary: [255, 105, 180],
  secondary: [255, 182, 193],
  accent: [138, 43, 226],
  text: [50, 50, 50],
  textLight: [100, 100, 100],
  success: [50, 205, 50],
  failure: [255, 69, 0],
  white: [255, 255, 255],
  panel: [255, 255, 255, 230]
};

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  playState: STATE_CLIENT_SELECT,
  controlMode: "HUMAN",
  
  // Player/Agency data
  player: {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    reputation: 0,
    currency: 0
  },
  
  // Clients and dates
  clients: [],
  dates: [],
  selectedClient: null,
  selectedDate: null,
  currentCouple: null,
  
  // Venues
  venues: [],
  selectedVenue: null,
  unlockedVenues: 1,
  
  // Date progress
  loveMeter: 0,
  miniGamesCompleted: 0,
  currentMiniGame: null,
  miniGameTimer: 0,
  
  // UI state
  menuSelection: 0,
  menuOptions: [],
  
  // Game progression
  datesCompleted: 0,
  successfulDates: 0,
  targetReputation: 500,
  
  // Entities for tracking
  entities: [],
  
  // Input tracking
  lastActionFrame: 0,
  positionHistory: []
};

// Expose getGameState globally
window.getGameState = function() {
  return gameState;
};

export default gameState;