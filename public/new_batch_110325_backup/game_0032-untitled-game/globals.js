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

export const TOWER_TYPES = {
  ARCHER: { name: "Archer", cost: 70, color: [100, 200, 100], damage: 15, range: 100, fireRate: 30 },
  MAGE: { name: "Mage", cost: 120, color: [100, 100, 255], damage: 25, range: 90, fireRate: 45, splash: 40 },
  CANNON: { name: "Cannon", cost: 160, color: [200, 100, 50], damage: 50, range: 110, fireRate: 60, splash: 50 },
  BARRACKS: { name: "Barracks", cost: 100, color: [200, 150, 50], damage: 10, range: 50, fireRate: 20 }
};

export const TOWER_TYPE_ARRAY = Object.keys(TOWER_TYPES);

export const UPGRADE_COSTS = [0, 50, 100, 150];

export const gameState = {
  player: null,
  entities: [],
  towers: [],
  enemies: [],
  projectiles: [],
  heroes: [],
  particles: [],
  
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  health: 20,
  maxHealth: 20,
  gold: 250,
  score: 0,
  
  currentWave: 0,
  maxWaves: 8,
  waveInProgress: false,
  waveTimer: 0,
  enemiesSpawned: 0,
  enemiesToSpawn: 0,
  spawnInterval: 0,
  spawnTimer: 0,
  
  selectedTowerType: 0,
  hoveredPlot: null,
  selectedTower: null,
  
  heroAbilityCooldown: 0,
  heroAbilityMaxCooldown: 180,
  
  path: [],
  towerPlots: [],
  
  framesSinceLastAction: 0,
  positionHistory: []
};

// Tower plot positions - strategic locations along the path
export const TOWER_PLOT_POSITIONS = [
  { x: 150, y: 100 },
  { x: 250, y: 140 },
  { x: 380, y: 100 },
  { x: 450, y: 200 },
  { x: 350, y: 250 },
  { x: 200, y: 280 },
  { x: 100, y: 230 },
  { x: 500, y: 300 }
];

// Path waypoints for enemies to follow
export const PATH_WAYPOINTS = [
  { x: -30, y: 80 },
  { x: 100, y: 80 },
  { x: 100, y: 150 },
  { x: 220, y: 150 },
  { x: 220, y: 100 },
  { x: 350, y: 100 },
  { x: 350, y: 180 },
  { x: 480, y: 180 },
  { x: 480, y: 270 },
  { x: 320, y: 270 },
  { x: 320, y: 320 },
  { x: 150, y: 320 },
  { x: 150, y: 250 },
  { x: 50, y: 250 },
  { x: 50, y: 350 },
  { x: 630, y: 350 }
];