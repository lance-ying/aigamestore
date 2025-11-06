// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE",
  LEVEL_TRANSITION: "LEVEL_TRANSITION"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  score: 0,
  currentLevel: 1,
  balloonY: 0,
  balloonX: CANVAS_WIDTH / 2,
  shieldX: CANVAS_WIDTH / 2,
  shieldY: CANVAS_HEIGHT - 80,
  obstacles: [],
  targetHeight: 5000,
  worldScrollOffset: 0,
  levelTransitionTimer: 0,
  lastObstacleSpawn: 0,
  highScores: [],
  lastClearedTime: 0,
  comboCount: 0,
  distanceScore: 0
};

export const LEVEL_CONFIG = {
  1: {
    targetHeight: 5000,
    balloonSpeed: 2,
    spawnRate: 60,
    maxObstacles: 8
  },
  2: {
    targetHeight: 10000,
    balloonSpeed: 2.5,
    spawnRate: 40,
    maxObstacles: 10
  },
  3: {
    targetHeight: 15000,
    balloonSpeed: 3,
    spawnRate: 30,
    maxObstacles: 12
  },
  4: {
    targetHeight: 20000,
    balloonSpeed: 3.5,
    spawnRate: 25,
    maxObstacles: 15
  }
};

export const KEYS = {
  ENTER: 13,
  ESC: 27,
  SPACE: 32,
  SHIFT: 16,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  R: 82,
  Z: 90
};