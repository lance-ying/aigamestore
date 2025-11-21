// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE",
  UPGRADE_SELECTION: "UPGRADE_SELECTION",
  LEVEL_TRANSITION: "LEVEL_TRANSITION"
};

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2"
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  projectiles: [],
  expGems: [],
  enemies: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  
  // Level system
  currentLevel: 1,
  levelStartTime: 0,
  levelDuration: 0,
  
  // Spawn system
  lastEnemySpawn: 0,
  enemySpawnRate: 2000,
  maxEnemiesOnScreen: 8,
  
  // Upgrade system
  availableUpgrades: [],
  selectedUpgradeIndex: 0,
  
  // Transition
  transitionStartTime: 0,
  transitionDuration: 3000,
  transitionMessage: "",
  
  // Boss tracking
  bossSpawned: false,
  miniBossSpawned: false,
  bossDefeated: false,
  
  // Testing
  testingFrameCount: 0,
  testingAutoUpgrade: false
};

// Player constants
export const PLAYER_CONFIG = {
  startX: CANVAS_WIDTH / 2,
  startY: CANVAS_HEIGHT / 2,
  radius: 10,
  maxHealth: 100,
  baseSpeed: 2.5,
  baseDamage: 25,
  baseAttackSpeed: 1.0,
  projectileSpeed: 5,
  invincibilityDuration: 60,
  expToLevel: 150,
  expGrowthRate: 1.4,
  swordRange: 40,
  swordArc: Math.PI / 2
};

// Enemy types - Reduced speeds by ~40%
export const ENEMY_TYPES = {
  GOBLIN: {
    name: "GOBLIN",
    radius: 8,
    health: 30,
    damage: 10,
    speed: 0.6,
    expValue: 25,
    pointsValue: 10,
    color: [255, 50, 50]
  },
  SPIDER: {
    name: "SPIDER",
    size: 10,
    health: 20,
    damage: 8,
    speed: 1.1,
    expValue: 30,
    pointsValue: 25,
    color: [50, 255, 50]
  },
  IMP: {
    name: "IMP",
    size: 12,
    health: 40,
    damage: 15,
    speed: 0.7,
    expValue: 45,
    pointsValue: 40,
    color: [150, 50, 255],
    shootInterval: 3000
  },
  BRUTE: {
    name: "BRUTE",
    radius: 15,
    health: 80,
    damage: 25,
    speed: 0.4,
    expValue: 60,
    pointsValue: 50,
    color: [120, 80, 40]
  },
  WRAITH: {
    name: "WRAITH",
    size: 12,
    health: 25,
    damage: 12,
    speed: 1.3,
    expValue: 50,
    pointsValue: 45,
    color: [180, 180, 255],
    teleportInterval: 5000
  },
  NECROMANCER: {
    name: "NECROMANCER",
    size: 14,
    health: 50,
    damage: 10,
    speed: 0.5,
    expValue: 90,
    pointsValue: 75,
    color: [100, 0, 100],
    shootInterval: 4000,
    summonInterval: 8000
  },
  GOLEM: {
    name: "GOLEM",
    radius: 18,
    health: 120,
    damage: 30,
    speed: 0.3,
    expValue: 120,
    pointsValue: 100,
    color: [100, 100, 100]
  },
  MINIBOSS: {
    name: "MINIBOSS",
    radius: 20,
    health: 300,
    damage: 20,
    speed: 0.5,
    expValue: 150,
    pointsValue: 200,
    color: [255, 220, 50]
  },
  BOSS: {
    name: "BOSS",
    radius: 30,
    health: 800,
    damage: 30,
    speed: 0.4,
    expValue: 300,
    pointsValue: 1000,
    color: [180, 30, 30],
    shootInterval: 2000
  }
};

// Level configurations - Added more enemy variety
export const LEVEL_CONFIGS = {
  1: {
    duration: 120000, // 120 seconds
    name: "The Training Grounds",
    clearMessage: "Level 1 Cleared! Prepare for the Swarm.",
    completionBonus: 500,
    spawnConfig: [
      { time: 0, type: "GOBLIN", rate: 2500, maxEnemies: 8 },
      { time: 20000, type: "SPIDER", rate: 12000, maxEnemies: 10 },
      { time: 40000, type: "IMP", rate: 15000, maxEnemies: 12 },
      { time: 60000, type: "BRUTE", rate: 18000, maxEnemies: 12 },
      { time: 80000, type: "GOBLIN", rate: 2000, maxEnemies: 14, speedMultiplier: 1.1 }
    ]
  },
  2: {
    duration: 180000, // 180 seconds
    name: "The Swarm Plains",
    clearMessage: "Level 2 Cleared! The Boss Approaches...",
    completionBonus: 1000,
    spawnConfig: [
      { time: 0, type: "GOBLIN", rate: 2000, maxEnemies: 15 },
      { time: 0, type: "SPIDER", rate: 15000, maxEnemies: 15, groupSize: 3 },
      { time: 20000, type: "IMP", rate: 18000, maxEnemies: 18 },
      { time: 30000, type: "BRUTE", rate: 12000, maxEnemies: 18 },
      { time: 60000, type: "WRAITH", rate: 10000, maxEnemies: 20 },
      { time: 90000, type: "SPIDER", rate: 10000, maxEnemies: 25 },
      { time: 120000, type: "IMP", rate: 12000, maxEnemies: 28 },
      { time: 150000, type: "MINIBOSS", rate: 999999, maxEnemies: 30, once: true }
    ]
  },
  3: {
    duration: 240000, // 240 seconds
    name: "The Dark Sanctum",
    clearMessage: "Level 3 Cleared! You are a Monster Survivor!",
    completionBonus: 2000,
    spawnConfig: [
      { time: 0, type: "GOBLIN", rate: 1500, maxEnemies: 30, speedMultiplier: 1.2, healthMultiplier: 1.5 },
      { time: 0, type: "SPIDER", rate: 8000, maxEnemies: 30, groupSize: 3, speedMultiplier: 1.1 },
      { time: 0, type: "IMP", rate: 20000, maxEnemies: 30 },
      { time: 30000, type: "BRUTE", rate: 10000, maxEnemies: 35, healthMultiplier: 1.3 },
      { time: 30000, type: "WRAITH", rate: 12000, maxEnemies: 35, speedMultiplier: 1.1 },
      { time: 60000, type: "NECROMANCER", rate: 15000, maxEnemies: 38 },
      { time: 90000, type: "GOLEM", rate: 20000, maxEnemies: 40 },
      { time: 120000, type: "BOSS", rate: 999999, maxEnemies: 40, once: true }
    ]
  }
};

// Upgrade pool - Updated piercing description to clarify it only affects projectiles
export const UPGRADE_POOL = [
  // Weapons
  { type: "WEAPON", name: "Arcane Orb", description: "Fires slow, powerful orbs", effect: { weapon: "ARCANE_ORB" } },
  { type: "WEAPON", name: "Triple Shot", description: "Fire 3 projectiles in a cone", effect: { weapon: "TRIPLE_SHOT" } },
  { type: "WEAPON", name: "Rapid Fire", description: "Fast firing projectiles", effect: { weapon: "RAPID_FIRE" } },
  { type: "WEAPON", name: "Lightning Chain", description: "Strikes jump between enemies", effect: { weapon: "LIGHTNING_CHAIN" } },
  { type: "WEAPON", name: "Boomerang", description: "Returns after hitting", effect: { weapon: "BOOMERANG" } },
  { type: "WEAPON", name: "Laser Beam", description: "Continuous damage beam", effect: { weapon: "LASER_BEAM" } },
  { type: "WEAPON", name: "Explosive Shot", description: "Area damage projectiles", effect: { weapon: "EXPLOSIVE_SHOT" } },
  
  // Stats - Offensive
  { type: "STAT", name: "+10% Attack Speed", description: "Increases attack rate", effect: { attackSpeed: 0.1 } },
  { type: "STAT", name: "+1 Projectile", description: "Fire one more projectile", effect: { projectileCount: 1 } },
  { type: "STAT", name: "+20% Projectile Speed", description: "Projectiles move faster", effect: { projectileSpeed: 0.2 } },
  { type: "STAT", name: "+5 Base Damage", description: "Deal more damage", effect: { baseDamage: 5 } },
  { type: "STAT", name: "+15% Crit Chance", description: "Chance for 2x damage", effect: { critChance: 0.15 } },
  { type: "STAT", name: "+50% Crit Damage", description: "Critical hits deal more", effect: { critDamage: 0.5 } },
  { type: "STAT", name: "Piercing Shots", description: "Projectiles hit 1 additional enemy", effect: { piercing: 1 } },
  
  // Stats - Defensive
  { type: "STAT", name: "+25 Max HP", description: "Increases maximum health", effect: { maxHealth: 25, healAmount: 25 } },
  { type: "STAT", name: "+15% Movement Speed", description: "Move faster", effect: { moveSpeed: 0.15 } },
  { type: "STAT", name: "Health Regen", description: "Restore 1 HP per second", effect: { healthRegen: 1 } },
  { type: "STAT", name: "Thorns", description: "Reflect 20% damage", effect: { thorns: 0.2 } },
  { type: "STAT", name: "Lifesteal", description: "Heal 5% of damage dealt", effect: { lifesteal: 0.05 } },
  
  // Stats - Utility
  { type: "STAT", name: "Damage Aura", description: "Damage nearby enemies", effect: { aura: true } },
  { type: "STAT", name: "+10% EXP Gain", description: "Level up faster", effect: { expMultiplier: 0.1 } },
  { type: "STAT", name: "Magnet Range", description: "Attract gems from farther", effect: { magnetRange: 30 } },
  { type: "STAT", name: "+20% Aura Size", description: "Larger damage aura", effect: { auraSize: 0.2 } },
  { type: "STAT", name: "+3 Aura Damage", description: "Aura deals more damage", effect: { auraDamage: 3 } }
];