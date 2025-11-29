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
  
  // Visual effects
  lightningBolts: [], // { x1, y1, x2, y2, lifetime }
  
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

// Enemy types - Enhanced colors for better visual distinction
export const ENEMY_TYPES = {
  GOBLIN: {
    name: "GOBLIN",
    radius: 8,
    health: 30,
    damage: 10,
    speed: 0.6,
    expValue: 25,
    pointsValue: 10,
    color: [255, 30, 30] // Bright red
  },
  SPIDER: {
    name: "SPIDER",
    size: 10,
    health: 20,
    damage: 8,
    speed: 1.1,
    expValue: 30,
    pointsValue: 25,
    color: [30, 255, 30] // Bright green
  },
  IMP: {
    name: "IMP",
    size: 12,
    health: 40,
    damage: 15,
    speed: 0.7,
    expValue: 45,
    pointsValue: 40,
    color: [200, 30, 255], // Bright purple/magenta
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
    color: [150, 90, 40] // Orange-brown
  },
  WRAITH: {
    name: "WRAITH",
    size: 12,
    health: 25,
    damage: 12,
    speed: 1.3,
    expValue: 50,
    pointsValue: 45,
    color: [100, 200, 255], // Cyan/light blue
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
    color: [150, 0, 200], // Deep purple
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
    color: [120, 120, 120] // Gray
  },
  MINIBOSS: {
    name: "MINIBOSS",
    radius: 20,
    health: 300,
    damage: 20,
    speed: 0.5,
    expValue: 150,
    pointsValue: 200,
    color: [255, 220, 0] // Bright gold/yellow
  },
  BOSS: {
    name: "BOSS",
    radius: 30,
    health: 800,
    damage: 30,
    speed: 0.4,
    expValue: 300,
    pointsValue: 1000,
    color: [200, 0, 0], // Dark red
    shootInterval: 2000
  }
};

// Level configurations - 9 levels with progressive difficulty
export const LEVEL_CONFIGS = {
  // EASY LEVELS (1-3) - Tutorial and basic introduction
  1: {
    duration: 60000, // 60 seconds
    name: "First Steps",
    clearMessage: "Level 1 Complete! You're getting the hang of it!",
    completionBonus: 300,
    spawnConfig: [
      { time: 0, type: "GOBLIN", rate: 2000, maxEnemies: 5 },
      { time: 15000, type: "SPIDER", rate: 4000, maxEnemies: 6, groupSize: 1 },
      { time: 30000, type: "GOBLIN", rate: 1500, maxEnemies: 8 }
    ]
  },
  2: {
    duration: 75000, // 75 seconds
    name: "Growing Threat",
    clearMessage: "Level 2 Complete! The challenge increases!",
    completionBonus: 400,
    spawnConfig: [
      { time: 0, type: "GOBLIN", rate: 1800, maxEnemies: 8 },
      { time: 0, type: "SPIDER", rate: 3500, maxEnemies: 8, groupSize: 2 },
      { time: 20000, type: "IMP", rate: 5000, maxEnemies: 10 },
      { time: 40000, type: "SPIDER", rate: 2500, maxEnemies: 12, groupSize: 2 }
    ]
  },
  3: {
    duration: 90000, // 90 seconds
    name: "Rising Danger",
    clearMessage: "Level 3 Complete! You're ready for tougher challenges!",
    completionBonus: 500,
    spawnConfig: [
      { time: 0, type: "GOBLIN", rate: 1500, maxEnemies: 10 },
      { time: 0, type: "SPIDER", rate: 3000, maxEnemies: 10, groupSize: 2 },
      { time: 15000, type: "IMP", rate: 4000, maxEnemies: 12 },
      { time: 30000, type: "BRUTE", rate: 6000, maxEnemies: 14 },
      { time: 50000, type: "SPIDER", rate: 2000, maxEnemies: 16, groupSize: 3 }
    ]
  },
  
  // MEDIUM LEVELS (4-6) - Moderate challenge with more variety
  4: {
    duration: 120000, // 120 seconds
    name: "The Proving Grounds",
    clearMessage: "Level 4 Complete! Your skills are improving!",
    completionBonus: 700,
    spawnConfig: [
      { time: 0, type: "GOBLIN", rate: 1200, maxEnemies: 12 },
      { time: 0, type: "SPIDER", rate: 4000, maxEnemies: 12, groupSize: 2 },
      { time: 10000, type: "IMP", rate: 5000, maxEnemies: 14 },
      { time: 20000, type: "BRUTE", rate: 6000, maxEnemies: 16 },
      { time: 30000, type: "WRAITH", rate: 7000, maxEnemies: 18 },
      { time: 50000, type: "SPIDER", rate: 2500, maxEnemies: 20, groupSize: 3 },
      { time: 70000, type: "GOBLIN", rate: 1000, maxEnemies: 22, speedMultiplier: 1.1 }
    ]
  },
  5: {
    duration: 150000, // 150 seconds
    name: "Escalating Chaos",
    clearMessage: "Level 5 Complete! The horde grows stronger!",
    completionBonus: 900,
    spawnConfig: [
      { time: 0, type: "GOBLIN", rate: 1100, maxEnemies: 15 },
      { time: 0, type: "SPIDER", rate: 3500, maxEnemies: 15, groupSize: 3 },
      { time: 0, type: "IMP", rate: 5500, maxEnemies: 15 },
      { time: 15000, type: "BRUTE", rate: 5000, maxEnemies: 18 },
      { time: 25000, type: "WRAITH", rate: 5500, maxEnemies: 20 },
      { time: 40000, type: "NECROMANCER", rate: 8000, maxEnemies: 22 },
      { time: 60000, type: "SPIDER", rate: 2500, maxEnemies: 25, groupSize: 4 },
      { time: 80000, type: "IMP", rate: 4000, maxEnemies: 28 },
      { time: 100000, type: "BRUTE", rate: 4000, maxEnemies: 30, healthMultiplier: 1.1 }
    ]
  },
  6: {
    duration: 180000, // 180 seconds
    name: "Trial by Fire",
    clearMessage: "Level 6 Complete! A mini-boss defeated!",
    completionBonus: 1200,
    spawnConfig: [
      { time: 0, type: "GOBLIN", rate: 1000, maxEnemies: 18 },
      { time: 0, type: "SPIDER", rate: 4000, maxEnemies: 18, groupSize: 3 },
      { time: 0, type: "IMP", rate: 6000, maxEnemies: 18 },
      { time: 10000, type: "BRUTE", rate: 5000, maxEnemies: 22 },
      { time: 20000, type: "WRAITH", rate: 5000, maxEnemies: 25 },
      { time: 35000, type: "NECROMANCER", rate: 7000, maxEnemies: 28 },
      { time: 50000, type: "SPIDER", rate: 3000, maxEnemies: 30, groupSize: 4 },
      { time: 70000, type: "GOBLIN", rate: 800, maxEnemies: 32, speedMultiplier: 1.2 },
      { time: 90000, type: "IMP", rate: 4000, maxEnemies: 35 },
      { time: 120000, type: "WRAITH", rate: 4000, maxEnemies: 38 },
      { time: 150000, type: "MINIBOSS", rate: 999999, maxEnemies: 40, once: true }
    ]
  },
  
  // HARD LEVELS (7-9) - Ultimate challenge
  7: {
    duration: 210000, // 210 seconds (3.5 minutes)
    name: "Into the Abyss",
    clearMessage: "Level 7 Complete! The darkness deepens...",
    completionBonus: 1500,
    spawnConfig: [
      { time: 0, type: "GOBLIN", rate: 900, maxEnemies: 25, speedMultiplier: 1.15 },
      { time: 0, type: "SPIDER", rate: 3000, maxEnemies: 25, groupSize: 4 },
      { time: 0, type: "IMP", rate: 5000, maxEnemies: 25 },
      { time: 0, type: "BRUTE", rate: 5000, maxEnemies: 25, healthMultiplier: 1.2 },
      { time: 10000, type: "WRAITH", rate: 4500, maxEnemies: 30, speedMultiplier: 1.1 },
      { time: 20000, type: "NECROMANCER", rate: 6500, maxEnemies: 32 },
      { time: 35000, type: "GOLEM", rate: 8000, maxEnemies: 35 },
      { time: 50000, type: "SPIDER", rate: 2200, maxEnemies: 40, groupSize: 5 },
      { time: 70000, type: "GOBLIN", rate: 700, maxEnemies: 45, speedMultiplier: 1.25 },
      { time: 90000, type: "IMP", rate: 3500, maxEnemies: 48 },
      { time: 120000, type: "WRAITH", rate: 3500, maxEnemies: 50 },
      { time: 150000, type: "BRUTE", rate: 4000, maxEnemies: 52, healthMultiplier: 1.3 }
    ]
  },
  8: {
    duration: 240000, // 240 seconds (4 minutes)
    name: "Nightmare Realm",
    clearMessage: "Level 8 Complete! One more challenge remains!",
    completionBonus: 1800,
    spawnConfig: [
      { time: 0, type: "GOBLIN", rate: 800, maxEnemies: 30, speedMultiplier: 1.2, healthMultiplier: 1.3 },
      { time: 0, type: "SPIDER", rate: 2800, maxEnemies: 30, groupSize: 4, speedMultiplier: 1.1 },
      { time: 0, type: "IMP", rate: 4500, maxEnemies: 30 },
      { time: 0, type: "BRUTE", rate: 4500, maxEnemies: 30, healthMultiplier: 1.3 },
      { time: 5000, type: "WRAITH", rate: 4000, maxEnemies: 35, speedMultiplier: 1.15 },
      { time: 15000, type: "NECROMANCER", rate: 6000, maxEnemies: 38 },
      { time: 25000, type: "GOLEM", rate: 7500, maxEnemies: 42 },
      { time: 40000, type: "SPIDER", rate: 2000, maxEnemies: 48, groupSize: 5 },
      { time: 60000, type: "GOBLIN", rate: 650, maxEnemies: 52, speedMultiplier: 1.3 },
      { time: 80000, type: "IMP", rate: 3200, maxEnemies: 55 },
      { time: 100000, type: "WRAITH", rate: 3200, maxEnemies: 58 },
      { time: 120000, type: "MINIBOSS", rate: 999999, maxEnemies: 60, once: true, healthMultiplier: 1.2 },
      { time: 150000, type: "NECROMANCER", rate: 5000, maxEnemies: 62 },
      { time: 180000, type: "BRUTE", rate: 3500, maxEnemies: 65, healthMultiplier: 1.4 }
    ]
  },
  9: {
    duration: 300000, // 300 seconds (5 minutes)
    name: "The Final Reckoning",
    clearMessage: "Level 9 Complete! YOU ARE THE ULTIMATE SURVIVOR!",
    completionBonus: 2500,
    spawnConfig: [
      { time: 0, type: "GOBLIN", rate: 700, maxEnemies: 35, speedMultiplier: 1.25, healthMultiplier: 1.5 },
      { time: 0, type: "SPIDER", rate: 2500, maxEnemies: 35, groupSize: 5, speedMultiplier: 1.15 },
      { time: 0, type: "IMP", rate: 4000, maxEnemies: 35, healthMultiplier: 1.2 },
      { time: 0, type: "BRUTE", rate: 4000, maxEnemies: 35, healthMultiplier: 1.4 },
      { time: 5000, type: "WRAITH", rate: 3500, maxEnemies: 40, speedMultiplier: 1.2 },
      { time: 10000, type: "NECROMANCER", rate: 5500, maxEnemies: 45 },
      { time: 20000, type: "GOLEM", rate: 7000, maxEnemies: 50 },
      { time: 35000, type: "SPIDER", rate: 1800, maxEnemies: 55, groupSize: 6 },
      { time: 50000, type: "GOBLIN", rate: 600, maxEnemies: 60, speedMultiplier: 1.35 },
      { time: 70000, type: "IMP", rate: 3000, maxEnemies: 65 },
      { time: 90000, type: "WRAITH", rate: 3000, maxEnemies: 68 },
      { time: 110000, type: "BRUTE", rate: 3200, maxEnemies: 70, healthMultiplier: 1.5 },
      { time: 130000, type: "NECROMANCER", rate: 4500, maxEnemies: 72 },
      { time: 150000, type: "GOLEM", rate: 5500, maxEnemies: 75, healthMultiplier: 1.3 },
      { time: 180000, type: "SPIDER", rate: 1500, maxEnemies: 78, groupSize: 6 },
      { time: 210000, type: "GOBLIN", rate: 500, maxEnemies: 80, speedMultiplier: 1.4 },
      { time: 240000, type: "BOSS", rate: 999999, maxEnemies: 85, once: true, healthMultiplier: 1.3, speedMultiplier: 1.1 }
    ]
  }
};

// Upgrade pool - Focused on weapons and sword upgrades only
export const UPGRADE_POOL = [
  // Projectile Weapons
  { type: "WEAPON", name: "Arcane Orb", description: "Fires slow, powerful orbs", effect: { weapon: "ARCANE_ORB" } },
  { type: "WEAPON", name: "Triple Shot", description: "Fire 3 projectiles in a cone", effect: { weapon: "TRIPLE_SHOT" } },
  { type: "WEAPON", name: "Rapid Fire", description: "Fast firing projectiles", effect: { weapon: "RAPID_FIRE" } },
  { type: "WEAPON", name: "Lightning Chain", description: "Strikes jump between enemies", effect: { weapon: "LIGHTNING_CHAIN" } },
  { type: "WEAPON", name: "Boomerang", description: "Returns after hitting", effect: { weapon: "BOOMERANG" } },
  { type: "WEAPON", name: "Laser Beam", description: "Continuous damage beam", effect: { weapon: "LASER_BEAM" } },
  { type: "WEAPON", name: "Explosive Shot", description: "Area damage projectiles", effect: { weapon: "EXPLOSIVE_SHOT" } },
  
  // Sword Upgrades
  { type: "WEAPON", name: "Faster Sword", description: "Swing sword 50% faster", effect: { swordSpeed: 0.5 } },
  { type: "WEAPON", name: "Longer Sword", description: "Increases sword reach", effect: { swordRange: 20 } },
  { type: "WEAPON", name: "Wider Swing", description: "Bigger sword arc", effect: { swordArc: 0.5 } },
  { type: "WEAPON", name: "Double Swords", description: "Swing two swords at once", effect: { doubleSwords: true } },
  { type: "WEAPON", name: "Heavy Blade", description: "+15 sword damage", effect: { swordDamage: 15 } },
  { type: "WEAPON", name: "Spinning Blade", description: "Full 360° sword spin", effect: { spinAttack: true } },
  
  // Essential stat upgrades only (very impactful)
  { type: "WEAPON", name: "+50 Max HP", description: "Greatly increases health", effect: { maxHealth: 50, healAmount: 50 } },
  { type: "WEAPON", name: "Swift Feet", description: "+30% movement speed", effect: { moveSpeed: 0.3 } },
  { type: "WEAPON", name: "Lifesteal", description: "Heal 8% of damage dealt", effect: { lifesteal: 0.08 } },
  { type: "WEAPON", name: "Critical Strike", description: "+25% crit chance for 3x damage", effect: { critChance: 0.25, critDamage: 1.0 } }
];