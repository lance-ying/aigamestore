// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = 0.6;
export const JUMP_STRENGTH = -12;
export const MOVE_SPEED = 5;
export const DASH_SPEED = 12;
export const DASH_DURATION = 15;
export const GROUND_POUND_SPEED = 15;

export const gameState = {
  player: null,
  entities: [],
  platforms: [],
  pizzas: [],
  destructibleBlocks: [],
  score: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  frameCount: 0,
  exitReached: false,
  cameraY: 0,
  timeElapsed: 0
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;