// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const PLAY_AREA = {
  x: 50,
  y: 50,
  width: 500,
  height: 300
};

export const PLAYER_CONSTANTS = {
  baseSpeed: 3.5,
  focusSpeed: 1.5,
  baseFireRate: 8, // frames between shots
  baseDamage: 10,
  baseHealth: 100,
  maxHealth: 100,
  hitboxRadius: 3,
  visualRadius: 12
};

export const BOSS_CONSTANTS = {
  baseHealth: 500,
  healthScaling: 1.5, // multiplier per stage
  positionX: CANVAS_WIDTH / 2,
  positionY: 120
};

// Game state object
export const gameState = {
  // Core game state
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "BOSS_SELECT", "POWER_UP", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  
  // Entities
  player: null,
  currentBoss: null,
  playerProjectiles: [],
  enemyProjectiles: [],
  particles: [],
  entities: [],
  
  // Game progression
  currentStage: 1,
  maxStage: 5,
  bossesDefeated: 0,
  score: 0,
  
  // Boss selection
  availableBosses: [],
  selectedBossIndex: null,
  
  // Power-ups
  availablePowerUps: [],
  selectedPowerUpIndex: null,
  collectedPowerUps: [],
  
  // Player stats (modified by power-ups)
  playerStats: {
    speed: PLAYER_CONSTANTS.baseSpeed,
    focusSpeed: PLAYER_CONSTANTS.focusSpeed,
    fireRate: PLAYER_CONSTANTS.baseFireRate,
    damage: PLAYER_CONSTANTS.baseDamage,
    health: PLAYER_CONSTANTS.baseHealth,
    maxHealth: PLAYER_CONSTANTS.maxHealth,
    projectileSpeed: 8,
    projectileSize: 5,
    hasSpecialAbility: false,
    specialCooldown: 0,
    maxSpecialCooldown: 180
  },
  
  // Frame tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Visual effects
  screenShake: 0,
  flashIntensity: 0,
  
  // Input state
  keys: {},
  
  // Performance
  projectilePool: [],
  particlePool: []
};

// Power-up definitions
export const POWER_UP_TYPES = [
  {
    name: "Swift Heart",
    description: "+0.5 Movement Speed",
    rarity: "common",
    color: [100, 200, 255],
    apply: (stats) => { stats.speed += 0.5; stats.focusSpeed += 0.2; }
  },
  {
    name: "Rapid Love",
    description: "-2 Fire Rate (faster)",
    rarity: "common",
    color: [255, 100, 100],
    apply: (stats) => { stats.fireRate = Math.max(2, stats.fireRate - 2); }
  },
  {
    name: "Power of Friendship",
    description: "+5 Damage",
    rarity: "common",
    color: [255, 200, 100],
    apply: (stats) => { stats.damage += 5; }
  },
  {
    name: "Resilient Soul",
    description: "+20 Max Health",
    rarity: "common",
    color: [100, 255, 100],
    apply: (stats) => { stats.maxHealth += 20; stats.health += 20; }
  },
  {
    name: "Loving Arrows",
    description: "+2 Projectile Speed",
    rarity: "uncommon",
    color: [200, 100, 255],
    apply: (stats) => { stats.projectileSpeed += 2; }
  },
  {
    name: "Giant's Love",
    description: "+3 Projectile Size",
    rarity: "uncommon",
    color: [255, 150, 200],
    apply: (stats) => { stats.projectileSize += 3; }
  },
  {
    name: "Healer's Touch",
    description: "Restore 30 Health",
    rarity: "uncommon",
    color: [150, 255, 150],
    apply: (stats) => { stats.health = Math.min(stats.maxHealth, stats.health + 30); }
  },
  {
    name: "Double Shot",
    description: "Fire 2 projectiles",
    rarity: "rare",
    color: [255, 100, 255],
    apply: (stats) => { stats.doubleShot = true; }
  },
  {
    name: "Piercing Love",
    description: "Projectiles pierce enemies",
    rarity: "rare",
    color: [100, 255, 255],
    apply: (stats) => { stats.piercing = true; }
  },
  {
    name: "Heart Shield",
    description: "Unlock Special Ability",
    rarity: "rare",
    color: [255, 255, 100],
    apply: (stats) => { stats.hasSpecialAbility = true; }
  }
];

// Boss definitions
export const BOSS_TYPES = [
  {
    name: "Spiral Terror",
    color: [255, 50, 50],
    size: 40,
    pattern: "spiral",
    difficulty: 1
  },
  {
    name: "Wave Keeper",
    color: [50, 255, 50],
    size: 45,
    pattern: "wave",
    difficulty: 1
  },
  {
    name: "Bullet Storm",
    color: [50, 50, 255],
    size: 50,
    pattern: "spread",
    difficulty: 2
  },
  {
    name: "Aimed Fury",
    color: [255, 255, 50],
    size: 40,
    pattern: "aimed",
    difficulty: 2
  },
  {
    name: "Circle Spinner",
    color: [255, 50, 255],
    size: 45,
    pattern: "circle",
    difficulty: 3
  },
  {
    name: "Cross Guard",
    color: [50, 255, 255],
    size: 40,
    pattern: "cross",
    difficulty: 3
  },
  {
    name: "Chaos Bringer",
    color: [255, 150, 50],
    size: 55,
    pattern: "random",
    difficulty: 4
  },
  {
    name: "The Void",
    color: [100, 0, 150],
    size: 70,
    pattern: "void",
    difficulty: 5
  }
];

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;