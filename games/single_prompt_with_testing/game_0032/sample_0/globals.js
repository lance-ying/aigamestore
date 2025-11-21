// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

// Resource types
export const RESOURCE_TYPES = {
  WOOD: "wood",
  STONE: "stone",
  FOOD: "food",
  PROCESSED_WOOD: "processed_wood",
  PROCESSED_METAL: "processed_metal"
};

// Building types
export const BUILDING_TYPES = {
  TOWN_HALL: "town_hall",
  WOOD_CAMP: "wood_camp",
  STONE_QUARRY: "stone_quarry",
  FARM: "farm",
  SAWMILL: "sawmill",
  FORGE: "forge",
  TRAINING_GROUND: "training_ground",
  ALCHEMY_LAB: "alchemy_lab"
};

// Game state object
export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Village stats
  villagers: 10,
  idleVillagers: 10,
  
  // Resources
  resources: {
    wood: 0,
    stone: 0,
    food: 50,
    processed_wood: 0,
    processed_metal: 0,
    gold: 100
  },
  
  // Buildings
  buildings: [],
  
  // Workers assigned to buildings
  workerAssignments: {},
  
  // Hunters
  hunters: [],
  activeAlliance: null,
  
  // Creatures
  creatures: [],
  defeatedCreatures: [],
  
  // UI state
  selectedBuilding: null,
  selectedIndex: 0,
  menuOpen: false,
  menuType: null,
  craftingIndex: 0,
  
  // Game progress
  gameTime: 0,
  timeScale: 1,
  lastTradeShipTime: 0,
  tradeShipAvailable: false,
  
  // Dragon state
  dragonDefeated: false,
  
  // Position tracking for automated testing
  positionHistory: []
};

// Crafting recipes
export const CRAFTING_RECIPES = {
  wooden_sword: { wood: 0, stone: 0, processed_wood: 3, processed_metal: 0, gold: 0 },
  iron_sword: { wood: 0, stone: 0, processed_wood: 0, processed_metal: 5, gold: 0 },
  wooden_armor: { wood: 0, stone: 0, processed_wood: 5, processed_metal: 0, gold: 0 },
  iron_armor: { wood: 0, stone: 0, processed_wood: 0, processed_metal: 8, gold: 0 },
  health_potion: { wood: 0, stone: 0, processed_wood: 0, processed_metal: 0, gold: 10, food: 5 },
  strength_potion: { wood: 0, stone: 0, processed_wood: 0, processed_metal: 0, gold: 15, food: 3 }
};

// Building costs
export const BUILDING_COSTS = {
  sawmill: { wood: 20, stone: 10, gold: 50 },
  forge: { wood: 15, stone: 25, gold: 75 },
  training_ground: { wood: 30, stone: 20, gold: 100 },
  alchemy_lab: { wood: 25, stone: 15, gold: 80 }
};

// Creature types and stats
export const CREATURE_TYPES = [
  { name: "Wolf", hp: 30, damage: 5, reward: { gold: 20, experience: 10 } },
  { name: "Bear", hp: 60, damage: 10, reward: { gold: 50, experience: 25 } },
  { name: "Troll", hp: 100, damage: 15, reward: { gold: 100, experience: 50 } },
  { name: "Giant", hp: 150, damage: 20, reward: { gold: 200, experience: 100 } },
  { name: "Dragon", hp: 300, damage: 30, reward: { gold: 1000, experience: 500 } }
];

// Expose getGameState globally
window.getGameState = function() {
  return gameState;
};