// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2",
  TEST_3: "TEST_3",
  TEST_4: "TEST_4",
  TEST_5: "TEST_5",
  TEST_6: "TEST_6",
  TEST_7: "TEST_7"
};

// Game configuration
export const CONFIG = {
  PLAYER_SPEED: 4,
  PLAYER_LIVES: 3,
  PLAYER_MAX_HEALTH: 100,
  BULLET_SPEED: 8,
  CHARGE_TIME: 60, // frames to fully charge
  FORCE_POD_SPEED: 6,
  ENEMY_SPAWN_RATE: 120, // frames between spawns
  POWERUP_CHANCE: 0.3,
  LEVELS_TO_WIN: 3,
  ENEMIES_PER_WAVE: 5,
  WAVES_PER_LEVEL: 3,
  BOSS_HEALTH: 200
};

export const POWERUP_TYPES = {
  WEAPON: 'WEAPON',
  MISSILE: 'MISSILE',
  SPEED: 'SPEED',
  SHIELD: 'SHIELD'
};

export const gameState = {
  player: null,
  forcePod: null,
  entities: [],
  bullets: [],
  enemyBullets: [],
  enemies: [],
  powerups: [],
  particles: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  engine: null,
  world: null,
  lives: CONFIG.PLAYER_LIVES,
  currentLevel: 1,
  currentWave: 0,
  enemiesKilled: 0,
  boss: null,
  bossActive: false,
  lastEnemySpawn: 0,
  keys: {},
  chargeTime: 0,
  weaponLevel: 1,
  hasMissiles: false,
  speedBoost: 1,
  lastPlayerLogFrame: 0
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}