// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Control modes
export const CONTROL_HUMAN = "HUMAN";
export const CONTROL_TEST_1 = "TEST_1";
export const CONTROL_TEST_2 = "TEST_2";

// Game constants
export const TOTAL_ROUNDS = 8;
export const CARDS_IN_MARKET = 6;
export const STARTING_TROOPS = 10;
export const STARTING_CITIES = 3;

// Resource types
export const RESOURCE_COIN = "COIN";
export const RESOURCE_FOOD = "FOOD";
export const RESOURCE_WOOD = "WOOD";

// Action types
export const ACTION_RECRUIT = "RECRUIT";
export const ACTION_MOVE = "MOVE";
export const ACTION_SAIL = "SAIL";
export const ACTION_DESTROY = "DESTROY";
export const ACTION_BUILD_CASTLE = "BUILD_CASTLE";

// Map structure - regions grouped by continents
export const MAP_DATA = {
  continents: [
    {
      id: 0,
      name: "WEST",
      regions: [
        { id: 0, name: "W1", x: 100, y: 120, adjacent: [1, 2] },
        { id: 1, name: "W2", x: 100, y: 200, adjacent: [0, 2, 3] },
        { id: 2, name: "W3", x: 180, y: 160, adjacent: [0, 1, 4] },
        { id: 3, name: "W4", x: 100, y: 280, adjacent: [1] }
      ]
    },
    {
      id: 1,
      name: "CENTRAL",
      regions: [
        { id: 4, name: "C1", x: 280, y: 140, adjacent: [2, 5, 6] },
        { id: 5, name: "C2", x: 280, y: 220, adjacent: [4, 6, 7] },
        { id: 6, name: "C3", x: 360, y: 180, adjacent: [4, 5, 8] }
      ]
    },
    {
      id: 2,
      name: "EAST",
      regions: [
        { id: 7, name: "E1", x: 480, y: 240, adjacent: [5, 8, 9] },
        { id: 8, name: "E2", x: 480, y: 160, adjacent: [6, 7, 9] },
        { id: 9, name: "E3", x: 520, y: 100, adjacent: [7, 8] }
      ]
    }
  ]
};

// Card definitions
export const CARD_DEFINITIONS = [
  { resource: RESOURCE_COIN, amount: 3, action: ACTION_RECRUIT, value: 2, cost: 0 },
  { resource: RESOURCE_COIN, amount: 2, action: ACTION_MOVE, value: 3, cost: 1 },
  { resource: RESOURCE_FOOD, amount: 2, action: ACTION_RECRUIT, value: 3, cost: 1 },
  { resource: RESOURCE_FOOD, amount: 1, action: ACTION_MOVE, value: 4, cost: 2 },
  { resource: RESOURCE_WOOD, amount: 2, action: ACTION_SAIL, value: 1, cost: 1 },
  { resource: RESOURCE_WOOD, amount: 1, action: ACTION_DESTROY, value: 1, cost: 2 },
  { resource: RESOURCE_COIN, amount: 1, action: ACTION_BUILD_CASTLE, value: 1, cost: 3 },
  { resource: RESOURCE_FOOD, amount: 3, action: ACTION_RECRUIT, value: 2, cost: 0 },
  { resource: RESOURCE_WOOD, amount: 3, action: ACTION_MOVE, value: 2, cost: 1 },
  { resource: RESOURCE_COIN, amount: 2, action: ACTION_SAIL, value: 1, cost: 1 },
  { resource: RESOURCE_FOOD, amount: 2, action: ACTION_DESTROY, value: 2, cost: 2 },
  { resource: RESOURCE_WOOD, amount: 1, action: ACTION_BUILD_CASTLE, value: 1, cost: 3 },
];

// Global game state
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  currentRound: 0,
  currentPlayer: 0, // 0 = human/AI controlled player, 1 = AI opponent
  
  // Players
  players: [],
  
  // Map state
  regions: [],
  
  // Card market
  cardMarket: [],
  cardDeck: [],
  
  // UI state
  selectedCardIndex: -1,
  selectedRegionId: -1,
  actionState: "SELECT_CARD", // SELECT_CARD, SELECT_REGION, EXECUTING
  actionData: null,
  
  // Animation
  animationFrame: 0,
  messageText: "",
  messageTimer: 0,
};

// Initialize game state
export function initializeGameState() {
  gameState.currentRound = 0;
  gameState.currentPlayer = 0;
  gameState.selectedCardIndex = -1;
  gameState.selectedRegionId = -1;
  gameState.actionState = "SELECT_CARD";
  gameState.actionData = null;
  gameState.animationFrame = 0;
  gameState.messageText = "";
  gameState.messageTimer = 0;
  
  // Initialize players
  gameState.players = [
    {
      id: 0,
      name: "PLAYER",
      isAI: false,
      troops: STARTING_TROOPS,
      resources: { COIN: 0, FOOD: 0, WOOD: 0 },
      castles: [],
      score: 0
    },
    {
      id: 1,
      name: "AI",
      isAI: true,
      troops: STARTING_TROOPS,
      resources: { COIN: 0, FOOD: 0, WOOD: 0 },
      castles: [],
      score: 0
    }
  ];
  
  // Initialize regions
  gameState.regions = [];
  MAP_DATA.continents.forEach(continent => {
    continent.regions.forEach(regionData => {
      gameState.regions.push({
        id: regionData.id,
        name: regionData.name,
        continentId: continent.id,
        x: regionData.x,
        y: regionData.y,
        adjacent: [...regionData.adjacent],
        troops: { 0: 0, 1: 0 },
        castle: null,
        isCity: false
      });
    });
  });
  
  // Set starting cities
  const startingCities = [0, 3, 9]; // One per continent
  startingCities.forEach(regionId => {
    gameState.regions[regionId].isCity = true;
    gameState.regions[regionId].troops[0] = 3;
    gameState.regions[regionId].troops[1] = 3;
  });
  
  // Adjust starting troops
  gameState.players[0].troops -= 9;
  gameState.players[1].troops -= 9;
  
  // Initialize card deck and market
  initializeCards();
}

function initializeCards() {
  gameState.cardDeck = [];
  for (let i = 0; i < CARD_DEFINITIONS.length; i++) {
    gameState.cardDeck.push({ ...CARD_DEFINITIONS[i], id: i });
  }
  
  // Shuffle deck (using seeded random from p5)
  for (let i = gameState.cardDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [gameState.cardDeck[i], gameState.cardDeck[j]] = [gameState.cardDeck[j], gameState.cardDeck[i]];
  }
  
  // Draw initial market
  gameState.cardMarket = [];
  for (let i = 0; i < CARDS_IN_MARKET; i++) {
    if (gameState.cardDeck.length > 0) {
      gameState.cardMarket.push(gameState.cardDeck.pop());
    }
  }
}

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}