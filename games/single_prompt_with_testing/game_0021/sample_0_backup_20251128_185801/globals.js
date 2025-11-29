// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 40;
export const GRID_WIDTH = 9;
export const GRID_HEIGHT = 7;
export const GRID_OFFSET_X = 60;
export const GRID_OFFSET_Y = 60;

export const TILE_TYPES = {
  EMPTY: 0,
  WALL: 1,
  BLOCK: 2,
  SKELETON: 3,
  SPIKE: 4,
  GOAL: 5
};

export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  currentLevel: 0,
  movesRemaining: 0,
  maxMoves: 0,
  grid: [],
  playerDir: DIRECTIONS.DOWN,
  levelComplete: false,
  demonsCollected: 0
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;