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

export const DEDUCTION_STAGES = {
  SUSPECT: "SUSPECT",
  LOCATION: "LOCATION",
  WEAPON: "WEAPON",
  COMPLETE: "COMPLETE"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Game-specific state
  currentRound: 1,
  maxRounds: 7,
  currentStage: DEDUCTION_STAGES.SUSPECT,
  
  // Cards
  visionCard: null,
  suspectCards: [],
  locationCards: [],
  weaponCards: [],
  
  // Correct answers (hidden from UI)
  correctSuspect: 0,
  correctLocation: 0,
  correctWeapon: 0,
  
  // Player selections
  selectedSuspect: null,
  selectedLocation: null,
  selectedWeapon: null,
  
  // UI state
  currentSelection: 0,
  viewingVision: false,
  
  // Progress tracking
  stagesCompleted: 0,
  correctGuesses: 0,
  incorrectGuesses: 0
};

// Expose globally
window.getGameState = () => gameState;