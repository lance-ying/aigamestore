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
  WORLD: "WORLD",
  TRAINING_SELECT: "TRAINING_SELECT",
  TRAINING_GAME: "TRAINING_GAME",
  BATTLE: "BATTLE",
  EQUIPMENT: "EQUIPMENT"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  screen: SCREENS.WORLD,
  
  // Player duck stats
  player: {
    x: 300,
    y: 200,
    power: 10,
    health: 100,
    maxHealth: 100,
    defence: 5,
    speed: 8,
    special: 5,
    wins: 0,
    currency: 0
  },
  
  // Training state
  currentTraining: null,
  trainingProgress: 0,
  trainingTarget: 0,
  trainingTimer: 0,
  trainingSequence: [],
  trainingInput: [],
  
  // Battle state
  inBattle: false,
  currentOpponent: null,
  battleTurn: "PLAYER",
  playerBattleHealth: 100,
  opponentBattleHealth: 100,
  battleLog: [],
  battleAction: null,
  selectedAction: 0,
  
  // Equipment
  unlockedEquipment: [],
  equippedWeapon: null,
  equippedCostume: null,
  
  // World navigation
  worldObjects: [],
  selectedObject: 0,
  
  // Menu state
  menuSelection: 0,
  
  // Opponents defeated
  defeatedOpponents: [],
  
  // Frame tracking
  framesSinceAction: 0,
  
  entities: []
};

// Equipment database
export const EQUIPMENT = {
  weapons: [
    { id: "wooden_sword", name: "Wooden Sword", power: 5, cost: 0, unlocked: true },
    { id: "iron_sword", name: "Iron Sword", power: 10, cost: 50, unlocked: false },
    { id: "steel_blade", name: "Steel Blade", power: 15, cost: 100, unlocked: false },
    { id: "dragon_claw", name: "Dragon Claw", power: 25, cost: 200, unlocked: false }
  ],
  costumes: [
    { id: "basic_outfit", name: "Basic Outfit", defence: 3, cost: 0, unlocked: true },
    { id: "leather_armor", name: "Leather Armor", defence: 8, cost: 50, unlocked: false },
    { id: "chain_mail", name: "Chain Mail", defence: 12, cost: 100, unlocked: false },
    { id: "dragon_scale", name: "Dragon Scale", defence: 20, cost: 200, unlocked: false }
  ]
};

// Opponent database
export const OPPONENTS = [
  { id: 1, name: "Puddles", power: 8, health: 80, defence: 3, speed: 6, reward: 20 },
  { id: 2, name: "Quackers", power: 12, health: 90, defence: 5, speed: 8, reward: 30 },
  { id: 3, name: "Waddles", power: 15, health: 100, defence: 7, speed: 10, reward: 50 },
  { id: 4, name: "Striker", power: 20, health: 120, defence: 10, speed: 12, reward: 75 },
  { id: 5, name: "Champion", power: 25, health: 150, defence: 15, speed: 15, reward: 100 }
];

export const TRAINING_TYPES = [
  { id: "power", name: "Power Dojo", stat: "power", color: [255, 100, 100] },
  { id: "health", name: "Health Dojo", stat: "health", color: [100, 255, 100] },
  { id: "defence", name: "Defence Dojo", stat: "defence", color: [100, 100, 255] },
  { id: "speed", name: "Speed Dojo", stat: "speed", color: [255, 255, 100] },
  { id: "special", name: "Special Dojo", stat: "special", color: [255, 100, 255] }
];

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;