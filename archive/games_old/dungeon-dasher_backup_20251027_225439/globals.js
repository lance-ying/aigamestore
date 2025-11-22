// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 40;
export const GRID_COLS = Math.floor(CANVAS_WIDTH / GRID_SIZE);
export const GRID_ROWS = Math.floor(CANVAS_HEIGHT / GRID_SIZE);

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  UPGRADE_SELECTION: "UPGRADE_SELECTION",
  LEVEL_TRANSITION: "LEVEL_TRANSITION",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  player: null,
  entities: [],
  projectiles: [],
  enemies: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentLevel: 1,
  currentRoom: 1,
  roomsPerLevel: [3, 4, 5, 5, 3],
  upgrades: [],
  selectedUpgradeIndex: 0,
  availableUpgrades: [],
  levelTransitionTimer: 0,
  highScore: 0,
  attackCooldown: 0,
  walls: [],
  roomCleared: false,
  framesSinceLastMove: 0
};

export const ENTITY_TYPES = {
  PLAYER: "PLAYER",
  MELEE_ENEMY: "MELEE_ENEMY",
  RANGED_ENEMY: "RANGED_ENEMY",
  TANK_ENEMY: "TANK_ENEMY",
  BOSS_ENEMY: "BOSS_ENEMY"
};

export const UPGRADE_TYPES = {
  INCREASE_ATK: "INCREASE_ATK",
  INCREASE_HP: "INCREASE_HP",
  INCREASE_SPEED: "INCREASE_SPEED",
  MULTI_SHOT: "MULTI_SHOT",
  PIERCING: "PIERCING",
  FAST_PROJECTILES: "FAST_PROJECTILES",
  INCREASE_MAX_HP: "INCREASE_MAX_HP",
  HEAL: "HEAL"
};