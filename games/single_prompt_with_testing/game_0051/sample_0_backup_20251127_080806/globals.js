// globals.js - Constants and global game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  projectiles: [],
  particles: [],
  powerUps: [],
  bodyParts: [], // Severed body parts
  
  score: 0,
  wave: 0,
  enemiesDefeated: 0,
  
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  
  // Physics
  gravity: 0.3,
  friction: 0.85,
  
  // Game timing
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Wave management
  waveTimer: 0,
  waveDelay: 180, // 3 seconds at 60fps
  enemiesInWave: 0,
  enemiesSpawned: 0,
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  cameraShake: 0,
  
  // Arena bounds
  arenaLeft: 50,
  arenaRight: 550,
  arenaTop: 50,
  arenaBottom: 350,
  
  // Input state
  keys: {},
  
  // Game stats
  totalDamageDealt: 0,
  totalDamageTaken: 0,
  partsLost: 0,
  powerUpsCollected: 0
};

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

// Color palette
export const COLORS = {
  background: [15, 15, 25],
  arena: [30, 30, 45],
  arenaWall: [50, 50, 70],
  player: [80, 180, 255],
  playerCore: [100, 200, 255],
  enemy: [255, 80, 80],
  enemyCore: [255, 100, 100],
  sword: [0, 255, 255],
  swordGlow: [150, 255, 255],
  healthGreen: [0, 255, 100],
  healthRed: [255, 50, 50],
  powerUp: [255, 220, 0],
  particle: [200, 200, 255],
  metal: [150, 150, 180]
};

// Body part types
export const PART_TYPES = {
  CORE: 'core',
  HEAD: 'head',
  TORSO: 'torso',
  LEFT_ARM: 'left_arm',
  RIGHT_ARM: 'right_arm',
  LEFT_LEG: 'left_leg',
  RIGHT_LEG: 'right_leg'
};

// Power-up types
export const POWERUP_TYPES = {
  HEALTH: 'health',
  DAMAGE: 'damage',
  SPEED: 'speed',
  ARMOR: 'armor'
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;