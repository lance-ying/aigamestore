// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

export const TILE_SIZE = 40;
export const PLAYER_SIZE = 16;
export const ENEMY_SIZE = 16;
export const MELEE_RANGE = 25;
export const SHOOT_RANGE = 300;
export const BULLET_SPEED = 12;

export const PLAYER_SPEED = 2.5;
export const PLAYER_SPRINT_SPEED = 4.5;
export const ENEMY_SPEED = 1.5;
export const ENEMY_ALERT_SPEED = 2.5;
export const ENEMY_VISION_RANGE = 120;
export const ENEMY_ALERT_RANGE = 150;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  bullets: [],
  walls: [],
  doors: [],
  currentFloor: 0,
  totalFloors: 3,
  score: 0,
  kills: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  levelLayouts: [],
  camera: { x: 0, y: 0 },
  roomsCleared: 0
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;