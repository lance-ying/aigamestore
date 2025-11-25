// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Game timing (60 FPS)
export const DAWN_TIME = 60 * 60 * 5; // 5 minutes in frames

// Player constants
export const PLAYER_SIZE = 20;
export const PLAYER_SPEED = 2.5;
export const PLAYER_MAX_HEALTH = 100;

// Enemy constants
export const ENEMY_BASE_SIZE = 15;
export const ENEMY_BASE_SPEED = 1.2;
export const ENEMY_BASE_DAMAGE = 10;
export const ENEMY_BASE_HEALTH = 20;
export const ENEMY_SPAWN_RATE = 60; // frames between spawns
export const MAX_ENEMIES = 150;

// Weapon constants
export const WEAPON_BASE_DAMAGE = 10;
export const WEAPON_BASE_RANGE = 80;
export const WEAPON_BASE_COOLDOWN = 60; // frames

// Experience and leveling
export const XP_GEM_VALUE = 1;
export const XP_TO_LEVEL_BASE = 5;
export const XP_TO_LEVEL_SCALING = 2;

// Gold and upgrades
export const GOLD_COIN_VALUE = 1;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  projectiles: [],
  pickups: [],
  particles: [],
  score: 0,
  gold: 0,
  persistentGold: 0, // Gold that carries between runs
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  elapsedTime: 0,
  enemySpawnTimer: 0,
  camera: { x: 0, y: 0 },
  levelUpPending: false,
  upgradeChoices: [],
  difficultyMultiplier: 1.0,
  enemiesKilled: 0,
};

// Export function to expose game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}