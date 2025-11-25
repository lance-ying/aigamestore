// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE",
  PAUSED: "PAUSED"
};

export const PLAY_PHASES = {
  SHOP_MENU: "SHOP_MENU",
  BREWING: "BREWING",
  NEGOTIATION: "NEGOTIATION",
  DAY_END: "DAY_END"
};

export const INGREDIENT_TYPES = {
  HERB: { name: "Herb", color: [100, 200, 100], baseValue: 10 },
  CRYSTAL: { name: "Crystal", color: [150, 150, 255], baseValue: 15 },
  ESSENCE: { name: "Essence", color: [255, 200, 100], baseValue: 20 },
  MUSHROOM: { name: "Mushroom", color: [200, 150, 200], baseValue: 12 }
};

export const CARD_TYPES = {
  CHARM: { name: "Charm", color: [255, 200, 200], stressReduce: 2, value: 15 },
  LOGIC: { name: "Logic", color: [200, 200, 255], stressReduce: 1, value: 20 },
  PASSION: { name: "Passion", color: [255, 150, 150], stressReduce: 0, value: 25 },
  CALM: { name: "Calm", color: [200, 255, 200], stressReduce: 5, value: 5 }
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  playPhase: PLAY_PHASES.SHOP_MENU,
  controlMode: "HUMAN",
  
  // Economy
  gold: 100,
  debt: 500,
  day: 1,
  maxDays: 60,
  
  // Shop
  ingredients: [],
  potions: [],
  
  // Current brewing
  brewingSlots: [null, null, null],
  selectedSlot: 0,
  selectedIngredientType: null,
  
  // Negotiation
  currentCustomer: null,
  negotiationCards: [],
  selectedCard: 0,
  customerStress: 0,
  playerStress: 0,
  currentPrice: 0,
  priceTarget: 0,
  
  // Menu navigation
  menuSelection: 0,
  
  // Player position for logging
  playerX: CANVAS_WIDTH / 2,
  playerY: CANVAS_HEIGHT / 2,
  
  // Stats
  potionsBrewed: 0,
  potionsSold: 0,
  totalRevenue: 0
};

// Initialize starting ingredients
export function initializeGameState() {
  gameState.gold = 100;
  gameState.debt = 500;
  gameState.day = 1;
  gameState.ingredients = [
    { type: "HERB", level: 1, count: 5 },
    { type: "CRYSTAL", level: 1, count: 3 },
    { type: "ESSENCE", level: 1, count: 2 },
    { type: "MUSHROOM", level: 1, count: 4 }
  ];
  gameState.potions = [];
  gameState.brewingSlots = [null, null, null];
  gameState.selectedSlot = 0;
  gameState.playPhase = PLAY_PHASES.SHOP_MENU;
  gameState.potionsBrewed = 0;
  gameState.potionsSold = 0;
  gameState.totalRevenue = 0;
}

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;