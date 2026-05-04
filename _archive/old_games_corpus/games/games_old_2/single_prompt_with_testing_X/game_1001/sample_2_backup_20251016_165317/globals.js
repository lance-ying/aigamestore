// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRID_SIZE = 6; // 6x6 grid
export const DOT_SIZE = 40;
export const DOT_RADIUS = 16;
export const GRID_OFFSET_X = 150;
export const GRID_OFFSET_Y = 50;

export const DOT_COLORS = [
  [255, 87, 87],   // Red
  [87, 171, 255],  // Blue
  [255, 223, 87],  // Yellow
  [87, 255, 135],  // Green
  [218, 112, 214]  // Purple
];

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  moves: 0,
  maxMoves: 20,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN",
  engine: null,
  world: null,
  grid: [],
  selectedDots: [],
  currentPath: [],
  level: 1,
  targetScore: 500,
  dotsCleared: {},
  animatingDots: [],
  fallingDots: [],
  particleEffects: [],
  lastMousePos: { x: 0, y: 0 },
  isConnecting: false,
  squareDetected: false
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}