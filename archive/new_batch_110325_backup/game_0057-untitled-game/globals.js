// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Game-specific state
  currentLocation: 0,
  locations: [],
  clues: [],
  collectedClues: [],
  suspects: [],
  interrogatedSuspects: [],
  puzzles: [],
  solvedPuzzles: [],
  dialogueState: null,
  showCaseFile: false,
  selectedHotspot: null,
  puzzleActive: null,
  finalDeductionMade: false,
  
  // Win conditions tracking
  totalClues: 0,
  totalSuspects: 0,
  totalPuzzles: 0,
  requiredCluesCollected: 0,
  requiredSuspectsInterrogated: 0,
  requiredPuzzlesSolved: 0
};

// Make gameState accessible globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function getGameState() {
  return gameState;
}