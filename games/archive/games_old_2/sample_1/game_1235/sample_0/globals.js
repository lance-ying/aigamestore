// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

export const BUBBLE_RADIUS = 15;
export const BUBBLE_COLORS = [
  [255, 100, 100], // Red
  [100, 150, 255], // Blue
  [100, 255, 150], // Green
  [255, 200, 100], // Yellow
  [255, 100, 255], // Magenta
];

export const GAME_TIME_LIMIT = 90; // 90 seconds per match

export const gameState = {
  player: null,
  entities: [],
  bubbleGrid: [],
  currentBubble: null,
  nextBubble: null,
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN",
  aimAngle: -Math.PI / 2,
  laserGuideVisible: true,
  timeRemaining: GAME_TIME_LIMIT,
  lastFrameTime: 0,
  opponents: [],
  playerRank: 0,
  matchStarted: false,
  gridOffsetY: 60,
  shooterY: CANVAS_HEIGHT - 50,
  currentLevel: 1,
  bubblesCleared: 0,
  combo: 0,
};

// Make gameState accessible globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}