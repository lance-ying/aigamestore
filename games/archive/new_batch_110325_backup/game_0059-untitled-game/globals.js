// Global game state and constants
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
  player: null,
  entities: [],
  enemies: [],
  towers: [],
  projectiles: [],
  effects: [],
  hero: null,
  score: 0,
  gold: 150,
  lives: 20,
  maxLives: 20,
  currentWave: 0,
  totalWaves: 10,
  waveInProgress: false,
  waveTimer: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  selectedTowerType: 1, // 1=Archer, 2=Mage, 3=Barracks, 4=Druid
  selectedTower: null,
  cursorX: 0,
  cursorY: 0,
  path: [],
  enemiesSpawnedThisWave: 0,
  enemiesKilledThisWave: 0,
  totalEnemiesThisWave: 0,
  framesSinceWaveStart: 0,
  stars: 0,
  difficulty: "Normal"
};

// Tower types configuration
export const TOWER_TYPES = {
  1: { name: "Archer", cost: 70, color: [100, 200, 100], range: 120, damage: 8, attackSpeed: 40 },
  2: { name: "Mage", cost: 100, color: [100, 100, 255], range: 100, damage: 15, attackSpeed: 60 },
  3: { name: "Barracks", cost: 80, color: [200, 100, 100], range: 60, damage: 5, attackSpeed: 30 },
  4: { name: "Druid", cost: 90, color: [150, 200, 50], range: 110, damage: 10, attackSpeed: 50 }
};

export const UPGRADE_COSTS = [0, 80, 120, 180]; // Index = tier level

// Initialize the game state function for external access
window.getGameState = function() {
  return gameState;
};