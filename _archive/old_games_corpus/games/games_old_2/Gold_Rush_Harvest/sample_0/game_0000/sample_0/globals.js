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

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  
  // Player progress
  playerGold: 500,
  playerXP: 0,
  playerLevel: 1,
  score: 0,
  
  // Resources
  resources: {
    wheat: 0,
    corn: 0,
    carrot: 0,
    potato: 0,
    egg: 0,
    milk: 0,
    wool: 0,
    bread: 0,
    cake: 0,
    cheese: 0,
    flour: 0,
    wood: 0,
    stone: 0,
    ore: 0,
    gold_nugget: 0,
    lumber: 0,
    iron_bar: 0,
    gem: 0
  },
  
  // Farm state
  farmPlots: [],
  livestock: [],
  buildings: [],
  
  // Level and objectives
  currentLevel: 1,
  levelObjectives: [],
  completedObjectives: [],
  
  // UI state
  selectedPlotIndex: -1,
  selectedBuildingIndex: -1,
  selectedAnimalIndex: -1,
  showingMenu: null, // 'seed', 'building', 'production', 'expedition', 'objective'
  
  // Expedition state
  inExpedition: false,
  expeditionType: null,
  expeditionProgress: 0,
  expeditionTimeLeft: 0,
  expeditionCollected: {},
  
  // Time tracking
  gameTime: 0,
  lastUpdateTime: 0,
  
  // Input tracking
  keysPressed: {},
  lastAction: null
};

export const CROP_DATA = {
  wheat: { growTime: 3000, harvestAmount: 5, seedCost: 10, icon: '🌾', color: [218, 165, 32] },
  corn: { growTime: 4000, harvestAmount: 4, seedCost: 15, icon: '🌽', color: [255, 215, 0] },
  carrot: { growTime: 3500, harvestAmount: 6, seedCost: 12, icon: '🥕', color: [255, 140, 0] },
  potato: { growTime: 5000, harvestAmount: 8, seedCost: 20, icon: '🥔', color: [210, 180, 140] }
};

export const ANIMAL_DATA = {
  chicken: { productionTime: 4000, product: 'egg', productAmount: 2, cost: 100, icon: '🐔', color: [255, 255, 255] },
  cow: { productionTime: 6000, product: 'milk', productAmount: 3, cost: 200, icon: '🐄', color: [139, 69, 19] },
  sheep: { productionTime: 8000, product: 'wool', productAmount: 2, cost: 300, icon: '🐑', color: [240, 240, 240] }
};

export const BUILDING_DATA = {
  bakery: { cost: 300, produces: ['bread', 'cake'], icon: '🏪', color: [210, 105, 30] },
  barn: { cost: 400, produces: ['flour'], icon: '🏚️', color: [139, 90, 43] },
  windmill: { cost: 500, produces: ['flour'], icon: '🏭', color: [105, 105, 105] },
  cheese_press: { cost: 600, produces: ['cheese'], icon: '🏭', color: [169, 169, 169] },
  sawmill: { cost: 700, produces: ['lumber'], icon: '🏭', color: [160, 82, 45] }
};

export const RECIPE_DATA = {
  bread: { ingredients: { wheat: 3 }, productionTime: 3000, rewardXP: 10, icon: '🍞' },
  cake: { ingredients: { wheat: 2, egg: 1, milk: 1 }, productionTime: 5000, rewardXP: 20, icon: '🎂' },
  flour: { ingredients: { wheat: 5 }, productionTime: 2500, rewardXP: 8, icon: '🌾' },
  cheese: { ingredients: { milk: 4 }, productionTime: 4000, rewardXP: 15, icon: '🧀' },
  lumber: { ingredients: { wood: 10 }, productionTime: 3500, rewardXP: 12, icon: '🪵' }
};

export const LEVEL_CONFIG = {
  1: {
    name: "First Furrows",
    objectives: [
      { id: 'harvest_wheat', type: 'harvest', resource: 'wheat', amount: 10, completed: false, reward: 50 },
      { id: 'collect_eggs', type: 'collect', resource: 'egg', amount: 5, completed: false, reward: 50 },
      { id: 'bake_bread', type: 'produce', resource: 'bread', amount: 2, completed: false, reward: 100 }
    ],
    unlocks: ['wheat', 'chicken', 'bakery'],
    expeditionAvailable: 'forest'
  },
  2: {
    name: "Expansion & Trade",
    objectives: [
      { id: 'collect_milk', type: 'collect', resource: 'milk', amount: 10, completed: false, reward: 100 },
      { id: 'bake_cakes', type: 'produce', resource: 'cake', amount: 5, completed: false, reward: 150 },
      { id: 'build_barn', type: 'build', building: 'barn', completed: false, reward: 200 }
    ],
    unlocks: ['corn', 'carrot', 'cow', 'barn'],
    expeditionAvailable: 'mining'
  },
  3: {
    name: "The Gold Rush Beckons",
    objectives: [
      { id: 'produce_flour', type: 'produce', resource: 'flour', amount: 15, completed: false, reward: 200 },
      { id: 'produce_cheese', type: 'produce', resource: 'cheese', amount: 8, completed: false, reward: 250 },
      { id: 'gather_gold', type: 'collect', resource: 'gold_nugget', amount: 10, completed: false, reward: 300 }
    ],
    unlocks: ['potato', 'windmill', 'cheese_press'],
    expeditionAvailable: 'panning'
  },
  4: {
    name: "Northern Prospects",
    objectives: [
      { id: 'collect_wool', type: 'collect', resource: 'wool', amount: 12, completed: false, reward: 300 },
      { id: 'craft_lumber', type: 'produce', resource: 'lumber', amount: 5, completed: false, reward: 350 },
      { id: 'build_sawmill', type: 'build', building: 'sawmill', completed: false, reward: 400 }
    ],
    unlocks: ['sheep', 'sawmill'],
    expeditionAvailable: 'mountain'
  },
  5: {
    name: "The Klondike Dream",
    objectives: [
      { id: 'grand_final', type: 'score', amount: 10000, completed: false, reward: 1000 }
    ],
    unlocks: [],
    expeditionAvailable: null
  }
};

export const XP_PER_LEVEL = [0, 200, 500, 1000, 2000, 4000];

export function getGameState() {
  return gameState;
}

// Attach to window for external access
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}