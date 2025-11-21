// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

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
  projectiles: [],
  experienceOrbs: [],
  particles: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  levelUpPending: false,
  upgradeChoices: [],
  selectedUpgrade: null,
  waveLevel: 1,
  timeSurvived: 0,
  bossActive: false,
  currentBoss: null,
  framesSinceStart: 0,
  lastWaveIncrease: 0,
  lastBossSpawn: 0
};

// Game balance constants
export const PLAYER_CONFIG = {
  maxHealth: 100,
  baseSpeed: 2.5,
  baseDamage: 10,
  attackRange: 150,
  attackCooldown: 30, // frames
  size: 16
};

export const ENEMY_CONFIG = {
  baseHealth: 30,
  baseSpeed: 1.2,
  baseDamage: 10,
  size: 14,
  spawnRate: 90, // frames between spawns
  experienceValue: 10
};

export const BOSS_CONFIG = {
  health: 500,
  speed: 1.5,
  damage: 25,
  size: 40,
  attackCooldown: 60,
  experienceValue: 200,
  spawnInterval: 18000 // 5 minutes at 60 FPS
};

export const UPGRADE_POOL = [
  { id: 'damage', name: 'Power Shot', description: '+20% Damage', type: 'passive' },
  { id: 'speed', name: 'Swift Boots', description: '+15% Move Speed', type: 'passive' },
  { id: 'health', name: 'Vitality', description: '+20 Max Health', type: 'passive' },
  { id: 'attackSpeed', name: 'Quick Draw', description: '+25% Attack Speed', type: 'passive' },
  { id: 'range', name: 'Long Barrel', description: '+20% Attack Range', type: 'passive' },
  { id: 'piercing', name: 'Piercing Rounds', description: 'Bullets pierce enemies', type: 'active' },
  { id: 'multishot', name: 'Scatter Shot', description: 'Fire 3 bullets', type: 'active' },
  { id: 'heal', name: 'Bandage', description: 'Restore 30 Health', type: 'instant' }
];

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;