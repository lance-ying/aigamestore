// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Player cannon
  cannon: null,
  cannonAngle: 0,
  
  // Units
  units: [],
  totalUnitsSpawned: 0,
  unitsReachedBase: 0,
  unitsLost: 0,
  
  // Enemy units
  enemyUnits: [],
  totalEnemiesSpawned: 0,
  enemiesKilled: 0,
  enemySpawnTimer: 0,
  enemySpawnInterval: 120, // frames between spawns
  enemyWaveCount: 0,
  
  // Gates and obstacles
  gates: [],
  obstacles: [],
  speedPads: [],
  
  // Enemy
  enemyBase: null,
  
  // Champion
  championAbilityReady: true,
  championAbilityCooldown: 0,
  championUsedCount: 0,
  
  // Score tracking
  score: 0,
  blueGatesPassed: 0,
  redGatesPassed: 0,
  perfectBlueChain: true,
  obstaclesDestroyed: 0,
  startTime: 0,
  levelParTime: 45000, // 45 seconds in ms
  
  // Input state
  slowMotionActive: false,
  firingUnits: false,
  
  // Level state
  currentLevel: 1,
  levelComplete: false,
  finalRank: "",
  
  // Testing helpers
  testFrameCount: 0,
  testLastUnitCount: 0
};

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function getGameState() {
  return gameState;
}