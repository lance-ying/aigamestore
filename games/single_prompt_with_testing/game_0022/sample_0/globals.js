// globals.js - Game constants and shared state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = 0.5;
export const JUMP_FORCE = -10;
export const MOVE_SPEED = 4;
export const DASH_SPEED = 12;
export const DASH_DURATION = 10;
export const GROUND_POUND_FORCE = 15;

export const gameState = {
  player: null,
  entities: [],
  platforms: [],
  orbs: [],
  particles: [],
  score: 0,
  gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN
  controlMode: "HUMAN",
  abilities: {
    doubleJump: false,
    groundPound: false,
    dash: false
  },
  worldSaturation: 0, // 0-1, increases with abilities
  cameraY: 0,
  goalReached: false
};

// Make gameState accessible globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function getGameState() {
  return gameState;
}