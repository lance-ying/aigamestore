// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  ROUND_END: "ROUND_END",
  UPGRADE_SELECT: "UPGRADE_SELECT",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE",
  PAUSED: "PAUSED"
};

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2",
  TEST_3: "TEST_3"
};

// Game state object
export const gameState = {
  player: null,
  enemy: null,
  entities: [],
  projectiles: [],
  particles: [],
  score: 0,
  playerRoundWins: 0,
  enemyRoundWins: 0,
  roundNumber: 1,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  upgradeOptions: [],
  selectedUpgrade: null,
  roundEndTimer: 0,
  roundWinner: null,
  camera: { x: 0, y: 0 }
};

// Key codes
export const KEY_CODES = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32,
  SHIFT: 16,
  Z: 90,
  ENTER: 13,
  ESC: 27,
  R: 82
};

// Player stats
export const PLAYER_DEFAULTS = {
  maxHealth: 100,
  moveSpeed: 3,
  projectileSpeed: 6,
  projectileDamage: 10,
  fireRate: 15, // frames between shots
  shieldDuration: 60, // frames
  shieldCooldown: 180, // frames
  dashSpeed: 12,
  dashDuration: 10,
  dashCooldown: 120
};

export const ARENA_CONFIG = {
  width: 560,
  height: 360,
  marginX: 20,
  marginY: 20
};

export const WINS_TO_WIN = 3;