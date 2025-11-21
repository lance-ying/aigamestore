// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

export const NUM_LANES = 5;
export const LANE_WIDTH = CANVAS_WIDTH / NUM_LANES;

export const PLAYER_BASE_HP = 500;
export const ENEMY_BASE_HP = 500;

export const UNIT_SPEED = 2;
export const UNIT_SIZE = 8;
export const UNIT_HP = 10;
export const UNIT_DAMAGE = 1;

export const CHAMPION_HP = 100;
export const CHAMPION_DAMAGE = 10;
export const CHAMPION_SIZE = 16;
export const CHAMPION_COST = 100;

export const SPEED_BOOST_COST = 50;
export const SPEED_BOOST_MULTIPLIER = 2;

export const FIRE_RATE = 10; // units per second
export const ENEMY_SPAWN_RATE = 3; // units per second (base)

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  
  // Game specific state
  playerBaseHP: PLAYER_BASE_HP,
  enemyBaseHP: ENEMY_BASE_HP,
  cannonAngle: 0,
  isFiring: false,
  unitCount: 0,
  totalUnitsSpawned: 0,
  
  gates: [],
  
  championStars: 0,
  level: 1,
  
  framesSinceLastFire: 0,
  framesSinceLastEnemySpawn: 0,
  
  speedBoostActive: false,
  speedBoostFrames: 0,
  
  keys: {
    left: false,
    right: false,
    space: false,
    z: false,
    shift: false
  }
};

export function resetGameState() {
  gameState.entities = [];
  gameState.score = 0;
  gameState.playerBaseHP = PLAYER_BASE_HP;
  gameState.enemyBaseHP = ENEMY_BASE_HP;
  gameState.cannonAngle = 0;
  gameState.isFiring = false;
  gameState.unitCount = 0;
  gameState.totalUnitsSpawned = 0;
  gameState.gates = [];
  gameState.framesSinceLastFire = 0;
  gameState.framesSinceLastEnemySpawn = 0;
  gameState.speedBoostActive = false;
  gameState.speedBoostFrames = 0;
  gameState.keys = {
    left: false,
    right: false,
    space: false,
    z: false,
    shift: false
  };
}

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}