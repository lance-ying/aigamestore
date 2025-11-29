// globals.js - Global constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASE = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  player: null,
  entities: [],
  projectiles: [],
  loot: [],
  obstacles: [],
  score: 0,
  highScore: 0,
  gamePhase: GAME_PHASE.START,
  controlMode: "HUMAN",
  currentLevel: 1,
  levelTimer: 0,
  levelDuration: 60,
  enemiesDefeated: 0,
  enemiesRequired: 3,
  zoneRadius: 280,
  zoneTargetRadius: 280,
  zoneCenterX: CANVAS_WIDTH / 2,
  zoneCenterY: CANVAS_HEIGHT / 2,
  zoneDamageTimer: 0,
  framesSinceStart: 0,
  testModeActions: []
};

// Level configurations
export const LEVELS = [
  {
    level: 1,
    duration: 60,
    enemyCount: 3,
    enemyTypes: [{ type: 'GRUNT', count: 3 }],
    zoneStartDelay: 15 * 60,
    zoneShrinkSpeed: 0.3,
    zoneMinRadius: 80,
    lootSpawnRate: 0.008
  },
  {
    level: 2,
    duration: 75,
    enemyCount: 5,
    enemyTypes: [{ type: 'GRUNT', count: 3 }, { type: 'RANGER', count: 2 }],
    zoneStartDelay: 10 * 60,
    zoneShrinkSpeed: 0.4,
    zoneMinRadius: 70,
    lootSpawnRate: 0.006
  },
  {
    level: 3,
    duration: 90,
    enemyCount: 7,
    enemyTypes: [{ type: 'GRUNT', count: 3 }, { type: 'RANGER', count: 3 }, { type: 'BRUISER', count: 1 }],
    zoneStartDelay: 0,
    zoneShrinkSpeed: 0.5,
    zoneMinRadius: 60,
    lootSpawnRate: 0.005
  },
  {
    level: 4,
    duration: 100,
    enemyCount: 9,
    enemyTypes: [{ type: 'RANGER', count: 4 }, { type: 'BRUISER', count: 3 }, { type: 'SCOUT', count: 2 }],
    zoneStartDelay: 0,
    zoneShrinkSpeed: 0.6,
    zoneMinRadius: 50,
    lootSpawnRate: 0.004
  },
  {
    level: 5,
    duration: 120,
    enemyCount: 9,
    enemyTypes: [{ type: 'GRUNT', count: 2 }, { type: 'RANGER', count: 3 }, { type: 'BRUISER', count: 2 }, { type: 'SCOUT', count: 1 }, { type: 'BOSS', count: 1 }],
    zoneStartDelay: 0,
    zoneShrinkSpeed: 0.7,
    zoneMinRadius: 40,
    lootSpawnRate: 0.003
  }
];