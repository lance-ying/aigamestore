// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const GAME_MODES = {
  CASTLE: "CASTLE",
  MAZE: "MAZE"
};

export const JOB_TYPES = [
  { name: "Warrior", cost: 50, hp: 100, atk: 15, def: 10 },
  { name: "Mage", cost: 60, hp: 60, atk: 25, def: 5 },
  { name: "Rogue", cost: 55, hp: 70, atk: 20, def: 7 },
  { name: "Cleric", cost: 65, hp: 80, atk: 10, def: 12 },
  { name: "Ranger", cost: 58, hp: 75, atk: 18, def: 8 },
  { name: "Paladin", cost: 80, hp: 110, atk: 18, def: 15 },
  { name: "Necromancer", cost: 90, hp: 65, atk: 30, def: 6 },
  { name: "Berserker", cost: 75, hp: 95, atk: 22, def: 9 }
];

export const EQUIPMENT_RECIPES = [
  { name: "Iron Sword", cost: { iron: 10, wood: 5 }, atk: 5, def: 0, craftTime: 30 },
  { name: "Leather Armor", cost: { leather: 15 }, atk: 0, def: 8, craftTime: 40 },
  { name: "Steel Shield", cost: { iron: 20, wood: 10 }, atk: 0, def: 12, craftTime: 50 },
  { name: "Magic Staff", cost: { wood: 15, crystal: 5 }, atk: 10, def: 0, craftTime: 60 },
  { name: "Dragon Blade", cost: { iron: 30, crystal: 10 }, atk: 15, def: 0, craftTime: 80 },
  { name: "Mystic Robe", cost: { leather: 20, crystal: 8 }, atk: 5, def: 10, craftTime: 70 }
];

export const MATERIAL_TYPES = ["iron", "wood", "leather", "crystal"];

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentMode: GAME_MODES.CASTLE,
  
  // Castle resources
  materials: { iron: 0, wood: 0, leather: 0, crystal: 0 },
  materialGenerationRate: { iron: 0.5, wood: 0.5, leather: 0.3, crystal: 0.1 },
  population: 100,
  
  // Crafting
  craftingQueue: [],
  inventory: [],
  selectedRecipe: 0,
  
  // Team
  adventurers: [],
  selectedAdventurer: 0,
  maxTeamSize: 4,
  
  // Maze
  currentMazeLevel: 1,
  mazeNodes: [],
  currentNode: null,
  exploredNodes: new Set(),
  mazeDepth: 0,
  selectedNodeIndex: 0,
  
  // Player position for logging
  player: {
    x: 300,
    y: 200
  },
  
  // Game progression
  score: 0,
  timeElapsed: 0,
  
  // UI state
  castleTab: 0, // 0: crafting, 1: team
  
  // Testing
  testMoveHistory: []
};

// Make gameState accessible globally
window.getGameState = () => gameState;