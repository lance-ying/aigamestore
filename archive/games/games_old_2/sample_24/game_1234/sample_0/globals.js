// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  GAME_WON: 'GAME_WON'
};

export const PLAYER_STATES = {
  RUNNING: 'running',
  JUMPING: 'jumping',
  SLIDING: 'sliding',
  DEAD: 'dead'
};

export const OBSTACLE_TYPES = {
  LOW_BARRIER: 'low_barrier',
  HIGH_BARRIER: 'high_barrier',
  GAP: 'gap',
  TURN_LEFT: 'turn_left',
  TURN_RIGHT: 'turn_right'
};

export const LEVELS = [
  {
    id: 1,
    name: 'Ancient Path',
    distance: 1000,
    speedMultiplier: 1.0,
    obstacleSpawnRate: 0.015,
    coinSpawnRate: 0.02,
    color: [120, 90, 60]
  },
  {
    id: 2,
    name: 'Bridge of Trials',
    distance: 2000,
    speedMultiplier: 1.2,
    obstacleSpawnRate: 0.02,
    coinSpawnRate: 0.025,
    color: [80, 70, 50]
  },
  {
    id: 3,
    name: 'Temple Ascent',
    distance: 3000,
    speedMultiplier: 1.5,
    obstacleSpawnRate: 0.025,
    coinSpawnRate: 0.03,
    color: [100, 80, 70]
  },
  {
    id: 4,
    name: 'Demon\'s Lair',
    distance: 4000,
    speedMultiplier: 1.8,
    obstacleSpawnRate: 0.03,
    coinSpawnRate: 0.035,
    color: [90, 50, 50]
  }
];

export const gameState = {
  player: null,
  entities: [],
  obstacles: [],
  coins: [],
  score: 0,
  coinCount: 0,
  currentLevel: 1,
  distanceTraveled: 0,
  distanceTraveledInLevel: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: 'HUMAN',
  baseSpeed: 5,
  currentSpeed: 5,
  levelCompleteTimer: 0,
  cameraZ: 0,
  pathSegments: [],
  currentLane: 0
};