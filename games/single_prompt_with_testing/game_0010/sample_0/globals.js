// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Valid Arstotzkan cities for document validation
export const VALID_CITIES = [
  "Orvech Vonor", "East Grestin", "Paradizna", 
  "West Grestin", "Outer Grouse", "Lesrenadi"
];

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Game-specific state
  currentTraveler: null,
  travelers: [],
  travelerIndex: 0,
  
  selectedDocument: null,
  inspectMode: false,
  
  day: 1,
  quota: 5,
  processed: 0,
  correctDecisions: 0,
  wrongDecisions: 0,
  
  timeRemaining: 180, // 3 minutes per day
  lastTimeUpdate: 0,
  
  message: "",
  messageTimer: 0,
  
  uiState: {
    selectedButton: "approve" // "approve" or "deny"
  }
};

// Expose game state globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}