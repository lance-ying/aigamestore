// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 500;

// Cannon constants
export const CANNON_BASE_X = CANVAS_WIDTH / 2;
export const CANNON_BASE_Y = CANVAS_HEIGHT - 120;
export const CANNON_LENGTH = 40;
export const CANNON_WIDTH = 20;
export const CANNON_ROTATION_STEP = 5; // degrees
export const MIN_CANNON_ANGLE = -90; // degrees from vertical (now allows horizontal left)
export const MAX_CANNON_ANGLE = 90; // degrees from vertical (now allows horizontal right)
export const FIRE_RATE_DELAY = 300; // milliseconds
export const CANNON_RECOIL_DISTANCE = 5;
export const CANNON_RECOIL_DURATION = 100; // milliseconds

// Projectile constants
export const PROJECTILE_RADIUS = 5;
export const PROJECTILE_SPEED = 8;
export const PROJECTILE_DAMAGE = 1;

// Upgrade system
export const UPGRADES = {
  DAMAGE: {
    name: 'Damage',
    levels: [1, 2, 3, 5, 8],
    costs: [0, 100, 300, 600, 1200]
  },
  FIRE_RATE: {
    name: 'Fire Rate',
    levels: [1, 0.8, 0.6, 0.4, 0.3],
    costs: [0, 150, 400, 800, 1500]
  },
  ROTATION_SPEED: {
    name: 'Rotation Speed',
    levels: [1, 1.2, 1.4, 1.6, 2],
    costs: [0, 100, 250, 500, 1000]
  },
  WEAPON_TYPE: {
    name: 'Weapon Type',
    levels: ['Normal', 'Spread', 'Piercing', 'Rapid'],
    costs: [0, 200, 500, 1000]
  }
};

// Fish type definitions
export const FISH_TYPES = {
  SARDINE: {
    name: 'Sardine',
    radius: 10,
    health: 1,
    points: 10,
    speed: 1.5,
    color: [50, 100, 255],
    minSpeed: 1,
    maxSpeed: 2
  },
  CLOWNFISH: {
    name: 'Clownfish',
    radius: 12,
    health: 1,
    points: 15,
    speed: 2,
    color: [255, 140, 0],
    minSpeed: 1.5,
    maxSpeed: 2.5
  },
  TUNA: {
    name: 'Tuna',
    radius: 15,
    health: 2,
    points: 25,
    speed: 2,
    color: [50, 200, 100],
    minSpeed: 1.5,
    maxSpeed: 2.5
  },
  SEAHORSE: {
    name: 'Seahorse',
    radius: 13,
    health: 2,
    points: 30,
    speed: 1,
    color: [255, 200, 100],
    minSpeed: 0.8,
    maxSpeed: 1.5
  },
  MANTA: {
    name: 'Manta Ray',
    radius: 20,
    health: 3,
    points: 50,
    speed: 2.5,
    color: [255, 150, 50],
    minSpeed: 2,
    maxSpeed: 3
  },
  JELLYFISH: {
    name: 'Jellyfish',
    radius: 18,
    health: 3,
    points: 60,
    speed: 1.5,
    color: [200, 100, 255],
    minSpeed: 1,
    maxSpeed: 2
  },
  SWORDFISH: {
    name: 'Swordfish',
    radius: 22,
    health: 5,
    points: 100,
    speed: 3.5,
    color: [100, 150, 255],
    minSpeed: 3,
    maxSpeed: 4
  },
  SHARK: {
    name: 'Shark',
    radius: 25,
    health: 10,
    points: 200,
    speed: 3,
    color: [120, 120, 140],
    minSpeed: 2.5,
    maxSpeed: 3.5
  },
  SQUID: {
    name: 'Giant Squid',
    radius: 35,
    health: 25,
    points: 500,
    speed: 2,
    color: [180, 50, 200],
    minSpeed: 1.5,
    maxSpeed: 2.5
  }
};

// Level definitions - 9 levels total (3 easy, 3 medium, 3 hard)
export const LEVELS = [
  // EASY LEVELS (1-3)
  {
    number: 1,
    name: "Shallow Waters",
    targetScore: 100,
    timeLimit: 70,
    spawnRate: 2000,
    maxFishOnScreen: 8,
    fishTypes: ['SARDINE', 'CLOWNFISH', 'TUNA'],
    fishWeights: [0.6, 0.3, 0.1]
  },
  {
    number: 2,
    name: "Coral Reef Calm",
    targetScore: 200,
    timeLimit: 75,
    spawnRate: 1800,
    maxFishOnScreen: 10,
    fishTypes: ['SARDINE', 'CLOWNFISH', 'TUNA', 'SEAHORSE'],
    fishWeights: [0.4, 0.3, 0.2, 0.1]
  },
  {
    number: 3,
    name: "Reef Awakening",
    targetScore: 400,
    timeLimit: 80,
    spawnRate: 1600,
    maxFishOnScreen: 11,
    fishTypes: ['CLOWNFISH', 'TUNA', 'SEAHORSE', 'MANTA'],
    fishWeights: [0.3, 0.3, 0.2, 0.2]
  },
  // MEDIUM LEVELS (4-6)
  {
    number: 4,
    name: "Deep Sea Currents",
    targetScore: 1200,
    timeLimit: 80,
    spawnRate: 1400,
    maxFishOnScreen: 12,
    fishTypes: ['TUNA', 'MANTA', 'JELLYFISH', 'SWORDFISH'],
    fishWeights: [0.3, 0.3, 0.2, 0.2]
  },
  {
    number: 5,
    name: "Twilight Zone",
    targetScore: 1800,
    timeLimit: 85,
    spawnRate: 1200,
    maxFishOnScreen: 13,
    fishTypes: ['MANTA', 'JELLYFISH', 'SWORDFISH', 'SHARK'],
    fishWeights: [0.3, 0.2, 0.3, 0.2]
  },
  {
    number: 6,
    name: "Abyssal Frenzy",
    targetScore: 2500,
    timeLimit: 90,
    spawnRate: 1000,
    maxFishOnScreen: 15,
    fishTypes: ['MANTA', 'SWORDFISH', 'SHARK'],
    fishWeights: [0.3, 0.4, 0.3]
  },
  // HARD LEVELS (7-9)
  {
    number: 7,
    name: "Midnight Depths",
    targetScore: 3500,
    timeLimit: 95,
    spawnRate: 900,
    maxFishOnScreen: 16,
    fishTypes: ['JELLYFISH', 'SWORDFISH', 'SHARK', 'SQUID'],
    fishWeights: [0.2, 0.3, 0.4, 0.1]
  },
  {
    number: 8,
    name: "Apex Predators",
    targetScore: 4500,
    timeLimit: 100,
    spawnRate: 800,
    maxFishOnScreen: 18,
    fishTypes: ['SWORDFISH', 'SHARK', 'SQUID'],
    fishWeights: [0.3, 0.5, 0.2]
  },
  {
    number: 9,
    name: "Leviathan's Lair",
    targetScore: 6000,
    timeLimit: 110,
    spawnRate: 700,
    maxFishOnScreen: 20,
    fishTypes: ['MANTA', 'SHARK', 'SQUID'],
    fishWeights: [0.3, 0.4, 0.3]
  }
];

// Game state object
export const gameState = {
  player: null,
  entities: [],
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN",
  score: 0,
  totalGameScore: 0,
  level: 0,
  timeRemaining: 0,
  levelStartTime: 0,
  cannon: {
    angle: 0,
    x: CANNON_BASE_X,
    y: CANNON_BASE_Y,
    recoiling: false,
    recoilStartTime: 0
  },
  projectiles: [],
  fish: [],
  lastShotTime: 0,
  particles: [],
  floatingTexts: [],
  highScores: [],
  bossSpawned: false,
  keysPressed: {},
  upgrades: {
    damage: 0,
    fireRate: 0,
    rotationSpeed: 0,
    weaponType: 0
  }
};

// Expose gameState getter
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}