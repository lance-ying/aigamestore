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

export const PLAYING_SUBSTATES = {
  EXPLORE: "PLAYING_EXPLORE",
  CITY_MENU: "PLAYING_CITY_MENU",
  COMBAT: "PLAYING_COMBAT",
  LEVEL_COMPLETE: "LEVEL_COMPLETE"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  playingSubstate: PLAYING_SUBSTATES.EXPLORE,
  controlMode: "HUMAN",
  
  // Player resources
  resources: {
    ice: 0,
    wood: 0,
    food: 0
  },
  
  // City buildings
  cityBuildings: {
    cityCenter: 0,
    storage: 0,
    barracks: 0,
    heroHall: 0
  },
  
  // Heroes
  heroes: [],
  
  // Map state
  mapState: {
    resourceNodes: [],
    combatZones: [],
    cityCenter: { x: 300, y: 200 }
  },
  
  // Game progression
  currentLevel: 1,
  score: 0,
  turnCount: 0,
  
  // UI state
  selectedMapObject: null,
  hoveredObject: null,
  menuSelection: 0,
  
  // Combat state
  combatData: null,
  
  // Animation state
  animations: [],
  
  // Player reference
  player: null,
  entities: [],
  
  // Camera/scroll
  cameraX: 0,
  cameraY: 0
};

// Level definitions
export const LEVEL_DEFINITIONS = [
  {
    level: 1,
    name: "The First Frost",
    objectives: {
      ice: 100,
      wood: 50,
      food: 20,
      cityCenterLevel: 1,
      defeatedCombatZones: [0]
    },
    completeMessage: "LEVEL 1 COMPLETE! You've survived the First Frost.\nPrepare for the growing challenges ahead.",
    targetTurnCount: 50
  },
  {
    level: 2,
    name: "Whispers of the Wild",
    objectives: {
      ice: 200,
      wood: 100,
      food: 50,
      cityCenterLevel: 2,
      heroCount: 2,
      defeatedCombatZones: [0, 1]
    },
    completeMessage: "LEVEL 2 COMPLETE! The wilds grow restless.\nYour camp needs more protection.",
    targetTurnCount: 80
  },
  {
    level: 3,
    name: "The Expanding Reach",
    objectives: {
      ice: 300,
      wood: 150,
      food: 100,
      buildingUpgrades: 2,
      defeatedCombatZones: [0, 1, 2]
    },
    completeMessage: "LEVEL 3 COMPLETE! Your influence spreads.\nBut the Rival Chief watches...",
    targetTurnCount: 120
  },
  {
    level: 4,
    name: "Shadow of the Chief",
    objectives: {
      ice: 400,
      wood: 200,
      food: 150,
      maxHeroLevel: 5,
      cityCenterLevel: 4,
      buildingUpgrades: 3,
      defeatedCombatZones: [0, 1, 2, 3]
    },
    completeMessage: "LEVEL 4 COMPLETE! The Chief's forces are weakened.\nPrepare for the final confrontation!",
    targetTurnCount: 150
  },
  {
    level: 5,
    name: "The Strongest",
    objectives: {
      defeatedCombatZones: [0, 1, 2, 3, 4]
    },
    completeMessage: "VICTORY! You Conquered the Ice Field!",
    targetTurnCount: 200
  }
];

export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}