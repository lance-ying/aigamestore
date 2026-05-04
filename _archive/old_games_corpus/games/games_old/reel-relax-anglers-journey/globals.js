// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";
export const PHASE_PAUSED = "PAUSED";

// Internal game states for playing phase
export const STATE_LOCATION_SELECT = "LOCATION_SELECT";
export const STATE_SHOP = "SHOP";
export const STATE_HOME_BASE = "HOME_BASE";
export const STATE_CASTING = "CASTING";
export const STATE_WAITING_BITE = "WAITING_BITE";
export const STATE_REELING = "REELING";
export const STATE_FISH_CAUGHT = "FISH_CAUGHT";
export const STATE_LINE_SNAPPED = "LINE_SNAPPED";
export const STATE_LEVEL_COMPLETE = "LEVEL_COMPLETE";

// Key codes
export const KEY_ENTER = 13;
export const KEY_SPACE = 32;
export const KEY_ESC = 27;
export const KEY_R = 82;
export const KEY_S = 83;
export const KEY_D = 68;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_ARROW_LEFT = 37;
export const KEY_ARROW_UP = 38;
export const KEY_ARROW_RIGHT = 39;
export const KEY_ARROW_DOWN = 40;

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  internalState: STATE_LOCATION_SELECT,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  score: 0,
  cash: 0,
  currentLevel: 1,
  currentLocation: null,
  fishCaughtThisLevel: 0,
  consecutiveCatches: 0,
  highScore: 0,
  
  // Casting
  castingPower: 0,
  castingCharging: false,
  
  // Reeling
  tensionValue: 50, // 0-100
  fishStamina: 100,
  lineDurability: 100,
  reelingProgress: 0,
  fishPullForce: 0,
  timeInGreenZone: 0,
  totalReelingTime: 0,
  
  // Current fish
  currentFish: null,
  
  // Bobber position
  bobberX: 0,
  bobberY: 0,
  lineDistance: 0,
  
  // Timers
  biteTimer: 0,
  messageTimer: 0,
  messageText: "",
  
  // Gear
  equippedGear: {
    rod: null,
    reel: null,
    line: null,
    lure: null
  },
  
  // Inventory
  ownedGear: [],
  caughtFish: [],
  
  // Locations
  unlockedLocations: [1], // Level 1 unlocked by default
  
  // UI
  selectedMenuIndex: 0,
  shopCategory: "rods", // rods, reels, lines, lures
  
  // Home upgrades
  homeLevel: 0,
  
  // Stats
  totalFishCaught: 0,
  failedAttempts: 0
};

// Locations data
export const LOCATIONS = [
  {
    id: 1,
    name: "Serene Lake",
    unlockCost: 0,
    objectiveScore: 500,
    objectiveFish: 5,
    maxCastDistance: 200,
    fishTypes: ["Lake Perch", "Sunfish"],
    rarityWeights: { common: 0.8, uncommon: 0.15, rare: 0.05, legendary: 0 },
    biteChanceBase: 0.15,
    biteTimeMin: 2000,
    biteTimeMax: 5000,
    backgroundColor: [135, 206, 235]
  },
  {
    id: 2,
    name: "Cloudy River",
    unlockCost: 250,
    objectiveScore: 1500,
    objectiveFish: 7,
    maxCastDistance: 250,
    fishTypes: ["River Trout", "Catfish"],
    rarityWeights: { common: 0.6, uncommon: 0.3, rare: 0.1, legendary: 0 },
    biteChanceBase: 0.1,
    biteTimeMin: 3000,
    biteTimeMax: 7000,
    backgroundColor: [100, 150, 180]
  },
  {
    id: 3,
    name: "Rocky Coast",
    unlockCost: 750,
    objectiveScore: 3000,
    objectiveFish: 10,
    maxCastDistance: 300,
    fishTypes: ["Rock Bass", "Cod", "Flounder"],
    rarityWeights: { common: 0.5, uncommon: 0.35, rare: 0.13, legendary: 0.02 },
    biteChanceBase: 0.08,
    biteTimeMin: 4000,
    biteTimeMax: 10000,
    backgroundColor: [80, 120, 150]
  },
  {
    id: 4,
    name: "Deep Ocean Trench",
    unlockCost: 2000,
    objectiveScore: 6000,
    objectiveFish: 12,
    maxCastDistance: 350,
    fishTypes: ["Marlin", "Giant Squid", "Swordfish"],
    rarityWeights: { common: 0.3, uncommon: 0.4, rare: 0.25, legendary: 0.05 },
    biteChanceBase: 0.05,
    biteTimeMin: 5000,
    biteTimeMax: 15000,
    backgroundColor: [30, 60, 100]
  }
];

// Fish data
export const FISH_DATA = {
  "Lake Perch": { baseValue: 10, sizeRange: [0.8, 1.2], strengthRange: [1, 2] },
  "Sunfish": { baseValue: 10, sizeRange: [0.8, 1.0], strengthRange: [1, 1.5] },
  "River Trout": { baseValue: 15, sizeRange: [0.9, 1.3], strengthRange: [2, 3] },
  "Catfish": { baseValue: 12, sizeRange: [1.0, 1.5], strengthRange: [1.5, 2.5] },
  "Rock Bass": { baseValue: 20, sizeRange: [1.0, 1.4], strengthRange: [3, 4] },
  "Cod": { baseValue: 18, sizeRange: [1.1, 1.5], strengthRange: [2.5, 3.5] },
  "Flounder": { baseValue: 16, sizeRange: [0.9, 1.3], strengthRange: [2, 3] },
  "Marlin": { baseValue: 50, sizeRange: [1.2, 1.8], strengthRange: [5, 7] },
  "Giant Squid": { baseValue: 60, sizeRange: [1.3, 2.0], strengthRange: [6, 8] },
  "Swordfish": { baseValue: 55, sizeRange: [1.1, 1.7], strengthRange: [5, 6] }
};

// Rarity multipliers
export const RARITY_MULTIPLIERS = {
  common: 1.0,
  uncommon: 1.5,
  rare: 2.0,
  legendary: 5.0
};

// Gear data
export const GEAR_DATA = {
  rods: [
    { id: "basic_rod", name: "Basic Rod", cost: 0, castBonus: 0, description: "Your starting rod" },
    { id: "improved_rod", name: "Improved Rod", cost: 200, castBonus: 50, description: "+50 cast distance" },
    { id: "advanced_rod", name: "Advanced Rod", cost: 600, castBonus: 100, description: "+100 cast distance" },
    { id: "pro_rod", name: "Pro Rod", cost: 1500, castBonus: 150, description: "+150 cast distance" }
  ],
  reels: [
    { id: "basic_reel", name: "Basic Reel", cost: 0, reelPower: 1.0, sweetSpotBonus: 0, description: "Your starting reel" },
    { id: "improved_reel", name: "Improved Reel", cost: 250, reelPower: 1.3, sweetSpotBonus: 2, description: "+30% reel power, +2% sweet spot" },
    { id: "advanced_reel", name: "Advanced Reel", cost: 700, reelPower: 1.6, sweetSpotBonus: 5, description: "+60% reel power, +5% sweet spot" },
    { id: "pro_reel", name: "Pro Reel", cost: 1800, reelPower: 2.0, sweetSpotBonus: 8, description: "+100% reel power, +8% sweet spot" }
  ],
  lines: [
    { id: "basic_line", name: "Basic Line", cost: 0, maxTension: 100, durability: 100, description: "Your starting line" },
    { id: "improved_line", name: "Improved Line", cost: 150, maxTension: 120, durability: 150, description: "+20% tension, +50% durability" },
    { id: "advanced_line", name: "Advanced Line", cost: 500, maxTension: 150, durability: 200, description: "+50% tension, +100% durability" },
    { id: "pro_line", name: "Pro Line", cost: 1200, maxTension: 200, durability: 300, description: "+100% tension, +200% durability" }
  ],
  lures: [
    { id: "basic_lure", name: "Basic Lure", cost: 0, biteBonus: 0, valueBonus: 0, description: "Your starting lure" },
    { id: "shiny_lure", name: "Shiny Lure", cost: 180, biteBonus: 0.05, valueBonus: 0, description: "+5% bite chance" },
    { id: "premium_lure", name: "Premium Lure", cost: 550, biteBonus: 0.10, valueBonus: 0.1, description: "+10% bite chance, +10% fish value" },
    { id: "legendary_lure", name: "Legendary Lure", cost: 1400, biteBonus: 0.15, valueBonus: 0.2, description: "+15% bite chance, +20% fish value" }
  ]
};