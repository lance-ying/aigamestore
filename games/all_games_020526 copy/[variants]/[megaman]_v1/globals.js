export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
};

export const gameState = {
  player: null,
  entities: [],
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  camera: { x: 0, y: 0 },
  currentStage: null,
  currentLevel: 0,
  totalLevels: 9,
  robotMastersDefeated: {},
  unlockedWeapons: [],
  currentWeapon: 0,
  weaponEnergy: {},
  bossGauntletIndex: 0,
  wilyStagePhase: 0,
  score: 0,
  lives: 5,
  maxLives: 5,
  playerHealth: 28,
  maxPlayerHealth: 28,
  bossHealth: 0,
  maxBossHealth: 28,
  particles: [],
  projectiles: [],
  platformBlocks: [],
  hazards: [],
  enemySpawners: [],
  drops: [],
  showBossHealthBar: false,
  stageComplete: false,
  transitionTimer: 0,
  invincibilityFrames: 0,
  yokublockTimer: 0,
  yokublockPattern: [],
  healingAvailable: false,
  autoRestartTimer: null, // Added for automatic restart countdown
};

export const ROBOT_MASTERS = [
  { name: "CUT", color: [200, 50, 50], weakness: "BOMB", weapon: "METAL_BLADE" },
  { name: "ELEC", color: [255, 255, 100], weakness: "METAL_BLADE", weapon: "THUNDER_BEAM" },
  { name: "ICE", color: [100, 200, 255], weakness: "THUNDER_BEAM", weapon: "ICE_SLASHER" },
  { name: "BOMB", color: [150, 150, 150], weakness: "ICE_SLASHER", weapon: "HYPER_BOMB" },
  { name: "FIRE", color: [255, 100, 50], weakness: "ICE_SLASHER", weapon: "FIRE_STORM" },
  { name: "TIME", color: [150, 100, 255], weakness: "FIRE_STORM", weapon: "TIME_STOPPER" }
];

export const WEAPONS = {
  BUSTER: { 
    name: "MEGA BUSTER", 
    energy: Infinity, 
    damage: 1, 
    color: [100, 200, 255],
    cooldown: 15,
    speed: 5,
    count: 1,
    spread: 0 
  },
  METAL_BLADE: { 
    name: "METAL BLADE", 
    energy: 28, 
    damage: 2, 
    color: [200, 200, 200],
    cooldown: 25,
    speed: 6,
    count: 2,
    spread: 0.4 // Shoots 2 blades at slight angles
  },
  THUNDER_BEAM: { 
    name: "THUNDER BEAM", 
    energy: 28, 
    damage: 3, 
    color: [255, 255, 100],
    cooldown: 45,
    speed: 7,
    count: 3,
    spread: 0.8 // Shotgun style spread
  },
  ICE_SLASHER: { 
    name: "ICE SLASHER", 
    energy: 28, 
    damage: 1, 
    color: [100, 200, 255],
    cooldown: 6, // Very fast "machine gun"
    speed: 9,
    count: 1,
    spread: 0.1 // Slight jitter
  },
  HYPER_BOMB: { 
    name: "HYPER BOMB", 
    energy: 28, 
    damage: 6, 
    color: [80, 80, 80],
    cooldown: 60, // Slow but powerful
    speed: 3,
    count: 1,
    spread: 0
  },
  FIRE_STORM: { 
    name: "FIRE STORM", 
    energy: 28, 
    damage: 2, 
    color: [255, 100, 50],
    cooldown: 50,
    speed: 4,
    count: 8,
    spread: Math.PI * 2 // All directions
  },
  TIME_STOPPER: { 
    name: "TIME STOPPER", 
    energy: 28, 
    damage: 3, 
    color: [200, 150, 255],
    cooldown: 30,
    speed: 12, // Very fast sniper shot
    count: 1,
    spread: 0
  },
  MAGNET_BEAM: { 
    name: "MAGNET BEAM", 
    energy: 28, 
    damage: 0, 
    color: [255, 50, 150],
    cooldown: 20,
    speed: 0,
    count: 0,
    spread: 0
  }
};

export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}