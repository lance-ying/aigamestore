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

export const FISHING_STATES = {
  IDLE: "IDLE",
  CASTING: "CASTING",
  WAITING: "WAITING",
  BITING: "BITING",
  REELING: "REELING",
  CAUGHT: "CAUGHT"
};

export const WATER_ZONES = {
  SHALLOW: { name: "Shallow Water", minX: 350, maxX: 550, y: 250, depth: 1 },
  DEEP: { name: "Deep Water", minX: 50, maxX: 250, y: 280, depth: 2 },
  SPECIAL: { name: "Golden Spot", minX: 280, maxX: 320, y: 200, depth: 3 }
};

export const FISH_TYPES = [
  // Common fish (tier 1)
  { id: 0, name: "Minnow", rarity: 1, value: 5, color: [200, 200, 200], requiredRod: 0, zone: "SHALLOW" },
  { id: 1, name: "Perch", rarity: 1, value: 8, color: [150, 180, 100], requiredRod: 0, zone: "SHALLOW" },
  { id: 2, name: "Sunfish", rarity: 1, value: 10, color: [255, 200, 100], requiredRod: 0, zone: "SHALLOW" },
  { id: 3, name: "Carp", rarity: 1, value: 12, color: [180, 150, 100], requiredRod: 0, zone: "SHALLOW" },
  
  // Uncommon fish (tier 2)
  { id: 4, name: "Bass", rarity: 2, value: 20, color: [100, 150, 100], requiredRod: 1, zone: "DEEP" },
  { id: 5, name: "Trout", rarity: 2, value: 25, color: [150, 100, 150], requiredRod: 1, zone: "DEEP" },
  { id: 6, name: "Pike", rarity: 2, value: 30, color: [100, 150, 150], requiredRod: 1, zone: "DEEP" },
  { id: 7, name: "Catfish", rarity: 2, value: 28, color: [120, 100, 80], requiredRod: 1, zone: "DEEP" },
  
  // Rare fish (tier 3)
  { id: 8, name: "Salmon", rarity: 3, value: 50, color: [255, 150, 150], requiredRod: 2, zone: "DEEP" },
  { id: 9, name: "Sturgeon", rarity: 3, value: 60, color: [100, 100, 120], requiredRod: 2, zone: "DEEP" },
  { id: 10, name: "Tuna", rarity: 3, value: 70, color: [80, 100, 150], requiredRod: 2, zone: "SPECIAL" },
  
  // Epic fish (tier 4)
  { id: 11, name: "Shark", rarity: 4, value: 100, color: [150, 150, 180], requiredRod: 3, zone: "SPECIAL" },
  { id: 12, name: "Swordfish", rarity: 4, value: 120, color: [100, 120, 180], requiredRod: 3, zone: "SPECIAL" },
  
  // Legendary fish (tier 5)
  { id: 13, name: "Golden Fish", rarity: 5, value: 200, color: [255, 215, 0], requiredRod: 4, zone: "SPECIAL" },
  { id: 14, name: "Dragon Fish", rarity: 5, value: 250, color: [255, 50, 50], requiredRod: 4, zone: "SPECIAL" }
];

export const ROD_UPGRADES = [
  { level: 0, name: "Basic Rod", cost: 0, power: 1, catchChance: 0.7 },
  { level: 1, name: "Decent Rod", cost: 50, power: 2, catchChance: 0.75 },
  { level: 2, name: "Good Rod", cost: 150, power: 3, catchChance: 0.8 },
  { level: 3, name: "Great Rod", cost: 300, power: 4, catchChance: 0.85 },
  { level: 4, name: "Master Rod", cost: 600, power: 5, catchChance: 0.9 }
];

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  money: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  fishingState: FISHING_STATES.IDLE,
  currentFish: null,
  fishingTimer: 0,
  biteWindow: 0,
  rodLevel: 0,
  caughtFish: [],
  journal: new Set(),
  journalOpen: false,
  fishingLine: null,
  masteryLevel: 0,
  totalFishCaught: 0,
  currentZone: null,
  bobberPosition: { x: 0, y: 0 },
  reactionTime: 0
};

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}