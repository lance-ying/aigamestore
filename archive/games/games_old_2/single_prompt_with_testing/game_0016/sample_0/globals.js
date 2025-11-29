// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const FISHING_PHASES = {
  SURFACE: "SURFACE",
  DESCENDING: "DESCENDING",
  ASCENDING: "ASCENDING",
  SHOP: "SHOP"
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  cash: 0,
  gamePhase: GAME_PHASES.START,
  fishingPhase: FISHING_PHASES.SURFACE,
  controlMode: "HUMAN",
  
  // Player stats
  maxDepth: 200,
  currentDepth: 0,
  descentSpeed: 2,
  lureX: CANVAS_WIDTH / 2,
  lureY: 50,
  
  // Upgrades
  lineUpgradeLevel: 0,
  speedUpgradeLevel: 0,
  weaponUpgradeLevel: 0,
  
  // Fish caught
  fishCaught: [],
  uniqueSpeciesCaught: new Set(),
  
  // Location progression
  currentLocation: 0,
  unlockedLocations: 1,
  
  // Projectiles
  projectiles: [],
  
  // Frame counters
  framesSinceLastShot: 0,
  
  // Position history for testing
  positionHistory: []
};

export const LOCATIONS = [
  {
    name: "Shallow Bay",
    unlockCash: 0,
    maxDepth: 200,
    fishTypes: ["Sardine", "Mackerel", "Anchovy", "Herring"],
    bgColor: [100, 150, 200]
  },
  {
    name: "Coral Reef",
    unlockCash: 1000,
    maxDepth: 350,
    fishTypes: ["Clownfish", "Tang", "Angelfish", "Butterflyfish", "Parrotfish"],
    bgColor: [80, 180, 220]
  },
  {
    name: "Deep Ocean",
    unlockCash: 5000,
    maxDepth: 500,
    fishTypes: ["Tuna", "Swordfish", "Marlin", "Barracuda", "Mahi-Mahi"],
    bgColor: [40, 80, 140]
  },
  {
    name: "Abyss",
    unlockCash: 10000,
    maxDepth: 650,
    fishTypes: ["Anglerfish", "Viperfish", "Gulper Eel", "Giant Squid", "Oarfish"],
    bgColor: [20, 30, 60]
  }
];

export const FISH_DATA = {
  // Shallow Bay
  "Sardine": { value: 5, size: 15, speed: 1.5, rarity: 1, color: [180, 180, 180] },
  "Mackerel": { value: 8, size: 20, speed: 2, rarity: 1, color: [120, 150, 180] },
  "Anchovy": { value: 4, size: 12, speed: 1.8, rarity: 1, color: [150, 150, 150] },
  "Herring": { value: 7, size: 18, speed: 1.6, rarity: 1, color: [140, 160, 180] },
  
  // Coral Reef
  "Clownfish": { value: 15, size: 16, speed: 2.2, rarity: 2, color: [255, 140, 0] },
  "Tang": { value: 18, size: 18, speed: 2.5, rarity: 2, color: [100, 150, 255] },
  "Angelfish": { value: 22, size: 20, speed: 2, rarity: 2, color: [255, 200, 100] },
  "Butterflyfish": { value: 20, size: 17, speed: 2.3, rarity: 2, color: [255, 255, 100] },
  "Parrotfish": { value: 25, size: 22, speed: 1.8, rarity: 2, color: [100, 255, 150] },
  
  // Deep Ocean
  "Tuna": { value: 35, size: 28, speed: 3, rarity: 3, color: [80, 100, 140] },
  "Swordfish": { value: 50, size: 35, speed: 3.5, rarity: 3, color: [120, 130, 150] },
  "Marlin": { value: 60, size: 38, speed: 3.2, rarity: 3, color: [100, 120, 180] },
  "Barracuda": { value: 45, size: 32, speed: 3.8, rarity: 3, color: [140, 150, 160] },
  "Mahi-Mahi": { value: 40, size: 30, speed: 3.3, rarity: 3, color: [100, 200, 100] },
  
  // Abyss
  "Anglerfish": { value: 80, size: 25, speed: 1.5, rarity: 4, color: [60, 40, 80] },
  "Viperfish": { value: 90, size: 28, speed: 2, rarity: 4, color: [80, 60, 100] },
  "Gulper Eel": { value: 100, size: 40, speed: 1.8, rarity: 4, color: [50, 30, 70] },
  "Giant Squid": { value: 120, size: 50, speed: 2.2, rarity: 4, color: [140, 80, 80] },
  "Oarfish": { value: 150, size: 60, speed: 1.5, rarity: 4, color: [180, 120, 120] }
};

export const UPGRADES = {
  line: [
    { cost: 100, depthIncrease: 50 },
    { cost: 300, depthIncrease: 75 },
    { cost: 600, depthIncrease: 100 },
    { cost: 1200, depthIncrease: 150 }
  ],
  speed: [
    { cost: 150, speedMultiplier: 1.15 },
    { cost: 400, speedMultiplier: 1.15 },
    { cost: 800, speedMultiplier: 1.15 },
    { cost: 1500, speedMultiplier: 1.2 }
  ],
  weapon: [
    { cost: 200, projectileIncrease: 1 },
    { cost: 500, projectileIncrease: 1 },
    { cost: 1000, damageMultiplier: 1.2 },
    { cost: 2000, damageMultiplier: 1.5 }
  ]
};

// Win conditions
export const WIN_CONDITIONS = {
  minCash: 15000,
  minUniqueSpecies: 15,
  allLocationsUnlocked: true,
  maxUpgradeLevels: true
};