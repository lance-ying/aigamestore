// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = 0.6;
export const GROUND_Y = 360;

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
  projectiles: [],
  pickups: [],
  particles: [],
  score: 0,
  enemiesDefeated: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  boss: null,
  bossDefeated: false,
  levelProgress: 0,
  cameraX: 0,
  worldWidth: 2400
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;