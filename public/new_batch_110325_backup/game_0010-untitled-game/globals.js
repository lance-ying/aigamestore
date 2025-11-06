// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const PLAY_PHASES = {
  INVESTIGATION: "INVESTIGATION",
  TRIAL: "TRIAL"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  playPhase: PLAY_PHASES.INVESTIGATION,
  currentLocation: 0,
  evidence: [],
  maxEvidence: 8,
  currentChapter: 1,
  mistakes: 0,
  maxMistakes: 3,
  trialStatements: [],
  currentStatement: 0,
  selectedEvidence: null,
  cursorPosition: 0,
  locations: [],
  interactables: [],
  trialActive: false,
  statementTimer: 0,
  statementTimeLimit: 300, // 5 seconds at 60fps
  canQuickTravel: true,
  transitionAlpha: 0,
  transitionTarget: null,
  framesSinceAction: 0
};

// Expose game state globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}