// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// Container dimensions
export const CONTAINER_WIDTH = 300;
export const CONTAINER_HEIGHT = 320;
export const CONTAINER_X = (CANVAS_WIDTH - CONTAINER_WIDTH) / 2;
export const CONTAINER_Y = CANVAS_HEIGHT - CONTAINER_HEIGHT - 10;
export const DANGER_LINE_Y = CONTAINER_Y + 40;

// Fruit progression system
export const FRUIT_TYPES = [
  { name: "cherry", radius: 12, color: [220, 20, 60], points: 1 },
  { name: "strawberry", radius: 16, color: [255, 105, 180], points: 3 },
  { name: "grape", radius: 18, color: [147, 112, 219], points: 6 },
  { name: "orange", radius: 22, color: [255, 140, 0], points: 10 },
  { name: "apple", radius: 26, color: [255, 0, 0], points: 15 },
  { name: "pear", radius: 28, color: [173, 255, 47], points: 21 },
  { name: "peach", radius: 32, color: [255, 218, 185], points: 28 },
  { name: "pineapple", radius: 36, color: [255, 215, 0], points: 36 },
  { name: "melon", radius: 42, color: [50, 205, 50], points: 45 },
  { name: "watermelon", radius: 50, color: [0, 100, 0], points: 100 }
];

// Physics constants
export const GRAVITY = 0.4;
export const FRICTION = 0.98;
export const BOUNCE = 0.3;
export const MERGE_DELAY = 15; // frames to wait before checking merges

// Game state
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  highScore: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN",
  previewFruit: null,
  previewX: CANVAS_WIDTH / 2,
  canDrop: true,
  dropCooldown: 0,
  framesSinceLastDrop: 0,
  mergeQueue: [],
  nextFruitType: 0,
  watermelonCreated: false,
  fruitsSettled: true
};

// Expose gameState globally
window.getGameState = () => gameState;