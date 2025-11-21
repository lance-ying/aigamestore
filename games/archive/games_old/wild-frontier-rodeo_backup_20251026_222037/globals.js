// globals.js - Game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER_WIN: 'GAME_OVER_WIN',
  GAME_OVER_LOSE: 'GAME_OVER_LOSE'
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: 'HUMAN',
  currentLevel: 1,
  levelTimer: 0,
  highScore: 0,
  currentAnimal: null,
  ridingTimer: 0,
  isJumping: false,
  lastLandedAnimal: null,
  consecutiveJumps: 0,
  backgroundOffset: 0
};

export const ANIMAL_TYPES = {
  COW: {
    name: 'COW',
    ridingDuration: 4000,
    speedMultiplier: 0.9,
    jumpHeight: 15,
    width: 80,
    height: 50,
    color: [139, 90, 43]
  },
  ZEBRA: {
    name: 'ZEBRA',
    ridingDuration: 3000,
    speedMultiplier: 1.0,
    jumpHeight: 18,
    width: 75,
    height: 48,
    color: [240, 240, 240]
  },
  GIRAFFE: {
    name: 'GIRAFFE',
    ridingDuration: 2500,
    speedMultiplier: 1.1,
    jumpHeight: 22,
    width: 60,
    height: 70,
    color: [218, 165, 32]
  },
  ELEPHANT: {
    name: 'ELEPHANT',
    ridingDuration: 2000,
    speedMultiplier: 1.0,
    jumpHeight: 16,
    width: 100,
    height: 60,
    color: [128, 128, 128]
  }
};

export const LEVEL_CONFIG = [
  {
    level: 1,
    name: 'The Grassy Plains',
    duration: 60000,
    speedMultiplier: 1.0,
    animalTypes: ['COW', 'ZEBRA'],
    spawnInterval: 2000,
    obstacleChance: 0.15
  },
  {
    level: 2,
    name: 'Rocky Foothills',
    duration: 75000,
    speedMultiplier: 1.15,
    animalTypes: ['COW', 'ZEBRA', 'GIRAFFE'],
    spawnInterval: 1800,
    obstacleChance: 0.25
  },
  {
    level: 3,
    name: 'Savannah Stampede',
    duration: 90000,
    speedMultiplier: 1.3,
    animalTypes: ['ZEBRA', 'GIRAFFE', 'ELEPHANT'],
    spawnInterval: 1600,
    obstacleChance: 0.35
  },
  {
    level: 4,
    name: 'Canyon Crossing',
    duration: 100000,
    speedMultiplier: 1.45,
    animalTypes: ['ZEBRA', 'GIRAFFE', 'ELEPHANT'],
    spawnInterval: 1500,
    obstacleChance: 0.45
  },
  {
    level: 5,
    name: 'The Grand Finale',
    duration: 120000,
    speedMultiplier: 1.6,
    animalTypes: ['ZEBRA', 'GIRAFFE', 'ELEPHANT'],
    spawnInterval: 1400,
    obstacleChance: 0.5
  }
];

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}