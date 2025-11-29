// globals.js
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
  TEST_1: "TEST_1",
  TEST_2: "TEST_2",
  TEST_3: "TEST_3"
};

// Game state - single source of truth
export const gameState = {
  player: null,
  entities: [],
  party: [],
  enemies: [],
  loot: [],
  projectiles: [],
  particles: [],
  score: 0,
  mission: 1,
  totalMissions: 8,
  enemiesDefeated: 0,
  enemiesThisMission: 0,
  enemiesPerMission: 10,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  camera: { x: 0, y: 0 },
  worldBounds: { minX: -400, maxX: 400, minY: -300, maxY: 300 },
  dashCooldown: 0,
  specialCharge: 0,
  maxSpecialCharge: 100,
  keys: {},
  framesSinceLastEnemy: 0
};

// Hero class data
export const HERO_CLASSES = {
  KNIGHT: {
    name: "Knight",
    color: [100, 150, 255],
    baseHp: 120,
    baseDamage: 15,
    baseSpeed: 2.5,
    skillName: "Shield Bash",
    skillCooldown: 180,
    skillColor: [150, 180, 255]
  },
  MAGE: {
    name: "Mage",
    color: [200, 100, 255],
    baseHp: 80,
    baseDamage: 25,
    baseSpeed: 2,
    skillName: "Fireball",
    skillCooldown: 240,
    skillColor: [255, 150, 50]
  },
  ARCHER: {
    name: "Archer",
    color: [100, 255, 100],
    baseHp: 90,
    baseDamage: 18,
    baseSpeed: 3,
    skillName: "Multi-Shot",
    skillCooldown: 200,
    skillColor: [150, 255, 150]
  },
  WARRIOR: {
    name: "Warrior",
    color: [255, 100, 100],
    baseHp: 110,
    baseDamage: 20,
    baseSpeed: 2.8,
    skillName: "Whirlwind",
    skillCooldown: 220,
    skillColor: [255, 150, 150]
  }
};

// Loot rarity tiers
export const LOOT_RARITY = {
  COMMON: { name: "Common", color: [200, 200, 200], statBonus: 1 },
  UNCOMMON: { name: "Uncommon", color: [100, 255, 100], statBonus: 2 },
  RARE: { name: "Rare", color: [100, 150, 255], statBonus: 3 },
  EPIC: { name: "Epic", color: [200, 100, 255], statBonus: 5 },
  LEGENDARY: { name: "Legendary", color: [255, 200, 50], statBonus: 8 }
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;