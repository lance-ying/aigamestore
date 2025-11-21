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

export const SCREENS = {
  COMBAT: "COMBAT",
  UPGRADE: "UPGRADE"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentScreen: SCREENS.COMBAT,
  
  // Player stats
  player: {
    level: 1,
    exp: 0,
    expToLevel: 100,
    gold: 0,
    attack: 10,
    defense: 5,
    maxHp: 100,
    hp: 100,
    baseAttack: 10,
    baseDefense: 5,
    baseMaxHp: 100
  },
  
  // Equipment system
  equipment: {
    weapon: null,
    armor: null,
    accessory: null
  },
  
  // Combat state
  combat: {
    enemy: null,
    isInCombat: false,
    combatTimer: 0,
    attackCooldown: 0,
    enemyAttackCooldown: 0,
    playerTurn: true
  },
  
  // Zone progression
  currentZone: 1,
  zoneProgress: 0,
  zonesCleared: 0,
  
  // Notifications and rewards
  notifications: [],
  combatLog: [],
  
  // Upgrade menu state
  upgradeMenu: {
    selectedIndex: 0,
    scrollOffset: 0,
    upgrades: [
      { name: "Attack +5", cost: 50, stat: "attack", value: 5 },
      { name: "Defense +3", cost: 50, stat: "defense", value: 3 },
      { name: "Max HP +20", cost: 50, stat: "maxHp", value: 20 },
      { name: "Attack +10", cost: 150, stat: "attack", value: 10 },
      { name: "Defense +8", cost: 150, stat: "defense", value: 8 },
      { name: "Max HP +50", cost: 150, stat: "maxHp", value: 50 },
      { name: "Attack +20", cost: 400, stat: "attack", value: 20 },
      { name: "Defense +15", cost: 400, stat: "defense", value: 15 },
      { name: "Max HP +100", cost: 400, stat: "maxHp", value: 100 }
    ]
  },
  
  // Time tracking
  gameTime: 0,
  idleGoldRate: 1, // gold per second when idle
  lastUpdateTime: 0,
  
  // Enemy spawn tracking
  enemiesDefeated: 0,
  bossesDefeated: 0
};

// Initialize getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}

export function getGameState() {
  return gameState;
}