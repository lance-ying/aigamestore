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

export const TRICK_TYPES = {
  OLLIE: "Ollie",
  KICKFLIP_LEFT: "Kickflip Left",
  KICKFLIP_RIGHT: "Kickflip Right",
  MANUAL: "Manual",
  GRIND: "Grind"
};

export const TRICK_SCORES = {
  [TRICK_TYPES.OLLIE]: 100,
  [TRICK_TYPES.KICKFLIP_LEFT]: 300,
  [TRICK_TYPES.KICKFLIP_RIGHT]: 300,
  [TRICK_TYPES.MANUAL]: 50, // per frame
  [TRICK_TYPES.GRIND]: 75 // per frame
};

export const gameState = {
  player: null,
  entities: [],
  obstacles: [],
  rails: [],
  score: 0,
  combo: 1,
  currentTrick: null,
  trickStartFrame: 0,
  comboTimer: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  engine: null,
  world: null,
  framesSinceStart: 0,
  lastLoggedPosition: { x: 0, y: 0 },
  testModeInputs: []
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}