// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Cannon constants
export const CANNON_BASE_X = CANVAS_WIDTH / 2;
export const CANNON_BASE_Y = CANVAS_HEIGHT - 30;
export const CANNON_LENGTH = 40;
export const CANNON_WIDTH = 20;
export const CANNON_ROTATION_STEP = 5; // degrees
export const MIN_CANNON_ANGLE = -60; // degrees from vertical
export const MAX_CANNON_ANGLE = 60; // degrees from vertical
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
    levels: [1, 1.5, 2, 2.5, 3],
    costs: [0, 100, 250, 500, 1000]
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

// Level definitions
export const LEVELS = [
  {
    number: 1,
    name: "Coral Reef Calm",
    targetScore: 500,
    timeLimit: 60,
    spawnRate: 2000,
    maxFishOnScreen: 8,
    fishTypes: ['SARDINE', 'TUNA'],
    fishWeights: [0.7, 0.3]
  },
  {
    number: 2,
    name: "Deep Sea Currents",
    targetScore: 1200,
    timeLimit: 75,
    spawnRate: 1500,
    maxFishOnScreen: 12,
    fishTypes: ['SARDINE', 'TUNA', 'MANTA'],
    fishWeights: [0.4, 0.4, 0.2]
  },
  {
    number: 3,
    name: "Abyssal Frenzy",
    targetScore: 2500,
    timeLimit: 90,
    spawnRate: 1000,
    maxFishOnScreen: 15,
    fishTypes: ['TUNA', 'MANTA', 'SHARK'],
    fishWeights: [0.3, 0.5, 0.2]
  },
  {
    number: 4,
    name: "Leviathan's Lair",
    targetScore: 4000,
    timeLimit: 100,
    spawnRate: 800,
    maxFishOnScreen: 18,
    fishTypes: ['MANTA', 'SHARK', 'SQUID'],
    fishWeights: [0.4, 0.4, 0.2]
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
    rotationSpeed: 0
  }
};

// Expose gameState getter
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}