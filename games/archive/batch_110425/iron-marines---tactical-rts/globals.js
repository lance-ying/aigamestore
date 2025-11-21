// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Map constants
export const MAP_WIDTH = 1200;
export const MAP_HEIGHT = 800;
export const SCROLL_SPEED = 8;

// Unit types
export const UNIT_COMMANDO = "COMMANDO";
export const UNIT_SNIPER = "SNIPER";
export const UNIT_HEAVY = "HEAVY";

// Game balance constants
export const INITIAL_ENERGY = 100;
export const MAX_ENERGY = 300;
export const ENERGY_REGEN_RATE = 0.3;
export const DEPLOY_COST = 40;
export const UPGRADE_COST = 50;
export const HERO_ABILITY_COST = 60;
export const HERO_ABILITY_COOLDOWN = 180; // 3 seconds at 60 FPS

export const TURRET_COST = 80;
export const MAX_TURRETS = 3;

// Unit stats
export const UNIT_STATS = {
  [UNIT_COMMANDO]: {
    health: 100,
    damage: 10,
    range: 80,
    attackSpeed: 60,
    speed: 2,
    color: [100, 200, 100]
  },
  [UNIT_SNIPER]: {
    health: 60,
    damage: 25,
    range: 150,
    attackSpeed: 90,
    speed: 1.5,
    color: [100, 150, 255]
  },
  [UNIT_HEAVY]: {
    health: 200,
    damage: 15,
    range: 60,
    attackSpeed: 45,
    speed: 1,
    color: [200, 100, 100]
  }
};

// Enemy stats
export const ENEMY_STATS = {
  basic: {
    health: 50,
    damage: 8,
    range: 50,
    attackSpeed: 60,
    speed: 1.2,
    reward: 20,
    color: [255, 100, 100]
  },
  fast: {
    health: 30,
    damage: 5,
    range: 40,
    attackSpeed: 45,
    speed: 2.5,
    reward: 15,
    color: [255, 150, 50]
  },
  tank: {
    health: 150,
    damage: 12,
    range: 50,
    attackSpeed: 75,
    speed: 0.8,
    reward: 40,
    color: [150, 50, 50]
  }
};

// Game state
export const gameState = {
  player: null,
  entities: [],
  units: [],
  enemies: [],
  turrets: [],
  projectiles: [],
  particles: [],
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  energy: INITIAL_ENERGY,
  score: 0,
  wave: 0,
  enemiesKilled: 0,
  totalWaves: 5,
  cameraX: 0,
  cameraY: 0,
  cursorX: CANVAS_WIDTH / 2,
  cursorY: CANVAS_HEIGHT / 2,
  selectedUnitType: UNIT_COMMANDO,
  heroAbilityCooldown: 0,
  heroAbilityActive: false,
  missionObjectives: {
    capturedPoints: 0,
    requiredPoints: 3
  },
  capturePoints: [],
  keysPressed: {}
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}