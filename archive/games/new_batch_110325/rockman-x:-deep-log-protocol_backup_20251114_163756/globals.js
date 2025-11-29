// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

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
  collectibles: [],
  particles: [],
  boss: null,
  score: 0,
  stage: 1,
  enemiesDefeated: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  camera: { x: 0, y: 0 },
  stageWidth: 2400,
  bossSpawned: false,
  bossDefeated: false
};

// Make getGameState available globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;