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

export const DELIVERY_TYPES = {
  FAST: "FAST",
  SPINNER: "SPINNER",
  YORKER: "YORKER",
  BOUNCER: "BOUNCER"
};

export const SHOT_TYPES = {
  FRONT_FOOT: "FRONT_FOOT",
  BACK_FOOT: "BACK_FOOT",
  OFF_SIDE: "OFF_SIDE",
  ON_SIDE: "ON_SIDE",
  DEFENSIVE: "DEFENSIVE",
  POWER: "POWER",
  LATE_CUT: "LATE_CUT"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  engine: null,
  world: null,
  player: null,
  entities: [],
  ball: null,
  bowler: null,
  
  // Game stats
  score: 0,
  wickets: 10,
  ballsPlayed: 0,
  currentDelivery: null,
  
  // Batting mechanics
  shotPrepared: false,
  shotType: null,
  shotTiming: 0,
  isPowerShot: false,
  
  // Ball state
  ballInPlay: false,
  ballDelivered: false,
  deliverySpeed: 0,
  deliveryType: null,
  
  // Timing windows
  perfectTimingWindow: 0.15,
  goodTimingWindow: 0.3,
  
  // Field zones
  fieldZones: [],
  
  // Animation states
  batsmanAnimation: "idle",
  animationFrame: 0,
  
  // Test automation
  testSequence: [],
  testIndex: 0,
  testDelay: 0,
  
  // Career mode
  level: 1,
  targetScore: 50,
  
  // Visual effects
  particles: []
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}