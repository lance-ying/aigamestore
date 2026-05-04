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

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2"
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  hintCoins: [],
  puzzleHotspots: [],
  score: 0,
  totalHintCoins: 0,
  collectedCoins: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  currentArea: 0,
  totalAreas: 3,
  puzzlesSolved: 0,
  totalPuzzles: 6,
  inPuzzleMode: false,
  currentPuzzle: null,
  puzzleAttempts: 0,
  frameCount: 0,
  lastInteraction: 0,
  storyProgress: 0,
  playerPositionHistory: [],
  puzzleInput: "",
  showingHint: false,
  currentHintLevel: 0,
  cameraPanX: 0,
  interactionCooldown: 0
};

// Expose getGameState globally
window.getGameState = function() {
  return gameState;
};

export function getGameState() {
  return gameState;
}