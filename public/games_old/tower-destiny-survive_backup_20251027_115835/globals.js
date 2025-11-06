// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  LEVEL_COMPLETE: "LEVEL_COMPLETE",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Player/Tower
  player: null,
  towerX: CANVAS_WIDTH / 2,
  towerHealth: 100,
  towerMaxHealth: 100,
  towerSpeed: 4,
  facingRight: true, // New: direction tower is facing
  
  // Energy system
  energy: 100,
  maxEnergy: 100,
  energyRegenRate: 0.5, // energy per frame
  shotEnergyCost: 15, // energy per shot
  
  // Combo system
  comboCount: 0,
  comboTimer: 0,
  comboTimeLimit: 120, // frames to maintain combo
  comboMultiplier: 1,
  
  // Game progression
  currentLevel: 1,
  currentWave: 0,
  zombiesSpawnedInWave: 0,
  zombiesRemainingInWave: 0,
  totalZombiesInLevel: 0,
  waveSpawnTimer: 0,
  waveSpawnDelay: 60,
  
  // Resources and score
  blocksCollected: 0,
  score: 0,
  highScore: 0,
  
  // Entities
  entities: [],
  bullets: [],
  zombies: [],
  blocks: [],
  particles: [],
  powerups: [],
  
  // Weapons
  weapons: [
    {
      type: "cannon",
      damage: 20,
      fireRate: 30,
      lastFired: 0,
      unlocked: true
    },
    {
      type: "machinegun",
      damage: 10,
      fireRate: 10,
      lastFired: 0,
      unlocked: false
    }
  ],
  activeWeaponSlots: 1,
  
  // Power-up effects
  powerupEffects: {
    damageBoost: 0,
    damageBoostTimer: 0
  },
  
  // Upgrade costs
  upgradeCosts: {
    health: 10,
    weaponDamage: 15,
    weaponFireRate: 20,
    secondSlot: 50,
    unlockMachinegun: 100
  },
  
  // Level configuration
  levels: [
    {
      waves: 3,
      zombiesPerWave: [8, 10, 12],
      zombieTypes: ["basic"],
      zombieSpeed: 1.0,
      blockFrequency: 180
    },
    {
      waves: 4,
      zombiesPerWave: [10, 12, 15, 18],
      zombieTypes: ["basic", "fast"],
      zombieSpeed: 1.2,
      blockFrequency: 240
    },
    {
      waves: 5,
      zombiesPerWave: [12, 15, 18, 20, 25],
      zombieTypes: ["basic", "fast", "tank"],
      zombieSpeed: 1.5,
      blockFrequency: 300
    }
  ],
  
  // Timers
  blockSpawnTimer: 0,
  frameCount: 0,
  
  // UI state
  upgradeMenuOpen: false,
  selectedUpgrade: null
};

// Make gameState accessible globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}