// globals.js - Game constants and global state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Monster slot positions (5 slots arranged in a grid)
export const MONSTER_SLOTS = [
  { x: 150, y: 150 },
  { x: 150, y: 250 },
  { x: 250, y: 100 },
  { x: 250, y: 200 },
  { x: 250, y: 300 }
];

// Monster types with stats
export const MONSTER_TYPES = [
  { 
    name: "Goblin", 
    health: 100, 
    damage: 15, 
    attackSpeed: 60, 
    range: 80,
    skillName: "Quick Strike",
    skillCooldown: 300,
    skillEffect: "damage",
    color: [80, 180, 80]
  },
  { 
    name: "Orc", 
    health: 180, 
    damage: 25, 
    attackSpeed: 90, 
    range: 70,
    skillName: "War Cry",
    skillCooldown: 450,
    skillEffect: "buff",
    color: [100, 140, 100]
  },
  { 
    name: "Demon", 
    health: 150, 
    damage: 35, 
    attackSpeed: 75, 
    range: 90,
    skillName: "Fireball",
    skillCooldown: 360,
    skillEffect: "aoe",
    color: [200, 80, 80]
  },
  { 
    name: "Wraith", 
    health: 80, 
    damage: 20, 
    attackSpeed: 45, 
    range: 100,
    skillName: "Life Drain",
    skillCooldown: 420,
    skillEffect: "heal",
    color: [150, 100, 180]
  },
  { 
    name: "Troll", 
    health: 250, 
    damage: 20, 
    attackSpeed: 120, 
    range: 60,
    skillName: "Regenerate",
    skillCooldown: 540,
    skillEffect: "heal",
    color: [140, 120, 90]
  }
];

// Hero types
export const HERO_TYPES = [
  { 
    name: "Warrior", 
    health: 80, 
    damage: 10, 
    speed: 0.8, 
    shards: 10,
    color: [200, 180, 100]
  },
  { 
    name: "Knight", 
    health: 120, 
    damage: 15, 
    speed: 0.6, 
    shards: 15,
    color: [180, 180, 200]
  },
  { 
    name: "Paladin", 
    health: 150, 
    damage: 20, 
    speed: 0.5, 
    shards: 20,
    color: [220, 200, 150]
  },
  { 
    name: "Archer", 
    health: 60, 
    damage: 12, 
    speed: 1.0, 
    shards: 12,
    color: [100, 180, 100]
  }
];

// Upgrade types
export const UPGRADE_TYPES = [
  { type: "new_monster", name: "New Monster", description: "Add a new monster to your squad" },
  { type: "damage", name: "Damage Up", description: "+20% damage for all monsters" },
  { type: "health", name: "Health Up", description: "+30% max health for all monsters" },
  { type: "skill_cooldown", name: "Quick Skills", description: "-20% skill cooldown" },
  { type: "attack_speed", name: "Swift Strikes", description: "+15% attack speed" },
  { type: "range", name: "Extended Range", description: "+25% attack range" }
];

// Game state
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Combat state
  wave: 0,
  maxWaves: 10,
  monsters: [],
  heroes: [],
  projectiles: [],
  particles: [],
  selectedMonsterIndex: -1,
  selectedSlotIndex: 0,
  
  // Resources
  soulShards: 0,
  totalShardsEarned: 0,
  
  // Spawning
  heroSpawnTimer: 0,
  heroSpawnInterval: 180,
  heroesPerWave: 5,
  heroesSpawned: 0,
  waveComplete: false,
  
  // Upgrades
  showUpgradeScreen: false,
  upgradeOptions: [],
  selectedUpgrade: 0,
  availableMonsterTypes: [0], // Start with Goblin
  
  // Stats
  modifiers: {
    damageMultiplier: 1.0,
    healthMultiplier: 1.0,
    skillCooldownMultiplier: 1.0,
    attackSpeedMultiplier: 1.0,
    rangeMultiplier: 1.0
  },
  
  // UI
  message: "",
  messageTimer: 0
};

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function getGameState() {
  return gameState;
}