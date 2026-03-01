// globals.js - Global constants and game state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Key codes
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;

// Game constants
export const GRAVITY = 0.6;
export const GROUND_Y = 350;
export const PLATFORM_HEIGHT = 15;

// Difficulty scaling
export const BASE_DIFFICULTY = 1.0;
export const DIFFICULTY_INCREASE_RATE = 0.001; // Per frame
export const ENEMY_SPAWN_RATE = 180; // Frames between spawns
export const ITEM_SPAWN_RATE = 300; // Frames between item spawns

// Color palette
export const COLORS = {
  background: [15, 15, 25],
  platform: [60, 60, 80],
  player: [100, 255, 150],
  enemy: [255, 80, 80],
  boss: [255, 50, 100],
  projectile: [255, 255, 100],
  item: [150, 100, 255],
  teleporter: [50, 200, 255],
  health: [50, 255, 100],
  healthBg: [80, 30, 30],
  ui: [200, 200, 220]
};

// Item types and their effects
export const ITEM_TYPES = {
  DAMAGE: { name: 'Damage Up', color: [255, 100, 100], stackable: true },
  SPEED: { name: 'Speed Up', color: [100, 255, 100], stackable: true },
  HEALTH: { name: 'Max Health', color: [100, 100, 255], stackable: true },
  FIRE_RATE: { name: 'Fire Rate', color: [255, 255, 100], stackable: true },
  CRIT: { name: 'Critical Hit', color: [255, 150, 255], stackable: true },
  JUMP: { name: 'Jump Boost', color: [150, 255, 255], stackable: true }
};

// Global game state
export const gameState = {
  // Core game state
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Entities
  player: null,
  entities: [],
  enemies: [],
  projectiles: [],
  particles: [],
  platforms: [],
  items: [],
  
  // Teleporter
  teleporter: null,
  teleporterActivated: false,
  boss: null,
  
  // Game progression
  score: 0,
  difficulty: BASE_DIFFICULTY,
  gameTime: 0, // In frames
  enemySpawnTimer: 0,
  itemSpawnTimer: 0,
  
  // Physics
  gravity: GRAVITY,
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  
  // Performance
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Item inventory (count per type)
  itemCounts: {
    DAMAGE: 0,
    SPEED: 0,
    HEALTH: 0,
    FIRE_RATE: 0,
    CRIT: 0,
    JUMP: 0
  }
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Helper function to calculate stat from items
export function getStatMultiplier(itemType) {
  const count = gameState.itemCounts[itemType] || 0;
  switch(itemType) {
    case 'DAMAGE':
      return 1 + (count * 0.3); // +30% per item
    case 'SPEED':
      return 1 + (count * 0.15); // +15% per item
    case 'HEALTH':
      return 1 + (count * 0.25); // +25% per item
    case 'FIRE_RATE':
      return 1 + (count * 0.2); // +20% per item
    case 'CRIT':
      return Math.min(0.05 * count, 0.5); // +5% crit chance per item, max 50%
    case 'JUMP':
      return 1 + (count * 0.15); // +15% per item
    default:
      return 1;
  }
}