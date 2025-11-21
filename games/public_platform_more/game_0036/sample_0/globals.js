// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GROUND_Y = 320;
export const GRAVITY = 0.4;
export const MAX_ZOMBIES = 15;
export const CHECKPOINT_DISTANCE = 3000;

export const gameState = {
  player: null,
  entities: [],
  zombies: [],
  terrain: [],
  particles: [],
  score: 0,
  distance: 0,
  maxDistance: 0,
  cash: 0,
  totalCash: 0,
  zombiesKilled: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  fuel: 100,
  maxFuel: 100,
  nitro: 100,
  maxNitro: 100,
  health: 100,
  maxHealth: 100,
  upgrades: {
    engine: 0,
    fuel: 0,
    armor: 0,
    weapon: 0,
    nitro: 0
  },
  upgradeShopOpen: false,
  cameraX: 0,
  keys: {},
  lastNitroUse: 0,
  runStarted: false,
  checkpointsReached: []
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;