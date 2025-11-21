// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const BUBBLE_RADIUS = 15;
export const GRID_COLS = 12;
export const GRID_ROWS = 10;
export const GRID_OFFSET_X = 50;
export const GRID_OFFSET_Y = 30;

export const LAUNCHER_Y = CANVAS_HEIGHT - 40;
export const LAUNCHER_X = CANVAS_WIDTH / 2;

export const DANGER_LINE_Y = CANVAS_HEIGHT - 80;

export const BUBBLE_COLORS = [
  [255, 50, 50],   // Red
  [50, 150, 255],  // Blue
  [50, 255, 50],   // Green
  [255, 220, 50],  // Yellow
  [200, 50, 255]   // Purple
];

export const ROCK_COLOR = [100, 100, 100]; // Grey rock bubbles

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  currentLevel: 1,
  shotsRemaining: 0,
  maxShots: 0,
  bubbleGrid: [],
  activeBubbles: [],
  launcherAngle: -Math.PI / 2,
  currentBubbleColor: null,
  nextBubbleColor: null,
  bombPowerups: 0,
  beamPowerups: 0,
  bubblesPopped: 0,
  consecutiveCombos: 0,
  levelScore: 0,
  starsEarned: 0,
  fallingBubbles: [],
  descending: false,
  descentCounter: 0,
  gridOffsetY: GRID_OFFSET_Y
};

export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}