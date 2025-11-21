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
export const PHASE_WAVE_COMPLETE = "WAVE_COMPLETE";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_R = 82;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  zombirds: [],
  bolts: [],
  pumpkins: [],
  particles: [],
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Game progression
  wave: 0,
  score: 0,
  coins: 0,
  zombirdsKilled: 0,
  
  // Player stats
  fireRate: 15, // frames between shots
  boltDamage: 1,
  lastShotFrame: -100,
  aimDirection: 0, // 0=up, 1=right, 2=down, 3=left
  
  // Upgrades
  upgrades: {
    fireRateLevel: 0,
    damageLevel: 0,
    multiShotUnlocked: false,
    shieldUnlocked: false
  },
  
  // Power-ups
  multiShotCooldown: 0,
  multiShotDuration: 0,
  shieldCooldown: 0,
  shieldDuration: 0,
  
  // Wave management
  waveZombirdCount: 0,
  waveZombirdSpawned: 0,
  nextSpawnFrame: 0,
  
  // Testing
  positionHistory: []
};

// Upgrade costs and effects
export const UPGRADES = {
  fireRate: [
    { cost: 10, fireRate: 12 },
    { cost: 20, fireRate: 10 },
    { cost: 30, fireRate: 8 }
  ],
  damage: [
    { cost: 15, damage: 2 },
    { cost: 25, damage: 3 },
    { cost: 40, damage: 4 }
  ],
  multiShot: { cost: 50 },
  shield: { cost: 50 }
};

// Zombird types
export const ZOMBIRD_TYPES = {
  BASIC: { health: 1, speed: 1, color: [100, 200, 100], coins: 1, size: 20 },
  FAST: { health: 1, speed: 1.8, color: [200, 200, 100], coins: 2, size: 18 },
  TANK: { health: 3, speed: 0.7, color: [200, 100, 100], coins: 3, size: 25 },
  ELITE: { health: 4, speed: 1.2, color: [150, 100, 200], coins: 5, size: 22 }
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}