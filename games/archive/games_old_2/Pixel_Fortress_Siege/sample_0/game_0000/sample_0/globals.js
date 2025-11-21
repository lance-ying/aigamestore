// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 20;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Unit types
export const UNIT_WARRIOR = "WARRIOR";
export const UNIT_ARCHER = "ARCHER";
export const UNIT_SORCERER = "SORCERER";
export const UNIT_GOBLIN = "GOBLIN";
export const UNIT_BARBARIAN = "BARBARIAN";
export const UNIT_GIANT = "GIANT";

// Structure types
export const STRUCTURE_TOWN_HALL = "TOWN_HALL";
export const STRUCTURE_WALL = "WALL";
export const STRUCTURE_BARRACKS = "BARRACKS";
export const STRUCTURE_FORTRESS = "FORTRESS";
export const STRUCTURE_CANNON = "CANNON";
export const STRUCTURE_ARCHER_TOWER = "ARCHER_TOWER";

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  playerGold: 0,
  activePlayerUnits: [],
  activeEnemyUnits: [],
  playerStructures: [],
  enemyStructures: [],
  projectiles: [],
  waveTimer: 0,
  currentWave: 0,
  totalWaves: 0,
  levelNumber: 1,
  playerScore: 0,
  deploymentCursorPos: { x: 2, y: 10 },
  selectedUnitType: UNIT_WARRIOR,
  lastGoldGenTime: 0,
  goldPerSecond: 0,
  waveSpawnDelay: 0,
  waveActive: false,
  highScore: 0,
  levelStartTime: 0,
  particles: []
};

// Expose gameState getter
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}