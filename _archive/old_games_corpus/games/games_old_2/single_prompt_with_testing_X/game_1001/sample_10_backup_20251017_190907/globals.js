// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 20;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const REALMS = {
  LIGHT: "LIGHT",
  DARK: "DARK"
};

export const ITEMS = {
  SMALL_KEY: "SMALL_KEY",
  BIG_KEY: "BIG_KEY",
  DASH_BOOTS: "DASH_BOOTS",
  HOOKSHOT: "HOOKSHOT",
  HAMMER: "HAMMER",
  POWER_GLOVE: "POWER_GLOVE",
  BOW: "BOW",
  BOMB: "BOMB",
  BOOMERANG: "BOOMERANG",
  REALM_MIRROR: "REALM_MIRROR"
};

export const gameState = {
  player: null,
  entities: [],
  projectiles: [],
  particles: [],
  currentRealm: REALMS.LIGHT,
  currentRoom: { x: 0, y: 0 },
  roomData: {},
  score: 0,
  dungeonTreasures: 0,
  smallKeys: 0,
  hasBigKey: false,
  inventory: [],
  equippedItem: null,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  frameCount: 0,
  bossesDefeated: 0
};

export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}