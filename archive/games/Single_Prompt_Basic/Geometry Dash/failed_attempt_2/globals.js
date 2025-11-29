// Game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GROUND_HEIGHT = 40;
export const GRAVITY = 0.8;
export const JUMP_FORCE = -12;
export const SCROLL_SPEED_INITIAL = 5;
export const SCROLL_SPEED_INCREMENT = 0.001;
export const CUBE_SIZE = 30;
export const SPIKE_WIDTH = 30;
export const SPIKE_HEIGHT = 30;
export const PLATFORM_HEIGHT = 20;
export const CHECKPOINT_SIZE = 40;
export const CHECKPOINT_INTERVAL = 1000; // Distance between checkpoints

// Game state object
export const gameState = {
  player: null,
  entities: [],
  obstacles: [],
  checkpoints: [],
  score: 0,
  distance: 0,
  scrollSpeed: SCROLL_SPEED_INITIAL,
  gamePhase: "START",
  controlMode: "HUMAN",
  level: null,
  currentCheckpoint: 0,
  deathCount: 0,
  levelLength: 10000, // Total level length in pixels
  jumpCount: 0,
  lastJumpFrame: 0,
  lastGroundedFrame: 0,
  inputBuffer: []
};

// Get game state function (exposed globally)
export function getGameState() {
  return gameState;
}

// Keyboard key codes
export const KEYS = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32,
  SHIFT: 16,
  Z: 90,
  ENTER: 13,
  ESC: 27,
  R: 82
};

// Colors
export const COLORS = {
  BACKGROUND: [20, 20, 30],
  GROUND: [50, 50, 60],
  PLAYER: [0, 200, 255],
  PLAYER_TRAIL: [0, 150, 200, 100],
  OBSTACLE: [255, 50, 50],
  PLATFORM: [100, 200, 100],
  CHECKPOINT: [255, 215, 0],
  TEXT_PRIMARY: [255, 255, 255],
  TEXT_SECONDARY: [200, 200, 200],
  GRID: [40, 40, 50, 100]
};