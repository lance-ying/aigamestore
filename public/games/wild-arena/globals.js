// globals.js - Global constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASE = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  LEVEL_TRANSITION: "LEVEL_TRANSITION",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

// Weapon types
export const WEAPON_TYPES = {
  PISTOL: {
    name: 'Pistol',
    damage: 15,
    fireRate: 15,
    projectileSpeed: 8,
    projectileCount: 1,
    spread: 0,
    color: [255, 220, 100]
  },
  SHOTGUN: {
    name: 'Shotgun',
    damage: 8,
    fireRate: 35,
    projectileSpeed: 7,
    projectileCount: 5,
    spread: 0.3,
    color: [255, 150, 50]
  },
  RIFLE: {
    name: 'Rifle',
    damage: 25,
    fireRate: 25,
    projectileSpeed: 12,
    projectileCount: 1,
    spread: 0,
    color: [100, 200, 255]
  }
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
  testModeActions: [],
  transitionTimer: 0,
  keyTaps: {
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
    ability: false,
    weapon1: false,
    weapon2: false,
    weapon3: false
  }
};

// Level configurations
export const LEVELS = [
  {
    level: 1,
    duration: 60,
    enemyCount: 3,
    enemyTypes: [{ type: 'GRUNT', count: 3 }],
    zoneStartDelay: 5 * 60,
    zoneShrinkSpeed: 0.15,
    zoneMinRadius: 80,
    lootSpawnRate: 0.002
  },
  {
    level: 2,
    duration: 75,
    enemyCount: 5,
    enemyTypes: [{ type: 'GRUNT', count: 3 }, { type: 'RANGER', count: 2 }],
    zoneStartDelay: 3 * 60,
    zoneShrinkSpeed: 0.18,
    zoneMinRadius: 70,
    lootSpawnRate: 0.002
  },
  {
    level: 3,
    duration: 90,
    enemyCount: 7,
    enemyTypes: [{ type: 'GRUNT', count: 3 }, { type: 'RANGER', count: 3 }, { type: 'BRUISER', count: 1 }],
    zoneStartDelay: 0,
    zoneShrinkSpeed: 0.2,
    zoneMinRadius: 60,
    lootSpawnRate: 0.002
  },
  {
    level: 4,
    duration: 100,
    enemyCount: 9,
    enemyTypes: [{ type: 'RANGER', count: 4 }, { type: 'BRUISER', count: 3 }, { type: 'SCOUT', count: 2 }],
    zoneStartDelay: 0,
    zoneShrinkSpeed: 0.25,
    zoneMinRadius: 50,
    lootSpawnRate: 0.002
  },
  {
    level: 5,
    duration: 120,
    enemyCount: 9,
    enemyTypes: [{ type: 'GRUNT', count: 2 }, { type: 'RANGER', count: 3 }, { type: 'BRUISER', count: 2 }, { type: 'SCOUT', count: 1 }, { type: 'BOSS', count: 1 }],
    zoneStartDelay: 0,
    zoneShrinkSpeed: 0.3,
    zoneMinRadius: 40,
    lootSpawnRate: 0.002
  }
];
// Expose gameState to window for debugging and recording scripts
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}
