// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const PLATFORM_Y = 320;
export const PLATFORM_HEIGHT = 80;

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  engine: null,
  world: null,
  currentLevel: 1,
  maxLevel: 100,
  clicksRemaining: 5,
  maxClicks: 5,
  isStable: false,
  stabilityTimer: 0,
  stabilityThreshold: 90, // frames to wait for stability
  selectedShape: null,
  mousePressed: false,
  checkingWinLose: false,
  testClickTimer: 0,
  testClickInterval: 60,
  testTargetType: null // For TEST_2: 'red', for TEST_3: 'support'
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;