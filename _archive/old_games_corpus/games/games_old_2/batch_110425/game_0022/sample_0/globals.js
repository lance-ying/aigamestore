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

export const AREAS = {
  SHOP: "SHOP",
  POND: "POND",
  GARDEN: "GARDEN",
  CAMPFIRE: "CAMPFIRE"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Player resources
  acorns: 0,
  fish: 0,
  crops: 0,
  craftedItems: 0,
  
  // Current area
  currentArea: AREAS.SHOP,
  unlockedAreas: [AREAS.SHOP],
  
  // Upgrades and automation
  scavengers: 0,
  scavengerRate: 5, // acorns per second per scavenger
  autoCollectEnabled: false,
  
  // Shop upgrades
  upgrades: {
    clickPower: 1,
    scavengerEfficiency: 1,
    unlockPond: false,
    unlockGarden: false,
    unlockCampfire: false,
    fishingSkill: 1,
    gardenSize: 1,
    cookingSkill: 1
  },
  
  // Fishing
  fishingState: {
    casting: false,
    castProgress: 0,
    catchWindow: 0,
    catchWindowActive: false
  },
  
  // Garden
  gardenPlots: [],
  maxPlots: 3,
  
  // Campfire
  recipes: [],
  visitors: [],
  
  // Timing
  lastUpdate: Date.now(),
  totalPlayTime: 0,
  
  // Player reference
  player: null,
  entities: [],
  
  // Score tracking
  score: 0,
  totalAcornsCollected: 0,
  
  // Win conditions
  targetCraftedItems: 24,
  maxScavengers: 10,
  allAreasUnlocked: false,
  allUpgradesMaxed: false
};

// Export function to access gameState
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}