// globals.js - Game constants and global state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRID_START_X = 50;
export const GRID_START_Y = 80;
export const CELL_SIZE = 45;

export const ORDER_ZONE_X = 480;
export const ORDER_ZONE_Y = 80;
export const ORDER_ZONE_WIDTH = 100;
export const ORDER_ZONE_HEIGHT = 300;

export const ITEM_TYPES = {
  COFFEE: { id: 'COFFEE', name: 'Coffee', maxLevel: 6 },
  SANDWICH: { id: 'SANDWICH', name: 'Sandwich', maxLevel: 6 },
  PASTRY: { id: 'PASTRY', name: 'Pastry', maxLevel: 6 },
  JUICE: { id: 'JUICE', name: 'Juice', maxLevel: 6 },
  SALAD: { id: 'SALAD', name: 'Salad', maxLevel: 6 },
  BURGER: { id: 'BURGER', name: 'Burger', maxLevel: 6 }
};

export const LEVEL_CONFIG = [
  {
    level: 1,
    gridSize: 5,
    initialItems: 5,
    ordersToComplete: 5,
    spawnInterval: 600, // frames (10 seconds at 60fps)
    story: "Welcome to Gossip Harbor! This old diner needs work. Let's start with basic coffee orders."
  },
  {
    level: 2,
    gridSize: 5,
    initialItems: 8,
    ordersToComplete: 7,
    spawnInterval: 480,
    story: "Great! We've patched the flooring. Customers want more breakfast items now!"
  },
  {
    level: 3,
    gridSize: 6,
    initialItems: 10,
    ordersToComplete: 9,
    spawnInterval: 420,
    story: "Kitchen expansion! Better equipment for elaborate dishes. Locals are talking about a secret..."
  },
  {
    level: 4,
    gridSize: 6,
    initialItems: 12,
    ordersToComplete: 12,
    spawnInterval: 360,
    story: "Outdoor seating is a hit! Regulars know something about the island's secret. Earn their trust!"
  },
  {
    level: 5,
    gridSize: 7,
    initialItems: 15,
    ordersToComplete: 15,
    spawnInterval: 300,
    story: "Grand reopening day! Everything depends on this. Solve the mystery once and for all!"
  }
];

export const gameState = {
  gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE, LEVEL_TRANSITION
  controlMode: "HUMAN",
  score: 0,
  currentLevel: 0,
  grid: [],
  gridSize: 5,
  selectedItem: null,
  draggedItem: null,
  orders: [],
  ordersCompleted: 0,
  spawnTimer: 0,
  transitionTimer: 0,
  highScore: 0,
  cursorX: 0,
  cursorY: 0,
  itemIdCounter: 0
};

export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}