// globals.js - Global game state and constants

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
  rooms: [],
  interactables: [],
  memoryFragments: [],
  currentRoom: 0,
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  inventory: [],
  collectedFragments: 0,
  totalFragments: 5,
  doorUnlocked: false,
  shadowEntityActive: false,
  shadowEntity: null,
  frameCount: 0,
  endingType: null, // "TRANSCENDENCE", "ESCAPE", "LOST"
  puzzlesSolved: 0,
  secretsFound: 0
};

// Export getter for global access
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}