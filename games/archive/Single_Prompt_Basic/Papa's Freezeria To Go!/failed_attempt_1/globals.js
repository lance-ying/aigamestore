// Game constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const STATION_WIDTH = CANVAS_WIDTH / 4;

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

// Game stations
export const STATIONS = {
  ORDER: 0,
  BUILD: 1,
  BLEND: 2,
  TOP: 3
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

// Colors
export const COLORS = {
  BACKGROUND: [220, 240, 255],
  STATION_BG: [240, 240, 240],
  STATION_ACTIVE: [255, 240, 200],
  TEXT: [50, 50, 50],
  HIGHLIGHT: [255, 100, 100],
  CUSTOMER_BASE: [200, 180, 160],
  PATIENCE_GOOD: [100, 200, 100],
  PATIENCE_MEDIUM: [255, 200, 0],
  PATIENCE_LOW: [255, 100, 100],
  BUTTON: [80, 180, 255],
  BUTTON_HOVER: [100, 200, 255],
  CHOCOLATE: [101, 67, 33],
  VANILLA: [255, 248, 220],
  STRAWBERRY: [255, 182, 193],
  MINT: [152, 251, 152],
  BLUEBERRY: [138, 180, 248],
  WHIPPED_CREAM: [255, 255, 255],
  CHERRY: [220, 20, 60],
  SPRINKLES: [255, 192, 203],
  CHOCOLATE_CHIPS: [50, 25, 0],
  COOKIE: [210, 180, 140],
  CUP: [255, 223, 186]
};

// Game settings
export const SETTINGS = {
  DAILY_GOAL: 5, // Number of customers to serve to win
  MAX_CUSTOMERS: 8, // Maximum number of customers in queue
  BASE_PATIENCE: 1000, // Base patience value (frames)
  PATIENCE_DECREASE_RATE: 0.5, // How fast patience decreases
  MAX_ACCURACY: 100, // Maximum accuracy score
  MIN_TIP: 1, // Minimum tip amount
  MAX_TIP: 5, // Maximum tip amount
  POUR_RATE: 1, // How fast ingredients pour
  BLEND_TIME: 180, // Frames needed for perfect blending
  CUSTOMER_SPAWN_RATE: 600, // Frames between customer spawns
  POUR_MAX: 100, // Maximum pour amount
  POUR_OPTIMAL_MIN: 40, // Minimum optimal pour
  POUR_OPTIMAL_MAX: 60, // Maximum optimal pour
  BLEND_OPTIMAL_MIN: 170, // Minimum optimal blend time
  BLEND_OPTIMAL_MAX: 190, // Maximum optimal blend time
  TOPPING_POSITIONS: [ // Optimal positions for toppings
    {x: STATION_WIDTH * 3 + 40, y: 250},
    {x: STATION_WIDTH * 3 + 80, y: 250},
    {x: STATION_WIDTH * 3 + 120, y: 250},
    {x: STATION_WIDTH * 3 + 60, y: 220},
    {x: STATION_WIDTH * 3 + 100, y: 220},
    {x: STATION_WIDTH * 3 + 80, y: 190}
  ]
};

// Game state
export const gameState = {
  player: {
    currentStation: STATIONS.ORDER,
    selectedOption: 0
  },
  currentOrder: null,
  currentSundae: null,
  customers: [],
  waitingCustomers: [],
  servedCustomers: 0,
  dayPhase: 0, // 0: morning, 1: noon, 2: evening
  tips: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  lastKeyPressed: null,
  keyReleased: true,
  stationProgress: {
    [STATIONS.ORDER]: false,
    [STATIONS.BUILD]: false,
    [STATIONS.BLEND]: false,
    [STATIONS.TOP]: false
  },
  customerSpawnTimer: 0,
  activeKeyPresses: new Set()
};

// Game content
export const FLAVORS = [
  { name: "Chocolate", color: COLORS.CHOCOLATE },
  { name: "Vanilla", color: COLORS.VANILLA },
  { name: "Strawberry", color: COLORS.STRAWBERRY },
  { name: "Mint", color: COLORS.MINT },
  { name: "Blueberry", color: COLORS.BLUEBERRY }
];

export const TOPPINGS = [
  { name: "Whipped Cream", color: COLORS.WHIPPED_CREAM },
  { name: "Cherry", color: COLORS.CHERRY },
  { name: "Sprinkles", color: COLORS.SPRINKLES },
  { name: "Chocolate Chips", color: COLORS.CHOCOLATE_CHIPS },
  { name: "Cookie", color: COLORS.COOKIE }
];

// Function to get game state
export function getGameState() {
  return gameState;
}

// Expose the getGameState function globally
window.getGameState = getGameState;