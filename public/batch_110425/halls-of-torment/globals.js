// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

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
  TEST_5: "TEST_5"
};

// Game balance constants
export const PLAYER_BASE_SPEED = 2.5;
export const PLAYER_BASE_HEALTH = 100;
export const PLAYER_BASE_DAMAGE = 10;
export const PLAYER_ATTACK_RANGE = 80;
export const PLAYER_ATTACK_COOLDOWN = 30; // frames

export const ENEMY_BASE_SPEED = 1.2;
export const ENEMY_BASE_HEALTH = 30;
export const ENEMY_BASE_DAMAGE = 5;
export const ENEMY_SPAWN_INTERVAL = 120; // frames
export const ENEMY_MAX_COUNT = 40;

export const BOSS_HEALTH_MULTIPLIER = 10;
export const BOSS_DAMAGE_MULTIPLIER = 2;
export const BOSS_SPAWN_INTERVAL = 3600; // 60 seconds

export const XP_ORB_VALUE = 10;
export const XP_TO_LEVEL = 100;
export const GOLD_DROP_CHANCE = 0.3;
export const ITEM_DROP_CHANCE = 0.15;

export const WIN_TIME = 300; // seconds (5 minutes)

export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  projectiles: [],
  items: [],
  particles: [],
  xpOrbs: [],
  score: 0,
  gold: 0,
  level: 1,
  xp: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  playTime: 0,
  lastBossSpawn: 0,
  bossesDefeated: 0,
  enemiesKilled: 0,
  levelUpPending: false,
  abilityChoices: [],
  selectedAbilities: [],
  inventory: [],
  waveNumber: 1
};

// Expose gameState globally
window.getGameState = () => gameState;