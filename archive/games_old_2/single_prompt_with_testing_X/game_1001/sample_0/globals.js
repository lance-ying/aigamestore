// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Container dimensions
export const CONTAINER_WIDTH = 400;
export const CONTAINER_HEIGHT = 320;
export const CONTAINER_X = CANVAS_WIDTH / 2;
export const CONTAINER_Y = CANVAS_HEIGHT - CONTAINER_HEIGHT / 2 - 20;
export const WALL_THICKNESS = 10;

// Danger line (game over if fruit crosses this)
export const DANGER_LINE_Y = CONTAINER_Y - CONTAINER_HEIGHT / 2 + 60;

// Fruit types and properties
export const FRUIT_TYPES = [
  { name: 'cherry', size: 15, color: [255, 50, 50], points: 10 },
  { name: 'strawberry', size: 20, color: [255, 100, 100], points: 20 },
  { name: 'grape', size: 25, color: [150, 50, 200], points: 40 },
  { name: 'orange', size: 30, color: [255, 165, 0], points: 80 },
  { name: 'apple', size: 35, color: [255, 50, 50], points: 160 },
  { name: 'pear', size: 40, color: [200, 255, 100], points: 320 },
  { name: 'peach', size: 45, color: [255, 200, 150], points: 640 },
  { name: 'pineapple', size: 50, color: [255, 215, 0], points: 1280 },
  { name: 'melon', size: 55, color: [100, 255, 100], points: 2560 },
  { name: 'watermelon', size: 65, color: [50, 200, 50], points: 5120 }
];

export const gameState = {
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  engine: null,
  world: null,
  player: null,
  entities: [],
  fruits: [],
  score: 0,
  currentFruit: null,
  nextFruitType: 0,
  previewX: CONTAINER_X,
  canDrop: true,
  dropCooldown: 0,
  testState: {
    phase: 0,
    timer: 0,
    dropSequence: []
  }
};

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}