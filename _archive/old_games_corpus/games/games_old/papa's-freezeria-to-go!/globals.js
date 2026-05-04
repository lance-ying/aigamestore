// Game constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 450;
export const STATION_WIDTH = 150;
export const STATION_HEIGHT = 300;

// Game phases
export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

// Control modes
export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2",
  TEST_3: "TEST_3",
  TEST_4: "TEST_4",
  TEST_5: "TEST_5"
};

// Key codes
export const KEYS = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32,
  SHIFT: 16,
  Z: 90,
  ENTER: 13,
  ESC: 27,
  R: 82
};

// Station types
export const STATION_TYPES = {
  ORDER: "ORDER",
  BUILD: "BUILD",
  BLEND: "BLEND",
  TOP: "TOP",
  SERVE: "SERVE"
};

// Ice cream flavors
export const FLAVORS = [
  { name: "Vanilla", color: [255, 255, 240] },
  { name: "Chocolate", color: [101, 67, 33] },
  { name: "Strawberry", color: [255, 182, 193] },
  { name: "Mint", color: [152, 251, 152] }
];

// Mix-ins
export const MIXINS = [
  { name: "Cookies", color: [150, 75, 0] },
  { name: "Sprinkles", color: [255, 105, 180] },
  { name: "Nuts", color: [210, 180, 140] },
  { name: "Chocolate Chips", color: [90, 60, 30] }
];

// Toppings
export const TOPPINGS = [
  { name: "Whipped Cream", color: [255, 255, 255] },
  { name: "Cherry", color: [220, 20, 60] },
  { name: "Caramel", color: [184, 134, 11] },
  { name: "Chocolate Syrup", color: [70, 40, 20] }
];

// Customer data
export const CUSTOMER_TYPES = [
  { name: "Regular", patienceModifier: 1.0, tipModifier: 1.0 },
  { name: "Impatient", patienceModifier: 0.7, tipModifier: 1.2 },
  { name: "Patient", patienceModifier: 1.3, tipModifier: 0.9 },
  { name: "Big Tipper", patienceModifier: 1.0, tipModifier: 1.5 }
];

// Game state
export const gameState = {
  player: null,
  stations: [],
  customers: [],
  currentCustomer: null,
  waitingCustomers: [],
  servedCustomers: 0,
  currentOrder: null,
  currentStation: 0,
  tips: 0,
  dayTimer: 0,
  dayLength: 180 * 60, // 3 minutes at 60fps
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  selectedOption: 0,
  orderAccuracy: 100,
  requiredOrdersToWin: 10,
  stationMenuOpen: false,
  actionInProgress: false,
  actionProgress: 0,
  actionSpeed: 1,
  customerPatience: 100,
  customerMaxPatience: 100,
  blendLevel: 0,
  targetBlendLevel: 0,
  currentSundae: {
    cup: null,
    flavor: null,
    mixins: null,
    blendLevel: 0,
    toppings: []
  }
};

// Get game state function
export function getGameState() {
  return gameState;
}

// Reset game state
export function resetGameState() {
  gameState.player = null;
  gameState.stations = [];
  gameState.customers = [];
  gameState.currentCustomer = null;
  gameState.waitingCustomers = [];
  gameState.servedCustomers = 0;
  gameState.currentOrder = null;
  gameState.currentStation = 0;
  gameState.tips = 0;
  gameState.dayTimer = 0;
  gameState.gamePhase = GAME_PHASES.START;
  gameState.selectedOption = 0;
  gameState.orderAccuracy = 100;
  gameState.stationMenuOpen = false;
  gameState.actionInProgress = false;
  gameState.actionProgress = 0;
  gameState.actionSpeed = 1;
  gameState.customerPatience = 100;
  gameState.customerMaxPatience = 100;
  gameState.blendLevel = 0;
  gameState.targetBlendLevel = 0;
  gameState.currentSundae = {
    cup: null,
    flavor: null,
    mixins: null,
    blendLevel: 0,
    toppings: []
  };
}