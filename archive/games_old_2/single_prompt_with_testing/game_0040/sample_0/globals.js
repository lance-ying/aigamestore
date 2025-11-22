// globals.js - Global constants and state management

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
export const KEY_SHIFT = 16;
export const KEY_R = 82;
export const KEY_Z = 90;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  projectiles: [],
  effects: [],
  upgrades: {
    castleHealth: 100,
    maxCastleHealth: 100,
    projectileDamage: 10,
    volleyDamage: 8,
    bomberDamage: 30
  },
  resources: 0,
  score: 0,
  wave: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  cursor: { x: 300, y: 200 },
  bomberActive: false,
  bomberX: -50,
  bomberY: 100,
  bomberReadyToDetonate: false,
  castleX: 50,
  castleY: CANVAS_HEIGHT / 2,
  nextWaveTimer: 0,
  enemySpawnTimer: 0,
  enemiesThisWave: 0,
  enemiesSpawnedThisWave: 0,
  waveComplete: false,
  lastVolleyTime: 0,
  lastBomberTime: 0,
  volleyCooldown: 2000, // 2 seconds
  bomberCooldown: 5000, // 5 seconds
  cursorSpeed: 5
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;