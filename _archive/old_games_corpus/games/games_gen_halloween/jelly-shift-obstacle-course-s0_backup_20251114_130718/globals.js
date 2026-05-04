// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const JELLY_HEIGHTS = {
  TALL: 80,
  MEDIUM: 50,
  FLAT: 25
};

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
  obstacles: [],
  diamonds: [],
  score: 0,
  level: 1,
  diamondCount: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  engine: null,
  world: null,
  
  // Game mechanics
  jellyFeverActive: false,
  jellyFeverTimer: 0,
  consecutivePasses: 0,
  baseSpeed: 3,
  currentSpeed: 3,
  
  // Obstacle spawning
  obstacleTimer: 0,
  obstacleInterval: 120, // frames between obstacles
  distanceTraveled: 0,
  
  // Camera/scrolling
  cameraX: 0,
  
  // Ground
  ground: null,
  
  // Input tracking
  keys: {
    up: false,
    down: false
  },
  
  // Automation
  nextAutomationAction: 0
};

// Expose globally
export function getGameState() {
  return gameState;
}
window.getGameState = getGameState;