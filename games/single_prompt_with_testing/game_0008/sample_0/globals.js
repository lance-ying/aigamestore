// globals.js - Global constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = 0.6;
export const JUMP_FORCE = -12;
export const PLAYER_SPEED = 4;
export const DASH_SPEED = 12;
export const DASH_DURATION = 10;

export const gameState = {
  player: null,
  entities: [],
  platforms: [],
  enemies: [],
  projectiles: [],
  particles: [],
  pickups: [],
  score: 0,
  highestY: CANVAS_HEIGHT - 50,
  gamePhase: "START",
  controlMode: "HUMAN",
  dashUnlocked: false,
  gameTime: 0,
  cameraY: 0
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;