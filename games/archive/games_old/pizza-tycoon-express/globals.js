// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";
export const PHASE_LEVEL_COMPLETE = "LEVEL_COMPLETE";
export const PHASE_UPGRADE_MENU = "UPGRADE_MENU";

// Control modes
export const CONTROL_HUMAN = "HUMAN";
export const CONTROL_TEST_1 = "TEST_1";
export const CONTROL_TEST_2 = "TEST_2";

// Pizza states
export const PIZZA_DOUGH = "DOUGH";
export const PIZZA_SAUCED = "SAUCED";
export const PIZZA_CHEESED = "CHEESED";
export const PIZZA_TOPPED = "TOPPED";
export const PIZZA_BAKED = "BAKED";
export const PIZZA_SLICED = "SLICED";

// Timing constants
export const DOUGH_PREP_TIME = 60;
export const SAUCE_TIME = 40;
export const CHEESE_TIME = 40;
export const TOPPING_TIME = 30;
export const BAKE_TIME = 120;
export const SLICE_TIME = 50;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  money: 100,
  level: 1,
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  levelTimeRemaining: 180,
  unhappyCustomerCount: 0,
  pizzasServedThisLevel: 0,
  customerQueueCounter: [],
  customerQueueDriveThru: [],
  activeOrders: [],
  pizzasInPrep: [],
  ingredientsStock: {
    dough: 100,
    sauce: 100,
    cheese: 100,
    pepperoni: 50,
    mushroom: 50,
    olive: 50,
    onion: 50,
    pepper: 50
  },
  upgrades: {
    playerSpeed: 1,
    ovenCapacity: 1,
    employeeSlots: 0,
    customerPatienceBoost: 1
  },
  employees: [],
  selectedPizza: null,
  activeWorkstation: null,
  actionProgress: 0,
  actionDuration: 0,
  streakCount: 0,
  multiplierActive: false,
  turboActive: false,
  turboCooldown: 0,
  turboTimeRemaining: 0,
  levelData: null,
  nextCustomerSpawnCounter: 0,
  nextCustomerSpawnDriveThru: 0
};

// Level definitions
export const LEVELS = [
  {
    level: 1,
    name: "The Humble Beginning",
    moneyTarget: 500,
    maxUnhappyCustomers: 2,
    timeLimit: 180,
    customersToServe: 10,
    customerSpawnRate: 180,
    customerPatienceBase: 600,
    availableToppings: ["pepperoni"],
    ovenSlots: 1
  },
  {
    level: 2,
    name: "Drive-Thru Rush",
    moneyTarget: 1200,
    maxUnhappyCustomers: 3,
    timeLimit: 240,
    customersToServe: 20,
    customerSpawnRate: 120,
    customerPatienceBase: 480,
    availableToppings: ["pepperoni", "mushroom"],
    ovenSlots: 2
  },
  {
    level: 3,
    name: "Topping Spree",
    moneyTarget: 2500,
    maxUnhappyCustomers: 4,
    timeLimit: 300,
    customersToServe: 30,
    customerSpawnRate: 90,
    customerPatienceBase: 420,
    availableToppings: ["pepperoni", "mushroom", "olive", "onion"],
    ovenSlots: 3
  },
  {
    level: 4,
    name: "Peak Hours",
    moneyTarget: 4000,
    maxUnhappyCustomers: 5,
    timeLimit: 360,
    customersToServe: 40,
    customerSpawnRate: 75,
    customerPatienceBase: 360,
    availableToppings: ["pepperoni", "mushroom", "olive", "onion", "pepper"],
    ovenSlots: 3
  },
  {
    level: 5,
    name: "The Tycoon Test",
    moneyTarget: 6000,
    maxUnhappyCustomers: 6,
    timeLimit: 420,
    customersToServe: 50,
    customerSpawnRate: 60,
    customerPatienceBase: 300,
    availableToppings: ["pepperoni", "mushroom", "olive", "onion", "pepper"],
    ovenSlots: 4
  }
];

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}