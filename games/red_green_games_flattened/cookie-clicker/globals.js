// globals.js - Global game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null, // Not used in idle game, but required for compatibility
  entities: [], // All game entities (buildings, cookies, etc.)
  cookies: 0,
  totalCookiesEarned: 0,
  cookiesPerSecond: 0,
  buildings: [],
  upgrades: [],
  ownedUpgrades: [],
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  currentTab: "BUILDINGS", // "BUILDINGS" or "UPGRADES"
  scrollOffset: 0,
  selectedIndex: 0,
  lastClickTime: 0,
  goldenCookies: [],
  cookieClickAnimations: [],
  manualClicks: 0,
  frameCounter: 0
};

// Building definitions
export const BUILDING_TYPES = [
  { 
    name: "Cursor", 
    baseCost: 15, 
    baseCps: 0.1, 
    description: "Autoclicks once every 10 seconds",
    icon: "cursor"
  },
  { 
    name: "Grandma", 
    baseCost: 100, 
    baseCps: 1, 
    description: "A nice grandma to bake more cookies",
    icon: "grandma"
  },
  { 
    name: "Farm", 
    baseCost: 1100, 
    baseCps: 8, 
    description: "Grows cookie plants from cookie seeds",
    icon: "farm"
  },
  { 
    name: "Mine", 
    baseCost: 12000, 
    baseCps: 47, 
    description: "Mines out cookie dough and chocolate chips",
    icon: "mine"
  },
  { 
    name: "Factory", 
    baseCost: 130000, 
    baseCps: 260, 
    description: "Produces large quantities of cookies",
    icon: "factory"
  }
];

// Upgrade definitions
export const UPGRADE_TYPES = [
  {
    id: "cursor_upgrade_1",
    name: "Reinforced Fingers",
    cost: 100,
    description: "Cursors are twice as efficient",
    requirement: { building: "Cursor", count: 1 },
    effect: { building: "Cursor", multiplier: 2 }
  },
  {
    id: "grandma_upgrade_1",
    name: "Forwards From Grandma",
    cost: 1000,
    description: "Grandmas are twice as efficient",
    requirement: { building: "Grandma", count: 1 },
    effect: { building: "Grandma", multiplier: 2 }
  },
  {
    id: "farm_upgrade_1",
    name: "Cheap Hoes",
    cost: 11000,
    description: "Farms are twice as efficient",
    requirement: { building: "Farm", count: 1 },
    effect: { building: "Farm", multiplier: 2 }
  },
  {
    id: "click_upgrade_1",
    name: "Plastic Mouse",
    cost: 50,
    description: "Manual clicking power +1",
    requirement: { clicks: 100 },
    effect: { type: "click_power", amount: 1 }
  },
  {
    id: "click_upgrade_2",
    name: "Iron Mouse",
    cost: 500,
    description: "Manual clicking power +5",
    requirement: { clicks: 500 },
    effect: { type: "click_power", amount: 5 }
  }
];

export const WIN_CONDITION = 10000; // cookies needed to win