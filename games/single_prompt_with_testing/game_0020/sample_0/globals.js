// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = 0.6;
export const JUMP_FORCE = -12;
export const MOVE_SPEED = 3;
export const SPRINT_MULTIPLIER = 1.6;

export const gameState = {
  player: null,
  entities: [],
  obstacles: [],
  interactables: [],
  hazards: [],
  level: 1,
  maxLevel: 3,
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", "TEST_3", "TEST_4"
  keys: {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
    shift: false,
    z: false
  },
  cameraX: 0,
  levelComplete: false,
  deathReason: "",
  timeInLevel: 0
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;