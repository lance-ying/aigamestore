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
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null, // slingshot anchor point
  entities: [], // all physics bodies
  birds: [], // available birds for current level
  currentBirdIndex: 0,
  slingshotBird: null, // bird currently in slingshot
  birdInFlight: null, // bird that was launched
  abilityUsed: false,
  pigs: [],
  blocks: [],
  score: 0,
  highScore: 0,
  currentLevel: 1,
  totalLevels: 5,
  slingshotPullAngle: 0, // radians
  slingshotPullDistance: 0,
  maxPullDistance: 120,
  slingshotAiming: false,
  levelComplete: false,
  birdSettled: false,
  settleTimer: 0,
  framesSinceLastAction: 0,
  collisionGracePeriod: 0 // Frames to wait before processing collision damage
};

// Bird types
export const BIRD_TYPES = {
  RED: 'RED',
  YELLOW: 'YELLOW',
  BLUE: 'BLUE',
  BLACK: 'BLACK'
};

// Material types
export const MATERIAL_TYPES = {
  WOOD: 'WOOD',
  STONE: 'STONE',
  GLASS: 'GLASS'
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}