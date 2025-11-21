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
  ARCHER: { name: "Archer", cost: 70, damage: 8, range: 120, fireRate: 30, color: [100, 200, 100] },
  MAGE: { name: "Mage", cost: 100, damage: 15, range: 100, fireRate: 50, color: [100, 100, 255] },
  BARRACKS: { name: "Barracks", cost: 70, damage: 5, range: 60, fireRate: 20, color: [200, 100, 100] },
  ARTILLERY: { name: "Artillery", cost: 120, damage: 30, range: 140, fireRate: 80, color: [200, 150, 50] }
};

export const gameState = {
  player: null,
  entities: [],
  towers: [],
  enemies: [],
  projectiles: [],
  particles: [],
  score: 0,
  gold: 200,
  lives: 20,
  wave: 0,
  maxWaves: 10,
  waveTimer: 0,
  waveDelay: 180,
  enemiesSpawned: 0,
  enemiesPerWave: 5,
  cursorX: 0,
  cursorY: 0,
  selectedSlot: null,
  selectedTower: null,
  showTowerMenu: false,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  path: [],
  towerSlots: [],
  levelComplete: false
};

// Expose gameState getter
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}