// globals.js - Global game state and constants

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
  // Game phase
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Player
  player: null,
  
  // Entities
  entities: [],
  enemies: [],
  projectiles: [],
  pickups: [],
  
  // Game progression
  score: 0,
  survivalTime: 0,
  waveLevel: 1,
  lastWaveTime: 0,
  
  // UI state
  showUpgradeMenu: false,
  availableUpgrades: [],
  
  // Performance tracking
  enemiesDefeated: 0,
  totalDamageDealt: 0,
  
  // Input tracking
  keys: {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
    shift: false,
    z: false
  }
};

// Expose globally
window.getGameState = () => gameState;