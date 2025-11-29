// globals.js - Global state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const BUBBLE_RADIUS = 20;
export const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;

export const SHOOTER_Y = CANVAS_HEIGHT - 60;
export const LOSE_LINE_Y = CANVAS_HEIGHT - 100;

export const BUBBLE_COLORS = [
  [255, 100, 100], // Red
  [100, 150, 255], // Blue
  [100, 255, 100], // Green
  [255, 255, 100], // Yellow
  [200, 100, 255], // Purple
  [255, 180, 100]  // Orange
];

export const gameState = {
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED", "LEVEL_TRANSITION"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  player: null,
  entities: [],
  score: 0,
  currentLevel: 1,
  timerRemaining: 0,
  bubbleGrid: [],
  projectileBubble: null,
  nextBubble: null,
  shooterAngle: -Math.PI / 2,
  canFire: true,
  swapAvailable: true,
  levelStartTime: 0,
  transitionTimer: 0,
  finalScore: 0,
  testActionIndex: 0,
  testActions: []
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}