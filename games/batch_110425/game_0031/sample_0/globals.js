// globals.js - Global state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const MODES = {
  SEARCH: "SEARCH",
  ANAGRAM: "ANAGRAM"
};

// Letter point values (Scrabble-style)
export const LETTER_SCORES = {
  'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4,
  'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3,
  'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8,
  'Y': 4, 'Z': 10, '?': 0, '*': 0
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  
  // Game-specific state
  currentMode: MODES.SEARCH,
  inputText: "",
  searchResults: [],
  selectedResultIndex: 0,
  score: 0,
  totalWordsFound: 0,
  bookmarkedWords: [],
  
  // Win condition
  targetScore: 500,
  
  // UI state
  cursorBlink: true,
  blinkTimer: 0,
  
  // Input history for testing
  lastInputTime: 0,
  inputHistory: []
};

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function getGameState() {
  return gameState;
}