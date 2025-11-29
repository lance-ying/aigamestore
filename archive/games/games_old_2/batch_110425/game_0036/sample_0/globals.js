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

export const BATTLE_PHASES = {
  SELECT_CHARACTER: "SELECT_CHARACTER",
  SELECT_ACTION: "SELECT_ACTION",
  SELECT_TARGET: "SELECT_TARGET",
  EXECUTING: "EXECUTING",
  ENEMY_TURN: "ENEMY_TURN",
  BATTLE_END: "BATTLE_END"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Battle state
  battlePhase: BATTLE_PHASES.SELECT_CHARACTER,
  currentFloor: 1,
  maxFloor: 5,
  
  // Party
  party: [],
  enemies: [],
  
  // Menu state
  selectedCharacterIndex: 0,
  selectedActionIndex: 0,
  selectedTargetIndex: 0,
  actionsQueue: [],
  
  // Inventory and progression
  inventory: [],
  skills: [],
  experience: 0,
  
  // Transmutation
  transmutationMenu: false,
  kilnItems: [],
  transmutationTimer: 0,
  
  // Animation
  animationQueue: [],
  currentAnimation: null,
  
  // Turn tracking
  turnOrder: [],
  currentTurnIndex: 0,
  
  // Game progression
  battlesWon: 0,
  totalDamageDealt: 0
};

// Initialize gameState globally
window.getGameState = function() {
  return gameState;
};

export const SKILL_DATABASE = [
  { id: 1, name: "Power Strike", unlockCondition: "level5", description: "+20% damage", passive: true },
  { id: 2, name: "Quick Step", unlockCondition: "level10", description: "+10% speed", passive: true },
  { id: 3, name: "Iron Will", unlockCondition: "battles5", description: "+15% defense", passive: true },
  { id: 4, name: "Mana Surge", unlockCondition: "level15", description: "+20% magic", passive: true },
  { id: 5, name: "Critical Eye", unlockCondition: "damage1000", description: "+15% crit", passive: true }
];

export const ITEM_DATABASE = [
  { id: 1, name: "Health Potion", type: "consumable", effect: "heal", value: 50 },
  { id: 2, name: "Iron Sword", type: "weapon", effect: "attack", value: 15 },
  { id: 3, name: "Steel Shield", type: "armor", effect: "defense", value: 12 },
  { id: 4, name: "Magic Ring", type: "accessory", effect: "magic", value: 10 }
];

export const TRANSMUTATION_RECIPES = [
  { input: [1, 1], output: 2, name: "2 Potions → Sword" },
  { input: [2, 2], output: 3, name: "2 Swords → Shield" },
  { input: [1, 2], output: 4, name: "Potion + Sword → Ring" }
];