export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2"
};

export const GRID_SIZE = 40;
export const FARM_GRID_WIDTH = 20;
export const FARM_GRID_HEIGHT = 15;

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  player: null,
  entities: [],
  score: 0,
  coins: 100,
  xp: 0,
  level: 1,
  cameraX: 0,
  cameraY: 0,
  farmPlots: [],
  animals: [],
  workshops: [],
  inventory: {},
  orders: [],
  currentQuest: null,
  questProgress: {},
  selectedPlot: null,
  selectedAnimal: null,
  selectedWorkshop: null,
  showPopup: false,
  popupType: null,
  popupData: null,
  gameTime: 0,
  consecutiveOrders: 0,
  failedOrders: 0,
  actionCount: 0,
  lastEarningAction: 0,
  harvestStreak: 0,
  streakStartTime: 0
};

export const CROP_TYPES = {
  WHEAT: { name: "Wheat", growTime: 60, value: 5, stages: 4, color: [255, 220, 100], unlockLevel: 1 },
  CORN: { name: "Corn", growTime: 90, value: 7, stages: 4, color: [255, 200, 50], unlockLevel: 1 },
  CARROT: { name: "Carrot", growTime: 75, value: 6, stages: 4, color: [255, 140, 0], unlockLevel: 2 },
  TOMATO: { name: "Tomato", growTime: 80, value: 8, stages: 4, color: [255, 50, 50], unlockLevel: 3 },
  SUGARCANE: { name: "Sugar Cane", growTime: 100, value: 10, stages: 4, color: [150, 255, 150], unlockLevel: 3 },
  FRUIT: { name: "Fruit", growTime: 120, value: 12, stages: 4, color: [255, 100, 150], unlockLevel: 4 }
};

export const ANIMAL_TYPES = {
  CHICKEN: { name: "Chicken", productTime: 120, product: "Egg", value: 10, unlockLevel: 1 },
  COW: { name: "Cow", productTime: 180, product: "Milk", value: 15, unlockLevel: 2 }
};

export const WORKSHOP_TYPES = {
  BAKERY: { name: "Bakery", recipes: [{ input: "Wheat", output: "Bread", time: 60, value: 15 }], unlockLevel: 1 },
  DAIRY: { name: "Dairy", recipes: [{ input: "Milk", output: "Cheese", time: 70, value: 20 }], unlockLevel: 2 },
  SUGARMILL: { name: "Sugar Mill", recipes: [{ input: "Sugar Cane", output: "Sugar", time: 80, value: 18 }], unlockLevel: 3 },
  JAMFACTORY: { name: "Jam Factory", recipes: [{ input: ["Fruit", "Sugar"], output: "Jam", time: 90, value: 25 }], unlockLevel: 4 }
};

export const QUEST_DATA = {
  1: { stage: 1, objective: "Renovate Farmhouse", requirements: { Wheat: 10, Corn: 5, Bread: 3 }, reward: 500 },
  2: { stage: 2, objective: "Get More Animals", requirements: { Carrot: 5, Milk: 3, Cheese: 2 }, reward: 500 },
  3: { stage: 3, objective: "Expand the Market", requirements: { coins: 5000, Sugar: 5 }, reward: 500 },
  4: { stage: 4, objective: "Master Crafter", requirements: { Jam: 5, totalValue: 10000 }, reward: 500 },
  5: { stage: 5, objective: "Grand Opening Festival", requirements: { Wheat: 20, Milk: 10, Jam: 5, coins: 15000 }, reward: 1000 }
};