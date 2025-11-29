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

// Game constants
export const ROOM_WIDTH = 800;
export const ROOM_HEIGHT = 600;
export const MAX_ACTS = 3;
export const ROOMS_PER_ACT = 3;

// Enemy types
export const ENEMY_NORMAL = "NORMAL";
export const ENEMY_ELITE = "ELITE";
export const ENEMY_BOSS = "BOSS";

// Weapon types
export const WEAPON_PISTOL = "PISTOL";
export const WEAPON_RIFLE = "RIFLE";
export const WEAPON_SHOTGUN = "SHOTGUN";
export const WEAPON_ELEMENTAL = "ELEMENTAL";

// Global game state
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Player
  player: null,
  
  // Entities
  entities: [],
  enemies: [],
  projectiles: [],
  items: [],
  effects: [],
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  
  // Game progression
  currentAct: 1,
  currentRoom: 0,
  roomsCleared: 0,
  
  // Room state
  roomEnemies: [],
  roomCleared: false,
  roomType: "normal",
  
  // Stats
  score: 0,
  gold: 0,
  enemiesKilled: 0,
  
  // Meta progression (persistent across runs)
  totalGoldEarned: 0,
  permanentUpgrades: {
    maxHealthBonus: 0,
    damageBonus: 0,
    speedBonus: 0
  },
  
  // Input tracking
  keys: {},
  lastInputTime: 0,
  
  // Timing
  frameCount: 0,
  lastSkillUse: 0,
  
  // Position history for testing
  positionHistory: []
};

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}