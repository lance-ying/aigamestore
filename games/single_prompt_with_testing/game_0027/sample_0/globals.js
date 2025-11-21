// globals.js - Game constants and state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_R = 82;

// Game balance constants
export const GAME_DURATION = 1200; // 20 minutes in seconds (for testing, using shorter duration)
export const PLAYER_START_HEALTH = 100;
export const PLAYER_START_SPEED = 2.5;
export const PLAYER_START_DAMAGE = 10;
export const PLAYER_START_FIRE_RATE = 30; // frames between shots
export const PLAYER_DASH_SPEED = 8;
export const PLAYER_DASH_DURATION = 10; // frames
export const PLAYER_DASH_COOLDOWN = 120; // frames
export const PLAYER_INVULN_FRAMES = 10;

export const BULLET_SPEED = 5;
export const BULLET_SIZE = 4;
export const BULLET_RANGE = 300;

export const XP_GEM_VALUE = 10;
export const XP_GEM_ATTRACT_RANGE = 100;
export const XP_GEM_SPEED = 3;
export const XP_TO_LEVEL = 100;
export const XP_SCALING = 1.15; // XP needed increases by 15% per level

// Enemy constants
export const ENEMY_SPAWN_INTERVAL = 60; // frames
export const ENEMY_BASE_SPEED = 1;
export const ENEMY_BASE_HEALTH = 30;
export const ENEMY_BASE_DAMAGE = 10;
export const ENEMY_SIZE = 15;

// Game state
export const gameState = {
  player: null,
  entities: [],
  bullets: [],
  enemies: [],
  xpGems: [],
  upgrades: [],
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  score: 0,
  level: 1,
  xp: 0,
  xpToNextLevel: XP_TO_LEVEL,
  gameTime: 0,
  spawnTimer: 0,
  enemiesKilled: 0,
  showUpgradeScreen: false,
  availableUpgrades: [],
  lastInputs: {},
  positionHistory: []
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}

export function resetGameState() {
  gameState.player = null;
  gameState.entities = [];
  gameState.bullets = [];
  gameState.enemies = [];
  gameState.xpGems = [];
  gameState.upgrades = [];
  gameState.score = 0;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.xpToNextLevel = XP_TO_LEVEL;
  gameState.gameTime = 0;
  gameState.spawnTimer = 0;
  gameState.enemiesKilled = 0;
  gameState.showUpgradeScreen = false;
  gameState.availableUpgrades = [];
  gameState.lastInputs = {};
  gameState.positionHistory = [];
}