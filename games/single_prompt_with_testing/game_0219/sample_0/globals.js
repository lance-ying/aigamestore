// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game balance constants
export const GAME_CONFIG = {
  INITIAL_MANA: 150,
  INITIAL_LIVES: 20,
  TOWER_COST: 30,
  GEM_BASE_COST: 25,
  WAVE_COUNT: 10,
  WAVE_BONUS_MULTIPLIER: 1.2,
  
  // Gem types
  GEM_TYPES: {
    RUBY: { name: 'Ruby', color: [255, 50, 50], damage: 10, range: 100, speed: 0.8, effect: 'damage' },
    SAPPHIRE: { name: 'Sapphire', color: [50, 150, 255], damage: 5, range: 120, speed: 1.2, effect: 'slow' },
    EMERALD: { name: 'Emerald', color: [50, 255, 100], damage: 7, range: 90, speed: 1.0, effect: 'splash' }
  },
  
  // Monster scaling
  MONSTER_BASE_HEALTH: 50,
  MONSTER_BASE_SPEED: 1.0,
  MONSTER_HEALTH_SCALE: 1.5,
  MONSTER_SPEED_SCALE: 1.05,
  MONSTER_BASE_COUNT: 5,
  MONSTER_COUNT_INCREMENT: 3
};

// Path waypoints for monsters
export const PATH_WAYPOINTS = [
  { x: -20, y: 200 },
  { x: 150, y: 200 },
  { x: 150, y: 100 },
  { x: 300, y: 100 },
  { x: 300, y: 300 },
  { x: 450, y: 300 },
  { x: 450, y: 150 },
  { x: 620, y: 150 }
];

// Game state object
export const gameState = {
  // Core game state
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  
  // Resources
  mana: GAME_CONFIG.INITIAL_MANA,
  lives: GAME_CONFIG.INITIAL_LIVES,
  score: 0,
  
  // Game entities
  player: null,
  entities: [],
  towers: [],
  monsters: [],
  projectiles: [],
  particles: [],
  gems: [], // All gems in play
  
  // Wave management
  currentWave: 0,
  totalWaves: GAME_CONFIG.WAVE_COUNT,
  waveActive: false,
  waveSpawnCounter: 0,
  waveSpawnInterval: 30, // Frames between monster spawns
  monstersToSpawn: 0,
  monstersSpawned: 0,
  
  // UI state
  selectedTower: null,
  selectedGemType: 'RUBY',
  hoverTower: null,
  buildMode: false,
  combineMode: false,
  
  // Performance tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Input tracking
  keys: {},
  
  // Grid for tower placement
  towerGrid: null,
  gridSize: 40,
  
  // Path rendering
  pathPoints: []
};

// Initialize the game state
export function initGameState() {
  gameState.mana = GAME_CONFIG.INITIAL_MANA;
  gameState.lives = GAME_CONFIG.INITIAL_LIVES;
  gameState.score = 0;
  gameState.currentWave = 0;
  gameState.waveActive = false;
  gameState.monstersToSpawn = 0;
  gameState.monstersSpawned = 0;
  gameState.waveSpawnCounter = 0;
  
  gameState.entities = [];
  gameState.towers = [];
  gameState.monsters = [];
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.gems = [];
  
  gameState.selectedTower = null;
  gameState.selectedGemType = 'RUBY';
  gameState.hoverTower = null;
  gameState.buildMode = false;
  gameState.combineMode = false;
  
  // Initialize tower grid
  gameState.towerGrid = [];
  const cols = Math.floor(CANVAS_WIDTH / gameState.gridSize);
  const rows = Math.floor(CANVAS_HEIGHT / gameState.gridSize);
  
  for (let i = 0; i < cols; i++) {
    gameState.towerGrid[i] = [];
    for (let j = 0; j < rows; j++) {
      gameState.towerGrid[i][j] = null;
    }
  }
  
  // Calculate smooth path points
  calculatePathPoints();
}

// Calculate smooth path for rendering
function calculatePathPoints() {
  gameState.pathPoints = [];
  
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const start = PATH_WAYPOINTS[i];
    const end = PATH_WAYPOINTS[i + 1];
    const steps = 20;
    
    for (let t = 0; t <= steps; t++) {
      const ratio = t / steps;
      const x = start.x + (end.x - start.x) * ratio;
      const y = start.y + (end.y - start.y) * ratio;
      gameState.pathPoints.push({ x, y });
    }
  }
}

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Control mode setter
export function setControlMode(mode) {
  gameState.controlMode = mode;
  console.log(`Control mode set to: ${mode}`);
}

window.setControlMode = setControlMode;