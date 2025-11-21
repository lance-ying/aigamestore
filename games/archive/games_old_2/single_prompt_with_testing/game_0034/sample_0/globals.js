// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Duel phases
export const DUEL_INTRO = "DUEL_INTRO";
export const DUEL_READY = "DUEL_READY";
export const DUEL_STEADY = "DUEL_STEADY";
export const DUEL_WAIT = "DUEL_WAIT";
export const DUEL_BANG = "DUEL_BANG";
export const DUEL_RESULT = "DUEL_RESULT";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_R = 82;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Duel state
  currentRound: 0,
  totalRounds: 10,
  roundsWon: 0,
  duelPhase: DUEL_INTRO,
  duelTimer: 0,
  
  // Reaction tracking
  playerDrawTime: null,
  aiDrawTime: null,
  playerFouled: false,
  aiFouled: false,
  
  // AI difficulty
  aiReactionTimeMin: 250,  // milliseconds
  aiReactionTimeMax: 450,
  aiFoulChance: 0.0,
  
  // Round result
  roundWinner: null,
  roundResultTimer: 0,
  
  // Timestamps
  bangTimestamp: 0,
  readyStartTime: 0,
  
  // Position tracking for testing
  positionHistory: []
};

// Function to expose game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}