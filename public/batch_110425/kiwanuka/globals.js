// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null, // The staff that guides citizens
  citizens: [],
  entities: [],
  selectedCitizen: null,
  tower: null,
  bridges: [],
  currentLevel: 0,
  score: 0,
  totalCitizens: 0,
  citizensReachedExit: 0,
  exitPortal: null,
  platforms: [],
  frameCount: 0,
  keys: {
    left: false,
    right: false,
    up: false,
    down: false,
    z: false,
    space: false,
    shift: false
  },
  // For automated testing
  testStateHistory: [],
  testStartFrame: 0
};

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}