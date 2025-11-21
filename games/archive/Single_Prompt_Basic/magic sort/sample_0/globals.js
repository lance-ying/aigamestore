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

export const COLORS = {
  RED: [255, 50, 50],
  GREEN: [50, 255, 50],
  BLUE: [50, 150, 255],
  YELLOW: [255, 255, 50],
  PURPLE: [180, 50, 255],
  ORANGE: [255, 150, 50]
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  player: null,
  entities: [],
  bottles: [],
  selectedSourceBottleIndex: null,
  highlightedBottleIndex: 0,
  moveHistory: [],
  currentLevel: 1,
  totalScore: 0,
  levelMovesMade: 0,
  levelStartTime: 0,
  undoUsesLeft: 3,
  shuffleUsesLeft: 3,
  pouringAnimation: null,
  maxLevels: 5
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}