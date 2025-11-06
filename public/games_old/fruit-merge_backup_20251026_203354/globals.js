// globals.js - Global constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const CONTAINER_WIDTH = 300;
export const CONTAINER_HEIGHT = 350;
export const CONTAINER_X = CANVAS_WIDTH / 2;
export const CONTAINER_Y = CANVAS_HEIGHT - CONTAINER_HEIGHT / 2 - 10;
export const CONTAINER_WALL_THICKNESS = 10;

export const DANGER_LINE_Y = CONTAINER_Y - CONTAINER_HEIGHT / 2 + 60;
export const DANGER_LINE_GRACE_FRAMES = 120; // 2 seconds at 60fps

// Fruit types with sizes and colors
export const FRUIT_TYPES = [
  { name: 'cherry', radius: 15, color: '#ff0000', score: 1 },
  { name: 'strawberry', radius: 20, color: '#ff1744', score: 3 },
  { name: 'grape', radius: 25, color: '#9c27b0', score: 6 },
  { name: 'orange', radius: 30, color: '#ff9800', score: 10 },
  { name: 'apple', radius: 35, color: '#f44336', score: 15 },
  { name: 'pear', radius: 40, color: '#cddc39', score: 21 },
  { name: 'peach', radius: 45, color: '#ffb74d', score: 28 },
  { name: 'pineapple', radius: 50, color: '#ffd54f', score: 36 },
  { name: 'melon', radius: 55, color: '#4caf50', score: 45 },
  { name: 'watermelon', radius: 60, color: '#1b5e20', score: 55 }
];

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  highScore: 0,
  gamePhase: "START",
  engine: null,
  world: null,
  canvas: null,
  ctx: null,
  currentFruit: null,
  nextFruitType: 0,
  dropX: CANVAS_WIDTH / 2,
  isDropping: false,
  frameCount: 0,
  dangerFrameCount: 0,
  container: null,
  walls: [],
  mergeQueue: []
};

export const logs = {
  game_info: [],
  player_info: [],
  inputs: []
};

window.logs = logs;

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;